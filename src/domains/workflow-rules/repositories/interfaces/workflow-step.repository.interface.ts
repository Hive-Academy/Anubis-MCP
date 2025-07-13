import {
  StepProgressStatus,
  WorkflowStep,
  WorkflowStepProgress,
} from '../../../../../generated/prisma';
import {
  CreateWorkflowStepData,
  UpdateWorkflowStepData,
  WorkflowStepFindManyOptions,
  WorkflowStepIncludeOptions,
  WorkflowStepWithRelations,
} from '../types/workflow-step.types';

export interface IWorkflowStepRepository {
  // ===================================================================
  // BASIC CRUD OPERATIONS
  // ===================================================================

  findById(
    id: string,
    include?: WorkflowStepIncludeOptions,
  ): Promise<WorkflowStepWithRelations | null>;

  findMany(
    options?: WorkflowStepFindManyOptions,
  ): Promise<WorkflowStepWithRelations[]>;

  create(data: CreateWorkflowStepData): Promise<WorkflowStep>;

  update(id: string, data: UpdateWorkflowStepData): Promise<WorkflowStep>;

  // ===================================================================
  // STEP QUERY OPERATIONS
  // ===================================================================

  findByExecutionId(executionId: string): Promise<WorkflowStep[]>;

  findByRoleId(
    roleId: string,
    include?: WorkflowStepIncludeOptions,
  ): Promise<WorkflowStepWithRelations[]>;

  findByName(
    roleId: string,
    stepName: string,
    include?: WorkflowStepIncludeOptions,
  ): Promise<WorkflowStepWithRelations | null>;

  findBySequenceNumber(
    roleId: string,
    sequenceNumber: number,
    include?: WorkflowStepIncludeOptions,
  ): Promise<WorkflowStepWithRelations | null>;

  findByStepType(
    stepType: string,
    include?: WorkflowStepIncludeOptions,
  ): Promise<WorkflowStepWithRelations[]>;

  // ===================================================================
  // STEP PROGRESSION & NAVIGATION
  // ===================================================================

  findCurrentStep(
    executionId: string,
    include?: WorkflowStepIncludeOptions,
  ): Promise<WorkflowStepWithRelations | null>;

  findNextStep(
    currentStepId: string,
    executionId: string,
    include?: WorkflowStepIncludeOptions,
  ): Promise<WorkflowStepWithRelations | null>;

  findNextAvailableStep(
    taskId: string,
    roleId: string,
    include?: WorkflowStepIncludeOptions,
  ): Promise<WorkflowStepWithRelations | null>;

  findFirstStepForRole(
    roleId: string,
    include?: WorkflowStepIncludeOptions,
  ): Promise<WorkflowStepWithRelations | null>;

  // ===================================================================
  // STEP GUIDANCE & QUALITY MANAGEMENT
  // ===================================================================

  findWithAllRelations(
    stepId: string,
  ): Promise<WorkflowStepWithRelations | null>;

  // ===================================================================
  // STEP PROGRESS & STATUS MANAGEMENT
  // ===================================================================

  updateStepStatus(
    stepId: string,
    executionId: string,
    status: StepProgressStatus,
    executionData?: any,
  ): Promise<WorkflowStep>;

  createStepProgress(
    stepId: string,
    executionId: string,
    roleId: string,
    taskId?: string,
  ): Promise<WorkflowStepProgress>;

  updateStepProgress(
    progressId: string,
    data: Partial<WorkflowStepProgress>,
  ): Promise<WorkflowStepProgress>;

  findStepProgress(
    stepId: string,
    executionId: string,
  ): Promise<WorkflowStepProgress | null>;
}
