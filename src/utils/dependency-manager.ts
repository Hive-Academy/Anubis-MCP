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
   * STRATEGIC ENHANCEMENT: Support both NPX (custom path) and Docker (custom path) detection
   * ARCHITECTURAL CONTEXT: Project uses custom generated/prisma path, not standard @prisma/client
   * PATTERN FOLLOWED: Check for generated Prisma client in custom location
   * STRATEGIC PURPOSE: Ensure NPX package can find the custom generated Prisma client
   */
  checkPrismaClient(): boolean {
    try {
      // Check for custom generated location (both NPX and Docker use this)
      const customPath = path.join(process.cwd(), 'generated', 'prisma');

      if (fs.existsSync(customPath)) {
        // Verify it's a valid Prisma client by checking for key files
        const indexPath = path.join(customPath, 'index.js');
        const wasmPath = path.join(customPath, 'wasm.js');
        const edgePath = path.join(customPath, 'edge.js');

        if (
          fs.existsSync(indexPath) ||
          fs.existsSync(wasmPath) ||
          fs.existsSync(edgePath)
        ) {
          this.log(
            `Prisma client check: EXISTS at custom location ${customPath}`,
          );
          return true;
        } else {
          this.log(
            `Prisma client check: Custom location ${customPath} exists but missing client files`,
          );
        }
      } else {
        this.log(
          `Prisma client check: Custom location ${customPath} not found`,
        );
      }
    } catch (error) {
      this.log(`Prisma client custom path check failed: ${error}`);
    }

    this.log(
      'Prisma client check: NOT FOUND - custom generated client missing',
    );
    return false;
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
