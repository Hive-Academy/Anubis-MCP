import {
  WorkflowStep,
  StepProgressStatus,
} from '../../../../../generated/prisma';

export interface IWorkflowStepRepository {
  // Basic CRUD operations
  findById(id: string): Promise<WorkflowStep | null>;
  create(
    data: Omit<WorkflowStep, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<WorkflowStep>;
  update(id: string, data: Partial<WorkflowStep>): Promise<WorkflowStep>;
  delete(id: string): Promise<void>;

  // Domain-specific methods
  findByExecutionId(executionId: string): Promise<WorkflowStep[]>;
  findByRoleId(roleId: string): Promise<WorkflowStep[]>;
  findCurrentStep(executionId: string): Promise<WorkflowStep | null>;
  findNextStep(
    currentStepId: string,
    executionId: string,
  ): Promise<WorkflowStep | null>;
  findCompletedSteps(executionId: string): Promise<WorkflowStep[]>;
  updateStepStatus(
    stepId: string,
    executionId: string,
    status: StepProgressStatus,
    executionData?: any,
  ): Promise<WorkflowStep>;
  createStepWithSequence(
    stepData: Omit<
      WorkflowStep,
      'id' | 'createdAt' | 'updatedAt' | 'sequenceNumber'
    >,
  ): Promise<WorkflowStep>;
  findStepsByStatus(status: StepProgressStatus): Promise<WorkflowStep[]>;
}
