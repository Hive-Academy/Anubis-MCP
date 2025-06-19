#!/usr/bin/env node

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupDatabaseEnvironment } from './utils/database-config';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

/**
 * ANUBIS MCP SERVER - PRE-BUILT PACKAGE APPROACH
 * No runtime initialization - just copy pre-built database and run
 * This eliminates all the complexity that was causing NPX deployment issues
 */

// Enhanced logging function for MCP debugging
function mcpLog(
  level: 'info' | 'error' | 'debug',
  message: string,
  data?: any,
) {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [MCP-CLI-${level.toUpperCase()}]`;

  if (data) {
    console.error(`${prefix} ${message}`, JSON.stringify(data, null, 2));
  } else {
    console.error(`${prefix} ${message}`);
  }
}

/**
 * PRE-BUILT DATABASE SETUP
 * Copies pre-seeded database from package to project directory
 */
function setupPrebuiltDatabase(): void {
  try {
    mcpLog('info', '📦 Setting up pre-built database...');

    // Get database configuration
    const dbConfig = setupDatabaseEnvironment({
      projectRoot: process.env.PROJECT_ROOT || process.cwd(),
      verbose: true,
    });

    // Ensure data directory exists
    if (!fs.existsSync(dbConfig.dataDirectory)) {
      fs.mkdirSync(dbConfig.dataDirectory, { recursive: true });
      mcpLog('info', '📁 Created data directory', {
        path: dbConfig.dataDirectory,
      });
    }

    // Check if database already exists
    if (fs.existsSync(dbConfig.databasePath)) {
      mcpLog('info', '✅ Database already exists, skipping copy', {
        path: dbConfig.databasePath,
      });
      return;
    }

    // Find pre-built database template
    // First try to find it relative to the CLI script location
    const cliDirectory = path.dirname(__filename);
    let templateDbPath = path.join(
      cliDirectory,
      '..',
      'data-template',
      'workflow.db',
    );

    if (!fs.existsSync(templateDbPath)) {
      // Fallback: try relative to package root
      templateDbPath = path.join(
        cliDirectory,
        '..',
        '..',
        'data-template',
        'workflow.db',
      );
    }

    if (!fs.existsSync(templateDbPath)) {
      throw new Error(
        `Pre-built database template not found at: ${templateDbPath}`,
      );
    }

    // Copy pre-built database
    fs.copyFileSync(templateDbPath, dbConfig.databasePath);
    mcpLog('info', '✅ Pre-built database copied successfully', {
      from: templateDbPath,
      to: dbConfig.databasePath,
      size: fs.statSync(dbConfig.databasePath).size,
    });

    // Set the database URL environment variable
    process.env.DATABASE_URL = dbConfig.databaseUrl;
    mcpLog('debug', '🔧 Database URL configured', {
      url: dbConfig.databaseUrl,
    });
  } catch (error) {
    mcpLog('error', '❌ Failed to setup pre-built database', { error });
    throw error;
  }
}

/**
 * ENSURE PRISMA CLIENT
 * Generate Prisma client if not available (runtime generation for NPM packages)
 */
async function ensurePrismaClient(): Promise<void> {
  try {
    // Check if generated Prisma client exists
    const cliDirectory = path.dirname(__filename);
    const generatedPath = path.join(cliDirectory, '..', 'generated', 'prisma');

    if (fs.existsSync(generatedPath)) {
      mcpLog('debug', '✅ Prisma client already generated');
      return;
    }

    mcpLog('info', '🔧 Generating Prisma client...');

    // Generate Prisma client at runtime
    const packageRoot = path.join(cliDirectory, '..');

    await new Promise<void>((resolve, reject) => {
      try {
        execSync('npx prisma generate', {
          stdio: 'pipe', // Hide output to keep logs clean
          cwd: packageRoot,
          timeout: 60000, // 1 minute timeout
        });
        resolve();
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });

    mcpLog('info', '✅ Prisma client generated successfully');
  } catch (error) {
    mcpLog('error', '❌ Failed to generate Prisma client', { error });
    throw error;
  }
}

async function bootstrap() {
  try {
    mcpLog('info', '🚀 Starting Anubis MCP Server (Pre-built Package)...');

    // Parse command line arguments
    const args = process.argv.slice(2);
    const verbose = args.includes('--verbose') || args.includes('-v');

    // Set default environment variables
    if (!process.env.MCP_TRANSPORT_TYPE) {
      process.env.MCP_TRANSPORT_TYPE = 'STDIO';
    }

    if (!process.env.MCP_SERVER_NAME) {
      process.env.MCP_SERVER_NAME = 'Anubis';
    }

    if (!process.env.NODE_ENV) {
      process.env.NODE_ENV = 'production';
    }

    // Ensure Prisma client is available (runtime generation for NPM packages)
    await ensurePrismaClient();

    // Setup pre-built database (simple copy operation)
    setupPrebuiltDatabase();

    // Enhanced debugging for VS Code extensions
    if (
      verbose ||
      process.env.VSCODE_PID ||
      process.env.TERM_PROGRAM === 'vscode'
    ) {
      const dbConfig = setupDatabaseEnvironment({
        projectRoot: process.env.PROJECT_ROOT || process.cwd(),
      });

      console.error('🔍 Anubis MCP Server Debug Information:');
      console.error(`   Deployment Method: Pre-built Package`);
      console.error(`   Project Root: ${dbConfig.projectRoot}`);
      console.error(`   Database URL: ${dbConfig.databaseUrl}`);
      console.error(`   Data Directory: ${dbConfig.dataDirectory}`);
      console.error(`   VS Code PID: ${process.env.VSCODE_PID || 'not set'}`);
      console.error(
        `   Term Program: ${process.env.TERM_PROGRAM || 'not set'}`,
      );
      console.error(`   Working Directory: ${process.cwd()}`);
      console.error(`   Node Version: ${process.version}`);
      console.error('');
    }

    // Start NestJS application (no complex initialization needed)
    mcpLog('info', '🚀 Starting NestJS application...');
    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: verbose ? ['error', 'warn', 'log', 'debug'] : ['error', 'warn'],
    });

    mcpLog('info', '🎉 Anubis MCP Server is ready!');
    mcpLog('info', 'Server running - ready for MCP tool calls');

    // Handle graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      try {
        mcpLog('info', `🛑 Received ${signal} - shutting down...`);
        await app.close();
        mcpLog('info', '✅ Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        mcpLog('error', '❌ Error during shutdown', { error });
        process.exit(1);
      }
    };

    // Register signal handlers
    process.on('SIGINT', () => void gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => void gracefulShutdown('SIGTERM'));

    // Keep the process alive
    process.stdin.resume();
  } catch (error) {
    mcpLog('error', '💥 Failed to start MCP server', {
      error:
        error instanceof Error
          ? {
              message: error.message,
              stack: error.stack,
              name: error.name,
            }
          : error,
    });

    // Enhanced error reporting for VS Code extensions
    if (process.env.VSCODE_PID || process.env.TERM_PROGRAM === 'vscode') {
      console.error('❌ Failed to start MCP server:', error);
      console.error('');
      console.error('🔧 Troubleshooting Tips:');
      console.error('   1. Check if the project directory is writable');
      console.error(
        '   2. Verify PROJECT_ROOT environment variable is set correctly',
      );
      console.error('   3. Try running with --verbose flag for more details');
      console.error(
        '   4. Check VS Code extension logs for additional context',
      );
      console.error('');
    }
    process.exit(1);
  }
}

// Enhanced global exception handlers
process.on('unhandledRejection', (reason, _promise) => {
  mcpLog('error', '🚨 Unhandled Promise Rejection', { reason });
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  mcpLog('error', '🚨 Uncaught Exception', {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

// Start the server
mcpLog('info', '🔄 Initiating bootstrap sequence...');
bootstrap().catch((error) => {
  mcpLog('error', '💥 Bootstrap failed', { error });
  process.exit(1);
});
