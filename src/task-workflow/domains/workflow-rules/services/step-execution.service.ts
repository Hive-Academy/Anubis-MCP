import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { WorkflowStep } from 'generated/prisma';
import { StepExecutionContext } from './workflow-guidance.service';
import { StepConditionEvaluator } from './step-condition-evaluator.service';
import { StepActionExecutor } from './step-action-executor.service';

// Configuration interfaces to eliminate hardcoding
export interface StepExecutionConfig {
  defaults: {
    progressStatus: {
      inProgress: 'IN_PROGRESS';
      completed: 'COMPLETED';
      failed: 'FAILED';
      pending: 'PENDING';
    };
  };
  validation: {
    requireStepId: boolean;
    requireTaskId: boolean;
    requireRoleId: boolean;
  };
  performance: {
    executionTimeoutMs: number;
    maxRetryAttempts: number;
    queryTimeoutMs: number;
    maxConcurrentExecutions: number;
  };
}

export interface StepExecutionResult {
  success: boolean;
  results: any;
  nextStep?: WorkflowStep;
  duration?: number;
  errors?: string[];
}

@Injectable()
export class StepExecutionService {
  private readonly logger = new Logger(StepExecutionService.name);

  // Configuration with sensible defaults
  private readonly config: StepExecutionConfig = {
    defaults: {
      progressStatus: {
        inProgress: 'IN_PROGRESS',
        completed: 'COMPLETED' as const,
        failed: 'FAILED' as const,
        pending: 'PENDING',
      },
    },
    validation: {
      requireStepId: true,
      requireTaskId: true,
      requireRoleId: true,
    },
    performance: {
      executionTimeoutMs: 30000,
      maxRetryAttempts: 3,
      queryTimeoutMs: 5000,
      maxConcurrentExecutions: 5,
    },
  };

  constructor(
    private prisma: PrismaService,
    private conditionEvaluator: StepConditionEvaluator,
    private actionExecutor: StepActionExecutor,
  ) {}

  /**
   * Update step execution configuration
   */
  updateConfig(config: Partial<StepExecutionConfig>): void {
    if (config.defaults) {
      Object.assign(this.config.defaults, config.defaults);
    }
    if (config.validation) {
      Object.assign(this.config.validation, config.validation);
    }
    if (config.performance) {
      Object.assign(this.config.performance, config.performance);
    }
    this.logger.log('Step execution configuration updated');
  }

  /**
   * Get current configuration
   */
  getConfig(): StepExecutionConfig {
    return {
      defaults: JSON.parse(JSON.stringify(this.config.defaults)),
      validation: { ...this.config.validation },
      performance: { ...this.config.performance },
    };
  }

  /**
   * Validate input parameters
   */
  private validateInput(context: StepExecutionContext): void {
    if (this.config.validation.requireTaskId && !context.taskId) {
      throw new Error('taskId is required for step execution');
    }

    if (this.config.validation.requireRoleId && !context.roleId) {
      throw new Error('roleId is required for step execution');
    }

    if (this.config.validation.requireStepId && !context.stepId) {
      throw new Error('stepId is required for step execution');
    }
  }

