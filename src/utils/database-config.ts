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

    // NPX detection: Enhanced detection for VS Code extensions and various npx scenarios
    const execPath = process.argv[1] || '';
    const isNpxExecution =
      execPath.includes('.npm/_npx') ||
      execPath.includes('npm-cache/_npx') ||
      execPath.includes('npm/global') ||
      process.env.npm_execpath?.includes('npx') ||
      process.env.npm_config_user_config?.includes('.npmrc') ||
      // VS Code extension specific detection
      process.env.VSCODE_PID !== undefined ||
      process.env.TERM_PROGRAM === 'vscode' ||
      // GitHub Copilot and other MCP clients
      process.env.MCP_CLIENT_NAME !== undefined;

    if (isNpxExecution) {
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
    // Enhanced path resolution for VS Code extensions and MCP clients
    let resolvedProjectRoot = projectRoot;

    // If running in VS Code extension context, try to find a better project root
    if (process.env.VSCODE_PID || process.env.TERM_PROGRAM === 'vscode') {
      // Try to use workspace folder if available
      const workspaceFolder =
        process.env.VSCODE_WORKSPACE_FOLDER || process.env.PWD || process.cwd();

      if (workspaceFolder && fs.existsSync(workspaceFolder)) {
        resolvedProjectRoot = workspaceFolder;
      }
    }

    // Fallback to user home directory if project root is not writable
    let dataDirectory = path.join(resolvedProjectRoot, 'data');

    try {
      // Test if we can create the data directory
      if (!fs.existsSync(dataDirectory)) {
        fs.mkdirSync(dataDirectory, { recursive: true });
      }

      // Test write permissions
      const testFile = path.join(dataDirectory, '.write-test');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
    } catch (error) {
      // Fallback to user home directory for VS Code extensions
      const homeDir =
        process.env.USERPROFILE || process.env.HOME || process.cwd();
      dataDirectory = path.join(homeDir, '.anubis', 'data');

      if (this.verbose) {
        console.warn(`⚠️ Using fallback data directory: ${dataDirectory}`);
        console.warn(`   Original error: ${error}`);
      }

      // Ensure fallback directory exists
      try {
        if (!fs.existsSync(dataDirectory)) {
          fs.mkdirSync(dataDirectory, { recursive: true });
        }
      } catch (fallbackError) {
        throw new Error(
          `Cannot create data directory. Tried: ${path.join(resolvedProjectRoot, 'data')} and ${dataDirectory}. Error: ${fallbackError}`,
        );
      }
    }

    const databasePath = path.join(dataDirectory, 'workflow.db');
    const databaseUrl = `file:${databasePath}`;

    return {
      databaseUrl,
      databasePath,
      dataDirectory,
      projectRoot: resolvedProjectRoot,
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
      fs.mkdirSync(config.dataDirectory, { recursive: true });
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
  if (!validation.isValid && process.env.NODE_ENV !== 'production') {
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
