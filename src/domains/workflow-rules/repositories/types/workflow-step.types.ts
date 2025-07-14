import {
  WorkflowStep,
  WorkflowStepProgress,
  StepGuidance,
  QualityCheck,
  StepDependency,
  WorkflowRole,
  WorkflowExecution,
  StepProgressStatus,
  Prisma,
} from '../../../../../generated/prisma';

// ===================================================================
// PRISMA TRANSACTION TYPE
// ===================================================================

export type PrismaTransaction = Omit<
  Prisma.TransactionClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
>;

// ===================================================================
// WORKFLOW STEP WITH RELATIONS
// ===================================================================

export interface WorkflowStepWithRelations extends WorkflowStep {
  role?: WorkflowRole;
  stepProgress?: WorkflowStepProgress[];
  stepGuidance?: StepGuidance[];
  qualityChecks?: QualityCheck[];
  dependencies?: StepDependency[];
  dependentSteps?: StepDependency[];
  executions?: WorkflowExecution[];
}

// ===================================================================
// INCLUDE OPTIONS
// ===================================================================

export interface WorkflowStepIncludeOptions {
  role?: boolean;
  stepProgress?:
    | boolean
    | {
        where?: Prisma.WorkflowStepProgressWhereInput;
        orderBy?: Prisma.WorkflowStepProgressOrderByWithRelationInput;
        take?: number;
      };
  stepGuidance?:
    | boolean
    | {
        where?: Prisma.StepGuidanceWhereInput;
        orderBy?: Prisma.StepGuidanceOrderByWithRelationInput;
      };
  qualityChecks?:
    | boolean
    | {
        where?: Prisma.QualityCheckWhereInput;
        orderBy?: Prisma.QualityCheckOrderByWithRelationInput;
      };
  dependencies?:
    | boolean
    | {
        where?: Prisma.StepDependencyWhereInput;
        orderBy?: Prisma.StepDependencyOrderByWithRelationInput;
      };
  dependentSteps?:
    | boolean
    | {
        where?: Prisma.StepDependencyWhereInput;
        orderBy?: Prisma.StepDependencyOrderByWithRelationInput;
      };
  executions?:
    | boolean
    | {
        where?: Prisma.WorkflowExecutionWhereInput;
        orderBy?: Prisma.WorkflowExecutionOrderByWithRelationInput;
        take?: number;
      };
}

// ===================================================================
// FIND MANY OPTIONS
// ===================================================================

export interface WorkflowStepFindManyOptions {
  where?: Prisma.WorkflowStepWhereInput;
  orderBy?:
    | Prisma.WorkflowStepOrderByWithRelationInput
    | Prisma.WorkflowStepOrderByWithRelationInput[];
  take?: number;
  skip?: number;
  include?: WorkflowStepIncludeOptions;
  select?: Prisma.WorkflowStepSelect;
}

// ===================================================================
// CREATE AND UPDATE DATA TYPES
// ===================================================================

export interface CreateWorkflowStepData {
  roleId: string;
  name: string;
  description?: string;
  sequenceNumber?: number;
  isRequired?: boolean;
  stepType?: string;
  approach?: string;
  estimatedDuration?: number;
  maxRetries?: number;
  timeoutMinutes?: number;
  metadata?: Prisma.JsonValue;

  // Related data for creation
  stepGuidance?: Omit<StepGuidance, 'id' | 'stepId'>[];
  qualityChecks?: Omit<QualityCheck, 'id' | 'stepId'>[];
  dependencies?: Omit<StepDependency, 'id' | 'stepId'>[];
}

export interface UpdateWorkflowStepData {
  roleId?: string;
  name?: string;
  description?: string;
  sequenceNumber?: number;
  isRequired?: boolean;
  stepType?: string;
  approach?: string;
  estimatedDuration?: number;
  maxRetries?: number;
  timeoutMinutes?: number;
  metadata?: Prisma.JsonValue;
}

// ===================================================================
// STATISTICS AND ANALYTICS TYPES
// ===================================================================

export interface StepExecutionStatistics {
  stepId: string;
  stepName: string;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  medianExecutionTime: number;
  minExecutionTime: number;
  maxExecutionTime: number;
  successRate: number;
  failureRate: number;
  lastExecutionDate?: Date;
  commonFailureReasons: {
    reason: string;
    count: number;
    percentage: number;
  }[];
  performanceTrend: {
    period: string;
    averageTime: number;
    successRate: number;
  }[];
}

