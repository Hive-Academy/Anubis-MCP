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
import { StepExecutionCoreService } from './services/step-execution-core.service';
import { StepGuidanceService } from './services/step-guidance.service';
import { StepProgressTrackerService } from './services/step-progress-tracker.service';
import { StepQueryService } from './services/step-query.service';
import { RoleTransitionService } from './services/role-transition.service';
import { WorkflowExecutionService } from './services/workflow-execution.service';
import { WorkflowExecutionOperationsService } from './services/workflow-execution-operations.service';
import { ExecutionDataEnricherService } from './services/execution-data-enricher.service';
import { WorkflowBootstrapService } from './services/workflow-bootstrap.service';
import { CoreServiceOrchestrator } from './services/core-service-orchestrator.service';

import { ExecutionAnalyticsService } from './services/execution-analytics.service';
// Utils
import {
  EnvelopeBuilderService,
  RequiredInputExtractorService,
  ActionGuidanceGeneratorService,
} from '../../utils/envelope-builder';
import { ValidationContextBuilderService } from '../../utils/envelope-builder/validation-context-builder.service';
import { ProgressCalculatorService } from '../../utils/envelope-builder/progress-calculator.service';

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
    StepExecutionCoreService,
    StepGuidanceService,
    StepProgressTrackerService,
    StepQueryService,
    RoleTransitionService,
    WorkflowExecutionService,
    WorkflowExecutionOperationsService,
    ExecutionDataEnricherService,
    WorkflowBootstrapService,
    CoreServiceOrchestrator,
    ExecutionAnalyticsService,

    // Utils
    EnvelopeBuilderService,
    RequiredInputExtractorService,
    ActionGuidanceGeneratorService,
    ProgressCalculatorService,
    ValidationContextBuilderService,
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
    StepExecutionCoreService,
    StepGuidanceService,
    StepProgressTrackerService,
    StepQueryService,
    RoleTransitionService,
    WorkflowExecutionService,
    WorkflowExecutionOperationsService,
    ExecutionDataEnricherService,
    WorkflowBootstrapService,
    CoreServiceOrchestrator,
    ExecutionAnalyticsService,
  ],
})
export class WorkflowRulesModule {}