  /**
   * Execute a workflow step with validation and progress tracking
   */
  async executeWorkflowStep(
    context: StepExecutionContext,
    executionData?: any,
  ): Promise<StepExecutionResult> {
    const startTime = Date.now();

    try {
      this.validateInput(context);
      const { taskId, roleId, stepId } = context;

      // Get the step details
      const step = await this.getStepWithDetails(stepId!); // Safe after validation
      if (!step) {
        throw new Error(`Workflow step '${stepId}' not found`);
      }

      // Validate step conditions
      const conditionsValid =
        await this.conditionEvaluator.validateStepConditions(
          step.conditions,
          context,
        );

      if (!conditionsValid.isValid) {
        return {
          success: false,
          results: null,
          errors: conditionsValid.errors,
          duration: Date.now() - startTime,
        };
      }

      // Record step progress start
      const progressRecord = await this.createProgressRecord(
        String(taskId),
        roleId,
        stepId!, // Safe after validation
        executionData,
      );

      try {
        // Execute step actions
        const actionResults = await this.actionExecutor.executeStepActions(
          step.actions,
          context,
        );

        // Update progress record with completion
        await this.updateProgressRecord(
          progressRecord.id,
          this.config.defaults.progressStatus.completed,
          {
            validationResults: actionResults,
            duration: Date.now() - startTime,
          },
        );

        // Get next step in sequence
        const nextStep = await this.getNextStep(
          step.roleId,
          step.sequenceNumber,
        );

        // 🔧 FIX: Update workflow execution state after step completion
        await this.updateWorkflowExecutionState(
          taskId,
          roleId,
          stepId!,
          nextStep,
          Date.now() - startTime,
        );

        return {
          success: true,
          results: actionResults,
          nextStep: nextStep || undefined,
          duration: Date.now() - startTime,
        };
      } catch (error) {
        // Update progress record with failure
        await this.updateProgressRecord(
          progressRecord.id,
          this.config.defaults.progressStatus.failed,
          {
            errorDetails: { error: error.message, stack: error.stack },
            duration: Date.now() - startTime,
          },
        );

        throw error;
      }
    } catch (error) {
      this.logger.error(`Error executing workflow step:`, error);
      return {
        success: false,
        results: null,
        errors: [error.message],
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Get step execution progress for a task
   */
  getStepProgress(taskId: string, roleId?: string) {
    const whereClause: any = { taskId };
    if (roleId) {
      whereClause.roleId = roleId;
    }

    return this.prisma.workflowStepProgress.findMany({
      where: whereClause,
      include: {
        step: true,
        role: true,
      },
      orderBy: { startedAt: 'desc' },
    });
  }

  /**
   * Get the next available step for a role
   */
  async getNextAvailableStep(
    roleId: string,
    taskId: string,
  ): Promise<WorkflowStep | null> {
    // Get completed steps for this task and role
    const completedSteps = await this.prisma.workflowStepProgress.findMany({
      where: {
        taskId,
        roleId,
        status: 'COMPLETED',
      },
      select: { stepId: true },
    });

    const completedStepIds = completedSteps.map((s) => s.stepId);

    // Find the next step that hasn't been completed
    return this.prisma.workflowStep.findFirst({
      where: {
        roleId,
        id: { notIn: completedStepIds },
      },
      orderBy: { sequenceNumber: 'asc' },
    });
  }

  // Private helper methods

  private getStepWithDetails(stepId: string) {
    return this.prisma.workflowStep.findUnique({
      where: { id: stepId },
      include: {
        conditions: true,
        actions: true,
      },
    });
  }

  private createProgressRecord(
    taskId: string,
    roleId: string,
    stepId: string,
    executionData?: any,
  ) {
    return this.prisma.workflowStepProgress.create({
      data: {
        taskId,
        roleId,
        stepId,
        status: 'IN_PROGRESS',
        startedAt: new Date(),
        executionData,
      },
    });
  }

  private updateProgressRecord(
    progressId: string,
    status: 'COMPLETED' | 'FAILED',
    updateData: any,
  ) {
    return this.prisma.workflowStepProgress.update({
      where: { id: progressId },
      data: {
        status,
        completedAt: new Date(),
        ...updateData,
      },
    });
  }

  private getNextStep(
    roleId: string,
    currentSequenceNumber: number,
  ): Promise<WorkflowStep | null> {
    return this.prisma.workflowStep.findFirst({
      where: {
        roleId,
        sequenceNumber: { gt: currentSequenceNumber },
      },
      orderBy: { sequenceNumber: 'asc' },
    });
  }

  /**
   * 🔧 FIX: Update workflow execution state after step completion
   * This method synchronizes the workflow execution state with step progress
   */
  private async updateWorkflowExecutionState(
    taskId: number,
    _roleId: string,
    completedStepId: string,
    nextStep: WorkflowStep | null,
    stepDuration: number,
  ): Promise<void> {
    try {
      // Get current workflow execution
      const execution = await this.prisma.workflowExecution.findFirst({
        where: { taskId },
        include: { task: true },
      });

      if (!execution) {
        this.logger.warn(`No workflow execution found for task ${taskId}`);
        return;
      }

      // Get total completed steps for this task
      const completedStepsCount = await this.prisma.workflowStepProgress.count({
        where: {
          taskId: taskId.toString(),
          status: 'COMPLETED',
        },
      });

      // Calculate progress percentage (assuming ~15 total steps)
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

      // Safely handle JSON spread for executionState
      const currentExecutionState =
        (execution.executionState as Record<string, any>) || {};
      const currentExecutionContext =
        (execution.executionContext as Record<string, any>) || {};

      // Update workflow execution state
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

      // Update task status if needed
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
