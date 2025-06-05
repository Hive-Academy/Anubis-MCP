import { Injectable, Logger } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Template Path Resolver Service
 * Resolves template paths for both development and production environments
 * Supports Docker and local development
 */
@Injectable()
export class TemplatePathResolverService {
  private readonly logger = new Logger(TemplatePathResolverService.name);
  private readonly templateCache = new Map<string, string>();

  /**
   * Resolve template path based on environment
   */
  resolveTemplatePath(templateName: string, basePath?: string): string {
    // Check cache first (include basePath in cache key)
    const cacheKey = `${templateName}:${basePath || 'default'}`;
    if (this.templateCache.has(cacheKey)) {
      return this.templateCache.get(cacheKey)!;
    }

    let resolvedPath: string | undefined;

    // Get feature path and template filename
    const featurePath = this.getTemplateFeaturePath(templateName);
    const templateFileName = this.getTemplateFileName(templateName);

    // Use provided basePath or fallback to process.cwd()
    const workingDirectory = basePath || process.cwd();

    // Try different path resolution strategies
    const strategies = [
      // 1. Production build (dist folder) - feature-based structure
      () =>
        path.join(
          workingDirectory,
          'dist',
          'task-workflow',
          'domains',
          'reporting',
          featurePath,
          'templates',
          templateFileName,
        ),

      // 2. Development (src folder) - feature-based structure
      () =>
        path.join(
          workingDirectory,
          'src',
          'task-workflow',
          'domains',
          'reporting',
          featurePath,
          'templates',
          templateFileName,
        ),

      // 3. Docker environment (dist folder) - feature-based structure
      () =>
        path.join(
          '/app',
          'dist',
          'task-workflow',
          'domains',
          'reporting',
          featurePath,
          'templates',
          templateFileName,
        ),

      // 4. Legacy fallback - flat structure with template.hbs
      () =>
        path.join(
          workingDirectory,
          'src',
          'task-workflow',
          'domains',
          'reporting',
          featurePath,
          'templates',
          'template.hbs',
        ),
    ];

    for (const strategy of strategies) {
      try {
        const candidatePath = strategy();
        if (fs.existsSync(candidatePath)) {
          resolvedPath = candidatePath;
          break;
        }
      } catch (_error) {
        // Continue to next strategy
      }
    }

    if (!resolvedPath) {
      const searchedPaths = strategies.map((s) => {
        try {
          return s();
        } catch {
          return 'invalid path';
        }
      });

      // Enhanced debugging information
      this.logger.error(`Template resolution failed for: ${templateName}`);
      this.logger.error(`Working directory: ${workingDirectory}`);
      this.logger.error(`Base path provided: ${basePath || 'none'}`);
      this.logger.error(`Feature path: ${featurePath}`);
      this.logger.error(`Template filename: ${templateFileName}`);
      this.logger.error(`Searched paths:\n${searchedPaths.join('\n')}`);

      throw new Error(
        `Template not found: ${templateName}. Searched paths:\n${searchedPaths.join('\n')}`,
      );
    }

    // Cache the resolved path
    this.templateCache.set(cacheKey, resolvedPath);
    this.logger.log(
      `Resolved template path for ${templateName}: ${resolvedPath}`,
    );

    return resolvedPath;
  }

  /**
   * Map template names to their feature paths and actual filenames
   */
  private getTemplateFeaturePath(templateName: string): string {
    const templateFeatureMap: Record<string, string> = {
      'interactive-dashboard': 'dashboard/interactive-dashboard',
      'simple-report': 'dashboard/simple-report',
      'task-detail': 'task-management/task-detail',
      'implementation-plan': 'task-management/implementation-plan',
      'delegation-flow': 'workflow-analytics/delegation-flow',
      'workflow-analytics': 'workflow-analytics/workflow-analytics',
      'role-performance': 'workflow-analytics/role-performance',
    };

    return templateFeatureMap[templateName] || templateName;
  }

  /**
   * Get the actual template filename for a given template name
   */
  private getTemplateFileName(templateName: string): string {
    const templateFileMap: Record<string, string> = {
      'interactive-dashboard': 'interactive-dashboard.hbs',
      'simple-report': 'simple-report.hbs',
      'task-detail': 'task-detail-report.hbs',
      'implementation-plan': 'implementation-plan-report.hbs',
      'delegation-flow': 'delegation-flow-report.hbs',
      'workflow-analytics': 'workflow-analytics-report.hbs',
      'role-performance': 'role-performance-report.hbs',
    };

    return templateFileMap[templateName] || `${templateName}.hbs`;
  }

  /**
   * Check if template exists
   */
  templateExists(templateName: string): boolean {
    try {
      this.resolveTemplatePath(templateName);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get all available templates
   */
  getAvailableTemplates(): string[] {
    const templates: string[] = [];
    const templateNames = [
      'interactive-dashboard',
      'simple-report',
      'task-detail',
      'implementation-plan',
      'delegation-flow',
      'workflow-analytics',
      'role-performance',
    ];

    for (const templateName of templateNames) {
      if (this.templateExists(templateName)) {
        templates.push(templateName);
      }
    }

    return templates;
  }

  /**
   * Clear template cache (useful for development)
   */
  clearCache(): void {
    this.templateCache.clear();
    this.logger.log('Template path cache cleared');
  }
}
