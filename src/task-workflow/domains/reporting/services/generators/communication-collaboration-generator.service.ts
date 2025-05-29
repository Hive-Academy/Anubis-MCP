import { Injectable, Logger } from '@nestjs/common';
import {
  IBaseReportGenerator,
  ReportFilters,
  ReportGenerationResult,
} from './base-report-generator.interface';
import { ReportType } from '../../interfaces/service-contracts.interface';

import { CommunicationCollaborationService } from '../data-api';
import { HandlebarsTemplateService } from '../handlebars-template.service';

/**
 * Communication Collaboration Generator
 *
 * Clean, focused architecture using dedicated data API:
 * 1. Use CommunicationCollaborationService (focused analytics)
 * 2. Render template
 * 3. Return result
 *
 * Follows the proven task-summary pattern for consistency
 */
@Injectable()
export class CommunicationCollaborationGeneratorService
  implements IBaseReportGenerator
{
  private readonly logger = new Logger(
    CommunicationCollaborationGeneratorService.name,
  );

  constructor(
    // Focused communication collaboration API
    private readonly communicationCollaborationApi: CommunicationCollaborationService,

    // Template service for rendering
    private readonly templateService: HandlebarsTemplateService,
  ) {}

  getReportType(): ReportType {
    return 'communication_collaboration';
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
        'taskId is required for communication collaboration reports',
      );
    }
  }

  async generateReport(
    filters: ReportFilters,
  ): Promise<ReportGenerationResult> {
    this.logger.log(
      'Generating communication collaboration report using focused data API',
    );

    try {
      this.validateFilters(filters);

      // Step 1: Get focused communication collaboration data
      const templateData =
        await this.communicationCollaborationApi.getCommunicationCollaborationData(
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
          dataSourcesUsed: ['CommunicationCollaborationService (focused)'],
          analyticsApplied: [
            'CommunicationPatterns',
            'CollaborationEffectiveness',
            'TeamCoordination',
            'KnowledgeSharing'
          ],
        },
      };
    } catch (error) {
      this.logger.error(
        'Failed to generate communication collaboration report',
        error,
      );
      throw new Error(
        `Communication collaboration generation failed: ${error.message}`,
      );
    }
  }
}
