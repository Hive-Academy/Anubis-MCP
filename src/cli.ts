#!/usr/bin/env node

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  DependencyManager,
  DependencySetupOptions,
} from './utils/dependency-manager';

/**
 * ARCHITECTURAL CONTEXT: NPX package self-contained dependency management
 * PATTERN FOLLOWED: NPM postinstall and conditional loading patterns with utility service
 * STRATEGIC PURPOSE: Eliminate external dependency assumptions for npx users
 */

async function bootstrap() {
  // Parse command line arguments
  const args = process.argv.slice(2);

  // CRITICAL: Set PROJECT_ROOT to ensure database is created in user's project directory
  // This prevents database sharing across different projects when using NPX
  if (!process.env.PROJECT_ROOT) {
    process.env.PROJECT_ROOT = process.cwd();
    console.log(`📁 Project root set to: ${process.env.PROJECT_ROOT}`);
  }

  // Initialize dependency manager early to get environment info
  const dependencyManager = new DependencyManager({ verbose: false });
  const envInfo = dependencyManager.getEnvironmentInfo();

  // Set default environment variables if not provided
  if (!process.env.DATABASE_URL) {
    // Use static prisma/data location as expected by MCP server
    process.env.DATABASE_URL = `file:${envInfo.userDataDirectory}/workflow.db`;
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
  let skipPlaywright = false;
  let verbose = false;

  for (const arg of args) {
    if (arg === '--skip-playwright') {
      skipPlaywright = true;
      process.env.DISABLE_REPORT_GENERATION = 'true';
    }
    if (arg === '--verbose' || arg === '-v') {
      verbose = true;
    }
  }

  try {
    console.log('🚀 Starting MCP Workflow Manager...');

    // Reinitialize dependency manager with verbose setting
    const dependencyManagerWithVerbose = new DependencyManager({ verbose });

    // Get environment information for debugging
    const envInfoVerbose = dependencyManagerWithVerbose.getEnvironmentInfo();
    if (verbose) {
      console.log('🔍 Environment Info:', {
        isNpx: envInfoVerbose.isNpx,
        isGlobal: envInfoVerbose.isGlobal,
        isLocal: envInfoVerbose.isLocal,
        nodeVersion: envInfoVerbose.nodeVersion,
        packageRoot: envInfoVerbose.packageRoot,
        workingDirectory: envInfoVerbose.workingDirectory,
        userDataDirectory: envInfoVerbose.userDataDirectory,
      });
    }

    // Initialize dependencies automatically
    const setupOptions: DependencySetupOptions = {
      skipPlaywright,
      verbose,
      databaseUrl: process.env.DATABASE_URL,
    };

    const dependencyStatus =
      dependencyManagerWithVerbose.initializeAllDependencies(setupOptions);

    // Report any errors but continue if possible
    if (dependencyStatus.errors.length > 0) {
      console.warn('⚠️  Some dependency setup issues encountered:');
      dependencyStatus.errors.forEach((error) => console.warn(`   - ${error}`));
    }

    // Report final status
    if (skipPlaywright || process.env.DISABLE_REPORT_GENERATION === 'true') {
      console.log('📊 Report generation: DISABLED');
    } else {
      console.log('📊 Report generation: ENABLED');
    }

    console.log(`🗄️  Database: ${process.env.DATABASE_URL}`);
    console.log(`🔄 Transport: ${process.env.MCP_TRANSPORT_TYPE}`);

    // Create NestJS application context for MCP server
    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: false, // Use our custom logger
    });

    console.log('✅ MCP Workflow Manager started successfully');
    console.log('📡 Listening for MCP protocol messages...');

    // Handle graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
      try {
        await app.close();
        console.log('✅ MCP server stopped successfully');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    };

    // Register signal handlers
    process.on('SIGINT', () => void gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => void gracefulShutdown('SIGTERM'));

    // Keep the process alive
    process.stdin.resume();
  } catch (error) {
    console.error('❌ Failed to start MCP server:', error);

    // Provide helpful error messages based on error type
    if (error instanceof Error) {
      if (error.message.includes('Prisma')) {
        console.error(
          '💡 Tip: Ensure your prisma/schema.prisma file exists and is properly configured',
        );
        console.error(
          '💡 Try: npm run setup:force to regenerate Prisma client',
        );
      } else if (error.message.includes('database')) {
        console.error(
          '💡 Tip: Check your DATABASE_URL environment variable and database permissions',
        );
        console.error('💡 Current DATABASE_URL:', process.env.DATABASE_URL);
      } else if (error.message.includes('Playwright')) {
        console.error(
          '💡 Tip: Try running with --skip-playwright flag to disable report generation',
        );
      } else if (
        error.message.includes('ENOENT') ||
        error.message.includes('command not found')
      ) {
        console.error(
          '💡 Tip: Ensure Node.js and npm are properly installed and accessible',
        );
      }
    }

    console.error('\n🔧 Troubleshooting:');
    console.error('   1. Verify Node.js version >= 18.0.0');
    console.error('   2. Check if all dependencies are installed: npm install');
    console.error('   3. Try rebuilding: npm run build');
    console.error('   4. For report issues, use: --skip-playwright flag');

    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start the server
bootstrap().catch((error) => {
  console.error('Bootstrap failed:', error);
  process.exit(1);
});
