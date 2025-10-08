import { Controller, Get, Render } from '@nestjs/common';
import { WorkflowExecutionService } from '../services/workflow-execution.service';
import { ExecutionDataEnricherService } from '../services/execution-data-enricher.service';

@Controller('dashboard')
export class WorkflowDashboardController {
  constructor(
    private readonly executionService: WorkflowExecutionService,
    private readonly enricher: ExecutionDataEnricherService,
  ) {}

  @Get('workflows')
  @Render('workflow-rules/dashboard')
  async workflows() {
    const executions = await this.executionService.getActiveExecutions();
    const enriched = await Promise.all(
      executions.map((e) => this.enricher.enrichExecutionData(e)),
    );

    const viewModel = enriched.map((e) => ({
      id: e.execution.id,
      taskId: e.execution.taskId ?? null,
      roleName: e.execution.currentRole?.name ?? 'Unknown',
      stepName: e.execution.currentStep?.name ?? 'N/A',
      progress: e.progressMetrics.percentage ?? 0,
      stepsCompleted: e.progressMetrics.stepsCompleted ?? 0,
      totalSteps: e.progressMetrics.totalSteps ?? 0,
      startedAt: e.execution.startedAt,
    }));

    return { executions: viewModel };
  }
}
