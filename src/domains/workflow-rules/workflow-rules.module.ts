import { Module } from '@nestjs/common';
// MCP Operations
import { RoleTransitionMcpService } from './mcp-operations/role-transition-mcp.service';
import { StepExecutionMcpService } from './mcp-operations/step-execution-mcp.service';
import { WorkflowBootstrapMcpService } from './mcp-operations/workflow-bootstrap-mcp.service';
import { WorkflowExecutionMcpService } from './mcp-operations/workflow-execution-mcp.service';
import { WorkflowGuidanceMcpService } from './mcp-operations/workflow-guidance-mcp.service';

// Guards
import { WorkflowContextValidationGuard } from './guards/workflow-context-validation.guard';

// Repository Implementations
import { ProgressCalculationRepository } from './repositories/implementations/progress-calculation.repository';
import { StepProgressRepository } from './repositories/implementations/step-progress.repository';
import { WorkflowBootstrapRepository } from './repositories/implementations/workflow-bootstrap.repository';
import { WorkflowExecutionRepository } from './repositories/implementations/workflow-execution.repository';
import { WorkflowRoleRepository } from './repositories/implementations/workflow-role.repository';
import { WorkflowStepRepository } from './repositories/implementations/workflow-step.repository';

// Services
import { PrismaModule } from 'src/prisma/prisma.module';
import { TaskManagementModule } from '../task-management/task-management.module';
import { ExecutionAnalyticsService } from './services/execution-analytics.service';
import { ExecutionDataEnricherService } from './services/execution-data-enricher.service';
import { ProgressCalculatorService } from './services/progress-calculator.service';
import { RoleTransitionService } from './services/role-transition.service';
import { StepExecutionService } from './services/step-execution.service';
import { StepGuidanceService } from './services/step-guidance.service';
import { StepProgressTrackerService } from './services/step-progress-tracker.service';
import { StepQueryService } from './services/step-query.service';
import { WorkflowBootstrapService } from './services/workflow-bootstrap.service';
import { WorkflowContextCacheService } from './services/workflow-context-cache.service';
import { WorkflowExecutionOperationsService } from './services/workflow-execution-operations.service';
import { WorkflowExecutionService } from './services/workflow-execution.service';
import { WorkflowGuidanceService } from './services/workflow-guidance.service';

@Module({
  imports: [PrismaModule, TaskManagementModule],
  providers: [
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
      provide: 'IProgressCalculationRepository',
      useClass: ProgressCalculationRepository,
    },
    {
      provide: 'IWorkflowBootstrapRepository',
      useClass: WorkflowBootstrapRepository,
    },

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
    WorkflowContextCacheService,

    // Guards
    WorkflowContextValidationGuard,
  ],
  exports: [
    // MCP Operations
    WorkflowGuidanceMcpService,
    StepExecutionMcpService,
    RoleTransitionMcpService,
    WorkflowExecutionMcpService,
    WorkflowBootstrapMcpService,

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
    WorkflowContextCacheService,

    // Guards
    WorkflowContextValidationGuard,
  ],
})
export class WorkflowRulesModule {}
