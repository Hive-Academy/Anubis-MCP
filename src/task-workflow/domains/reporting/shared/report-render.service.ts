/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as Handlebars from 'handlebars';
import { IReportRenderService } from './interfaces';
import { TemplateContext } from './types';

/**
 * Template rendering service for all reports
 * Follows KISS principle with focused rendering logic
 * Max 200 lines following architecture guidelines
 */
@Injectable()
export class ReportRenderService implements IReportRenderService {
  private readonly logger = new Logger(ReportRenderService.name);
  private readonly templateCache = new Map<
    string,
    HandlebarsTemplateDelegate
  >();

  constructor() {
    this.registerDefaultHelpers();
  }

  /**
   * Compile Handlebars template from file
   */
  async compileTemplate(
    templatePath: string,
  ): Promise<HandlebarsTemplateDelegate> {
    try {
      // Check cache first
      if (this.templateCache.has(templatePath)) {
        return this.templateCache.get(templatePath)!;
      }

      // Read and compile template
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      const compiled = Handlebars.compile(templateContent);

      // Cache compiled template
      this.templateCache.set(templatePath, compiled);

      return compiled;
    } catch (error) {
      this.logger.error(
        `Failed to compile template ${templatePath}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Prepare template context with data and metadata
   */
  prepareTemplateContext(data: any, reportType: string): TemplateContext {
    return {
      data,
      metadata: {
        generatedAt: new Date().toISOString(),
        reportType,
        version: '2.0.0',
      },
      helpers: this.getTemplateHelpers(),
    };
  }

  /**
   * Render template with context
   */
  async renderTemplate(
    templatePath: string,
    context: TemplateContext,
  ): Promise<string> {
    try {
      const template = await this.compileTemplate(templatePath);
      return template(context);
    } catch (error) {
      this.logger.error(
        `Failed to render template ${templatePath}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Render template and save to file
   */
  async renderToFile(
    templatePath: string,
    context: TemplateContext,
    outputPath: string,
  ): Promise<void> {
    try {
      const rendered = await this.renderTemplate(templatePath, context);
      await fs.writeFile(outputPath, rendered, 'utf-8');
      this.logger.log(`Report rendered to: ${outputPath}`);
    } catch (error) {
      this.logger.error(
        `Failed to render to file ${outputPath}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Register custom Handlebars helpers
   */
  registerHelpers(helpers: Record<string, any>): void {
    Object.entries(helpers).forEach(([name, helper]) => {
      Handlebars.registerHelper(name, helper);
    });
  }

  /**
   * Get template helpers for context
   */
  private getTemplateHelpers(): Record<string, any> {
    return {
      formatDate: this.formatDateHelper,
      formatNumber: this.formatNumberHelper,
      percentage: this.percentageHelper,
      statusColor: this.statusColorHelper,
      priorityColor: this.priorityColorHelper,
    };
  }

  /**
   * Register default Handlebars helpers
   */
  private registerDefaultHelpers(): void {
    // Date formatting helper
    Handlebars.registerHelper(
      'formatDate',
      (date: string | Date, format?: string) => {
        if (!date) return '';
        const d = new Date(date);

        switch (format) {
          case 'short':
            return d.toLocaleDateString();
          case 'long':
            return d.toLocaleString();
          case 'time':
            return d.toLocaleTimeString();
          default:
            return d.toLocaleDateString();
        }
      },
    );

    // Number formatting helper
    Handlebars.registerHelper('formatNumber', (num: number, decimals = 0) => {
      if (typeof num !== 'number') return '0';
      return num.toFixed(decimals);
    });

    // Percentage helper
    Handlebars.registerHelper('percentage', (value: number, total: number) => {
      if (!total || total === 0) return '0%';
      return `${Math.round((value / total) * 100)}%`;
    });

    // Status color helper
    Handlebars.registerHelper('statusColor', (status: string) => {
      const colors: Record<string, string> = {
        completed: 'text-green-600 bg-green-100',
        'in-progress': 'text-blue-600 bg-blue-100',
        'not-started': 'text-gray-600 bg-gray-100',
        'needs-review': 'text-yellow-600 bg-yellow-100',
        'needs-changes': 'text-red-600 bg-red-100',
        paused: 'text-purple-600 bg-purple-100',
        cancelled: 'text-red-800 bg-red-200',
      };
      return colors[status] || 'text-gray-600 bg-gray-100';
    });

    // Priority color helper
    Handlebars.registerHelper('priorityColor', (priority: string) => {
      const colors: Record<string, string> = {
        Critical: 'text-red-700 bg-red-100 border-red-200',
        High: 'text-orange-700 bg-orange-100 border-orange-200',
        Medium: 'text-yellow-700 bg-yellow-100 border-yellow-200',
        Low: 'text-green-700 bg-green-100 border-green-200',
      };
      return colors[priority] || 'text-gray-700 bg-gray-100 border-gray-200';
    });

    // JSON stringify helper
    Handlebars.registerHelper('json', (context: any) => {
      return JSON.stringify(context, null, 2);
    });

    // Conditional helpers
    Handlebars.registerHelper('eq', (a: any, b: any) => a === b);
    Handlebars.registerHelper('ne', (a: any, b: any) => a !== b);
    Handlebars.registerHelper('gt', (a: number, b: number) => a > b);
    Handlebars.registerHelper('lt', (a: number, b: number) => a < b);

    // Array helpers
    Handlebars.registerHelper('length', (array: any[]) => array?.length || 0);
    Handlebars.registerHelper('first', (array: any[]) => array?.[0]);
    Handlebars.registerHelper(
      'last',
      (array: any[]) => array?.[array.length - 1],
    );

    // Math helpers
    Handlebars.registerHelper('add', (a: number, b: number) => a + b);
    Handlebars.registerHelper('subtract', (a: number, b: number) => a - b);
    Handlebars.registerHelper('multiply', (a: number, b: number) => a * b);
    Handlebars.registerHelper('divide', (a: number, b: number) =>
      b !== 0 ? a / b : 0,
    );
  }

  // Helper functions for template context
  private formatDateHelper = (date: string | Date, format?: string): string => {
    if (!date) return '';
    const d = new Date(date);

    switch (format) {
      case 'short':
        return d.toLocaleDateString();
      case 'long':
        return d.toLocaleString();
      case 'time':
        return d.toLocaleTimeString();
      default:
        return d.toLocaleDateString();
    }
  };

  private formatNumberHelper = (num: number, decimals = 0): string => {
    if (typeof num !== 'number') return '0';
    return num.toFixed(decimals);
  };

  private percentageHelper = (value: number, total: number): string => {
    if (!total || total === 0) return '0%';
    return `${Math.round((value / total) * 100)}%`;
  };

  private statusColorHelper = (status: string): string => {
    const colors: Record<string, string> = {
      completed: 'text-green-600 bg-green-100',
      'in-progress': 'text-blue-600 bg-blue-100',
      'not-started': 'text-gray-600 bg-gray-100',
      'needs-review': 'text-yellow-600 bg-yellow-100',
      'needs-changes': 'text-red-600 bg-red-100',
      paused: 'text-purple-600 bg-purple-100',
      cancelled: 'text-red-800 bg-red-200',
    };
    return colors[status] || 'text-gray-600 bg-gray-100';
  };

  private priorityColorHelper = (priority: string): string => {
    const colors: Record<string, string> = {
      Critical: 'text-red-700 bg-red-100 border-red-200',
      High: 'text-orange-700 bg-orange-100 border-orange-200',
      Medium: 'text-yellow-700 bg-yellow-100 border-yellow-200',
      Low: 'text-green-700 bg-green-100 border-green-200',
    };
    return colors[priority] || 'text-gray-700 bg-gray-100 border-gray-200';
  };
}
