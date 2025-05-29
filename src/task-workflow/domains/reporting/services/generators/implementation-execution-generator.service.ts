import { Injectable, Logger } from '@nestjs/common';
import {
  IBaseReportGenerator,
  ReportFilters,
  ReportGenerationResult,
} from './base-report-generator.interface';
import { ReportType } from '../../interfaces/service-contracts.interface';

import { TaskProgressExecutionService } from '../data-api';
import { HandlebarsTemplateService } from '../handlebars-template.service';

/**
 * Implementation Execution Generator
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
export class ImplementationExecutionGeneratorService
  implements IBaseReportGenerator
{
  private readonly logger = new Logger(
    ImplementationExecutionGeneratorService.name,
  );

  constructor(
    // The data service IS the glue layer
    private readonly templateData: TaskProgressExecutionService,

    // Template service for rendering
    private readonly templateService: HandlebarsTemplateService,
  ) {}

  getReportType(): ReportType {
    return 'implementation_execution';
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
      throw new Error(
        'taskId is required for implementation execution reports',
      );
    }
  }

  async generateReport(
    filters: ReportFilters,
  ): Promise<ReportGenerationResult> {
    this.logger.log(
      'Generating implementation execution report using data service glue layer',
    );

    try {
      this.validateFilters(filters);

      // Step 1: Use the data service as the glue layer
      // It already combines analytics + data + template formatting
      const templateData =
        await this.templateData.getImplementationExecutionData(
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
          dataSourcesUsed: ['TaskProgressExecutionService (glue layer)'],
          analyticsApplied: [
            'All analytics services via TaskProgressExecutionService',
          ],
        },
      };
    } catch (error) {
      this.logger.error(
        'Failed to generate implementation execution report',
        error,
      );
      throw new Error(
        `Implementation execution generation failed: ${error.message}`,
      );
    }
  }
}
