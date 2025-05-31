// src/task-workflow/domains/reporting/services/reporting-config.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { accessSync, readFileSync } from 'fs';
import * as path from 'path';

/**
 * Reporting Configuration Service
 *
 * Handles environment-aware configuration for the reporting system
 * Provides dynamic path resolution for Docker and development environments
 */
@Injectable()
export class ReportingConfigService {
  private readonly logger = new Logger(ReportingConfigService.name);
  private readonly _templatesPath: string;
  private readonly _reportsPath: string;

  constructor() {
    this._templatesPath = this.resolveTemplatesPath();
    this._reportsPath = this.resolveReportsPath();

    // Log configuration asynchronously without blocking constructor
    this.logConfiguration();
  }

  get templatesPath(): string {
    return this._templatesPath;
  }

  get reportsPath(): string {
    return this._reportsPath;
  }

  /**
   * Dynamically resolve templates path based on environment
   * Supports development, production, Docker, and NPX environments
   */
  private resolveTemplatesPath(): string {
    const templateRelativePath = path.join(
      'task-workflow',
      'domains',
      'reporting',
      'templates',
    );

    // Environment variable override
    if (process.env.TEMPLATES_PATH) {
      const envPath = path.resolve(process.env.TEMPLATES_PATH);
      if (this.pathExists(envPath)) {
        return envPath;
      }
      this.logger.warn(
        `TEMPLATES_PATH environment variable set but path doesn't exist: ${envPath}`,
        'ReportingConfigService',
      );
    }

    // Get the project root directory more reliably
    const projectRoot = this.findProjectRoot();

    // Try multiple possible locations in order of preference
    const possiblePaths = [
      // NPX package: relative to current module location
      path.join(__dirname, '..', '..', '..', '..', 'templates'),
      // NPX package: relative to dist folder in package
      path.join(
        __dirname,
        '..',
        '..',
        '..',
        '..',
        '..',
        'dist',
        templateRelativePath,
      ),
      // Production/Docker: dist folder (most common in containers)
      path.join(projectRoot, 'dist', templateRelativePath),
      // Development: src folder
      path.join(projectRoot, 'src', templateRelativePath),
      // Docker volume mount location
      path.join('/app', 'templates'),
      // Alternative Docker location
      path.join('/app', 'dist', templateRelativePath),
      // Fallback to process.cwd() based paths
      path.join(process.cwd(), 'dist', templateRelativePath),
      path.join(process.cwd(), 'src', templateRelativePath),
      // NPX fallback: look in node_modules
      path.join(
        process.cwd(),
        'node_modules',
        '@hive-academy',
        'mcp-workflow-manager',
        'dist',
        templateRelativePath,
      ),
    ];

    // Check which path exists and use the first available
    for (const templatePath of possiblePaths) {
      if (this.pathExists(templatePath)) {
        this.logger.log(
          `✅ Found templates at: ${templatePath}`,
          'ReportingConfigService',
        );
        return templatePath;
      }
    }

    // If no path found, default to dist (production) and log warning
    const defaultPath = possiblePaths[0];
    this.logger.warn(
      `No templates directory found. Using default: ${defaultPath}. Checked paths: ${possiblePaths.join(', ')}`,
      'ReportingConfigService',
    );
    return defaultPath;
  }

  /**
   * Find the project root directory by looking for package.json
   * Enhanced for NPX package detection
   */
  private findProjectRoot(): string {
    let currentDir = __dirname;

    // Walk up the directory tree to find package.json
    while (currentDir !== path.dirname(currentDir)) {
      const packageJsonPath = path.join(currentDir, 'package.json');
      if (this.pathExists(packageJsonPath)) {
        // Check if this is our NPX package by looking for our package name
        try {
          const packageJson = JSON.parse(
            readFileSync(packageJsonPath, 'utf-8'),
          );
          if (packageJson.name === '@hive-academy/mcp-workflow-manager') {
            this.logger.log(
              `✅ Found NPX package root: ${currentDir}`,
              'ReportingConfigService',
            );
            return currentDir;
          }
        } catch {
          // If we can't read package.json, continue searching
        }
        return currentDir;
      }
      currentDir = path.dirname(currentDir);
    }

    // Fallback to process.cwd() if package.json not found
    return process.cwd();
  }

  /**
   * Check if a path exists
   */
  private pathExists(pathToCheck: string): boolean {
    try {
      accessSync(pathToCheck);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Log current configuration for debugging
   */
  private logConfiguration(): void {
    this.logger.log(`Reporting Configuration:`, 'ReportingConfigService');
    this.logger.log(
      `  Templates Path: ${this._templatesPath}`,
      'ReportingConfigService',
    );
    this.logger.log(
      `  Reports Path: ${this._reportsPath}`,
      'ReportingConfigService',
    );

    this.logger.log(
      `  Environment: ${process.env.NODE_ENV || 'development'}`,
      'ReportingConfigService',
    );
    this.logger.log(
      `  Working Directory: ${process.cwd()}`,
      'ReportingConfigService',
    );

    // Verify templates directory exists
    if (this.pathExists(this._templatesPath)) {
      this.logger.log(
        `✅ Templates directory exists and is accessible`,
        'ReportingConfigService',
      );
    } else {
      this.logger.error(
        `❌ Templates directory does not exist: ${this._templatesPath}`,
        'ReportingConfigService',
      );
    }
  }

  /**
   * Get environment information for debugging
   */
  getEnvironmentInfo(): Record<string, any> {
    return {
      nodeEnv: process.env.NODE_ENV || 'development',
      workingDirectory: process.cwd(),
      templatesPath: this._templatesPath,
      templatesExists: this.pathExists(this._templatesPath),
      customTemplatesPath: process.env.TEMPLATES_PATH,
      customReportsPath: process.env.REPORTS_PATH,
    };
  }

  /**
   * Dynamically resolve reports path based on environment
   * Simple approach: always use current working directory + workflow-reports
   */
  private resolveReportsPath(): string {
    // Environment variable override
    if (process.env.REPORTS_PATH) {
      const envPath = path.resolve(process.env.REPORTS_PATH);
      if (this.pathExists(path.dirname(envPath))) {
        return envPath;
      }
      this.logger.warn(
        `REPORTS_PATH environment variable set but parent directory doesn't exist: ${envPath}`,
        'ReportingConfigService',
      );
    }

    // Simple approach: always use current working directory
    const reportsPath = path.join(process.cwd(), 'workflow-reports');
    this.logger.log(
      `📁 Reports directory: ${reportsPath}`,
      'ReportingConfigService',
    );
    return reportsPath;
  }
}
