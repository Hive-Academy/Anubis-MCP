import * as path from 'path';
import * as fs from 'fs';

/**
 * ARCHITECTURAL CONTEXT: Unified database configuration for all deployment methods
 * PATTERN FOLLOWED: Single source of truth for database path resolution
 * STRATEGIC PURPOSE: Eliminate configuration inconsistencies across Docker/NPX/Local
 */

export interface DatabaseConfig {
  databaseUrl: string;
  databasePath: string;
  dataDirectory: string;
  projectRoot: string;
  deploymentMethod: 'docker' | 'npx' | 'local';
  isProjectIsolated: boolean;
}

export interface DatabaseConfigOptions {
  projectRoot?: string;
  customDatabasePath?: string;
  verbose?: boolean;
}

export class DatabaseConfigManager {
  private verbose: boolean;

  constructor(options: DatabaseConfigOptions = {}) {
    this.verbose = options.verbose || false;
  }

  /**
   * Get unified database configuration for current deployment context
   */
  getDatabaseConfig(options: DatabaseConfigOptions = {}): DatabaseConfig {
    const deploymentMethod = this.detectDeploymentMethod();
    const projectRoot = this.resolveProjectRoot(options.projectRoot);

    this.log(`🔍 Detected deployment method: ${deploymentMethod}`);
    this.log(`📁 Project root: ${projectRoot}`);

    switch (deploymentMethod) {
      case 'docker':
        return this.getDockerDatabaseConfig(projectRoot, options);
      case 'npx':
        return this.getNpxDatabaseConfig(projectRoot, options);
      case 'local':
        return this.getLocalDatabaseConfig(projectRoot, options);
      default:
        throw new Error(
          `Unknown deployment method: ${deploymentMethod as any}`,
        );
    }
  }

  /**
   * Detect current deployment method based on environment
   */
  private detectDeploymentMethod(): 'docker' | 'npx' | 'local' {
    // Docker detection: Check for Docker-specific environment variables or file system markers
    if (
      process.env.RUNNING_IN_DOCKER ||
      fs.existsSync('/.dockerenv') ||
      process.env.MIGRATIONS_PRE_DEPLOYED === 'true'
    ) {
      return 'docker';
    }

    // NPX detection: Check if running from global or temporary NPX cache
    const execPath = process.argv[1] || '';
    if (
      execPath.includes('.npm/_npx') ||
      execPath.includes('npm/global') ||
      process.env.npm_execpath?.includes('npx')
    ) {
      return 'npx';
    }

    // Local development: Default fallback
    return 'local';
  }

  /**
   * Resolve project root directory consistently
   */
  private resolveProjectRoot(customRoot?: string): string {
    // 1. Custom root provided (highest priority)
    if (customRoot && path.isAbsolute(customRoot)) {
      return customRoot;
    }

    // 2. PROJECT_ROOT environment variable
    if (process.env.PROJECT_ROOT) {
      return process.env.PROJECT_ROOT;
    }

    // 3. Current working directory (most common case)
    return process.cwd();
  }

  /**
   * Docker deployment configuration
   * Pattern: /app/data/workflow.db with volume mounting for project isolation
   */
  private getDockerDatabaseConfig(
    projectRoot: string,
    _options: DatabaseConfigOptions,
  ): DatabaseConfig {
    // Docker uses container-internal paths but supports volume mounting for project isolation
    const dataDirectory = '/app/data';
    const databasePath = path.join(dataDirectory, 'workflow.db');
    const databaseUrl = `file:${databasePath}`;

    this.log(
      `🐳 Docker config - Data dir: ${dataDirectory}, DB path: ${databasePath}`,
    );

    return {
      databaseUrl,
      databasePath,
      dataDirectory,
      projectRoot,
      deploymentMethod: 'docker',
      isProjectIsolated: true, // Achieved via volume mounting
    };
  }

  /**
   * NPX deployment configuration
   * Pattern: {projectRoot}/data/workflow.db for automatic project isolation
   */
  private getNpxDatabaseConfig(
    projectRoot: string,
    _options: DatabaseConfigOptions,
  ): DatabaseConfig {
    const dataDirectory = path.join(projectRoot, 'data');
    const databasePath = path.join(dataDirectory, 'workflow.db');
    const databaseUrl = `file:${databasePath}`;

    this.log(
      `📦 NPX config - Data dir: ${dataDirectory}, DB path: ${databasePath}`,
    );

    return {
      databaseUrl,
      databasePath,
      dataDirectory,
      projectRoot,
      deploymentMethod: 'npx',
      isProjectIsolated: true, // Achieved via project-specific paths
    };
  }

