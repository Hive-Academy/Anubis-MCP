import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { TaskOperationsService } from './task-operations.service';
import { PlanningOperationsService } from './planning-operations.service';
import { IndividualSubtaskOperationsService } from './individual-subtask-operations.service';
import { WorkflowOperationsService } from './workflow-operations.service';
import { ReviewOperationsService } from './review-operations.service';
import { ResearchOperationsService } from './research-operations.service';

@Module({
  imports: [PrismaModule],
  providers: [
    // Internal operation services (no longer MCP tools)
    TaskOperationsService,
    PlanningOperationsService,
    IndividualSubtaskOperationsService,
    WorkflowOperationsService,
    ReviewOperationsService,
    ResearchOperationsService,
  ],
  exports: [
    // Internal operation services (exported for workflow-rules MCP interface)
    TaskOperationsService,
    PlanningOperationsService,
    IndividualSubtaskOperationsService,
    WorkflowOperationsService,
    ReviewOperationsService,
    ResearchOperationsService,
  ],
})
export class CoreWorkflowModule {}
