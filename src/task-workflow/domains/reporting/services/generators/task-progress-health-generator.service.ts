import { Injectable, Logger } from '@nestjs/common';
import {
  IBaseReportGenerator,
  ReportFilters,
  ReportGenerationResult,
} from './base-report-generator.interface';
import { ReportType } from '../../interfaces/service-contracts.interface';

// Data Service (already contains analytics integration)
import { TaskSummaryDataApiService } from '../data-api';

// Template Service
import { HandlebarsTemplateService } from '../handlebars-template.service';

/**
 * Simplified Task Progress Health Generator
 *
 * Uses the data services as the glue layer since they already:
 * - Combine data + analytics + insights
 * - Format data for template consumption
 * - Handle all the complex logic
 */
@Injectable()
export class TaskProgressHealthGeneratorService
  implements IBaseReportGenerator
{
  private readonly logger = new Logger(TaskProgressHealthGeneratorService.name);

  constructor(
    // The data service IS the glue layer
    private readonly individualTaskData: TaskSummaryDataApiService,

    // Template service for rendering
    private readonly templateService: HandlebarsTemplateService,
  ) {}

  getReportType(): ReportType {
    return 'task_progress_health';
  }

  validateFilters(filters: ReportFilters): void {
    if (!filters.taskId) {
      throw new Error(
        'Task ID is required for individual task progress health reports',
      );
    }
  }

  async generateReport(
    filters: ReportFilters,
  ): Promise<ReportGenerationResult> {
    this.logger.log(
      `Generating task progress health report for task: ${filters.taskId}`,
    );

    try {
      this.validateFilters(filters);

      // Step 1: Use the data service as the glue layer
      // It already combines analytics + data + template formatting
      const templateData =
        await this.individualTaskData.getTaskProgressHealthData(
          filters.taskId!,
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
          dataSourcesUsed: ['IndividualTaskTemplateDataService (glue layer)'],
          analyticsApplied: [
            'All analytics services via IndividualTaskTemplateDataService',
          ],
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to generate task progress health report for ${filters.taskId}`,
        error,
      );
      throw new Error(
        `Task progress health generation failed: ${error.message}`,
      );
    }
  }
}
