import { Module } from '@nestjs/common';
import { TaskDetailGeneratorService } from './task-detail-generator.service';
import { TaskDetailHeaderViewService } from './task-detail-header-view.service';
import { TaskDetailContentViewService } from './task-detail-content-view.service';
import { TaskDetailAnalysisViewService } from './task-detail-analysis-view.service';

/**
 * Task Detail View Module
 *
 * This module contains focused view generators for task detail reports,
 * following the Single Responsibility Principle by separating HTML generation
 * into specific, focused services.
 *
 * Services:
 * - TaskDetailGeneratorService: Main orchestrator for HTML generation
 * - TaskDetailHeaderViewService: Generates header and overview sections
 * - TaskDetailContentViewService: Generates main content sections
 * - TaskDetailAnalysisViewService: Generates analysis and metrics sections
 */
@Module({
  providers: [
    TaskDetailGeneratorService,
    TaskDetailHeaderViewService,
    TaskDetailContentViewService,
    TaskDetailAnalysisViewService,
  ],
  exports: [
    TaskDetailGeneratorService,
    TaskDetailHeaderViewService,
    TaskDetailContentViewService,
    TaskDetailAnalysisViewService,
  ],
})
export class TaskDetailViewModule {}