export interface StepProgressSummary {
  totalSteps: number;
  completedSteps: number;
  inProgressSteps: number;
  notStartedSteps: number;
  failedSteps: number;
  completionPercentage: number;
  averageStepDuration: number;
  estimatedTimeRemaining: number;
  stepsRequiringAttention: {
    stepId: string;
    stepName: string;
    status: StepProgressStatus;
    reason: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
  }[];
  roleBreakdown?: {
    roleId: string;
    roleName: string;
    completedSteps: number;
    totalSteps: number;
    completionPercentage: number;
  }[];
}

// ===================================================================
// STEP DEPENDENCY VALIDATION
// ===================================================================

export interface StepDependencyValidationResult {
  isValid: boolean;
  missingDependencies: {
    dependencyId: string;
    dependencyType: string;
    description: string;
    status: StepProgressStatus;
  }[];
  satisfiedDependencies: {
    dependencyId: string;
    dependencyType: string;
    description: string;
    completedAt: Date;
  }[];
  warnings: {
    message: string;
    severity: 'low' | 'medium' | 'high';
  }[];
}

// ===================================================================
// STEP REORDERING
// ===================================================================

export interface StepReorderRequest {
  stepId: string;
  newSequenceNumber: number;
  reason?: string;
}

export interface StepReorderResult {
  success: boolean;
  affectedSteps: {
    stepId: string;
    oldSequenceNumber: number;
    newSequenceNumber: number;
  }[];
  warnings: string[];
  errors: string[];
}

// ===================================================================
// STEP ATTENTION REQUIREMENTS
// ===================================================================

export interface StepAttentionItem {
  stepId: string;
  stepName: string;
  roleId: string;
  roleName: string;
  attentionType:
    | 'stuck'
    | 'failed'
    | 'timeout'
    | 'dependency_blocked'
    | 'quality_issues';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  suggestedActions: string[];
  affectedExecutions: {
    executionId: string;
    taskId?: string;
    status: StepProgressStatus;
    lastUpdated: Date;
  }[];
  metadata?: Prisma.JsonValue;
}

// ===================================================================
// STEP DUPLICATION
// ===================================================================

export interface StepDuplicationOptions {
  includeGuidance?: boolean;
  includeQualityChecks?: boolean;
  includeDependencies?: boolean;
  newName?: string;
  newDescription?: string;
  adjustSequenceNumber?: boolean;
}

export interface StepDuplicationResult {
  originalStepId: string;
  duplicatedStep: WorkflowStep;
  duplicatedGuidance?: StepGuidance[];
  duplicatedQualityChecks?: QualityCheck[];
  duplicatedDependencies?: StepDependency[];
  warnings: string[];
}

// ===================================================================
// STEP QUERY FILTERS
// ===================================================================

export interface StepQueryFilters {
  roleIds?: string[];
  stepTypes?: string[];
  statuses?: StepProgressStatus[];
  isRequired?: boolean;
  hasGuidance?: boolean;
  hasQualityChecks?: boolean;
  hasDependencies?: boolean;
  executionTimeRange?: {
    min?: number;
    max?: number;
  };
  sequenceNumberRange?: {
    min?: number;
    max?: number;
  };
  createdDateRange?: {
    from?: Date;
    to?: Date;
  };
  lastExecutedRange?: {
    from?: Date;
    to?: Date;
  };
  searchTerm?: string;
  tags?: string[];
}

// ===================================================================
// STEP PERFORMANCE METRICS
// ===================================================================

export interface StepPerformanceMetrics {
  stepId: string;
  averageExecutionTime: number;
  successRate: number;
  retryRate: number;
  timeoutRate: number;
  qualityScore: number;
  userSatisfactionScore?: number;
  complexityScore: number;
  maintenanceScore: number;
  lastOptimized?: Date;
  optimizationSuggestions: {
    type: 'performance' | 'reliability' | 'usability' | 'maintainability';
    description: string;
    impact: 'low' | 'medium' | 'high';
    effort: 'low' | 'medium' | 'high';
  }[];
}

// ===================================================================
// EXPORT ALL TYPES
// ===================================================================

export type {
  WorkflowStep,
  WorkflowStepProgress,
  StepGuidance,
  QualityCheck,
  StepDependency,
  StepProgressStatus,
};
