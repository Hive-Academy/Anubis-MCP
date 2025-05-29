import { Injectable, Logger } from '@nestjs/common';
import {
  IBaseReportGenerator,
  ReportFilters,
  ReportGenerationResult,
} from './base-report-generator.interface';
import { ReportType } from '../../interfaces/service-contracts.interface';

// Template Service
import { HandlebarsTemplateService } from '../handlebars-template.service';
import { TaskSummaryDataApiService } from '../data-api';

/**
 * Task Summary Generator
 *
 * Clean, direct architecture:
 * 1. Use TaskSummaryDataApiService (real analytics, no intermediate layers)
 * 2. Render template
 * 3. Return result
 *
 * Removed layers: TemplateDataService → BasicTemplateCoordinator → etc.
 * Now: Generator → TaskSummaryDataApiService → Analytics (DIRECT)
 */
@Injectable()
export class TaskSummaryGeneratorService implements IBaseReportGenerator {
  private readonly logger = new Logger(TaskSummaryGeneratorService.name);

  constructor(
    // Direct API service with real analytics
    private readonly taskSummaryApi: TaskSummaryDataApiService,

    // Template service for rendering
    private readonly templateService: HandlebarsTemplateService,
  ) {}

  getReportType(): ReportType {
    return 'task_summary';
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
      'Generating task summary report using DIRECT analytics API',
    );

    try {
      this.validateFilters(filters);

      // Step 1: Get real analytics data directly (no intermediate layers)
      const templateData = await this.taskSummaryApi.getTaskSummaryData(
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
          dataSourcesUsed: ['TaskSummaryDataApiService (direct analytics)'],
          analyticsApplied: [
            'CoreMetrics',
            'EnhancedInsights',
            'RecommendationEngine',
            'TaskHealthAnalysis',
          ],
        },
      };
    } catch (error) {
      this.logger.error('Failed to generate task summary report', error);
      throw new Error(`Task summary generation failed: ${error.message}`);
    }
  }
}
