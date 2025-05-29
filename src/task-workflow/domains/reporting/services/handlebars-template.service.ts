// src/task-workflow/domains/reporting/services/simple-template.service.ts

import { Injectable, Logger } from '@nestjs/common';
import * as Handlebars from 'handlebars';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ReportType } from '../interfaces/service-contracts.interface';
import { ReportingConfigService } from './infrastructure/reporting-config.service';

/**
 * Simple Template Service
 *
 * KISS PRINCIPLE: Keep It Simple, Stupid
 * - One service, one responsibility: render templates
 * - No complex abstractions or multiple layers
 * - Direct Handlebars rendering with minimal overhead
 * - Easy to understand and maintain
 */
@Injectable()
export class HandlebarsTemplateService {
  private readonly logger = new Logger(HandlebarsTemplateService.name);
  private readonly handlebars: typeof Handlebars;
  private readonly templateCache = new Map<
    string,
    HandlebarsTemplateDelegate
  >();

  constructor(private readonly configService: ReportingConfigService) {
    this.handlebars = Handlebars.create();
    this.registerBasicHelpers();
  }

  /**
   * Render any template with any data - that's it!
   */
  async renderTemplate(reportType: ReportType, data: any): Promise<string> {
    try {
      const templatePath = this.getTemplatePath(reportType);
      const template = await this.getTemplate(templatePath);

      // Add basic utilities to data
      const enhancedData = {
        ...data,
        generatedAt: new Date().toISOString(),
        reportType,
        utils: {
          formatDate: (date: string | Date) => {
            if (!date) return 'N/A';
            const d = typeof date === 'string' ? new Date(date) : date;
            return d.toLocaleDateString();
          },
          formatNumber: (num: number) => num?.toLocaleString() || '0',
          formatPercentage: (num: number) => `${(num || 0).toFixed(1)}%`,
        },
      };

      return template(enhancedData);
    } catch (error) {
      this.logger.error(
        `Template rendering failed for ${reportType}:`,
        error.stack,
      );
      return this.createErrorTemplate(reportType, error);
    }
  }

  /**
   * Get template path - uses config service for Docker/environment-aware resolution
   */
  private getTemplatePath(reportType: ReportType): string {
    const templatesDir = this.configService.templatesPath;

    // Use standard naming for all templates
    const templateFile = `${reportType.replace(/_/g, '-')}.hbs`;
    return path.join(templatesDir, templateFile);
  }

  /**
   * Get compiled template with simple caching
   */
  private async getTemplate(
    templatePath: string,
  ): Promise<HandlebarsTemplateDelegate> {
    if (this.templateCache.has(templatePath)) {
      return this.templateCache.get(templatePath)!;
    }

    const templateSource = await fs.readFile(templatePath, 'utf-8');
    const compiled = this.handlebars.compile(templateSource);

    // Cache it
    this.templateCache.set(templatePath, compiled);
    return compiled;
  }

  /**
   * Register only essential helpers
   */
  private registerBasicHelpers(): void {
    // JSON helper for debugging
    this.handlebars.registerHelper('json', (obj: any) => {
      return JSON.stringify(obj, null, 2);
    });

    // Basic conditionals
    this.handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b);
    this.handlebars.registerHelper(
      'if_exists',
      (value: unknown, options: Handlebars.HelperOptions) => {
        return value ? options.fn(this) : options.inverse(this);
      },
    );

    // Default value helper
    this.handlebars.registerHelper(
      'defaultValue',
      <T>(value: T | null | undefined | '', defaultVal: T): T => {
        return value !== null && value !== undefined && value !== ''
          ? value
          : defaultVal;
      },
    );

    // Section helper (for the templates that use it)
    this.handlebars.registerHelper(
      'section',
      function (this: any, name: string, options: any) {
        if (!this._sections) this._sections = {};
        this._sections[name] = options.fn(this);
        return null;
      },
    );

    // Date formatting helpers
    this.handlebars.registerHelper(
      'formatDate',
      (date: string | Date, format?: string) => {
        if (!date) return 'N/A';
        const d = typeof date === 'string' ? new Date(date) : date;
        if (format === 'MMMM Do, YYYY [at] h:mm A') {
          return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          });
        }
        return d.toLocaleDateString();
      },
    );

    this.handlebars.registerHelper('formatDateTime', (date: string | Date) => {
      if (!date) return 'N/A';
      const d = typeof date === 'string' ? new Date(date) : date;
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    });

    // Math helpers
    this.handlebars.registerHelper('gt', (a: number, b: number) => a > b);
    this.handlebars.registerHelper('gte', (a: number, b: number) => a >= b);
    this.handlebars.registerHelper('lte', (a: number, b: number) => a <= b);
    this.handlebars.registerHelper('abs', (num: number) => Math.abs(num));
    this.handlebars.registerHelper(
      'multiply',
      (a: number, b: number) => (a || 0) * (b || 0),
    );

    // String helpers
    this.handlebars.registerHelper('capitalize', (str: string) => {
      if (!str) return '';
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    });

    this.logger.log('Basic Handlebars helpers registered');
  }

  /**
   * Simple error template
   */
  private createErrorTemplate(reportType: ReportType, error: any): string {
    return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Template Error - ${reportType}</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-gray-50 p-8">
        <div class="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
          <h1 class="text-2xl font-bold text-red-600 mb-4">Template Error</h1>
          <p class="text-gray-600 mb-2">Report Type: ${reportType}</p>
          <p class="text-red-500 font-mono text-sm">${error.message}</p>
        </div>
      </body>
    </html>
    `;
  }

  /**
   * Clear cache for development
   */
  clearCache(): void {
    this.templateCache.clear();
  }
}
