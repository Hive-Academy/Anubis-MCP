import { Injectable, Logger } from '@nestjs/common';
import { TaskDetailData } from '../../../shared/types/report-data.types';
import { TaskDetailHeaderViewService } from './task-detail-header-view.service';
import { TaskDetailContentViewService } from './task-detail-content-view.service';
import { TaskDetailAnalysisViewService } from './task-detail-analysis-view.service';

/**
 * Task Detail Generator Service
 *
 * Main orchestrator for task detail HTML generation using focused view services.
 * Follows Single Responsibility Principle by delegating specific sections to specialized services.
 */
@Injectable()
export class TaskDetailGeneratorService {
  private readonly logger = new Logger(TaskDetailGeneratorService.name);

  constructor(
    private readonly headerViewService: TaskDetailHeaderViewService,
    private readonly contentViewService: TaskDetailContentViewService,
    private readonly analysisViewService: TaskDetailAnalysisViewService,
  ) {}

  /**
   * Generate complete task detail HTML using type-safe data and focused view services
   */
  generateTaskDetail(data: TaskDetailData): string {
    this.logger.log(
      'Generating type-safe task detail HTML using focused view services',
    );
    this.logger.log(`Task: ${data.task.name}`);

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    ${this.headerViewService.generateHead(data.task.name)}
</head>
<body class="bg-gray-50 font-sans">
    <div class="max-w-6xl mx-auto py-8 px-4">
        ${this.headerViewService.generateHeader(data.task)}
        ${this.headerViewService.generateTaskOverview(data.task)}
        ${data.description ? this.contentViewService.generateDescription(data.description) : ''}
        ${data.codebaseAnalysis ? this.analysisViewService.generateCodebaseAnalysis(data.codebaseAnalysis) : ''}
        ${data.implementationPlans ? this.contentViewService.generateImplementationPlans(data.implementationPlans) : ''}
        ${data.subtasks ? this.contentViewService.generateSubtasks(data.subtasks) : ''}
        ${this.analysisViewService.generateQualityMetrics(data.subtasks || [], data.delegationHistory || [])}
        ${data.delegationHistory ? this.contentViewService.generateDelegationHistory(data.delegationHistory) : ''}
        ${this.headerViewService.generateFooter(data.metadata)}
    </div>
</body>
</html>`;
  }
}
