import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { WorkflowStep } from 'generated/prisma';
import { StepExecutionContext } from './workflow-guidance.service';
import { StepConditionEvaluator } from './step-condition-evaluator.service';
import { StepActionExecutor } from './step-action-executor.service';

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

  constructor(
    private prisma: PrismaService,
    private conditionEvaluator: StepConditionEvaluator,
    private actionExecutor: StepActionExecutor,
  ) {}

  /**
   * Execute a workflow step with validation and progress tracking
   */
  async executeWorkflowStep(
    context: StepExecutionContext,
    executionData?: any,
  ): Promise<StepExecutionResult> {
    const startTime = Date.now();

    try {
      const { taskId, roleId, stepId } = context;

      if (!stepId) {
        throw new Error('Step ID is required for step execution');
      }

      // Get the step details
      const step = await this.getStepWithDetails(stepId);
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
        stepId,
        executionData,
      );

      try {
        // Execute step actions
        const actionResults = await this.actionExecutor.executeStepActions(
          step.actions,
          context,
        );

        // Update progress record with completion
        await this.updateProgressRecord(progressRecord.id, 'COMPLETED', {
          validationResults: actionResults,
          duration: Date.now() - startTime,
        });

        // Get next step in sequence
        const nextStep = await this.getNextStep(
          step.roleId,
          step.sequenceNumber,
        );

        return {
          success: true,
          results: actionResults,
          nextStep: nextStep || undefined,
          duration: Date.now() - startTime,
        };
      } catch (error) {
        // Update progress record with failure
        await this.updateProgressRecord(progressRecord.id, 'FAILED', {
          errorDetails: { error: error.message, stack: error.stack },
          duration: Date.now() - startTime,
        });

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
}
