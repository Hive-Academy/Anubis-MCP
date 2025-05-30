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

      // Debug: Log key data being passed to template
      this.logger.debug(`Rendering template for ${reportType}`);
      this.logger.debug(`Template path: ${templatePath}`);
      this.logger.debug(`Data keys: ${Object.keys(enhancedData).join(', ')}`);
      this.logger.debug(`TaskContext exists: ${!!enhancedData.taskContext}`);
      if (enhancedData.taskContext) {
        this.logger.debug(`TaskContext name: ${enhancedData.taskContext.name}`);
        this.logger.debug(
          `TaskContext taskId: ${enhancedData.taskContext.taskId}`,
        );
      }

      const renderedHtml = template(enhancedData);

      // Debug: Check if task name appears in rendered HTML
      if (enhancedData.taskContext?.name) {
        const taskNameInHtml = renderedHtml.includes(
          enhancedData.taskContext.name,
        );
        this.logger.debug(
          `Task name "${enhancedData.taskContext.name}" found in rendered HTML: ${taskNameInHtml}`,
        );
      }

      return renderedHtml;
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
   * Register comprehensive Handlebars helpers in organized groups
   * Following SOLID principles: Single responsibility per helper
   */
  private registerBasicHelpers(): void {
    // === CONDITIONAL & LOGICAL HELPERS ===
    this.handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b);
    this.handlebars.registerHelper('gt', (a: number, b: number) => a > b);
    this.handlebars.registerHelper('gte', (a: number, b: number) => a >= b);
    this.handlebars.registerHelper('lte', (a: number, b: number) => a <= b);
    this.handlebars.registerHelper('lt', (a: number, b: number) => a < b);

    this.handlebars.registerHelper('or', (...args: any[]) => {
      const values = args.slice(0, -1);
      return values.some((value) => Boolean(value));
    });

    this.handlebars.registerHelper('and', (...args: any[]) => {
      const values = args.slice(0, -1);
      return values.every((value) => !!value);
    });

    this.handlebars.registerHelper(
      'if_exists',
      (value: unknown, options: Handlebars.HelperOptions) => {
        return value ? options.fn(this) : options.inverse(this);
      },
    );

    // === UTILITY HELPERS ===
    this.handlebars.registerHelper(
      'defaultValue',
      <T>(value: T | null | undefined | '', defaultVal: T): T => {
        return value !== null && value !== undefined && value !== ''
          ? value
          : defaultVal;
      },
    );

    this.handlebars.registerHelper('json', (obj: any) => {
      return JSON.stringify(obj, null, 2);
    });

    // === MATH HELPERS ===
    this.handlebars.registerHelper('abs', (num: number) => Math.abs(num));
    this.handlebars.registerHelper(
      'multiply',
      (a: number, b: number) => (a || 0) * (b || 0),
    );
    this.handlebars.registerHelper(
      'round',
      (num: number, decimals: number = 0) => {
        if (typeof num !== 'number') return 0;
        const factor = Math.pow(10, decimals);
        return Math.round(num * factor) / factor;
      },
    );

    // === ARRAY & OBJECT HELPERS ===
    this.handlebars.registerHelper(
      'length',
      (array: any[] | null | undefined) => {
        if (!array || !Array.isArray(array)) return 0;
        return array.length;
      },
    );

    this.handlebars.registerHelper('array', (...args: any[]): unknown[] => {
      return args.slice(0, -1) as unknown[];
    });

    this.handlebars.registerHelper(
      'lookup',
      (obj: any, key: string): unknown => {
        if (!obj || typeof obj !== 'object') return null;
        return obj[key] as unknown;
      },
    );

    // === STRING HELPERS ===
    this.handlebars.registerHelper('capitalize', (str: string) => {
      if (!str) return '';
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    });

    this.handlebars.registerHelper(
      'replace',
      (str: string, searchValue: string, replaceValue: string) => {
        if (!str || typeof str !== 'string') return str;
        return str.replace(new RegExp(searchValue, 'g'), replaceValue);
      },
    );

    // === DATE HELPERS ===
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
        if (format === 'MMM DD, YYYY') {
          return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
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

    // === UI COMPONENT HELPERS ===
    this.handlebars.registerHelper(
      'statusBadge',
      (status: string | null | undefined) => {
        // Enhanced statusBadge with better null handling
        if (!status) {
          return new this.handlebars.SafeString(
            '<span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">No Status</span>',
          );
        }

        const statusMap: Record<string, { class: string; label: string }> = {
          completed: {
            class: 'bg-green-100 text-green-800',
            label: 'Completed',
          },
          'in-progress': {
            class: 'bg-blue-100 text-blue-800',
            label: 'In Progress',
          },
          'not-started': {
            class: 'bg-slate-100 text-slate-700',
            label: 'Not Started',
          },
          'needs-review': {
            class: 'bg-yellow-100 text-yellow-800',
            label: 'Needs Review',
          },
          'needs-changes': {
            class: 'bg-red-100 text-red-800',
            label: 'Needs Changes',
          },
          paused: { class: 'bg-gray-100 text-gray-800', label: 'Paused' },
          cancelled: { class: 'bg-red-100 text-red-800', label: 'Cancelled' },
        };

        const config = statusMap[status] || {
          class: 'bg-gray-100 text-gray-600',
          label: status,
        };

        return new this.handlebars.SafeString(
          `<span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.class}">${config.label}</span>`,
        );
      },
    );

    this.handlebars.registerHelper(
      'priorityBadge',
      (priority: string | null | undefined) => {
        if (!priority) {
          return new this.handlebars.SafeString(
            '<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">Unset</span>',
          );
        }

        const priorityMap: Record<string, { class: string; label: string }> = {
          Critical: { class: 'bg-red-100 text-red-800', label: 'Critical' },
          High: { class: 'bg-orange-100 text-orange-800', label: 'High' },
          Medium: { class: 'bg-yellow-100 text-yellow-800', label: 'Medium' },
          Low: { class: 'bg-green-100 text-green-800', label: 'Low' },
        };

        const config = priorityMap[priority] || {
          class: 'bg-slate-100 text-slate-600',
          label: priority,
        };

        return new this.handlebars.SafeString(
          `<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.class}">${config.label}</span>`,
        );
      },
    );

    // === LEGACY HELPERS (for backward compatibility) ===
    this.handlebars.registerHelper(
      'section',
      function (this: any, name: string, options: any) {
        if (!this._sections) this._sections = {};
        this._sections[name] = options.fn(this);
        return null;
      },
    );

    this.logger.log('✅ All Handlebars helpers registered successfully');
    this.logger.debug(
      'Registered helpers: conditional, logical, utility, math, array, object, string, date, UI components',
    );
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
