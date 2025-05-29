import { Injectable, Logger } from '@nestjs/common';
import {
  IBaseReportGenerator,
  ReportFilters,
  ReportGenerationResult,
} from './base-report-generator.interface';
import { ReportType } from '../../interfaces/service-contracts.interface';

import { DelegationFlowAnalysisDataApiService } from '../data-api';
import { HandlebarsTemplateService } from '../handlebars-template.service';

/**
 * Delegation Flow Analysis Generator
 *
 * Clean, focused architecture using dedicated data API:
 * 1. Use DelegationFlowAnalysisDataApiService (focused analytics)
 * 2. Render template
 * 3. Return result
 *
 * Follows the proven task-summary pattern for consistency
 */
@Injectable()
export class DelegationFlowAnalysisGeneratorService
  implements IBaseReportGenerator
{
  private readonly logger = new Logger(
    DelegationFlowAnalysisGeneratorService.name,
  );

  constructor(
    // Focused delegation flow analysis API
    private readonly delegationFlowApi: DelegationFlowAnalysisDataApiService,

    // Template service for rendering
    private readonly templateService: HandlebarsTemplateService,
  ) {}

  getReportType(): ReportType {
    return 'delegation_flow_analysis';
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
      'Generating delegation flow analysis report using focused data API',
    );

    try {
      this.validateFilters(filters);

      // Step 1: Get focused delegation flow analysis data
      const templateData =
        await this.delegationFlowApi.getDelegationFlowAnalysisData(
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
            'DelegationFlowAnalysisDataApiService (focused)',
          ],
          analyticsApplied: [
            'WorkflowBottleneckAnalysis',
            'DelegationPathMapping',
            'HandoffEfficiency',
            'FlowOptimization'
          ],
        },
      };
    } catch (error) {
      this.logger.error(
        'Failed to generate delegation flow analysis report',
        error,
      );
      throw new Error(
        `Delegation flow analysis generation failed: ${error.message}`,
      );
    }
  }
}
