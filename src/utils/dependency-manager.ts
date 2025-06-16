/**
 * ARCHITECTURAL CONTEXT: Self-contained NPX package dependency management
 * PATTERN FOLLOWED: Utility service pattern with environment-aware resource management
 * STRATEGIC PURPOSE: Provide complete MCP server functionality without requiring user project dependencies
 * DESIGN PRINCIPLE: Zero assumptions about user's project structure or dependencies
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { getDatabaseConfig, DatabaseConfig } from './database-config';

export interface DependencyCheckResult {
  prismaClientExists: boolean;
  databaseExists: boolean;
  databaseSeeded: boolean;
  errors: string[];
}

export interface DependencySetupOptions {
  verbose?: boolean;
  databaseUrl?: string;
}

export interface DependencyManagerOptions {
  verbose?: boolean;
  databaseUrl?: string;
}

/**
 * ARCHITECTURAL PATTERN: Self-contained dependency management utility
 * Ensures the NPX package can function without requiring user environment setup
 */
export class DependencyManager {
  private verbose: boolean;
  private databaseUrl: string;
  private packageRoot: string;
  private dbConfig: DatabaseConfig;

  constructor(options: DependencyManagerOptions = {}) {
    this.verbose = options.verbose || false;
    this.databaseUrl = options.databaseUrl || process.env.DATABASE_URL || '';

    // Determine package root - where this code is running from
    this.packageRoot = path.resolve(__dirname, '../..');

    // Get database configuration
    this.dbConfig = getDatabaseConfig({
      projectRoot: process.env.PROJECT_ROOT || process.cwd(),
      verbose: this.verbose,
    });

    // Use database URL from config if not provided
    if (!this.databaseUrl) {
      this.databaseUrl = this.dbConfig.databaseUrl;
    }
  }

  /**
   * Check if bundled Prisma client exists and is accessible
   */
  checkPrismaClient(): boolean {
    try {
      // Check for bundled Prisma client (NPX packages include this)
      const bundledPrismaPath = path.join(this.packageRoot, 'generated/prisma');

      if (fs.existsSync(bundledPrismaPath)) {
        return true;
      }

      // Fallback: check if we can require @prisma/client
      require.resolve('@prisma/client');

      return true;
    } catch (_error) {
      return false;
    }
  }

  /**
   * Check if database exists and is accessible
   */
  checkDatabase(): boolean {
    try {
      if (this.databaseUrl.includes('file:')) {
        // SQLite database
        const dbPath = this.databaseUrl.replace('file:', '');
        const absoluteDbPath = path.isAbsolute(dbPath)
          ? dbPath
          : path.resolve(process.cwd(), dbPath);

        if (fs.existsSync(absoluteDbPath)) {
          return true;
        } else {
          return false;
        }
      } else {
        // Remote database - assume accessible for now
        // In production, you might want to test connection

        return true;
      }
    } catch (_error) {
      return false;
    }
  }

  /**
   * Check if database has been seeded with workflow rules
   */
  async checkDatabaseSeeding(): Promise<boolean> {
    try {
      // Check if seeding is already done (Docker build-time seeding)
      if (process.env.BUILD_TIME_SEEDING_DEPLOYED === 'true') {
        return true;
      }

      // Dynamically import PrismaClient to avoid issues if not generated yet
      const { PrismaClient } = await import('../../generated/prisma');
      const prisma = new PrismaClient();

      try {
        const roleCount = await prisma.workflowRole.count();
        const stepCount = await prisma.workflowStep.count();

        const isSeeded = roleCount > 0 && stepCount > 0;

        return isSeeded;
      } finally {
        await prisma.$disconnect();
      }
    } catch (_error) {
      return false;
    }
  }

  /**
   * Generate Prisma client from schema
   */
  generatePrismaClient(): void {
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔧 Generating Prisma client...');
    }

