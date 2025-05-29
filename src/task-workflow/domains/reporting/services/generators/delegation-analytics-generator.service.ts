import { Injectable, Logger } from '@nestjs/common';
import {
  IBaseReportGenerator,
  ReportFilters,
  ReportGenerationResult,
} from './base-report-generator.interface';
import { ReportType } from '../../interfaces/service-contracts.interface';

// Focused Data API Service
import { DelegationAnalyticsDataApiService } from '../data-api';

// Template Service
import { HandlebarsTemplateService } from '../handlebars-template.service';

/**
 * Delegation Analytics Generator
 *
 * Clean, focused architecture using dedicated data API:
 * 1. Use DelegationAnalyticsDataApiService (focused analytics)
 * 2. Render template
 * 3. Return result
 *
 * Follows the proven task-summary pattern for consistency
 */
@Injectable()
export class DelegationAnalyticsGeneratorService
  implements IBaseReportGenerator
{
  private readonly logger = new Logger(
    DelegationAnalyticsGeneratorService.name,
  );

  constructor(
    // Focused delegation analytics API
    private readonly delegationAnalyticsApi: DelegationAnalyticsDataApiService,

    // Template service for rendering
    private readonly templateService: HandlebarsTemplateService,
  ) {}

  getReportType(): ReportType {
    return 'delegation_analytics';
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
      'Generating delegation analytics report using focused data API',
    );

    try {
      this.validateFilters(filters);

      // Step 1: Get focused delegation analytics data
      const templateData = await this.delegationAnalyticsApi.getDelegationAnalyticsData(
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
          dataSourcesUsed: ['DelegationAnalyticsDataApiService (focused)'],
          analyticsApplied: [
            'DelegationPatterns',
            'HandoffEfficiency', 
            'RolePerformance',
            'WorkflowBottlenecks'
          ],
        },
      };
    } catch (error) {
      this.logger.error(
        'Failed to generate delegation analytics report',
        error,
      );
      throw new Error(
        `Delegation analytics generation failed: ${error.message}`,
      );
    }
  }
}
