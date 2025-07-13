import {
  Prisma,
  WorkflowExecution,
  WorkflowExecutionMode,
} from '../../../../../generated/prisma';

// Transaction type
export type PrismaTransaction = Prisma.TransactionClient;

// Input types
export type WorkflowExecutionWhereInput = Prisma.WorkflowExecutionWhereInput;
export type WorkflowExecutionOrderByInput =
  Prisma.WorkflowExecutionOrderByWithRelationInput;

// Comprehensive WorkflowExecution with all relations
export interface WorkflowExecutionWithRelations extends WorkflowExecution {
  task?: Prisma.TaskGetPayload<Record<string, never>> | null;
  currentRole?: Prisma.WorkflowRoleGetPayload<Record<string, never>>;
  currentStep?: Prisma.WorkflowStepGetPayload<Record<string, never>> | null;
  stepProgress?: Prisma.WorkflowStepProgressGetPayload<Record<string, never>>[];
}

// Create and Update data types
export interface CreateWorkflowExecutionData {
  taskId?: number;
  currentRoleId: string;
  currentStepId?: string;
  executionState: any; // Required field in Prisma schema
  autoCreatedTask?: boolean;
  taskCreationData?: any;
  stepsCompleted?: number;
  totalSteps?: number;
  progressPercentage?: number;
  executionMode?: WorkflowExecutionMode;
  executionContext?: any;
  maxRecoveryAttempts?: number;
}

export interface UpdateWorkflowExecutionData {
  taskId?: number;
  currentRoleId?: string;
  currentStepId?: string;
  executionState?: any;
  completedAt?: Date;
  autoCreatedTask?: boolean;
  taskCreationData?: any;
  stepsCompleted?: number;
  totalSteps?: number;
  progressPercentage?: number;
  executionMode?: WorkflowExecutionMode;
  executionContext?: any;
  lastError?: any;
  recoveryAttempts?: number;
  maxRecoveryAttempts?: number;
}

// Include options for flexible relation loading
export interface WorkflowExecutionIncludeOptions {
  task?:
    | boolean
    | {
        taskDescription?: boolean;
        codebaseAnalysis?: boolean;
        researchReports?: boolean;
        subtasks?: boolean;
      };
  currentRole?: boolean;
  currentStep?:
    | boolean
    | {
        role?: boolean;
      };
  stepProgress?:
    | boolean
    | {
        step?: boolean;
        role?: boolean;
      };
}

// Find many options
export interface WorkflowExecutionFindManyOptions {
  where?: WorkflowExecutionWhereInput;
  include?: WorkflowExecutionIncludeOptions;
  orderBy?: WorkflowExecutionOrderByInput;
  skip?: number;
  take?: number;
}

// Error recovery result
export interface ExecutionErrorRecoveryResult {
  canRecover: boolean;
  recoveryAttempts: number;
  maxRecoveryAttempts: number;
  errorDetails: any;
  execution?: WorkflowExecutionWithRelations;
}