    try {
      // Set the database URL for this operation
      const oldDatabaseUrl = process.env.DATABASE_URL;
      process.env.DATABASE_URL = this.databaseUrl;

      execSync('npx prisma generate', {
        stdio: this.verbose ? 'inherit' : 'pipe',
        cwd: this.packageRoot,
        timeout: 60000, // 1 minute timeout
      });

      // Restore original DATABASE_URL
      if (oldDatabaseUrl !== undefined) {
        process.env.DATABASE_URL = oldDatabaseUrl;
      } else {
        delete process.env.DATABASE_URL;
      }

      if (process.env.NODE_ENV !== 'production') {
        console.log('✅ Prisma client generated successfully');
      }
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('⚠️  Prisma client generation failed:', error);
      }
      throw error;
    }
  }

  /**
   * Run database migrations to ensure schema is up to date
   */
  runDatabaseMigrations(): void {
    // Set the database URL for this operation
    const oldDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = this.databaseUrl;

    // Create data directory if it doesn't exist (for SQLite)
    if (this.databaseUrl.includes('file:')) {
      const dbPath = this.databaseUrl.replace('file:', '');
      const absoluteDbPath = path.isAbsolute(dbPath)
        ? dbPath
        : path.resolve(process.cwd(), dbPath);
      const dbDir = path.dirname(absoluteDbPath);

      try {
        if (!fs.existsSync(dbDir)) {
          fs.mkdirSync(dbDir, { recursive: true });
        }

        // Test write permissions
        const testFile = path.join(dbDir, '.write-test');
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
      } catch (error) {
        // Enhanced error handling for VS Code extensions
        if (this.verbose) {
          console.warn(
            `⚠️ Database directory creation/write test failed: ${error}`,
          );
          console.warn(`   Database path: ${absoluteDbPath}`);
          console.warn(`   Directory: ${dbDir}`);
        }

        // Try alternative approach for VS Code extensions
        const homeDir = process.env.USERPROFILE || process.env.HOME;
        if (homeDir) {
          const fallbackDir = path.join(homeDir, '.anubis', 'data');
          const fallbackDbPath = path.join(fallbackDir, 'workflow.db');

          try {
            if (!fs.existsSync(fallbackDir)) {
              fs.mkdirSync(fallbackDir, { recursive: true });
            }

            // Update database URL to use fallback path
            this.databaseUrl = `file:${fallbackDbPath}`;
            process.env.DATABASE_URL = this.databaseUrl;

            if (this.verbose) {
              console.log(`✅ Using fallback database path: ${fallbackDbPath}`);
            }
          } catch (fallbackError) {
            throw new Error(
              `Cannot create database directory. Original: ${dbDir}, Fallback: ${fallbackDir}. Error: ${fallbackError}`,
            );
          }
        } else {
          throw error;
        }
      }
    }

    try {
      execSync('npx prisma migrate deploy', {
        stdio: this.verbose ? 'inherit' : 'pipe',
        cwd: this.packageRoot,
        timeout: 60000, // 1 minute timeout
      });
    } catch (error) {
      if (this.verbose) {
        console.error('❌ Prisma migrate deploy failed:', error);
        console.error('   Database URL:', this.databaseUrl);
        console.error('   Package root:', this.packageRoot);
      }
      throw error;
    }

    // Restore original DATABASE_URL
    if (oldDatabaseUrl !== undefined) {
      process.env.DATABASE_URL = oldDatabaseUrl;
    } else {
      delete process.env.DATABASE_URL;
    }
  }

  /**
   * Run database seeding to populate workflow rules
   */
  runDatabaseSeeding(): void {
    // Set the database URL for this operation
    const oldDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = this.databaseUrl;

    execSync('npx prisma db seed', {
      stdio: this.verbose ? 'inherit' : 'pipe',
      cwd: this.packageRoot,
      timeout: 120000, // 2 minute timeout for seeding
    });

    // Restore original DATABASE_URL
    if (oldDatabaseUrl !== undefined) {
      process.env.DATABASE_URL = oldDatabaseUrl;
    } else {
      delete process.env.DATABASE_URL;
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('✅ Database seeding completed successfully');
    }
  }

  /**
   * Perform comprehensive dependency check
   */
  async checkAllDependencies(
    _options: DependencySetupOptions = {},
  ): Promise<DependencyCheckResult> {
    const result: DependencyCheckResult = {
      prismaClientExists: false,
      databaseExists: false,
      databaseSeeded: false,
      errors: [],
    };

    try {
      result.prismaClientExists = this.checkPrismaClient();
    } catch (error) {
      result.errors.push(`Bundled Prisma client check failed: ${error}`);
    }

    try {
      result.databaseExists = this.checkDatabase();
    } catch (error) {
      result.errors.push(`Database check failed: ${error}`);
    }

    try {
      result.databaseSeeded = await this.checkDatabaseSeeding();
    } catch (error) {
      result.errors.push(`Database seeding check failed: ${error}`);
    }

    return result;
  }

  /**
   * Initialize all dependencies automatically
   */
  async initializeAllDependencies(
    options: DependencySetupOptions = {},
  ): Promise<DependencyCheckResult> {
    const status = await this.checkAllDependencies(options);

    // Ensure bundled Prisma client is available
    if (!status.prismaClientExists) {
      try {
        this.generatePrismaClient();
        status.prismaClientExists = true;
      } catch (error) {
        status.errors.push(`Bundled Prisma client validation failed: ${error}`);
      }
    }

    // Initialize workflow database in user data directory (safe - never overwrites)
    if (!status.databaseExists) {
      try {
        this.runDatabaseMigrations();
        status.databaseExists = true;
      } catch (error) {
        status.errors.push(`Database initialization failed: ${error}`);
      }
    }

    // Seed database with workflow rules if not already seeded
    if (!status.databaseSeeded) {
      try {
        this.runDatabaseSeeding();
        status.databaseSeeded = true;
      } catch (error) {
        status.errors.push(`Database seeding failed: ${error}`);
      }
    }

    return status;
  }
}
