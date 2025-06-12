import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { WorkflowStep } from 'generated/prisma';
import { ProgressCalculatorService } from '../../../utils/envelope-builder/progress-calculator.service';

// ===================================================================
// 📊 STEP PROGRESS TRACKER SERVICE - Progress & Completion Management
// ===================================================================
// Purpose: Track step execution progress, completion, and calculate metrics
// Scope: Progress records, completion tracking, progress analytics
// Optimization: Eliminates duplication in progress calculation and reporting

export interface StepCompletionContext {
  taskId: number;
  stepId: string;
  roleId?: string;
  result: 'success' | 'failure';
  executionData?: any;
  executionTime?: number;
}

export interface StepCompletionResult {
  success: boolean;
  message: string;
  nextStep: {
    id: string;
    name: string;
    stepType: string;
    description: string;
  } | null;
  progressPercentage: number;
  stepsCompleted: number;
  estimatedTimeRemaining?: string;
  recoveryGuidance?: string[];
}

export interface TaskProgressMetrics {
  percentage: number;
  completed: number;
  total: number;
  estimatedTime?: string;
  traditionalProgress?: any;
  enhancedProgressData?: any;
}

@Injectable()
export class StepProgressTrackerService {
  private readonly logger = new Logger(StepProgressTrackerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly progressCalculator: ProgressCalculatorService,
  ) {}

  /**
   * ✅ OPTIMIZED: Process step completion results from AI (eliminates duplication)
   * Single source of truth for step completion processing
   */
  async processStepCompletion(
    context: StepCompletionContext,
  ): Promise<StepCompletionResult> {
    try {
      const { taskId, stepId, result, executionData, executionTime } = context;

      // Create or update progress record (single operation)
      await this.recordStepCompletion(
        taskId.toString(),
        stepId,
        result,
        executionData,
        executionTime,
      );

      if (result === 'success') {
        // Get the completed step details
        const completedStep = await this.prisma.workflowStep.findUnique({
          where: { id: stepId },
        });

        // Find next step
        const nextStep = completedStep
          ? await this.getNextStep(
              completedStep.roleId,
              completedStep.sequenceNumber,
            )
          : null;

        // Update workflow execution state
        await this.updateWorkflowExecutionState(
          taskId,
          completedStep?.roleId || 'unknown',
          stepId,
          nextStep,
          executionTime || 0,
        );

        // Calculate progress (single calculation)
        const progress = await this.calculateTaskProgress(taskId);

        return {
          success: true,
          message: `Step ${stepId} completed successfully`,
          nextStep: nextStep
            ? {
                id: nextStep.id,
                name: nextStep.name,
                stepType: nextStep.stepType,
                description: nextStep.description,
              }
            : null,
          progressPercentage: progress.percentage,
          stepsCompleted: progress.completed,
          estimatedTimeRemaining: progress.estimatedTime,
        };
      } else {
        // Handle failure - stay on same step
        return {
          success: false,
          message: `Step ${stepId} failed: ${executionData?.error || 'Unknown error'}`,
          nextStep: null, // Stay on same step for retry
          progressPercentage: await this.getTaskProgressPercentage(taskId),
          stepsCompleted: 0,
          recoveryGuidance: this.getRecoveryGuidanceForStep(stepId),
        };
      }
    } catch (error) {
      this.logger.error(
        `Error processing step completion: ${error.message}`,
        error,
      );
      return {
        success: false,
        message: `Failed to process step completion: ${error.message}`,
        nextStep: null,
        progressPercentage: 0,
        stepsCompleted: 0,
      };
    }
  }

