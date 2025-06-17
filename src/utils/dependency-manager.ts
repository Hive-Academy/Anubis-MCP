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

    // Determine package root - where this code is running from
    this.packageRoot = path.resolve(__dirname, '../..');

    // Get database configuration with PROJECT_ROOT priority
    const projectRoot = process.env.PROJECT_ROOT || process.cwd();
    this.dbConfig = getDatabaseConfig({
      projectRoot: projectRoot,
      verbose: this.verbose,
    });

    // Use database URL from config if not provided, with PROJECT_ROOT priority
    this.databaseUrl = options.databaseUrl || this.dbConfig.databaseUrl;

    if (this.verbose) {
      console.error(`🔧 Dependency Manager initialized:`);
      console.error(`   Package Root: ${this.packageRoot}`);
      console.error(`   Project Root: ${this.dbConfig.projectRoot}`);
      console.error(`   Database URL: ${this.databaseUrl}`);
      console.error(`   Deployment Method: ${this.dbConfig.deploymentMethod}`);
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
   * Reset database to ensure clean state (force reset for NPX installations)
   */
  private resetDatabase(): void {
    // Set the database URL for this operation
    const oldDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = this.databaseUrl;

    try {
      if (this.verbose) {
        console.log('🔄 Resetting database to ensure clean installation...');
      }

      execSync('npx prisma migrate reset --force', {
        stdio: this.verbose ? 'inherit' : 'pipe',
        cwd: this.packageRoot,
        timeout: 30000, // 30 seconds timeout
      });

      if (this.verbose) {
        console.log('✅ Database reset completed successfully');
      }
    } catch (error) {
      if (this.verbose) {
        console.warn(
          '⚠️  Database reset failed (might be first install):',
          error,
        );
      }
      // Don't throw - this might be the first installation
    } finally {
      // Restore original DATABASE_URL
      if (oldDatabaseUrl !== undefined) {
        process.env.DATABASE_URL = oldDatabaseUrl;
      } else {
        delete process.env.DATABASE_URL;
      }
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
        // Ensure directory exists with cross-platform approach
        if (!fs.existsSync(dbDir)) {
          fs.mkdirSync(dbDir, { recursive: true });
        }

        // Test write permissions
        const testFile = path.join(dbDir, '.write-test');
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);

        if (this.verbose) {
          console.error(`✅ Database directory ready: ${dbDir}`);
        }
      } catch (error) {
        // NO FALLBACK - fail with clear cross-platform error message
        const errorMessage = [
          `❌ Cannot create database directory: ${dbDir}`,
          `   Database path: ${absoluteDbPath}`,
          `   Error: ${error}`,
          ``,
          `💡 This indicates a permissions or disk space issue.`,
          `   Please ensure the project directory is writable.`,
          ``,
          `🔧 Cross-platform troubleshooting:`,
          `   - Windows: Check antivirus, run as administrator if needed`,
          `   - Linux/Mac: Check permissions with 'ls -la' and 'df -h'`,
          `   - All: Ensure sufficient disk space`,
          ``,
          `This tool requires project-isolated storage and will NOT use system directories.`,
        ].join('\n');

        throw new Error(errorMessage);
      }
    }

    try {
      execSync('npx prisma migrate deploy', {
        stdio: this.verbose ? 'inherit' : 'pipe',
        cwd: this.packageRoot,
        timeout: 60000, // 1 minute timeout
      });

      if (this.verbose) {
        console.error(`✅ Database migrations completed successfully`);
      }
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
    } else {
      // Reset database to ensure clean installation
      try {
        this.resetDatabase();
        // Run migrations after reset
        this.runDatabaseMigrations();
        status.databaseExists = true;
      } catch (error) {
        status.errors.push(`Database reset and migration failed: ${error}`);
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
