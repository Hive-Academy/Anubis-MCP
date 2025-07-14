import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
// MCP Operations
import { WorkflowGuidanceMcpService } from './mcp-operations/workflow-guidance-mcp.service';
import { StepExecutionMcpService } from './mcp-operations/step-execution-mcp.service';
import { RoleTransitionMcpService } from './mcp-operations/role-transition-mcp.service';
import { WorkflowExecutionMcpService } from './mcp-operations/workflow-execution-mcp.service';
import { WorkflowBootstrapMcpService } from './mcp-operations/workflow-bootstrap-mcp.service';

// Repository Implementations
import { WorkflowExecutionRepository } from './repositories/implementations/workflow-execution.repository';
import { WorkflowRoleRepository } from './repositories/implementations/workflow-role.repository';
import { WorkflowBootstrapRepository } from './repositories/implementations/workflow-bootstrap.repository';
import { StepProgressRepository } from './repositories/implementations/step-progress.repository';
import { ProjectContextRepository } from './repositories/implementations/project-context.repository';
import { ProgressCalculationRepository } from './repositories/implementations/progress-calculation.repository';
import { WorkflowStepRepository } from './repositories/implementations/workflow-step.repository';

// Services
import { WorkflowGuidanceService } from './services/workflow-guidance.service';
import { ProgressCalculatorService } from './services/progress-calculator.service';
import { StepExecutionService } from './services/step-execution.service';
import { StepGuidanceService } from './services/step-guidance.service';
import { StepProgressTrackerService } from './services/step-progress-tracker.service';
import { StepQueryService } from './services/step-query.service';
import { RoleTransitionService } from './services/role-transition.service';
import { WorkflowExecutionService } from './services/workflow-execution.service';
import { WorkflowExecutionOperationsService } from './services/workflow-execution-operations.service';
import { ExecutionDataEnricherService } from './services/execution-data-enricher.service';
import { WorkflowBootstrapService } from './services/workflow-bootstrap.service';
import { ExecutionAnalyticsService } from './services/execution-analytics.service';

@Module({
  imports: [],
  providers: [
    PrismaService,

    // Repository Implementations
    {
      provide: 'IWorkflowExecutionRepository',
      useClass: WorkflowExecutionRepository,
    },
    {
      provide: 'IWorkflowRoleRepository',
      useClass: WorkflowRoleRepository,
    },
    {
      provide: 'IStepProgressRepository',
      useClass: StepProgressRepository,
    },
    {
      provide: 'IWorkflowStepRepository',
      useClass: WorkflowStepRepository,
    },
    {
      provide: 'IProjectContextRepository',
      useClass: ProjectContextRepository,
    },
    {
      provide: 'IProgressCalculationRepository',
      useClass: ProgressCalculationRepository,
    },
    WorkflowBootstrapRepository,

    // MCP Operations
    WorkflowGuidanceMcpService,
    StepExecutionMcpService,
    RoleTransitionMcpService,
    WorkflowExecutionMcpService,
    WorkflowBootstrapMcpService,

    // Core Services
    WorkflowGuidanceService,
    ProgressCalculatorService,
    StepExecutionService,
    StepGuidanceService,
    StepProgressTrackerService,
    StepQueryService,
    RoleTransitionService,
    WorkflowExecutionService,
    WorkflowExecutionOperationsService,
    ExecutionDataEnricherService,
    WorkflowBootstrapService,
    ExecutionAnalyticsService,
  ],
  exports: [
    // MCP Operations
    WorkflowGuidanceMcpService,
    StepExecutionMcpService,
    RoleTransitionMcpService,
    WorkflowExecutionMcpService,
    WorkflowBootstrapMcpService,

    // Repository Implementations

    WorkflowBootstrapRepository,

    // Core Services
    WorkflowGuidanceService,
    StepExecutionService,
    StepGuidanceService,
    StepProgressTrackerService,
    StepQueryService,
    RoleTransitionService,
    WorkflowExecutionService,
    WorkflowExecutionOperationsService,
    ExecutionDataEnricherService,
    WorkflowBootstrapService,
    ExecutionAnalyticsService,
  ],
})
export class WorkflowRulesModule {}