  /**
   * Local development configuration
   * Pattern: {projectRoot}/data/workflow.db with optional custom paths
   */
  private getLocalDatabaseConfig(
    projectRoot: string,
    options: DatabaseConfigOptions,
  ): DatabaseConfig {
    // Support custom database path for local development flexibility
    if (options.customDatabasePath) {
      const customPath = path.resolve(projectRoot, options.customDatabasePath);
      const dataDirectory = path.dirname(customPath);
      const databaseUrl = `file:${customPath}`;

      this.log(
        `🏠 Local config (custom) - Data dir: ${dataDirectory}, DB path: ${customPath}`,
      );

      return {
        databaseUrl,
        databasePath: customPath,
        dataDirectory,
        projectRoot,
        deploymentMethod: 'local',
        isProjectIsolated: true,
      };
    }

    // Default local development pattern
    const dataDirectory = path.join(projectRoot, 'data');
    const databasePath = path.join(dataDirectory, 'workflow.db');
    const databaseUrl = `file:${databasePath}`;

    this.log(
      `🏠 Local config (default) - Data dir: ${dataDirectory}, DB path: ${databasePath}`,
    );

    return {
      databaseUrl,
      databasePath,
      dataDirectory,
      projectRoot,
      deploymentMethod: 'local',
      isProjectIsolated: true,
    };
  }

  /**
   * Ensure data directory exists with proper permissions
   */
  ensureDataDirectory(config: DatabaseConfig): void {
    if (!fs.existsSync(config.dataDirectory)) {
      this.log(`📁 Creating data directory: ${config.dataDirectory}`);
      fs.mkdirSync(config.dataDirectory, { recursive: true });
    } else {
      this.log(`✅ Data directory exists: ${config.dataDirectory}`);
    }
  }

  /**
   * Validate database configuration and fix common issues
   */
  validateConfiguration(config: DatabaseConfig): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    // Check data directory accessibility
    try {
      if (!fs.existsSync(config.dataDirectory)) {
        fs.mkdirSync(config.dataDirectory, { recursive: true });
      }

      // Test write permissions
      const testFile = path.join(config.dataDirectory, '.write-test');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
    } catch (error) {
      issues.push(
        `Data directory not writable: ${config.dataDirectory} - ${error}`,
      );
    }

    // Check database URL format
    if (!config.databaseUrl.startsWith('file:')) {
      issues.push(
        `Invalid database URL format: ${config.databaseUrl} (expected file: prefix)`,
      );
    }

    // Check path consistency
    const urlPath = config.databaseUrl.replace('file:', '');
    if (urlPath !== config.databasePath) {
      issues.push(
        `Database URL and path mismatch: ${config.databaseUrl} vs ${config.databasePath}`,
      );
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  /**
   * Get environment variables for database configuration
   */
  getEnvironmentVariables(config: DatabaseConfig): Record<string, string> {
    return {
      DATABASE_URL: config.databaseUrl,
      PROJECT_ROOT: config.projectRoot,
      MCP_DATA_DIRECTORY: config.dataDirectory,
      MCP_DEPLOYMENT_METHOD: config.deploymentMethod,
    };
  }

  /**
   * Generate Docker volume mounting configuration
   */
  getDockerVolumeConfig(config: DatabaseConfig): {
    volumeMount: string;
    containerPath: string;
    hostPath: string;
  } {
    if (config.deploymentMethod !== 'docker') {
      throw new Error(
        'Docker volume config only available for Docker deployment',
      );
    }

    const hostDataPath = path.join(config.projectRoot, 'data');

    return {
      volumeMount: `${hostDataPath}:/app/data`,
      containerPath: '/app/data',
      hostPath: hostDataPath,
    };
  }

  /**
   * Logging utility
   */
  private log(message: string): void {
    if (this.verbose) {
      console.log(`[DatabaseConfig] ${message}`);
    }
  }
}

/**
 * Convenience function to get database configuration
 */
export function getDatabaseConfig(
  options: DatabaseConfigOptions = {},
): DatabaseConfig {
  const manager = new DatabaseConfigManager(options);
  return manager.getDatabaseConfig(options);
}

/**
 * Convenience function to setup database environment
 */
export function setupDatabaseEnvironment(
  options: DatabaseConfigOptions = {},
): DatabaseConfig {
  const manager = new DatabaseConfigManager(options);
  const config = manager.getDatabaseConfig(options);

  // Ensure data directory exists
  manager.ensureDataDirectory(config);

  // Validate configuration
  const validation = manager.validateConfiguration(config);
  if (!validation.isValid) {
    console.warn('⚠️ Database configuration issues:');
    validation.issues.forEach((issue) => console.warn(`   - ${issue}`));
  }

  // Set environment variables
  const envVars = manager.getEnvironmentVariables(config);
  Object.entries(envVars).forEach(([key, value]) => {
    if (!process.env[key]) {
      process.env[key] = value;
    }
  });

  return config;
}
