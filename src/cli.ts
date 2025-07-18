#!/usr/bin/env node

import { execSync } from 'child_process';
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
 * SMART DATABASE SETUP WITH VERSION-AWARE UPDATES
 * Ensures users always get the latest workflow rules and schema
 */
function setupSmartDatabase(dbConfig: any): void {
  const packageRoot = path.resolve(__dirname, '..');
  const templateDbPath = path.join(
    packageRoot,
    'prisma',
    '.anubis',
    'workflow.db',
  );

  // Check if template database exists
  if (!fs.existsSync(templateDbPath)) {
    throw new Error(
      `Pre-built database template not found at: ${templateDbPath}`,
    );
  }

  const databaseExists = fs.existsSync(dbConfig.databasePath);
  const versionFile = path.join(dbConfig.dataDirectory, '.anubis-version');

  // Get current package version
  const packageJsonPath = path.join(packageRoot, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  const currentVersion = packageJson.version;

  // Check if we need to update
  let needsUpdate = false;
  let previousVersion = null;

  if (databaseExists && fs.existsSync(versionFile)) {
    previousVersion = fs.readFileSync(versionFile, 'utf-8').trim();
    needsUpdate = previousVersion !== currentVersion;
  } else {
    needsUpdate = true; // First install or version file missing
  }

  if (needsUpdate) {
    console.log(`📦 Anubis Database Update:`);
    if (previousVersion) {
      console.log(`   - Previous version: ${previousVersion}`);
      console.log(`   - Current version: ${currentVersion}`);
      console.log(`   - Updating workflow rules (preserving user data)...`);
    } else {
      console.log(`   - Version: ${currentVersion}`);
      console.log(`   - Setting up database...`);
    }

    // Only copy template if database doesn't exist (first install)
    if (!databaseExists) {
      console.log(`   - Creating new database from template...`);
      fs.copyFileSync(templateDbPath, dbConfig.databasePath);
    } else {
      console.log(`   - Database exists, preserving user data...`);
      // For existing databases, we'll rely on migrations and seeding
      // to update workflow rules without destroying user data
    }

    // Update version file
    fs.writeFileSync(versionFile, currentVersion);

    console.log(`   ✅ Database update completed`);
  }
}

/**
 * Run Prisma migrations to ensure schema is up-to-date
 */
function runDatabaseMigrations(dbConfig: any): void {
  try {
    const packageRoot = path.resolve(__dirname, '..');

    // Set the correct DATABASE_URL for migrations
    process.env.DATABASE_URL = dbConfig.databaseUrl;

    // Run Prisma migrations
    console.log('🔄 Running database migrations...');
    execSync('npx prisma migrate deploy', {
      cwd: packageRoot,
      stdio: 'pipe', // Suppress output unless there's an error
    });

    console.log('✅ Database migrations completed');
  } catch (error) {
    console.warn(
      '⚠️  Database migrations failed (this may be expected for first-time setup)',
    );
    if (process.env.NODE_ENV === 'development') {
      console.error('Migration error:', error);
    }
  }
}

/**
 * Run database seed to ensure latest workflow rules
 */
async function runDatabaseSeed(dbConfig: any): Promise<void> {
  try {
    const packageRoot = path.resolve(__dirname, '..');
    const seedScriptPath = path.join(
      packageRoot,
      'dist',
      'scripts',
      'prisma-seed.js',
    );

    // Check if compiled seed script exists
    if (!fs.existsSync(seedScriptPath)) {
      console.warn('⚠️  Seed script not found, skipping database seeding');
      return;
    }

    // Set the correct DATABASE_URL for seeding
    process.env.DATABASE_URL = dbConfig.databaseUrl;
    process.env.NODE_ENV = 'production'; // Ensure idempotent seeding

    console.log('🌱 Running database seed...');

    // Import and run the seed function
    const seedModule = await import(seedScriptPath);
    await seedModule.seed();

    console.log('✅ Database seed completed');
  } catch (error) {
    console.warn('⚠️  Database seeding failed');
    if (process.env.NODE_ENV === 'development') {
      console.error('Seed error:', error);
    }
  }
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
  // Setup smart database with version-aware updates
  setupSmartDatabase(dbConfig);

  // CRITICAL: Always run migrations and seed to ensure latest schema/data
  runDatabaseMigrations(dbConfig);
  await runDatabaseSeed(dbConfig);

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
