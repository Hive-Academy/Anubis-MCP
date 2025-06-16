#!/usr/bin/env node

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  DependencyManager,
  DependencySetupOptions,
} from './utils/dependency-manager';
import { setupDatabaseEnvironment } from './utils/database-config';

/**
 * ARCHITECTURAL CONTEXT: NPX package self-contained dependency management
 * PATTERN FOLLOWED: Unified database configuration with deployment-aware setup
 * STRATEGIC PURPOSE: Eliminate configuration inconsistencies across Docker/NPX/Local
 */

async function bootstrap() {
  // Parse command line arguments
  const args = process.argv.slice(2);

  // CRITICAL: Setup unified database configuration for all deployment methods
  // This replaces manual PROJECT_ROOT and DATABASE_URL configuration
  const dbConfig = setupDatabaseEnvironment({
    projectRoot: process.env.PROJECT_ROOT || process.cwd(),
    verbose: args.includes('--verbose') || args.includes('-v'),
  });

  // Set default environment variables if not provided
  if (!process.env.MCP_TRANSPORT_TYPE) {
    process.env.MCP_TRANSPORT_TYPE = 'STDIO';
  }

  if (!process.env.MCP_SERVER_NAME) {
    process.env.MCP_SERVER_NAME = 'Anubis';
  }

  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'production';
  }

  // Parse custom arguments
  let verbose = false;

  for (const arg of args) {
    if (arg === '--verbose' || arg === '-v') {
      verbose = true;
    }
  }

  // Enhanced debugging for VS Code extensions
  if (
    verbose ||
    process.env.VSCODE_PID ||
    process.env.TERM_PROGRAM === 'vscode'
  ) {
    console.error('🔍 Anubis MCP Server Debug Information:');
    console.error(`   Deployment Method: ${dbConfig.deploymentMethod}`);
    console.error(`   Project Root: ${dbConfig.projectRoot}`);
    console.error(`   Database URL: ${dbConfig.databaseUrl}`);
    console.error(`   Data Directory: ${dbConfig.dataDirectory}`);
    console.error(`   VS Code PID: ${process.env.VSCODE_PID || 'not set'}`);
    console.error(`   Term Program: ${process.env.TERM_PROGRAM || 'not set'}`);
    console.error(`   Working Directory: ${process.cwd()}`);
    console.error(`   Node Version: ${process.version}`);
    console.error('');
  }

  try {
    // Initialize dependency manager with database configuration
    const dependencyManager = new DependencyManager({
      verbose,
      databaseUrl: dbConfig.databaseUrl,
    });

    // Initialize dependencies with unified configuration
    const setupOptions: DependencySetupOptions = {
      verbose,
      databaseUrl: dbConfig.databaseUrl,
    };

    const _dependencyStatus =
      await dependencyManager.initializeAllDependencies(setupOptions);

    // Create NestJS application context for MCP server
    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: false, // Use our custom logger
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
  } catch (error) {
    // Enhanced error reporting for VS Code extensions
    if (
      verbose ||
      process.env.VSCODE_PID ||
      process.env.TERM_PROGRAM === 'vscode'
    ) {
      console.error('❌ Failed to start MCP server:', error);
      console.error('');
      console.error('🔧 Troubleshooting Tips:');
      console.error('   1. Check if the data directory is writable');
      console.error('   2. Verify database path permissions');
      console.error('   3. Try running with --verbose flag for more details');
      console.error(
        '   4. Check VS Code extension logs for additional context',
      );
      console.error('');
    }
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (_reason, _promise) => {
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (_error) => {
  process.exit(1);
});

// Start the server
bootstrap().catch((_error) => {
  process.exit(1);
});
