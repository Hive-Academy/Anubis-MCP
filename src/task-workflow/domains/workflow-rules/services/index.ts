// ===================================================================
// 🎯 WORKFLOW RULES SERVICES - Optimized Service Architecture
// ===================================================================
// Exports for the refactored step execution services
// Split from monolithic 1400+ line service into focused services

// Core step execution services
export { StepExecutionService } from './step-execution.service';
export { StepExecutionCoreService } from './step-execution-core.service';
export { StepGuidanceService } from './step-guidance.service';
export { StepProgressTrackerService } from './step-progress-tracker.service';
export { StepQueryService } from './step-query.service';

// Existing services (maintained)

export { WorkflowBootstrapService } from './workflow-bootstrap.service';
export { RoleTransitionService } from './role-transition.service';
export { WorkflowGuidanceService } from './workflow-guidance.service';
export { CoreServiceOrchestrator } from './core-service-orchestrator.service';
export { ExecutionAnalyticsService } from './execution-analytics.service';
export { WorkflowExecutionService } from './workflow-execution.service';
export { ExecutionDataEnricherService } from './execution-data-enricher.service';
export { WorkflowExecutionOperationsService } from './workflow-execution-operations.service';

// Types and interfaces
export type {
  StepExecutionContext,
  StepExecutionResult,
  StepExecutionConfig,
} from './step-execution-core.service';

export type {
  StepGuidanceContext,
  StepGuidanceResult,
  ValidationCriteriaResult,
} from './step-guidance.service';

export type {
  StepCompletionContext,
  StepCompletionResult,
  TaskProgressMetrics,
} from './step-progress-tracker.service';

export type {
  StepQueryOptions,
  StepWithDetails,
  StepFilterCriteria,
} from './step-query.service';
