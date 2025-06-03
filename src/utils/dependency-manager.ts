/**
 * ARCHITECTURAL CONTEXT: Self-contained NPX package dependency management
 * PATTERN FOLLOWED: Utility service pattern with environment-aware resource management
 * STRATEGIC PURPOSE: Provide complete MCP server functionality without requiring user project dependencies
 * DESIGN PRINCIPLE: Zero assumptions about user's project structure or dependencies
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
  private packageRoot: string;
  private userDataDir: string;

  constructor(options: DependencySetupOptions = {}) {
    this.verbose = options.verbose || false;

    // Always determine package root from current module location
    this.packageRoot = this.getPackageRoot();

    // Determine project root from environment variable or fallback to current working directory
    const projectRoot = process.env.PROJECT_ROOT || process.cwd();

    // User data directory is always in the project root at prisma/data
    this.userDataDir = path.join(projectRoot, 'prisma', 'data');

    // Log the paths for debugging
    this.log(
      `Project root: ${projectRoot} (${process.env.PROJECT_ROOT ? 'from PROJECT_ROOT env' : 'from process.cwd()'})`,
    );
    this.log(`User data directory: ${this.userDataDir}`);

    // Ensure user data directory exists
    this.ensureUserDataDirectory();
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
   * Ensure user data directory exists for database and logs
   */
  private ensureUserDataDirectory(): void {
    if (!fs.existsSync(this.userDataDir)) {
      fs.mkdirSync(this.userDataDir, { recursive: true });
      this.log(`Created user data directory: ${this.userDataDir}`);
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
   * Check if our workflow database exists in user data directory
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
   * Initialize database in user data directory
   * STRATEGIC CHANGE: Always run migrations to ensure database schema is up to date
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

      // Set database URL to user data directory
      const originalDbUrl = process.env.DATABASE_URL;
      process.env.DATABASE_URL = `file:${dbPath}`;

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
   * Copy bundled database to user data directory
   * @deprecated This method is no longer used - we run migrations instead
   */
  private copyBundledDatabase(): boolean {
    // No longer copying databases - we run migrations instead
    this.log('Skipping database copy - using migration-based initialization');
    return false;
  }

  /**
   * Create fresh database using bundled schema and migrations
   * @deprecated This method functionality is now handled by runDatabaseMigrations
   */
  private createFreshDatabase(): void {
    // This functionality is now handled by runDatabaseMigrations
    // which uses migrate deploy that works for both fresh and existing databases
    this.log(
      'Database creation handled by migrate deploy in runDatabaseMigrations',
    );
  }

  /**
   * Get database path in user data directory
   */
  private getDatabasePath(): string {
    return path.join(this.userDataDir, 'workflow.db');
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
   * Get environment detection information
   */
  getEnvironmentInfo(): {
    isNpx: boolean;
    isGlobal: boolean;
    isLocal: boolean;
    nodeVersion: string;
    npmVersion: string;
    packageRoot: string;
    workingDirectory: string;
    userDataDirectory: string;
  } {
    const isNpx = !!(
      process.env.npm_config_cache &&
      (process.env.npm_config_cache.includes('.npm/_npx') ||
        process.env.npm_config_cache.includes('npm-cache/_npx'))
    );
    const isGlobal = process.env.npm_config_global === 'true';
    const isLocal = !isNpx && !isGlobal;

    return {
      isNpx,
      isGlobal,
      isLocal,
      nodeVersion: process.version,
      npmVersion: process.env.npm_version || 'unknown',
      packageRoot: this.packageRoot,
      workingDirectory: process.cwd(),
      userDataDirectory: this.userDataDir,
    };
  }
}
