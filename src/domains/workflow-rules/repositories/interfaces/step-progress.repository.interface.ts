import { WorkflowStepProgress } from '../../../../../generated/prisma';
import {
  CreateStepProgressData,
  UpdateStepProgressData,
  StepProgressWithRelations,
  StepProgressIncludeOptions,
  StepProgressFindManyOptions,
  StepProgressSummary,
  ExecutionProgressSummary,
  PrismaTransaction,
  McpExecutionData,
  StepCompletionData,
  StepFailureData,
} from '../types/step-progress.types';

/**
 * Repository interface for WorkflowStepProgress entity
 * Provides comprehensive methods for step progress tracking and management
 */
export interface IStepProgressRepository {
  // ===================================================================
  // BASIC CRUD OPERATIONS
  // ===================================================================

  /**
   * Find step progress record by ID
   */
  findById(
    id: string,
    include?: StepProgressIncludeOptions,
  ): Promise<StepProgressWithRelations | null>;

  /**
   * Find step progress records by step ID
   */
  findByStepId(
    stepId: string,
    include?: StepProgressIncludeOptions,
  ): Promise<StepProgressWithRelations[]>;

  /**
   * Find step progress records by execution ID
   */
  findByExecutionId(
    executionId: string,
    include?: StepProgressIncludeOptions,
  ): Promise<StepProgressWithRelations[]>;

  /**
   * Find step progress records by role ID
   */
  findByRoleId(
    roleId: string,
    include?: StepProgressIncludeOptions,
  ): Promise<StepProgressWithRelations[]>;

  /**
   * Create new step progress record
   */
  create(
    data: CreateStepProgressData,
    tx?: PrismaTransaction,
  ): Promise<StepProgressWithRelations>;

  /**
   * Update existing step progress record
   */
  update(
    id: string,
    data: UpdateStepProgressData,
    tx?: PrismaTransaction,
  ): Promise<StepProgressWithRelations>;

  /**
   * Delete step progress record
   */
  delete(id: string, tx?: PrismaTransaction): Promise<WorkflowStepProgress>;

  // ===================================================================
  // QUERY OPERATIONS
  // ===================================================================

  /**
   * Find multiple step progress records with options
   */
  findMany(
    options?: StepProgressFindManyOptions,
  ): Promise<StepProgressWithRelations[]>;

  /**
   * Find latest step progress record by step ID
   */
  findLatestByStep(
    stepId: string,
    include?: StepProgressIncludeOptions,
  ): Promise<StepProgressWithRelations | null>;

  /**
   * Find in-progress steps by execution ID
   */
  findInProgressByExecution(
    executionId: string,
    include?: StepProgressIncludeOptions,
  ): Promise<StepProgressWithRelations[]>;

  /**
   * Find completed steps by role ID
   */
  findCompletedByRole(
    roleId: string,
    include?: StepProgressIncludeOptions,
  ): Promise<StepProgressWithRelations[]>;

  /**
   * Find failed steps by execution ID
   */
  findFailedByExecution(
    executionId: string,
    include?: StepProgressIncludeOptions,
  ): Promise<StepProgressWithRelations[]>;

  // ===================================================================
  // STEP PROGRESS MANAGEMENT
  // ===================================================================

  /**
   * Update step status
   */
  updateStepStatus(
    stepId: string,
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'FAILED',
    tx?: PrismaTransaction,
  ): Promise<StepProgressWithRelations>;

  /**
   * Create step progress record with initial data
   */
  createStepProgress(
    data: CreateStepProgressData,
    tx?: PrismaTransaction,
  ): Promise<StepProgressWithRelations>;

  /**
   * Start step execution tracking
   */
  startStep(
    stepId: string,
    executionId: string,
    roleId: string,
    taskId?: string,
    tx?: PrismaTransaction,
  ): Promise<StepProgressWithRelations>;

  /**
   * Update step progress with MCP execution data
   */
  updateProgress(
    stepId: string,
    executionData: McpExecutionData,
    tx?: PrismaTransaction,
  ): Promise<StepProgressWithRelations>;

  /**
   * Complete step execution
   */
  completeStep(
    stepId: string,
    completionData: StepCompletionData,
    tx?: PrismaTransaction,
  ): Promise<StepProgressWithRelations>;

  /**
   * Mark step as failed
   */
  failStep(
    stepId: string,
    failureData: StepFailureData,
    tx?: PrismaTransaction,
  ): Promise<StepProgressWithRelations>;

  // ===================================================================
  // PROGRESS SUMMARY & ANALYTICS
  // ===================================================================

  /**
   * Get progress summary for a role
   */
  getProgressSummary(roleId: string): Promise<StepProgressSummary>;

  /**
   * Get execution progress summary
   */
  getExecutionProgressSummary(
    executionId: string,
  ): Promise<ExecutionProgressSummary>;

  /**
   * Get step progress by task ID
   */
  findByTaskId(
    taskId: string,
    include?: StepProgressIncludeOptions,
  ): Promise<StepProgressWithRelations[]>;

  /**
   * Get current step for execution
   */
  getCurrentStep(
    executionId: string,
    include?: StepProgressIncludeOptions,
  ): Promise<StepProgressWithRelations | null>;

  /**
   * Get recent progress for execution
   */
  getRecentProgress(
    executionId: string,
    limit?: number,
    include?: StepProgressIncludeOptions,
  ): Promise<StepProgressWithRelations[]>;

  // ===================================================================
  // TRANSACTION SUPPORT
  // ===================================================================

  /**
   * Execute operations within a transaction
   */
  withTransaction<T>(fn: (tx: PrismaTransaction) => Promise<T>): Promise<T>;
}
