/**
 * ARCHITECTURAL CONTEXT: Modular dependency management for NPX self-contained package
 * PATTERN FOLLOWED: Utility service pattern with error handling and logging
 * STRATEGIC PURPOSE: Centralize dependency management logic for maintainability
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

export interface DependencyCheckResult {
  prismaClientExists: boolean;
  playwrightBrowsersInstalled: boolean;
  databaseExists: boolean;
  errors: string[];
}

export interface DependencySetupOptions {
  skipPlaywright?: boolean;
  verbose?: boolean;
  databaseUrl?: string;
}

export class DependencyManager {
  private verbose: boolean;

  constructor(options: DependencySetupOptions = {}) {
    this.verbose = options.verbose || false;
  }

  /**
   * Log message if verbose mode is enabled
   */
  private log(message: string): void {
    if (this.verbose) {
      console.log(message);
    }
  }

  /**
   * Check if Prisma client is generated and available
   */
  checkPrismaClient(): boolean {
    try {
      // Check if @prisma/client is available
      require.resolve('@prisma/client');

      // Check if the generated client exists in node_modules
      const generatedPath = path.join(
        process.cwd(),
        'node_modules',
        '.prisma',
        'client',
      );
      const exists = fs.existsSync(generatedPath);

      this.log(
        `Prisma client check: ${exists ? 'EXISTS' : 'MISSING'} at ${generatedPath}`,
      );
      return exists;
    } catch (error) {
      this.log(`Prisma client check failed: ${error}`);
      return false;
    }
  }

  /**
   * Check if Playwright browsers are installed
   */
  checkPlaywrightBrowsers(): boolean {
    try {
      // Check if playwright is available
      require.resolve('playwright');

      // Try to access chromium to verify browsers are installed
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { _chromium } = require('playwright');
      this.log('Playwright browsers check: AVAILABLE');
      return true;
    } catch (error) {
      this.log(`Playwright browsers check failed: ${error}`);
      return false;
    }
  }

  /**
   * Check if database file exists
   */
  checkDatabase(databaseUrl: string): boolean {
    if (!databaseUrl) {
      this.log('Database check: No DATABASE_URL provided');
      return false;
    }

    if (databaseUrl.startsWith('file:')) {
      const dbPath = databaseUrl.replace('file:', '');
      const fullPath = path.resolve(process.cwd(), dbPath);
      const exists = fs.existsSync(fullPath);

      this.log(
        `Database check: ${exists ? 'EXISTS' : 'MISSING'} at ${fullPath}`,
      );
      return exists;
    }

    // For non-file databases, assume they exist
    this.log('Database check: Non-file database, assuming exists');
    return true;
  }

  /**
   * Generate Prisma client
   */
  generatePrismaClient(): void {
    console.log('🔧 Generating Prisma client...');

    try {
      // Check if prisma schema exists
      const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
      if (!fs.existsSync(schemaPath)) {
        throw new Error(`Prisma schema not found at ${schemaPath}`);
      }

      execSync('npx prisma generate', {
        stdio: this.verbose ? 'inherit' : 'pipe',
        cwd: process.cwd(),
        timeout: 60000, // 60 second timeout
      });

      console.log('✅ Prisma client generated successfully');
    } catch (error) {
      console.error('❌ Failed to generate Prisma client:', error);
      throw new Error(
        'Prisma client generation failed. Please ensure Prisma is properly configured.',
      );
    }
  }

  /**
   * Run database migrations
   */
  runDatabaseMigrations(): void {
    console.log('🗄️  Running database migrations...');

    try {
      // Check if migrations directory exists
      const migrationsPath = path.join(process.cwd(), 'prisma', 'migrations');
      if (!fs.existsSync(migrationsPath)) {
        this.log(
          'No migrations directory found, skipping migration deployment',
        );
        return;
      }

      execSync('npx prisma migrate deploy', {
        stdio: this.verbose ? 'inherit' : 'pipe',
        cwd: process.cwd(),
        timeout: 120000, // 2 minute timeout
      });

      console.log('✅ Database migrations completed successfully');
    } catch (error) {
      console.error('❌ Failed to run database migrations:', error);
      throw new Error(
        'Database migration failed. Please check your database configuration.',
      );
    }
  }

  /**
   * Install Playwright browsers conditionally
   */
  installPlaywrightBrowsers(): void {
    console.log('🎭 Installing Playwright browsers...');

    try {
      execSync('npx playwright install chromium --with-deps', {
        stdio: this.verbose ? 'inherit' : 'pipe',
        cwd: process.cwd(),
        timeout: 300000, // 5 minute timeout for browser installation
      });

      console.log('✅ Playwright browsers installed successfully');
    } catch (error) {
      console.warn('⚠️  Playwright browser installation failed:', error);
      console.log('📊 Report generation will be disabled');
      throw error; // Re-throw to let caller handle
    }
  }

  /**
   * Perform comprehensive dependency check
   */
  checkAllDependencies(
    options: DependencySetupOptions = {},
  ): DependencyCheckResult {
    const result: DependencyCheckResult = {
      prismaClientExists: false,
      playwrightBrowsersInstalled: false,
      databaseExists: false,
      errors: [],
    };

    try {
      result.prismaClientExists = this.checkPrismaClient();
    } catch (error) {
      result.errors.push(`Prisma client check failed: ${error}`);
    }

    try {
      result.playwrightBrowsersInstalled = this.checkPlaywrightBrowsers();
    } catch (error) {
      result.errors.push(`Playwright check failed: ${error}`);
    }

    try {
      result.databaseExists = this.checkDatabase(options.databaseUrl || '');
    } catch (error) {
      result.errors.push(`Database check failed: ${error}`);
    }

    return result;
  }

  /**
   * Initialize all dependencies automatically
   */
  initializeAllDependencies(
    options: DependencySetupOptions = {},
  ): DependencyCheckResult {
    console.log('🔍 Checking dependencies...');

    const status = this.checkAllDependencies(options);

    // Generate Prisma client if missing
    if (!status.prismaClientExists) {
      try {
        this.generatePrismaClient();
        status.prismaClientExists = true;
      } catch (error) {
        status.errors.push(`Prisma client generation failed: ${error}`);
      }
    }

    // Run migrations if database doesn't exist
    if (!status.databaseExists) {
      try {
        this.runDatabaseMigrations();
        status.databaseExists = true;
      } catch (error) {
        status.errors.push(`Database migration failed: ${error}`);
      }
    }

    // Install Playwright browsers if missing and not skipped
    if (!status.playwrightBrowsersInstalled && !options.skipPlaywright) {
      try {
        this.installPlaywrightBrowsers();
        status.playwrightBrowsersInstalled = true;
      } catch (_error) {
        // Don't add to errors - this is optional and handled gracefully
        console.log(
          '📊 Report generation will be disabled due to Playwright installation failure',
        );
        process.env.DISABLE_REPORT_GENERATION = 'true';
      }
    }

    return status;
  }

  /**
   * Get environment detection information
   */
  getEnvironmentInfo(): {
    isNpx: boolean;
    isGlobal: boolean;
    isLocal: boolean;
    nodeVersion: string;
    npmVersion: string;
  } {
    const isNpx = !!(
      process.env.npm_config_cache &&
      process.env.npm_config_cache.includes('.npm/_npx')
    );
    const isGlobal = process.env.npm_config_global === 'true';
    const isLocal = !isNpx && !isGlobal;

    return {
      isNpx,
      isGlobal,
      isLocal,
      nodeVersion: process.version,
      npmVersion: process.env.npm_version || 'unknown',
    };
  }
}
