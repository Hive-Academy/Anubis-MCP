import {
  Prisma,
  WorkflowStepProgress,
  StepProgressStatus,
  StepExecutionResult,
} from '../../../../../generated/prisma';

// Transaction type
export type PrismaTransaction = Prisma.TransactionClient;

// Input types for queries
export type StepProgressWhereInput = Prisma.WorkflowStepProgressWhereInput;
export type StepProgressOrderByInput =
  Prisma.WorkflowStepProgressOrderByWithRelationInput;

// Comprehensive WorkflowStepProgress with all relations
export interface StepProgressWithRelations extends WorkflowStepProgress {
  step?: Prisma.WorkflowStepGetPayload<{
    include: {
      role: true;
    };
  }> | null;
  role?: Prisma.WorkflowRoleGetPayload<Record<string, never>> | null;
  execution?: Prisma.WorkflowExecutionGetPayload<Record<string, never>> | null;
  task?: Prisma.TaskGetPayload<Record<string, never>> | null;
}

// Create and Update data types
export interface CreateStepProgressData {
  stepId: string;
  executionId: string;
  taskId?: string | null;
  roleId: string;
  status: StepProgressStatus;
  startedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  duration?: number | null;
  executionData?: any;
  validationResults?: any;
  errorDetails?: any;
  result?: StepExecutionResult | null;
  reportData?: any;
}

export interface UpdateStepProgressData {
  stepId?: string;
  executionId?: string;
  taskId?: string | null;
  roleId?: string;
  status?: StepProgressStatus;
  startedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  duration?: number | null;
  executionData?: any;
  validationResults?: any;
  errorDetails?: any;
  result?: StepExecutionResult | null;
  reportData?: any;
}

// Query options
export interface StepProgressIncludeOptions {
  step?:
    | boolean
    | {
        include?: {
          role?: boolean;
        };
      };
  role?: boolean;
  execution?: boolean;
  task?: boolean;
}

export interface StepProgressFindManyOptions {
  where?: StepProgressWhereInput;
  orderBy?: StepProgressOrderByInput | StepProgressOrderByInput[];
  take?: number;
  skip?: number;
  include?: StepProgressIncludeOptions;
}

// Specific result types
export interface StepProgressSummary {
  roleId: string;
  totalSteps: number;
  completedSteps: number;
  failedSteps: number;
  inProgressSteps: number;
  averageExecutionTime: number;
  successRate: number;
}

export interface ExecutionProgressSummary {
  executionId: string;
  totalSteps: number;
  completedSteps: number;
  currentStep?: StepProgressWithRelations;
  recentProgress: StepProgressWithRelations[];
}

// MCP Execution Data types (from the service)
export interface McpExecutionData {
  executionType: 'MCP_ONLY';
  phase: 'GUIDANCE_PREPARED' | 'EXECUTING' | 'COMPLETED' | 'FAILED';
  lastMcpResult?: McpExecutionResult;
  mcpResults?: McpExecutionResult[];
  totalDuration?: number;
  errors?: string[];
}

export interface McpExecutionResult {
  operation: string;
  result: 'SUCCESS' | 'FAILURE';
  duration?: number;
  data?: any;
}

// Step completion types
export interface StepCompletionData {
  result: 'SUCCESS' | 'FAILURE';
  duration?: number;
  mcpResults?: McpExecutionResult[];
  validationResults?: any;
}

export interface StepFailureData {
  errors: string[];
  mcpResults?: McpExecutionResult[];
  errorDetails?: any;
}
