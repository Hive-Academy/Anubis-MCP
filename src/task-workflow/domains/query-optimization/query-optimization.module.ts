import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { QueryTaskContextService } from './query-task-context.service';
import { QueryWorkflowStatusService } from './query-workflow-status.service';
import { QueryReportsService } from './query-reports.service';
import { UtilsModule } from '../../utils/utils.module';

@Module({
  imports: [PrismaModule, UtilsModule],
  providers: [
    QueryTaskContextService,
    QueryWorkflowStatusService,
    QueryReportsService,
  ],
  exports: [
    QueryTaskContextService,
    QueryWorkflowStatusService,
    QueryReportsService,
  ],
})
export class QueryOptimizationModule {}
