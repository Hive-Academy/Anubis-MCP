import { WorkflowExecution } from '../../../../../generated/prisma';
import {
  CreateWorkflowExecutionData,
  UpdateWorkflowExecutionData,
  WorkflowExecutionWithRelations,
  WorkflowExecutionIncludeOptions,
  WorkflowExecutionFindManyOptions,
  ExecutionErrorRecoveryResult,
  PrismaTransaction,
} from '../types/workflow-execution.types';

export interface IWorkflowExecutionRepository {
  // Basic CRUD Operations
  findById(
    id: string,
    include?: WorkflowExecutionIncludeOptions,
  ): Promise<WorkflowExecutionWithRelations | null>;
  create(
    data: CreateWorkflowExecutionData,
  ): Promise<WorkflowExecutionWithRelations>;
  update(
    id: string,
    data: UpdateWorkflowExecutionData,
  ): Promise<WorkflowExecutionWithRelations>;
  delete(id: string): Promise<WorkflowExecution>;

  // Query Operations
  findMany(
    options?: WorkflowExecutionFindManyOptions,
  ): Promise<WorkflowExecutionWithRelations[]>;
  findByTaskId(
    taskId: number,
    include?: WorkflowExecutionIncludeOptions,
  ): Promise<WorkflowExecutionWithRelations | null>;
  findActiveExecutions(
    include?: WorkflowExecutionIncludeOptions,
  ): Promise<WorkflowExecutionWithRelations[]>;
  findByRoleId(
    roleId: string,
    include?: WorkflowExecutionIncludeOptions,
  ): Promise<WorkflowExecutionWithRelations[]>;
  findByExecutionMode(
    mode: string,
    include?: WorkflowExecutionIncludeOptions,
  ): Promise<WorkflowExecutionWithRelations[]>;

  // Progress Management
  updateProgress(
    id: string,
    progressData: {
      stepsCompleted?: number;
      totalSteps?: number;
      progressPercentage?: number;
      currentStepId?: string;
      currentRoleId?: string;
    },
  ): Promise<WorkflowExecutionWithRelations>;
  completeExecution(id: string): Promise<WorkflowExecutionWithRelations>;

  // Error Handling & Recovery
  handleExecutionError(
    id: string,
    error: any,
  ): Promise<ExecutionErrorRecoveryResult>;
  updateExecutionState(
    id: string,
    stateUpdate: Partial<any>,
  ): Promise<WorkflowExecutionWithRelations>;

  // Utility Operations
  count(where?: any): Promise<number>;
  isExecutionActive(id: string): Promise<boolean>;
  getExecutionsByDateRange(
    startDate: Date,
    endDate: Date,
    include?: WorkflowExecutionIncludeOptions,
  ): Promise<WorkflowExecutionWithRelations[]>;

  // Transaction Support
  createWithTransaction(
    data: CreateWorkflowExecutionData,
    tx?: PrismaTransaction,
  ): Promise<WorkflowExecutionWithRelations>;
  updateWithTransaction(
    id: string,
    data: UpdateWorkflowExecutionData,
    tx?: PrismaTransaction,
  ): Promise<WorkflowExecutionWithRelations>;

  // Relationship Loading
  findWithAllRelations(
    id: string,
  ): Promise<WorkflowExecutionWithRelations | null>;
  findWithStepProgress(
    id: string,
  ): Promise<WorkflowExecutionWithRelations | null>;
}
