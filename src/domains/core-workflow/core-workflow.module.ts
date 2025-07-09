import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { TaskOperationsService } from './task-operations.service';
import { IndividualSubtaskOperationsService } from './individual-subtask-operations.service';
import { WorkflowOperationsService } from './workflow-operations.service';
import { ReviewOperationsService } from './review-operations.service';
import { ResearchOperationsService } from './research-operations.service';

@Module({
  imports: [PrismaModule],
  providers: [
    // Core operation services (converted to MCP tools)
    TaskOperationsService,
    IndividualSubtaskOperationsService,
    WorkflowOperationsService,
    ReviewOperationsService,
    ResearchOperationsService,
  ],
  exports: [
    // Core operation services (MCP tools exported for external use)
    TaskOperationsService,
    IndividualSubtaskOperationsService,
    WorkflowOperationsService,
    ReviewOperationsService,
    ResearchOperationsService,
  ],
})
export class CoreWorkflowModule {}
