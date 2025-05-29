import { Injectable, Logger } from '@nestjs/common';
import {
  IBaseReportGenerator,
  ReportFilters,
  ReportGenerationResult,
} from './base-report-generator.interface';

import { CodeReviewQualityDataApiService } from '../data-api';
import { HandlebarsTemplateService } from '../handlebars-template.service';
import { ReportType } from '../../interfaces/service-contracts.interface';

/**
 * Code Review Quality Generator
 *
 * Uses the data services as the glue layer since they already:
 * - Combine data + analytics + insights
 * - Format data for template consumption
 * - Handle all the complex logic
 *
 * This generator just:
 * 1. Calls the appropriate data service method
 * 2. Renders the template
 * 3. Returns the result
 */
@Injectable()
export class CodeReviewQualityGeneratorService implements IBaseReportGenerator {
  private readonly logger = new Logger(CodeReviewQualityGeneratorService.name);

  constructor(
    // The data service IS the glue layer
    private readonly codeReviewQualityApi: CodeReviewQualityDataApiService,

    // Template service for rendering
    private readonly templateService: HandlebarsTemplateService,
  ) {}

  getReportType(): ReportType {
    return 'code_review_quality';
  }

  validateFilters(filters: ReportFilters): void {
    if (
      filters.startDate &&
      filters.endDate &&
      filters.startDate > filters.endDate
    ) {
      throw new Error('Start date cannot be after end date');
    }

    // Individual task reports require taskId
    if (!filters.taskId) {
      throw new Error('taskId is required for code review quality reports');
    }
  }

  async generateReport(
    filters: ReportFilters,
  ): Promise<ReportGenerationResult> {
    this.logger.log(
      'Generating code review quality report using focused data API',
    );

    try {
      this.validateFilters(filters);

      // Step 1: Use the data service as the glue layer
      // It already combines analytics + data + template formatting
      const templateData =
        await this.codeReviewQualityApi.getCodeReviewQualityData(
          filters.startDate as Date,
          filters.endDate as Date,
          {
            ...(filters.owner && { owner: filters.owner }),
            ...(filters.mode && { mode: filters.mode }),
            ...(filters.priority && { priority: filters.priority }),
          },
          filters.taskId,
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
          dataSourcesUsed: ['CodeReviewQualityDataApiService (focused)'],
          analyticsApplied: [
            'QualityMetrics',
            'ReviewAssessment',
            'ImprovementRecommendations',
            'CodeStandards',
          ],
        },
      };
    } catch (error) {
      this.logger.error('Failed to generate code review quality report', error);
      throw new Error(
        `Code review quality generation failed: ${error.message}`,
      );
    }
  }
}