  /**
   * ✅ ENHANCED: Get step execution progress with comprehensive metrics
   * OPTIMIZATION: Single query pattern, no data duplication
   */
  async getStepProgress(
    taskId: string,
    roleId?: string,
  ): Promise<TaskProgressMetrics & { success: boolean }> {
    // Get traditional progress data (single query)
    const whereClause: any = { taskId };
    if (roleId) {
      whereClause.roleId = roleId;
    }

    const traditionalProgress = await this.prisma.workflowStepProgress.findMany(
      {
        where: whereClause,
        include: {
          step: true,
          role: true,
        },
        orderBy: { startedAt: 'desc' },
      },
    );

    // ✅ ENHANCED: Use ProgressCalculatorService for enhanced metrics (no duplication)
    try {
      const baseGuidance = {
        currentRole: {
          name: roleId || 'unknown',
          displayName: roleId || 'Unknown Role',
          description: `Role: ${roleId || 'unknown'}`,
          capabilities: {},
        },
        currentStep: null,
        nextActions: [],
        projectContext: {},
        qualityReminders: [],
        ruleEnforcement: {
          requiredPatterns: [],
          antiPatterns: [],
          complianceChecks: [],
        },
        reportingStatus: { shouldTriggerReport: false },
      };

      const enhancedProgressResult =
        await this.progressCalculator.calculateProgress(
          parseInt(taskId),
          baseGuidance,
          null,
        );

      // ✅ OPTIMIZATION: Calculate basic metrics once
      const completedCount = traditionalProgress.filter(
        (p) => p.status === 'COMPLETED',
      ).length;
      const totalSteps = 15; // Configurable
      const percentage = Math.min(
        Math.round((completedCount / totalSteps) * 100),
        100,
      );

      return {
        percentage,
        completed: completedCount,
        total: totalSteps,
        estimatedTime:
          completedCount < totalSteps
            ? `${(totalSteps - completedCount) * 5} minutes`
            : undefined,
        traditionalProgress: traditionalProgress,
        enhancedProgressData: enhancedProgressResult.success
          ? enhancedProgressResult.metrics
          : null,
        success: true,
      };
    } catch (error) {
      this.logger.warn(
        'Enhanced progress calculation failed, returning traditional progress only:',
        error,
      );

      // Fallback calculation
      const completedCount = traditionalProgress.filter(
        (p) => p.status === 'COMPLETED',
      ).length;
      const totalSteps = 15;
      const percentage = Math.min(
        Math.round((completedCount / totalSteps) * 100),
        100,
      );

      return {
        percentage,
        completed: completedCount,
        total: totalSteps,
        traditionalProgress: traditionalProgress,
        enhancedProgressData: null,
        success: false,
      };
    }
  }

  /**
   * ✅ OPTIMIZATION: Get next available step with enhanced context
   * Single query with optional context enhancement
   */
  async getNextAvailableStep(
    roleId: string,
    taskId: string,
  ): Promise<WorkflowStep | null> {
    // Get completed steps for this task and role (single query)
    const completedSteps = await this.prisma.workflowStepProgress.findMany({
      where: {
        taskId,
        roleId,
        status: 'COMPLETED',
      },
      select: { stepId: true },
    });

    const completedStepIds = completedSteps.map((s) => s.stepId);

    // Find the next step that hasn't been completed (single query)
    const nextStep = await this.prisma.workflowStep.findFirst({
      where: {
        roleId,
        id: { notIn: completedStepIds },
      },
      orderBy: { sequenceNumber: 'asc' },
    });

    // ✅ ENHANCED: Add debug logging for enhanced context (no additional queries)
    if (nextStep) {
      this.logger.debug(`Next available step for role ${roleId}:`, {
        stepId: nextStep.id,
        stepName: nextStep.name,
        sequenceNumber: nextStep.sequenceNumber,
        completedStepsCount: completedStepIds.length,
      });
    }

    return nextStep;
  }

  // ===================================================================
  // 🔧 PRIVATE HELPER METHODS (Optimized - minimal queries)
  // ===================================================================

  private async recordStepCompletion(
    taskId: string,
    stepId: string,
    result: 'success' | 'failure',
    executionData?: any,
    executionTime?: number,
  ): Promise<any> {
    const status = result === 'success' ? 'COMPLETED' : 'FAILED';

    try {
      // ✅ FIX: Get the step to retrieve the correct roleId
      const step = await this.prisma.workflowStep.findUnique({
        where: { id: stepId },
        select: { roleId: true },
      });

      if (!step) {
        throw new Error(`Step with id ${stepId} not found`);
      }

      // ✅ FIX: Use the correct unique constraint from schema - the model uses @id @default(cuid())
      // We need to find if there's an existing record or create a new one
      const existingRecord = await this.prisma.workflowStepProgress.findFirst({
        where: {
          taskId,
          stepId,
          roleId: step.roleId,
        },
      });

      if (existingRecord) {
        // Update existing record
        return this.prisma.workflowStepProgress.update({
          where: { id: existingRecord.id },
          data: {
            status,
            completedAt: new Date(),
            executionData: executionData || {},
            duration: executionTime,
          },
        });
      } else {
        // Create new record
        return this.prisma.workflowStepProgress.create({
          data: {
            taskId,
            stepId,
            roleId: step.roleId,
            status,
            startedAt: new Date(),
            completedAt: status === 'COMPLETED' ? new Date() : null,
            executionData: executionData || {},
            duration: executionTime,
          },
        });
      }
    } catch (error) {
      this.logger.error('Failed to record step completion:', {
        taskId,
        stepId,
        result,
        error: error.message,
      });
      throw error;
    }
  }

