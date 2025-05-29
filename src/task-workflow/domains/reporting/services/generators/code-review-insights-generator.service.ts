import { Injectable, Logger } from '@nestjs/common';
import {
  IBaseReportGenerator,
  ReportFilters,
  ReportGenerationResult,
} from './base-report-generator.interface';

import { CodeReviewInsightsDataApiService } from '../data-api';
import { HandlebarsTemplateService } from '../handlebars-template.service';
import { ReportType } from '../../interfaces/service-contracts.interface';

/**
 * Code Review Insights Generator
 *
 * Uses the NEW focused data-api service that follows the proven task-summary pattern:
 * - ReportDataAccessService: Pure Prisma API interface
 * - CoreMetricsService: Foundation metrics calculations
 * - CodeReviewInsightsDataApiService: Focused business logic + data transformation
 *
 * This generator:
 * 1. Calls the focused data service method
 * 2. Renders the template
 * 3. Returns the result
 */
@Injectable()
export class CodeReviewInsightsGeneratorService
  implements IBaseReportGenerator
{
  private readonly logger = new Logger(CodeReviewInsightsGeneratorService.name);

  constructor(
    // Use the NEW focused data-api service
    private readonly codeReviewDataApi: CodeReviewInsightsDataApiService,

    // Template service for rendering
    private readonly templateService: HandlebarsTemplateService,
  ) {}

  getReportType(): ReportType {
    return 'code_review_insights';
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
      'Generating code review insights report using NEW CodeReviewInsightsDataApiService',
    );

    try {
      this.validateFilters(filters);

      // Step 1: Use the NEW focused data-api service
      // It uses foundation services and provides real data without dummy values
      const templateData =
        await this.codeReviewDataApi.getCodeReviewInsightsData(
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
            'CodeReviewInsightsDataApiService (NEW focused service with foundation)',
          ],
          analyticsApplied: [
            'CoreMetricsService',
            'ReportDataAccessService',
            'MetricsCalculatorService',
          ],
        },
      };
    } catch (error) {
      this.logger.error(
        'Failed to generate code review insights report',
        error,
      );
      throw new Error(
        `Code review insights generation failed: ${error.message}`,
      );
    }
  }
}
