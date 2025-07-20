import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { TaskOperationsService } from './task-operations.service';
import { IndividualSubtaskOperationsService } from './individual-subtask-operations.service';
import { ReviewOperationsService } from './review-operations.service';
import { ResearchOperationsService } from './research-operations.service';
import { TaskRepository } from './repositories/implementations/task.repository';
import { SubtaskRepository } from './repositories/implementations/subtask.repository';
import { CodeReviewRepository } from './repositories/implementations/code-review.repository';
import { CompletionReportRepository } from './repositories/implementations/completion-report.repository';
import { DelegationRecordRepository } from './repositories/implementations/delegation-record.repository';
import { ResearchReportRepository } from './repositories/implementations/research-report.repository';

// Import focused services
import { SubtaskCreationService } from './services/subtask-creation.service';
import { SubtaskUpdateService } from './services/subtask-update.service';
import { SubtaskQueryService } from './services/subtask-query.service';
import { SubtaskBatchService } from './services/subtask-batch.service';

@Module({
  imports: [PrismaModule],
  providers: [
    // Repository layer with proper DI tokens
    {
      provide: 'ITaskRepository',
      useClass: TaskRepository,
    },
    {
      provide: 'ISubtaskRepository',
      useClass: SubtaskRepository,
    },
    {
      provide: 'ICodeReviewRepository',
      useClass: CodeReviewRepository,
    },
    {
      provide: 'ICompletionReportRepository',
      useClass: CompletionReportRepository,
    },
    {
      provide: 'IDelegationRecordRepository',
      useClass: DelegationRecordRepository,
    },
    {
      provide: 'IResearchReportRepository',
      useClass: ResearchReportRepository,
    },

    // Focused services (simplified without dependency management)
    SubtaskBatchService, // No dependencies on other services
    SubtaskCreationService, // Simplified sequence-based approach
    SubtaskUpdateService, // Uses SubtaskBatchService for completion checks
    SubtaskQueryService, // Sequence-based subtask discovery

    // Core operation services (converted to MCP tools)
    TaskOperationsService,
    IndividualSubtaskOperationsService, // Now uses focused services
    ReviewOperationsService,
    ResearchOperationsService,
  ],
  exports: [
    // Repository layer with proper DI tokens
    {
      provide: 'ITaskRepository',
      useClass: TaskRepository,
    },
    {
      provide: 'ISubtaskRepository',
      useClass: SubtaskRepository,
    },
    {
      provide: 'ICodeReviewRepository',
      useClass: CodeReviewRepository,
    },
    {
      provide: 'ICompletionReportRepository',
      useClass: CompletionReportRepository,
    },
    {
      provide: 'IDelegationRecordRepository',
      useClass: DelegationRecordRepository,
    },
    {
      provide: 'IResearchReportRepository',
      useClass: ResearchReportRepository,
    },

    // Focused services (exported for external use and testing)
    SubtaskBatchService,
    SubtaskCreationService,
    SubtaskUpdateService,
    SubtaskQueryService,

    // Core operation services (MCP tools exported for external use)
    TaskOperationsService,
    IndividualSubtaskOperationsService,
    ReviewOperationsService,
    ResearchOperationsService,
  ],
})
export class TaskManagementModule {}
