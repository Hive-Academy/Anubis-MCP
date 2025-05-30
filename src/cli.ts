#!/usr/bin/env node

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';

const execAsync = promisify(exec);

async function ensurePlaywrightSetup() {
  try {
    console.log('Setting up Playwright for report generation...');

    // Install Playwright browsers
    await execAsync('npx playwright install chromium', {
      cwd: process.cwd(),
      env: { ...process.env },
    });

    // Install system dependencies for Playwright (Linux/CI environments)
    try {
      await execAsync('npx playwright install-deps chromium', {
        cwd: process.cwd(),
        env: { ...process.env },
      });
    } catch (_error) {
      // This might fail on some systems (like Windows/Mac), but that's okay
      console.log(
        'Playwright system dependencies installation skipped (not required on this system)',
      );
    }

    console.log('Playwright setup completed successfully.');
  } catch (error) {
    console.warn(
      'Playwright setup failed (report generation may not work):',
      error,
    );
    // Don't throw - allow the app to continue without report generation
  }
}

async function ensureDatabaseSetup() {
  try {
    // Ensure the database directory exists for SQLite
    if (process.env.DATABASE_URL?.startsWith('file:')) {
      const dbPath = process.env.DATABASE_URL.replace('file:', '');
      const dbDir = path.dirname(path.resolve(dbPath));
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }
    }

    // Generate Prisma client if not already generated
    console.log('Generating Prisma client...');
    await execAsync('npx prisma generate', {
      cwd: __dirname,
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
    });

    // Run database migrations
    console.log('Running database migrations...');
    await execAsync('npx prisma migrate deploy', {
      cwd: __dirname,
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
    });

    console.log('Database setup completed successfully.');
  } catch (error) {
    console.error('Database setup failed:', error);
    throw error;
  }
}

async function bootstrap() {
  // Parse command line arguments
  const args = process.argv.slice(2);

  // Set default environment variables if not provided
  if (!process.env.DATABASE_URL) {
    // Use project-specific database based on current directory name
    const projectName = path.basename(process.cwd());
    process.env.DATABASE_URL = `file:./${projectName}-workflow.db`;
  }

  if (!process.env.MCP_TRANSPORT_TYPE) {
    process.env.MCP_TRANSPORT_TYPE = 'STDIO';
  }

  if (!process.env.MCP_SERVER_NAME) {
    process.env.MCP_SERVER_NAME = 'MCP-Workflow-Manager';
  }

  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'production';
  }

  // Parse custom arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith('--database-url=')) {
      process.env.DATABASE_URL = arg.split('=')[1];
    } else if (arg.startsWith('--transport=')) {
      const transport = arg.split('=')[1].toUpperCase();
      if (['STDIO', 'SSE', 'STREAMABLE_HTTP'].includes(transport)) {
        process.env.MCP_TRANSPORT_TYPE = transport;
      }
    } else if (arg.startsWith('--port=')) {
      process.env.PORT = arg.split('=')[1];
    } else if (arg.startsWith('--server-name=')) {
      process.env.MCP_SERVER_NAME = arg.split('=')[1];
    } else if (arg === '--skip-playwright') {
      process.env.SKIP_PLAYWRIGHT = 'true';
    }
  }

  try {
    // Setup database and run migrations
    await ensureDatabaseSetup();

    // Setup Playwright for report generation (unless skipped)
    if (!process.env.SKIP_PLAYWRIGHT) {
      await ensurePlaywrightSetup();
    }

    // Create the NestJS application based on transport type
    let app;

    if (process.env.MCP_TRANSPORT_TYPE === 'STDIO') {
      // For STDIO transport, use createApplicationContext (like Docker production mode)
      app = await NestFactory.createApplicationContext(AppModule, {
        logger: ['error', 'warn'],
      });

      console.log('MCP Workflow Manager started with STDIO transport');

      // Keep the process alive for STDIO communication
      // The MCP communication is handled by @rekog/mcp-nest automatically
    } else {
      // For HTTP/SSE transport, create full HTTP application
      app = await NestFactory.create(AppModule, {
        logger:
          process.env.NODE_ENV === 'development'
            ? ['log', 'debug', 'error', 'verbose', 'warn']
            : ['error', 'warn'],
      });

      const port = process.env.PORT || 3000;
      await app.listen(port);
      console.log(
        `MCP Workflow Manager running on port ${port} with ${process.env.MCP_TRANSPORT_TYPE} transport`,
      );
    }

    // Setup graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      console.log(`Received ${signal}, shutting down gracefully...`);
      try {
        await app.close();
        console.log('Application closed successfully');
        process.exit(0);
      } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
      }
    };

    // Fix async handlers by wrapping in void
    process.on('SIGINT', () => void gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => void gracefulShutdown('SIGTERM'));
  } catch (error) {
    console.error('Failed to start MCP Workflow Manager:', error);
    process.exit(1);
  }
}

bootstrap();
