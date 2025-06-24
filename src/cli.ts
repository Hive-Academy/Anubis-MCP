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
  const templateDbPath = path.join(
    packageRoot,
    'prisma',
    'data',
    'workflow.db',
  );

  if (!fs.existsSync(templateDbPath)) {
    throw new Error(
      `Pre-built database template not found at: ${templateDbPath}`,
    );
  }

  // Copy the pre-built database to the final destination
  fs.copyFileSync(templateDbPath, dbConfig.databasePath);
}

// -------------------- RUNTIME DATABASE MAINTENANCE --------------------

function runPrismaMigrations(verbose: boolean): void {
  try {
    // Ensure Prisma client is generated before we later require it
    execSync('npx prisma generate', {
      stdio: verbose ? 'inherit' : 'ignore',
    });

    execSync('npx prisma migrate deploy', {
      stdio: verbose ? 'inherit' : 'ignore',
    });
  } catch (error) {
    console.error('[Anubis] Failed to apply Prisma migrations', error);
  }
}

async function ensureSeedIsUpToDate(verbose: boolean): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { PrismaClient } =
    require('generated/prisma') as typeof import('generated/prisma');
  const prisma = new PrismaClient();

  const packageRoot = path.resolve(
    path.dirname(require.resolve('@hive-academy/anubis/package.json')),
  );
  const seedDir = path.join(packageRoot, 'prisma', 'seed-patches');

  if (!fs.existsSync(seedDir)) {
    await prisma.$disconnect();
    return; // No patches bundled
  }

  try {
    await prisma.$connect();

    await prisma.$executeRawUnsafe(
      'CREATE TABLE IF NOT EXISTS _meta (key TEXT PRIMARY KEY, value TEXT);',
    );

    const rows: Array<{ value: string }> = await prisma.$queryRawUnsafe(
      "SELECT value FROM _meta WHERE key = 'seed_version';",
    );

    let currentVersion = 0;
    if (rows.length) {
      const num = Number(rows[0].value);
      if (!Number.isNaN(num)) currentVersion = num;
    } else {
      await prisma.$executeRawUnsafe(
        "INSERT OR IGNORE INTO _meta (key, value) VALUES ('seed_version', 0);",
      );
    }

    const patches = fs
      .readdirSync(seedDir)
      .filter((f) => /^\d+_.*\.sql$/.test(f))
      .sort((a, b) => Number(a.split('_')[0]) - Number(b.split('_')[0]))
      .filter((f) => Number(f.split('_')[0]) > currentVersion);

    for (const file of patches) {
      const version = Number(file.split('_')[0]);
      const sql = fs.readFileSync(path.join(seedDir, file), 'utf8');

      if (verbose) console.log(`[Anubis] Applying seed patch ${file}`);

      await prisma.$executeRawUnsafe(sql);

      await prisma.$executeRawUnsafe(
        `UPDATE _meta SET value = ${version} WHERE key = 'seed_version';`,
      );
    }
  } catch (err) {
    console.error('[Anubis] Failed to apply seed patches', err);
  } finally {
    await prisma.$disconnect();
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

  // Setup pre-built database by copying the template
  setupPrebuiltDatabase(dbConfig);

  // Apply schema migrations and seed patches (does not touch user data)
  runPrismaMigrations(verbose);
  await ensureSeedIsUpToDate(verbose);

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
