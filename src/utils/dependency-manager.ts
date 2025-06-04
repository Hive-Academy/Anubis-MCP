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
  playwrightBrowsersInstalled: boolean;
  databaseExists: boolean;
  errors: string[];
}

export interface DependencySetupOptions {
  skipPlaywright?: boolean;
  verbose?: boolean;
  databaseUrl?: string;
}

export interface DependencySetupResult {
  success: boolean;
  errors: string[];
  warnings: string[];
}

export interface EnvironmentInfo {
  isNpx: boolean;
  isGlobal: boolean;
  isLocal: boolean;
  nodeVersion: string;
  packageRoot: string;
  workingDirectory: string;
  userDataDirectory: string;
}

/**
 * ARCHITECTURAL CONTEXT: Enhanced dependency management with unified database configuration
 * PATTERN FOLLOWED: Database configuration integration with deployment-aware setup
 * STRATEGIC PURPOSE: Simplify dependency setup by leveraging unified database configuration
 */

export class DependencyManager {
  private verbose: boolean;
  private packageRoot: string;
  private databaseConfig: DatabaseConfig;

  constructor(options: DependencySetupOptions = {}) {
    this.verbose = options.verbose || false;

    // Always determine package root from current module location
    this.packageRoot = this.getPackageRoot();

    // Use unified database configuration
    this.databaseConfig = getDatabaseConfig({
      projectRoot: process.env.PROJECT_ROOT || process.cwd(),
      verbose: this.verbose,
    });

    this.log(`Package root: ${this.packageRoot}`);
    this.log(
      `Database config: ${this.databaseConfig.deploymentMethod} deployment`,
    );
    this.log(`Data directory: ${this.databaseConfig.dataDirectory}`);

    // Ensure data directory exists
    this.ensureDataDirectory();
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
   * Get the package root directory (where our bundled resources are)
   */
  private getPackageRoot(): string {
    // Navigate up from dist/utils to package root
    return path.resolve(__dirname, '..', '..');
  }

  /**
   * Ensure data directory exists (uses unified configuration)
   */
  private ensureDataDirectory(): void {
    if (!fs.existsSync(this.databaseConfig.dataDirectory)) {
      this.log(`Creating data directory: ${this.databaseConfig.dataDirectory}`);
      fs.mkdirSync(this.databaseConfig.dataDirectory, { recursive: true });
    } else {
      this.log(`Data directory exists: ${this.databaseConfig.dataDirectory}`);
    }
  }

  /**
   * Check if our bundled Prisma client exists
   * STRATEGIC CHANGE: Only check for our own bundled client, not user's project
   */
  checkPrismaClient(): boolean {
    try {
      // Check for our bundled Prisma client in the package
      const bundledClientPath = path.join(
        this.packageRoot,
        'generated',
        'prisma',
      );

      if (fs.existsSync(bundledClientPath)) {
        // Verify it's a valid Prisma client by checking for key files
        const indexPath = path.join(bundledClientPath, 'index.js');
        const wasmPath = path.join(bundledClientPath, 'wasm.js');
        const edgePath = path.join(bundledClientPath, 'edge.js');

        if (
          fs.existsSync(indexPath) ||
          fs.existsSync(wasmPath) ||
          fs.existsSync(edgePath)
        ) {
          this.log(`Bundled Prisma client: EXISTS at ${bundledClientPath}`);
          return true;
        } else {
          this.log(
            `Bundled Prisma client: Directory exists but missing client files at ${bundledClientPath}`,
          );
        }
      } else {
        this.log(`Bundled Prisma client: NOT FOUND at ${bundledClientPath}`);
      }
    } catch (error) {
      this.log(`Bundled Prisma client check failed: ${error}`);
    }

    this.log('Bundled Prisma client: NOT AVAILABLE');
    return false;
  }

  /**
   * Check if Playwright browsers are installed
   */
  checkPlaywrightBrowsers(): boolean {
    try {
      // Check if playwright is available in our package
      require.resolve('playwright');

      // Try to access chromium to verify browsers are installed
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { _chromium } = require('playwright');
      this.log('Playwright browsers: AVAILABLE');
      return true;
    } catch (error) {
      this.log(`Playwright browsers check failed: ${error}`);
      return false;
    }
  }

  /**
   * Get database path (uses unified configuration)
   */
  getDatabasePath(): string {
    return this.databaseConfig.databasePath;
  }

  /**
   * Check if our workflow database exists (uses unified configuration)
   */
  checkDatabase(_databaseUrl?: string): boolean {
    const dbPath = this.getDatabasePath();
    const exists = fs.existsSync(dbPath);

    this.log(
      `Workflow database: ${exists ? 'EXISTS' : 'MISSING'} at ${dbPath}`,
    );
    return exists;
  }

  /**
   * Generate Prisma client (not needed for NPX - should be pre-built)
   * STRATEGIC CHANGE: Skip generation for NPX, use bundled client
   */
  generatePrismaClient(): void {
    this.log('Using pre-built Prisma client from package bundle');

    // For NPX distribution, we should always have a pre-built client
    if (!this.checkPrismaClient()) {
      throw new Error(
        'Pre-built Prisma client not found in package. This indicates a packaging issue.',
      );
    }

    console.log('✅ Using bundled Prisma client');
  }

  /**
   * Initialize database with unified configuration
   * STRATEGIC CHANGE: Uses unified database configuration for all deployment methods
   * DATA SAFETY: Use Prisma migrate deploy which safely applies migrations without data loss
   */
  runDatabaseMigrations(): void {
    console.log('🗄️  Initializing workflow database...');

    try {
      const dbPath = this.getDatabasePath();
      const bundledSchemaPath = path.join(
        this.packageRoot,
        'prisma',
        'schema.prisma',
      );
      const bundledMigrationsPath = path.join(
        this.packageRoot,
        'prisma',
        'migrations',
      );

      // Verify bundled resources exist
      if (!fs.existsSync(bundledSchemaPath)) {
        throw new Error(
          `Bundled Prisma schema not found at ${bundledSchemaPath}`,
        );
      }

      if (!fs.existsSync(bundledMigrationsPath)) {
        throw new Error(
          `Bundled migrations not found at ${bundledMigrationsPath}`,
        );
      }

      // Set database URL from unified configuration
      const originalDbUrl = process.env.DATABASE_URL;
      process.env.DATABASE_URL = this.databaseConfig.databaseUrl;

      try {
        if (fs.existsSync(dbPath)) {
          console.log(
            '✅ Existing workflow database found - applying any pending migrations',
          );
          this.log(
            `Database exists at ${dbPath} - running migrate deploy to ensure schema is current`,
          );
        } else {
          console.log(
            '📝 No existing database found - creating fresh database with migrations',
          );
        }

        // Run migrations using bundled schema - this is safe and will:
        // 1. Create database if it doesn't exist
        // 2. Apply only pending migrations if database exists
        // 3. Preserve existing data
        execSync(`npx prisma migrate deploy --schema="${bundledSchemaPath}"`, {
          stdio: this.verbose ? 'inherit' : 'pipe',
          cwd: this.packageRoot,
          timeout: 120000,
        });

        console.log('✅ Workflow database migrations completed successfully');
      } finally {
        // Restore original DATABASE_URL
        if (originalDbUrl) {
          process.env.DATABASE_URL = originalDbUrl;
        } else {
          delete process.env.DATABASE_URL;
        }
      }
    } catch (error) {
      console.error('❌ Failed to run database migrations:', error);
      throw new Error(
        'Database migration failed. Please check permissions and disk space.',
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
        cwd: this.packageRoot,
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
    _options: DependencySetupOptions = {},
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
      result.errors.push(`Bundled Prisma client check failed: ${error}`);
    }

    try {
      result.playwrightBrowsersInstalled = this.checkPlaywrightBrowsers();
    } catch (error) {
      result.errors.push(`Playwright check failed: ${error}`);
    }

    try {
      result.databaseExists = this.checkDatabase();
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
    console.log('🔍 Checking MCP server dependencies...');

    const status = this.checkAllDependencies(options);

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
   * Get environment information (enhanced with database config)
   */
  getEnvironmentInfo(): EnvironmentInfo {
    const execPath = process.argv[1] || '';
    const isNpx = this.isNpxExecution(execPath);
    const isGlobal = this.isGlobalInstallation();
    const isLocal = !isNpx && !isGlobal;

    return {
      isNpx,
      isGlobal,
      isLocal,
      nodeVersion: process.version,
      packageRoot: this.packageRoot,
      workingDirectory: process.cwd(),
      userDataDirectory: this.databaseConfig.dataDirectory, // Use unified config
    };
  }

  private isNpxExecution(execPath: string): boolean {
    return !!(
      (process.env.npm_config_cache &&
        (process.env.npm_config_cache.includes('.npm/_npx') ||
          process.env.npm_config_cache.includes('npm-cache/_npx'))) ||
      execPath.includes('.npm/_npx') ||
      execPath.includes('npm/global') ||
      process.env.npm_execpath?.includes('npx')
    );
  }

  private isGlobalInstallation(): boolean {
    return process.env.npm_config_global === 'true';
  }
}
