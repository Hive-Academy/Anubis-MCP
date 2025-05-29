import { Injectable, Logger } from '@nestjs/common';
import {
  IBaseReportGenerator,
  ReportFilters,
  ReportGenerationResult,
} from './base-report-generator.interface';
import { ReportType } from '../../interfaces/service-contracts.interface';

import { ComprehensiveDataApiService } from '../data-api';
import { HandlebarsTemplateService } from '../handlebars-template.service';

/**
 * Comprehensive Generator
 *
 * Clean, focused architecture using dedicated data API:
 * 1. Use ComprehensiveDataApiService (executive-level analytics)
 * 2. Render template
 * 3. Return result
 *
 * Follows the proven task-summary pattern for consistency
 */
@Injectable()
export class ComprehensiveGeneratorService implements IBaseReportGenerator {
  private readonly logger = new Logger(ComprehensiveGeneratorService.name);

  constructor(
    // Focused comprehensive analytics API
    private readonly comprehensiveApi: ComprehensiveDataApiService,

    // Template service for rendering
    private readonly templateService: HandlebarsTemplateService,
  ) {}

  getReportType(): ReportType {
    return 'comprehensive';
  }

  validateFilters(filters: ReportFilters): void {
    if (
      filters.startDate &&
      filters.endDate &&
      filters.startDate > filters.endDate
    ) {
      throw new Error('Start date cannot be after end date');
    }
  }

  async generateReport(
    filters: ReportFilters,
  ): Promise<ReportGenerationResult> {
    this.logger.log('Generating comprehensive report using focused data API');

    try {
      this.validateFilters(filters);

      // Step 1: Get comprehensive analytics data
      const templateData = await this.comprehensiveApi.getComprehensiveData(
        filters.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        filters.endDate || new Date(),
        {
          ...(filters.owner && { owner: filters.owner }),
          ...(filters.mode && { mode: filters.mode }),
          ...(filters.priority && { priority: filters.priority }),
        },
      );

      // Step 2: Render template
      const htmlContent = await this.templateService.renderTemplate(
        this.getReportType(),
        templateData,
      );

      return {
        htmlContent,
        reportData: templateData,
        metadata: {
          reportType: this.getReportType(),
          generatedAt: new Date(),
          filters,
          dataSourcesUsed: ['ComprehensiveDataApiService (focused)'],
          analyticsApplied: [
            'TaskSummaryInsights',
            'DelegationAnalytics',
            'PerformanceMetrics',
            'CodeReviewTrends',
            'ExecutiveSummary',
          ],
        },
      };
    } catch (error) {
      this.logger.error('Failed to generate comprehensive report', error);
      throw new Error(`Comprehensive generation failed: ${error.message}`);
    }
  }
}
