import { WorkflowGuidance } from '../domains/workflow-rules/services/workflow-guidance.service';
import { ProgressMetrics } from '../utils/envelope-builder/types/progress-calculator.types';
import { ValidationContext } from '../utils/envelope-builder/types/validation-context.types';

// Base envelope interface
export interface BaseEnvelope {
  type: string;
  timestamp: string;
  metadata: {
    taskId: number | null;
    generatedBy: string;
    version: string;
  };
}

// For workflow guidance responses
export interface GuidanceEnvelope extends BaseEnvelope {
  type: 'guidance';
  workflowGuidance: WorkflowGuidance;
  requiredInputs: string[];
  actionGuidance: string;
  progressMetrics: ProgressMetrics;
  validationContext: ValidationContext;
  metadata: {
    taskId: number;
    stepId: string | null;
    roleName: string;
    stepName: string;
    generatedBy: string;
    version: string;
  };
}

// For step execution responses
export interface ExecutionEnvelope extends BaseEnvelope {
  type: 'execution';
  requiredInputs?: string[]; // Added for optimization tracking
  executionResult: {
    id?: string;
    status: string;
    success?: boolean;
    duration?: number;
    actionsCompleted?: number;
    errors?: string[];
    warnings?: string[];
    data?: any;
    nextStep?: {
      stepId: string;
      name: string;
      description?: string;
      stepType?: string;
    } | null; // Added for step progression
  };
  metadata: {
    taskId: number;
    stepId: string | null;
    executionId: string | null;
    status: string;
    generatedBy: string;
    version: string;
  };
}

// For role transition responses
export interface TransitionEnvelope extends BaseEnvelope {
  type: 'transition';
  transitionResult: {
    id?: string;
    fromRole?: { name: string };
    toRole?: { name: string };
    success?: boolean;
    message?: string; // Added for transition messaging
    availableTransitions?: Array<{
      id: string;
      toRole: string;
      name: string;
      score: number;
    }>;
    recommendation?: {
      transitionId: string;
      reasoning: string;
      requirements: string[];
    };
  };
  metadata: {
    taskId: number;
    fromRole: string;
    toRole: string;
    transitionId: string | null;
    generatedBy: string;
    version: string;
  };
}

// For bootstrap responses
export interface BootstrapEnvelope extends BaseEnvelope {
  type: 'bootstrap';
  bootstrapResult: {
    task?: { id: number };
    execution?: {
      id: string;
      currentRole?: { name: string };
    };
    success?: boolean;
    firstStep?: {
      stepId: string;
      name: string;
      guidance: string;
    };
  };
  metadata: {
    taskId: number | null;
    executionId: string | null;
    projectPath: string;
    initialRole: string;
    generatedBy: string;
    version: string;
  };
}

// For workflow execution responses
export interface WorkflowExecutionEnvelope extends BaseEnvelope {
  type: 'workflow-execution';
  executionData: {
    executionId: string;
    currentRole: string;
    status: string;
    activeSteps?: Array<{
      stepId: string;
      name: string;
      status: string;
    }>;
    activeExecutions?: Array<any>; // For get_active_executions
    executionsSummary?: any; // For get_active_executions
    execution?: any; // For get_execution
    progress: ProgressMetrics | Record<string, any>; // More flexible for different operation types
  };
  metadata: {
    taskId: number;
    executionId: string;
    currentRole: string;
    operation: string; // Added operation field
    generatedBy: string;
    version: string;
  };
}

// Union type for all envelope types
export type Envelope =
  | GuidanceEnvelope
  | ExecutionEnvelope
  | TransitionEnvelope
  | BootstrapEnvelope
  | WorkflowExecutionEnvelope;

// Response wrapper for MCP responses
export interface McpResponse {
  version: '2.0';
  envelope: Envelope;
  success: boolean;
  timestamp: string;
  metadata?: {
    responseTime?: number;
    cacheHit?: boolean;
    warnings?: string[];
  };
}

// Legacy envelope interfaces for backward compatibility (deprecated)
export interface LegacyGuidanceEnvelope {
  taskId: number;
  roleId: string;
  stepId: string;
  stepSummary: {
    name: string;
    displayName: string;
    stepType: 'ACTION' | 'VALIDATION' | 'DECISION' | 'MCP_CALL';
    sequenceNumber: number;
    estimatedTime?: string;
  };
  requiredInput: string[];
  actions: string[];
  instructions: {
    nextAction: string;
    actionType: string;
    guidance: string;
    parameters?: Record<string, any>;
  };
  validation: {
    requiredPatterns: string[];
    qualityChecks: string[];
    antiPatterns: string[];
  };
  nextStepName?: string;
  roleTransitionHint?: string;
  progress: {
    currentStep: number;
    totalSteps: number;
    completionPercentage: number;
  };
  meta: {
    timestamp: string;
    responseTime: number;
  };
}
