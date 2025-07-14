import { WorkflowExecution } from '../../../../../generated/prisma';
import {
  CreateWorkflowExecutionData,
  PrismaTransaction,
  UpdateWorkflowExecutionData,
  WorkflowExecutionFindManyOptions,
  WorkflowExecutionIncludeOptions,
  WorkflowExecutionWithRelations,
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

  findByExecutionMode(
    mode: string,
    include?: WorkflowExecutionIncludeOptions,
  ): Promise<WorkflowExecutionWithRelations[]>;

  // Utility Operations
  count(where?: any): Promise<number>;

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
}
