#!/usr/bin/env node

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as path from 'path';

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
  let skipPlaywright = false;

  for (const arg of args) {
    if (arg === '--skip-playwright') {
      skipPlaywright = true;
      process.env.DISABLE_REPORT_GENERATION = 'true';
    }
  }

  try {
    console.log('🚀 Starting MCP Workflow Manager...');

    if (skipPlaywright) {
      console.log('📊 Report generation: DISABLED (--skip-playwright flag)');
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
