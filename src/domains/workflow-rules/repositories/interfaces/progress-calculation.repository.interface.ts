import {
  TaskBasicInfo,
  RoleWithSteps,
  StepProgressWithRelations,
  ProgressCalculationResult,
  PrismaTransaction,
} from '../types/progress-calculation.types';

/**
 * Progress Calculation Repository Interface
 *
 * FOCUSED APPROACH: Interface defines only the methods actually used by
 * progress-calculator.service.ts based on analysis of actual database operations.
 */
export interface IProgressCalculationRepository {
  /**
   * Get basic task information by ID
   * Used by: getTaskBasicInfo() in progress-calculator.service.ts
   */
  findTaskBasicInfo(
    taskId: number,
    tx?: PrismaTransaction,
  ): Promise<ProgressCalculationResult<TaskBasicInfo | null>>;

  /**
   * Get role with its steps by role name
   * Used by: getRoleSteps() in progress-calculator.service.ts
   */
  findRoleWithSteps(
    roleName: string,
    tx?: PrismaTransaction,
  ): Promise<ProgressCalculationResult<RoleWithSteps | null>>;

  /**
   * Get step progress for a task with related step and role data
   * Used by: getStepProgress() in progress-calculator.service.ts
   */
  findStepProgressByTaskId(
    taskId: number,
    tx?: PrismaTransaction,
  ): Promise<ProgressCalculationResult<StepProgressWithRelations[]>>;
}