  private async calculateTaskProgress(taskId: number): Promise<{
    percentage: number;
    completed: number;
    estimatedTime?: string;
  }> {
    // ✅ OPTIMIZATION: Single query for completed count
    const completedCount = await this.prisma.workflowStepProgress.count({
      where: {
        taskId: taskId.toString(),
        status: 'COMPLETED',
      },
    });

    const estimatedTotalSteps = 15; // Could be made configurable
    const percentage = Math.min(
      Math.round((completedCount / estimatedTotalSteps) * 100),
      100,
    );
    const remainingSteps = Math.max(estimatedTotalSteps - completedCount, 0);
    const estimatedTime =
      remainingSteps > 0 ? `${remainingSteps * 5} minutes` : undefined;

    return {
      percentage,
      completed: completedCount,
      estimatedTime,
    };
  }

  private async getTaskProgressPercentage(taskId: number): Promise<number> {
    const progress = await this.calculateTaskProgress(taskId);
    return progress.percentage;
  }

  private getRecoveryGuidanceForStep(_stepId: string): string[] {
    // Generic recovery guidance - could be made step-specific
    return [
      'Review error message details',
      'Check prerequisites are met',
      'Retry the operation',
      'Get help if issue persists',
    ];
  }

  private async getNextStep(
    roleId: string,
    currentSequenceNumber: number,
  ): Promise<WorkflowStep | null> {
    return await this.prisma.workflowStep.findFirst({
      where: {
        roleId,
        sequenceNumber: { gt: currentSequenceNumber },
      },
      orderBy: { sequenceNumber: 'asc' },
    });
  }

  /**
   * 🔧 OPTIMIZATION: Update workflow execution state after step completion
   * Single update operation with minimal data transformation
   */
  private async updateWorkflowExecutionState(
    taskId: number,
    _roleId: string,
    completedStepId: string,
    nextStep: WorkflowStep | null,
    stepDuration: number,
  ): Promise<void> {
    try {
      // Get current workflow execution (single query)
      const execution = await this.prisma.workflowExecution.findFirst({
        where: { taskId },
        include: { task: true },
      });

      if (!execution) {
        this.logger.warn(`No workflow execution found for task ${taskId}`);
        return;
      }

      // ✅ OPTIMIZATION: Get completed count in single query (reuse from calculateTaskProgress)
      const completedStepsCount = await this.prisma.workflowStepProgress.count({
        where: {
          taskId: taskId.toString(),
          status: 'COMPLETED',
        },
      });

      // Calculate progress percentage (single calculation)
      const estimatedTotalSteps = 15;
      const progressPercentage = Math.min(
        Math.round((completedStepsCount / estimatedTotalSteps) * 100),
        100,
      );

      // Determine task status based on progress
      let taskStatus = execution.task.status;
      if (completedStepsCount > 0 && taskStatus === 'not-started') {
        taskStatus = 'in-progress';
      }

      // ✅ OPTIMIZATION: Safely handle JSON spread for executionState (no duplication)
      const currentExecutionState =
        (execution.executionState as Record<string, any>) || {};
      const currentExecutionContext =
        (execution.executionContext as Record<string, any>) || {};

      // Update workflow execution state (single update)
      await this.prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          currentStepId: nextStep?.id || null,
          stepsCompleted: completedStepsCount,
          progressPercentage,
          totalSteps: estimatedTotalSteps,
          executionState: {
            ...currentExecutionState,
            phase: 'in-progress',
            lastStepCompleted: {
              stepId: completedStepId,
              completedAt: new Date().toISOString(),
              duration: stepDuration,
            },
            ...(nextStep && {
              currentStep: {
                id: nextStep.id,
                name: nextStep.name,
                sequenceNumber: nextStep.sequenceNumber,
                assignedAt: new Date().toISOString(),
              },
            }),
          },
          executionContext: {
            ...currentExecutionContext,
            lastSyncUpdate: new Date().toISOString(),
            stepsCompleted: completedStepsCount,
            progressPercentage,
          },
        },
      });

      // Update task status if needed (single update)
      if (taskStatus !== execution.task.status) {
        await this.prisma.task.update({
          where: { id: taskId },
          data: {
            status: taskStatus,
            updatedAt: new Date(),
          },
        });
      }

      this.logger.debug(
        `Workflow execution state updated: Task ${taskId}, Steps: ${completedStepsCount}, Progress: ${progressPercentage}%`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to update workflow execution state for task ${taskId}:`,
        error,
      );
      // Don't throw - step execution should still succeed even if state sync fails
    }
  }
}
