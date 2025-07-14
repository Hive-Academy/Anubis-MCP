import { Injectable, Logger } from '@nestjs/common';
import { Prisma, WorkflowExecution } from '../../../../../generated/prisma';
import { PrismaService } from '../../../../prisma/prisma.service';
import { IWorkflowExecutionRepository } from '../interfaces/workflow-execution.repository.interface';
import {
  CreateWorkflowExecutionData,
  PrismaTransaction,
  UpdateWorkflowExecutionData,
  WorkflowExecutionFindManyOptions,
  WorkflowExecutionIncludeOptions,
  WorkflowExecutionWithRelations,
} from '../types/workflow-execution.types';

@Injectable()
export class WorkflowExecutionRepository
  implements IWorkflowExecutionRepository
{
  private readonly logger = new Logger(WorkflowExecutionRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  // Basic CRUD Operations
  async findById(
    id: string,
    include?: WorkflowExecutionIncludeOptions,
  ): Promise<WorkflowExecutionWithRelations | null> {
    try {
      return await this.prisma.workflowExecution.findUnique({
        where: { id },
        include: this.buildInclude(include),
      });
    } catch (error) {
      this.logger.error(`Failed to find execution by ID ${id}:`, error);
      throw error;
    }
  }

  async create(
    data: CreateWorkflowExecutionData,
  ): Promise<WorkflowExecutionWithRelations> {
    try {
      return await this.prisma.workflowExecution.create({
        data: {
          taskId: data.taskId,
          currentRoleId: data.currentRoleId,
          currentStepId: data.currentStepId,
          executionState: data.executionState || {},
          executionMode: data.executionMode || 'GUIDED',
          executionContext: data.executionContext || {},
          stepsCompleted: data.stepsCompleted || 0,
          totalSteps: data.totalSteps || 0,
          progressPercentage: data.progressPercentage || 0,
          maxRecoveryAttempts: data.maxRecoveryAttempts || 3,
          recoveryAttempts: data.recoveryAttempts || 0,
        },
        include: this.buildInclude(),
      });
    } catch (error) {
      this.logger.error('Failed to create execution:', error);
      throw error;
    }
  }

  async update(
    id: string,
    data: UpdateWorkflowExecutionData,
  ): Promise<WorkflowExecutionWithRelations> {
    try {
      return await this.prisma.workflowExecution.update({
        where: { id },
        data,
        include: this.buildInclude(),
      });
    } catch (error) {
      this.logger.error(`Failed to update execution ${id}:`, error);
      throw error;
    }
  }

  async delete(id: string): Promise<WorkflowExecution> {
    try {
      return await this.prisma.workflowExecution.delete({
        where: { id },
      });
    } catch (error) {
      this.logger.error(`Failed to delete execution ${id}:`, error);
      throw error;
    }
  }

  // Query Operations
  async findMany(
    options?: WorkflowExecutionFindManyOptions,
  ): Promise<WorkflowExecutionWithRelations[]> {
    try {
      return await this.prisma.workflowExecution.findMany({
        where: options?.where,
        orderBy: options?.orderBy || { createdAt: 'desc' },
        take: options?.take,
        skip: options?.skip,
        include: this.buildInclude(options?.include),
      });
    } catch (error) {
      this.logger.error('Failed to find many executions:', error);
      throw error;
    }
  }

  async findByTaskId(
    taskId: number,
    include?: WorkflowExecutionIncludeOptions,
  ): Promise<WorkflowExecutionWithRelations | null> {
    try {
      return await this.prisma.workflowExecution.findFirst({
        where: { taskId },
        include: this.buildInclude(include),
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(
        `Failed to find execution by task ID ${taskId}:`,
        error,
      );
      throw error;
    }
  }

  async findActiveExecutions(
    include?: WorkflowExecutionIncludeOptions,
  ): Promise<WorkflowExecutionWithRelations[]> {
    try {
      return await this.prisma.workflowExecution.findMany({
        where: {
          completedAt: null,
        },
        include: this.buildInclude(include),
        orderBy: { updatedAt: 'desc' },
      });
    } catch (error) {
      this.logger.error('Failed to find active executions:', error);
      throw error;
    }
  }

  async findByExecutionMode(
    mode: string,
    include?: WorkflowExecutionIncludeOptions,
  ): Promise<WorkflowExecutionWithRelations[]> {
    try {
      return await this.prisma.workflowExecution.findMany({
        where: { executionMode: mode as any },
        include: this.buildInclude(include),
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(`Failed to find executions by mode ${mode}:`, error);
      throw error;
    }
  }

  async count(where?: any): Promise<number> {
    try {
      return await this.prisma.workflowExecution.count({ where });
    } catch (error) {
      this.logger.error('Failed to count executions:', error);
      throw error;
    }
  }

  // Transaction Support
  async createWithTransaction(
    data: CreateWorkflowExecutionData,
    tx?: PrismaTransaction,
  ): Promise<WorkflowExecutionWithRelations> {
    const prismaClient = tx || this.prisma;

    try {
      return await prismaClient.workflowExecution.create({
        data: {
          taskId: data.taskId,
          currentRoleId: data.currentRoleId,
          currentStepId: data.currentStepId,
          executionState: data.executionState || {},
          executionMode: data.executionMode || 'GUIDED',
          executionContext: data.executionContext || {},
          stepsCompleted: data.stepsCompleted || 0,
          totalSteps: data.totalSteps || 0,
          progressPercentage: data.progressPercentage || 0,
          maxRecoveryAttempts: data.maxRecoveryAttempts || 3,
          recoveryAttempts: data.recoveryAttempts || 0,
        },
        include: this.buildInclude(),
      });
    } catch (error) {
      this.logger.error('Failed to create execution with transaction:', error);
      throw error;
    }
  }

  async updateWithTransaction(
    id: string,
    data: UpdateWorkflowExecutionData,
    tx?: PrismaTransaction,
  ): Promise<WorkflowExecutionWithRelations> {
    const prismaClient = tx || this.prisma;

    try {
      return await prismaClient.workflowExecution.update({
        where: { id },
        data,
        include: this.buildInclude(),
      });
    } catch (error) {
      this.logger.error(
        `Failed to update execution ${id} with transaction:`,
        error,
      );
      throw error;
    }
  }

  // Additional methods used by services (not in interface but needed)
  async updateProgress(
    id: string,
    progressData: {
      stepsCompleted?: number;
      totalSteps?: number;
      progressPercentage?: number;
      currentStepId?: string;
      currentRoleId?: string;
    },
  ): Promise<WorkflowExecutionWithRelations> {
    try {
      const updateData: any = {
        ...progressData,
        updatedAt: new Date(),
      };

      // Calculate progress percentage if not provided
      if (
        progressData.stepsCompleted !== undefined &&
        progressData.totalSteps !== undefined &&
        progressData.progressPercentage === undefined
      ) {
        updateData.progressPercentage =
          progressData.totalSteps > 0
            ? (progressData.stepsCompleted / progressData.totalSteps) * 100
            : 0;
      }

      return await this.prisma.workflowExecution.update({
        where: { id },
        data: updateData,
        include: this.buildInclude(),
      });
    } catch (error) {
      this.logger.error(`Failed to update execution progress ${id}:`, error);
      throw error;
    }
  }

  async handleExecutionError(
    executionId: string,
    error: any,
  ): Promise<{ recoveryAttempts: number; maxRetries: number }> {
    try {
      const execution = await this.prisma.workflowExecution.findUniqueOrThrow({
        where: { id: executionId },
        select: {
          executionState: true,
          recoveryAttempts: true,
          maxRecoveryAttempts: true,
        },
      });

      const currentState =
        (execution.executionState as Record<string, any>) || {};

      const newRecoveryAttempts = (execution.recoveryAttempts || 0) + 1;
      const maxRetries = execution.maxRecoveryAttempts || 3;

      const newState = {
        ...currentState,
        phase: 'failed',
        lastFailure: {
          timestamp: new Date().toISOString(),
          error: error.message || 'Unknown error',
          stack: error.stack,
          code: error.code,
          details: error.details || error,
        },
      };

      await this.prisma.workflowExecution.update({
        where: { id: executionId },
        data: {
          executionState: newState,
          recoveryAttempts: newRecoveryAttempts,
          lastError: {
            message: error.message || 'Unknown error',
            timestamp: new Date().toISOString(),
            stack: error.stack,
            code: error.code,
            details: error.details || error,
          },
        },
      });

      return {
        recoveryAttempts: newRecoveryAttempts,
        maxRetries,
      };
    } catch (updateError) {
      this.logger.error(
        `Failed to handle execution error for ${executionId}:`,
        updateError,
      );
      throw updateError;
    }
  }

  // Private helper methods
  private buildInclude(
    include?: WorkflowExecutionIncludeOptions,
  ): Prisma.WorkflowExecutionInclude | undefined {
    if (!include) {
      // Default include for basic relations
      return {
        task: true,
        currentRole: true,
        currentStep: true,
      };
    }

    const result: Prisma.WorkflowExecutionInclude = {};

    if (include.task) {
      result.task = true;
    }

    if (include.currentRole) {
      result.currentRole = true;
    }

    if (include.currentStep) {
      result.currentStep = true;
    }

    if (include.stepProgress) {
      if (typeof include.stepProgress === 'boolean') {
        result.stepProgress = {
          include: {
            step: {
              include: {
                role: true,
              },
            },
          },
        };
      } else {
        result.stepProgress = {
          include: {
            step: {
              include: {
                role: true,
              },
            },
          },
        };
      }
    }

    return Object.keys(result).length > 0 ? result : undefined;
  }
}
