import { Injectable, Logger } from '@nestjs/common';
import {
  IBaseReportGenerator,
  ReportFilters,
  ReportGenerationResult,
} from './base-report-generator.interface';
import { ReportType } from '../../interfaces/service-contracts.interface';

import { ImplementationPlanAnalyticsDataApiService } from '../data-api';
import { HandlebarsTemplateService } from '../handlebars-template.service';

/**
 * Implementation Plan Analytics Generator
 *
 * Clean, focused architecture using dedicated data API:
 * 1. Use ImplementationPlanAnalyticsDataApiService (focused analytics)
 * 2. Render template
 * 3. Return result
 *
 * Follows the proven task-summary pattern for consistency
 */
@Injectable()
export class ImplementationPlanAnalyticsGeneratorService
  implements IBaseReportGenerator
{
  private readonly logger = new Logger(
    ImplementationPlanAnalyticsGeneratorService.name,
  );

  constructor(
    // Focused implementation plan analytics API
    private readonly implementationPlanApi: ImplementationPlanAnalyticsDataApiService,

    // Template service for rendering
    private readonly templateService: HandlebarsTemplateService,
  ) {}

  getReportType(): ReportType {
    return 'implementation_plan_analytics';
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
    this.logger.log(
      'Generating implementation plan analytics report using focused data API',
    );

    try {
      this.validateFilters(filters);

      // Step 1: Get focused implementation plan analytics data
      const templateData =
        await this.implementationPlanApi.getImplementationPlanAnalyticsData(
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
          dataSourcesUsed: [
            'ImplementationPlanAnalyticsDataApiService (focused)',
          ],
          analyticsApplied: [
            'PlanQualityAnalysis',
            'SubtaskBreakdownPatterns',
            'ExecutionInsights',
            'ImplementationTrends'
          ],
        },
      };
    } catch (error) {
      this.logger.error(
        'Failed to generate implementation plan analytics report',
        error,
      );
      throw new Error(
        `Implementation plan analytics generation failed: ${error.message}`,
      );
    }
  }
}
