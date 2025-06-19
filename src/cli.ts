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

/**
 * PRE-BUILT DATABASE SETUP
 * Copies pre-seeded database from package to project directory
 */
function setupPrebuiltDatabase(): void {
  // Get database configuration
  const dbConfig = setupDatabaseEnvironment({
    projectRoot: process.env.PROJECT_ROOT || process.cwd(),
    verbose: true,
  });

  // Ensure data directory exists
  if (!fs.existsSync(dbConfig.dataDirectory)) {
    fs.mkdirSync(dbConfig.dataDirectory, { recursive: true });
  }

  // Check if database already exists
  if (fs.existsSync(dbConfig.databasePath)) {
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

  // Set the database URL environment variable
  process.env.DATABASE_URL = dbConfig.databaseUrl;
}

/**
 * ENSURE PRISMA CLIENT
 * Generate Prisma client if not available (runtime generation for NPM packages)
 */
async function ensurePrismaClient(): Promise<void> {
  // Check if generated Prisma client exists
  const cliDirectory = path.dirname(__filename);
  const generatedPath = path.join(cliDirectory, '..', 'generated', 'prisma');

  if (fs.existsSync(generatedPath)) {
    return;
  }

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
}

async function bootstrap() {
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
    setupDatabaseEnvironment({
      projectRoot: process.env.PROJECT_ROOT || process.cwd(),
    });
  }

  // Start NestJS application (no complex initialization needed)

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });

  // Handle graceful shutdown
  const gracefulShutdown = async (_signal: string) => {
    try {
      await app.close();
      process.exit(0);
    } catch (_error) {
      process.exit(1);
    }
  };

  // Register signal handlers
  process.on('SIGINT', () => void gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => void gracefulShutdown('SIGTERM'));

  // Keep the process alive
  process.stdin.resume();
}

// Enhanced global exception handlers
process.on('unhandledRejection', (_reason, _promise) => {
  process.exit(1);
});

process.on('uncaughtException', (_error) => {
  process.exit(1);
});

// Start the server
bootstrap().catch((_error) => {
  process.exit(1);
});
