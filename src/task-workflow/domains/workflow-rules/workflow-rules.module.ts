import { Module } from '@nestjs/common';
import { WorkflowGuidanceService } from './services/workflow-guidance.service';
import { StepExecutionService } from './services/step-execution.service';
import { RoleTransitionService } from './services/role-transition.service';
import { StepConditionEvaluator } from './services/step-condition-evaluator.service';
import { StepActionExecutor } from './services/step-action-executor.service';
import { WorkflowGuidanceMcpService } from './mcp-operations/workflow-guidance-mcp.service';
import { StepExecutionMcpService } from './mcp-operations/step-execution-mcp.service';
import { RoleTransitionMcpService } from './mcp-operations/role-transition-mcp.service';

@Module({
  providers: [
    // Core workflow rule services
    WorkflowGuidanceService,
    StepExecutionService,
    RoleTransitionService,
    StepConditionEvaluator,
    StepActionExecutor,

    // Focused MCP operation services
    WorkflowGuidanceMcpService,
    StepExecutionMcpService,
    RoleTransitionMcpService,
  ],
  exports: [
    // Export core services for use by other modules
    WorkflowGuidanceService,
    StepExecutionService,
    RoleTransitionService,
    StepConditionEvaluator,
    StepActionExecutor,

    // Export MCP services for MCP integration
    WorkflowGuidanceMcpService,
    StepExecutionMcpService,
    RoleTransitionMcpService,
  ],
})
export class WorkflowRulesModule {}
