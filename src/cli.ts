#!/usr/bin/env node

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupDatabaseEnvironment } from './utils/database-config';
import * as fs from 'fs';
import * as path from 'path';

/**
 * ANUBIS MCP SERVER - PRE-BUILT PACKAGE APPROACH
 * No runtime initialization - just copy pre-built database and run
 * This eliminates all the complexity that was causing NPX deployment issues
 */

/**
 * PRE-BUILT DATABASE SETUP
 * Copies pre-seeded database from package to project directory
 */
function setupPrebuiltDatabase(dbConfig: any): void {
  // This function now assumes dbConfig is provided and correct.
  // It also assumes the data directory has been created by setupDatabaseEnvironment.

  if (fs.existsSync(dbConfig.databasePath)) {
    return; // Database already exists, no need to copy
  }

  // Correctly locate the template DB within the package installation directory
  const packageRoot = path.resolve(
    path.dirname(require.resolve('@hive-academy/anubis/package.json')),
  );
  const templateDbPath = path.join(packageRoot, 'data-template', 'workflow.db');

  if (!fs.existsSync(templateDbPath)) {
    throw new Error(
      `Pre-built database template not found at: ${templateDbPath}`,
    );
  }

  // Copy the pre-built database to the final destination
  fs.copyFileSync(templateDbPath, dbConfig.databasePath);
}

async function bootstrap() {
  const args = process.argv.slice(2);
  const verbose = args.includes('--verbose') || args.includes('-v');

  // CRITICAL: Setup database environment FIRST to set DATABASE_URL
  const dbConfig = setupDatabaseEnvironment({
    projectRoot: process.env.PROJECT_ROOT || process.cwd(),
    verbose,
  });

  // Set default environment variables
  process.env.MCP_TRANSPORT_TYPE ||= 'STDIO';
  process.env.MCP_SERVER_NAME ||= 'Anubis';
  process.env.NODE_ENV ||= 'production';

  // Setup pre-built database by copying the template
  setupPrebuiltDatabase(dbConfig);

  // Start NestJS application
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

  process.on('SIGINT', () => void gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => void gracefulShutdown('SIGTERM'));

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
