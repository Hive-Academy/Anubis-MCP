import { Module } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CoreWorkflowModule } from '../core-workflow/core-workflow.module';

// MCP Operations
import { WorkflowGuidanceMcpService } from './mcp-operations/workflow-guidance-mcp.service';
import { StepExecutionMcpService } from './mcp-operations/step-execution-mcp.service';
import { RoleTransitionMcpService } from './mcp-operations/role-transition-mcp.service';
import { WorkflowExecutionMcpService } from './mcp-operations/workflow-execution-mcp.service';
import { WorkflowBootstrapMcpService } from './mcp-operations/workflow-bootstrap-mcp.service';

// Services
import { WorkflowGuidanceService } from './services/workflow-guidance.service';
import { StepExecutionService } from './services/step-execution.service';
import { RoleTransitionService } from './services/role-transition.service';
import { WorkflowExecutionService } from './services/workflow-execution.service';
import { WorkflowExecutionOperationsService } from './services/workflow-execution-operations.service';
import { ExecutionDataEnricherService } from './services/execution-data-enricher.service';
import { WorkflowBootstrapService } from './services/workflow-bootstrap.service';
import { CoreServiceOrchestrator } from './services/core-service-orchestrator.service';
import { StepConditionEvaluator } from './services/step-condition-evaluator.service';
import { StepActionExecutor } from './services/step-action-executor.service';
import { ExecutionAnalyticsService } from './services/execution-analytics.service';

@Module({
  imports: [CoreWorkflowModule],
  providers: [
    PrismaService,

    // MCP Operations
    WorkflowGuidanceMcpService,
    StepExecutionMcpService,
    RoleTransitionMcpService,
    WorkflowExecutionMcpService,
    WorkflowBootstrapMcpService,

    // Core Services
    WorkflowGuidanceService,
    StepExecutionService,
    RoleTransitionService,
    WorkflowExecutionService,
    WorkflowExecutionOperationsService,
    ExecutionDataEnricherService,
    WorkflowBootstrapService,
    CoreServiceOrchestrator,
    StepConditionEvaluator,
    StepActionExecutor,
    ExecutionAnalyticsService,
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
    RoleTransitionService,
    WorkflowExecutionService,
    WorkflowExecutionOperationsService,
    ExecutionDataEnricherService,
    WorkflowBootstrapService,
    CoreServiceOrchestrator,
    StepConditionEvaluator,
    StepActionExecutor,
    ExecutionAnalyticsService,
  ],
})
export class WorkflowRulesModule {}
