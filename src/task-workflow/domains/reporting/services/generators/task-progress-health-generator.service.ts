import { Injectable, Logger } from '@nestjs/common';
import {
  IBaseReportGenerator,
  ReportFilters,
  ReportGenerationResult,
} from './base-report-generator.interface';
import { ReportType } from '../../interfaces/service-contracts.interface';

// Focused Data API Service
import { TaskProgressHealthDataApiService } from '../data-api';

// Template Service
import { HandlebarsTemplateService } from '../handlebars-template.service';

/**
 * Task Progress Health Generator
 *
 * Clean, focused architecture using dedicated data API:
 * 1. Use TaskProgressHealthDataApiService (focused analytics)
 * 2. Render template
 * 3. Return result
 *
 * Follows the proven task-summary pattern for consistency
 */
@Injectable()
export class TaskProgressHealthGeneratorService
  implements IBaseReportGenerator
{
  private readonly logger = new Logger(TaskProgressHealthGeneratorService.name);

  constructor(
    // Focused task progress health API
    private readonly taskProgressHealthApi: TaskProgressHealthDataApiService,

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

      // Step 1: Get focused task progress health data
      const templateData =
        await this.taskProgressHealthApi.getTaskProgressHealthData(
          filters.taskId!,
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
          dataSourcesUsed: ['TaskProgressHealthDataApiService (focused)'],
          analyticsApplied: [
            'TaskHealthMetrics',
            'ProgressTracking',
            'RiskAssessment',
            'ActionItemGeneration',
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
