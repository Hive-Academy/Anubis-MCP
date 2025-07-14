import { Injectable, Logger } from '@nestjs/common';
import {
  WorkflowStepProgress,
  StepProgressStatus,
} from '../../../../../generated/prisma';
import { PrismaService } from '../../../../prisma/prisma.service';
import { IStepProgressRepository } from '../interfaces/step-progress.repository.interface';
import {
  StepProgressWithRelations,
  StepProgressIncludeOptions,
  StepProgressFindManyOptions,
  CreateStepProgressData,
  UpdateStepProgressData,
  StepProgressSummary,
  ExecutionProgressSummary,
  PrismaTransaction,
  McpExecutionData,
  StepCompletionData,
  StepFailureData,
} from '../types/step-progress.types';

@Injectable()
export class StepProgressRepository implements IStepProgressRepository {
  private readonly logger = new Logger(StepProgressRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  // ===================================================================
  // BASIC CRUD OPERATIONS
  // ===================================================================

  async findById(
    id: string,
    include?: StepProgressIncludeOptions,
  ): Promise<StepProgressWithRelations | null> {
    try {
      return await this.prisma.workflowStepProgress.findUnique({
        where: { id },
        include: this.buildInclude(include),
      });
    } catch (error) {
      this.logger.error(`Failed to find step progress by ID ${id}:`, error);
      throw error;
    }
  }

  async findByStepId(
    stepId: string,
    include?: StepProgressIncludeOptions,
  ): Promise<StepProgressWithRelations[]> {
    try {
      return await this.prisma.workflowStepProgress.findMany({
        where: { stepId },
        include: this.buildInclude(include),
        orderBy: { startedAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(
        `Failed to find step progress by step ID ${stepId}:`,
        error,
      );
      throw error;
    }
  }

  async findByExecutionId(
    executionId: string,
    include?: StepProgressIncludeOptions,
  ): Promise<StepProgressWithRelations[]> {
    try {
      return await this.prisma.workflowStepProgress.findMany({
        where: { executionId },
        include: this.buildInclude(include),
        orderBy: { startedAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(
        `Failed to find step progress by execution ID ${executionId}:`,
        error,
      );
      throw error;
    }
  }

  async findByRoleId(
    roleId: string,
    include?: StepProgressIncludeOptions,
  ): Promise<StepProgressWithRelations[]> {
    try {
      return await this.prisma.workflowStepProgress.findMany({
        where: { roleId },
        include: this.buildInclude(include),
        orderBy: { startedAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(
        `Failed to find step progress by role ID ${roleId}:`,
        error,
      );
      throw error;
    }
  }

  async create(
    data: CreateStepProgressData,
    tx?: PrismaTransaction,
  ): Promise<StepProgressWithRelations> {
    try {
      const client = tx || this.prisma;
      return await client.workflowStepProgress.create({
        data: {
          stepId: data.stepId,
          executionId: data.executionId,
          taskId: data.taskId,
          roleId: data.roleId,
          status: data.status,
          startedAt: data.startedAt,
          completedAt: data.completedAt,
          failedAt: data.failedAt,
          duration: data.duration,
          executionData: data.executionData
            ? JSON.parse(JSON.stringify(data.executionData))
            : undefined,
          validationResults: data.validationResults
            ? JSON.parse(JSON.stringify(data.validationResults))
            : undefined,
          errorDetails: data.errorDetails
            ? JSON.parse(JSON.stringify(data.errorDetails))
            : undefined,
          result: data.result,
          reportData: data.reportData
            ? JSON.parse(JSON.stringify(data.reportData))
            : undefined,
        },
        include: this.buildInclude(),
      });
    } catch (error) {
      this.logger.error('Failed to create step progress:', error);
      throw error;
    }
  }

  async update(
    id: string,
    data: UpdateStepProgressData,
    tx?: PrismaTransaction,
  ): Promise<StepProgressWithRelations> {
    try {
      const client = tx || this.prisma;
      const updateData: Partial<UpdateStepProgressData> = {};

      // Only include fields that are provided
      if (data.stepId !== undefined) updateData.stepId = data.stepId;
      if (data.executionId !== undefined)
        updateData.executionId = data.executionId;
      if (data.taskId !== undefined) updateData.taskId = data.taskId;
      if (data.roleId !== undefined) updateData.roleId = data.roleId;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.startedAt !== undefined) updateData.startedAt = data.startedAt;
      if (data.completedAt !== undefined)
        updateData.completedAt = data.completedAt;
      if (data.failedAt !== undefined) updateData.failedAt = data.failedAt;
      if (data.duration !== undefined) updateData.duration = data.duration;
      if (data.executionData !== undefined)
        updateData.executionData = JSON.parse(
          JSON.stringify(data.executionData),
        );
      if (data.validationResults !== undefined)
        updateData.validationResults = JSON.parse(
          JSON.stringify(data.validationResults),
        );
      if (data.errorDetails !== undefined)
        updateData.errorDetails = JSON.parse(JSON.stringify(data.errorDetails));
      if (data.result !== undefined) updateData.result = data.result;
      if (data.reportData !== undefined)
        updateData.reportData = JSON.parse(JSON.stringify(data.reportData));

      return await client.workflowStepProgress.update({
        where: { id },
        data: updateData,
        include: this.buildInclude(),
      });
    } catch (error) {
      this.logger.error(`Failed to update step progress ${id}:`, error);
      throw error;
    }
  }

  async delete(
    id: string,
    tx?: PrismaTransaction,
  ): Promise<WorkflowStepProgress> {
    try {
      const client = tx || this.prisma;
      return await client.workflowStepProgress.delete({
        where: { id },
      });
    } catch (error) {
      this.logger.error(`Failed to delete step progress ${id}:`, error);
      throw error;
    }
  }

  // ===================================================================
  // QUERY OPERATIONS
  // ===================================================================

  async findMany(
    options?: StepProgressFindManyOptions,
  ): Promise<StepProgressWithRelations[]> {
    try {
      return await this.prisma.workflowStepProgress.findMany({
        where: options?.where,
        orderBy: options?.orderBy || { startedAt: 'desc' },
        take: options?.take,
        skip: options?.skip,
        include: this.buildInclude(options?.include),
      });
    } catch (error) {
      this.logger.error('Failed to find many step progress records:', error);
      throw error;
    }
  }

  async findLatestByStep(
    stepId: string,
    include?: StepProgressIncludeOptions,
  ): Promise<StepProgressWithRelations | null> {
    try {
      return await this.prisma.workflowStepProgress.findFirst({
        where: { stepId },
        include: this.buildInclude(include),
        orderBy: { startedAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(
        `Failed to find latest step progress for step ${stepId}:`,
        error,
      );
      throw error;
    }
  }

  async findInProgressByExecution(
    executionId: string,
    include?: StepProgressIncludeOptions,
  ): Promise<StepProgressWithRelations[]> {
    try {
      return await this.prisma.workflowStepProgress.findMany({
        where: {
          executionId,
          status: 'IN_PROGRESS',
        },
        include: this.buildInclude(include),
        orderBy: { startedAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(
        `Failed to find in-progress steps for execution ${executionId}:`,
        error,
      );
      throw error;
    }
  }

  async findCompletedByRole(
    roleId: string,
    include?: StepProgressIncludeOptions,
  ): Promise<StepProgressWithRelations[]> {
    try {
      return await this.prisma.workflowStepProgress.findMany({
        where: {
          roleId,
          status: 'COMPLETED',
        },
        include: this.buildInclude(include),
        orderBy: { completedAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(
        `Failed to find completed steps for role ${roleId}:`,
        error,
      );
      throw error;
    }
  }

  async findFailedByExecution(
    executionId: string,
    include?: StepProgressIncludeOptions,
  ): Promise<StepProgressWithRelations[]> {
    try {
      return await this.prisma.workflowStepProgress.findMany({
        where: {
          executionId,
          status: 'FAILED',
        },
        include: this.buildInclude(include),
        orderBy: { failedAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(
        `Failed to find failed steps for execution ${executionId}:`,
        error,
      );
      throw error;
    }
  }

  // ===================================================================
  // STEP PROGRESS MANAGEMENT
  // ===================================================================

  async updateStepStatus(
    stepId: string,
    status: StepProgressStatus,
    tx?: PrismaTransaction,
  ): Promise<StepProgressWithRelations> {
    try {
      const client = tx || this.prisma;
      const existing = await client.workflowStepProgress.findFirst({
        where: { stepId },
        orderBy: { startedAt: 'desc' },
      });

      if (!existing) {
        throw new Error(`No progress record found for step: ${stepId}`);
      }

      const updateData: any = { status };

      // Set appropriate timestamp based on status
      if (status === 'COMPLETED') {
        updateData.completedAt = new Date();
      } else if (status === 'FAILED') {
        updateData.failedAt = new Date();
      }

      return await client.workflowStepProgress.update({
        where: { id: existing.id },
        data: updateData,
        include: this.buildInclude(),
      });
    } catch (error) {
      this.logger.error(`Failed to update step status for ${stepId}:`, error);
      throw error;
    }
  }

  async createStepProgress(
    data: CreateStepProgressData,
    tx?: PrismaTransaction,
  ): Promise<StepProgressWithRelations> {
    return this.create(data, tx);
  }

  async startStep(
    stepId: string,
    executionId: string,
    roleId: string,
    taskId?: string,
    tx?: PrismaTransaction,
  ): Promise<StepProgressWithRelations> {
    try {
      const createData: CreateStepProgressData = {
        stepId,
        executionId,
        roleId,
        taskId,
        status: 'IN_PROGRESS',
        startedAt: new Date(),
        executionData: {
          executionType: 'MCP_ONLY',
          phase: 'GUIDANCE_PREPARED',
        },
      };

      return await this.create(createData, tx);
    } catch (error) {
      this.logger.error(`Failed to start step ${stepId}:`, error);
      throw error;
    }
  }

  async updateProgress(
    stepId: string,
    executionData: McpExecutionData,
    tx?: PrismaTransaction,
  ): Promise<StepProgressWithRelations> {
    try {
      const client = tx || this.prisma;
      const existing = await client.workflowStepProgress.findFirst({
        where: { stepId },
        orderBy: { startedAt: 'desc' },
      });

      if (!existing) {
        throw new Error(`No progress record found for step: ${stepId}`);
      }

      return await client.workflowStepProgress.update({
        where: { id: existing.id },
        data: {
          executionData: JSON.parse(JSON.stringify(executionData)),
        },
        include: this.buildInclude(),
      });
    } catch (error) {
      this.logger.error(`Failed to update progress for step ${stepId}:`, error);
      throw error;
    }
  }

  async completeStep(
    stepId: string,
    completionData: StepCompletionData,
    tx?: PrismaTransaction,
  ): Promise<StepProgressWithRelations> {
    try {
      const client = tx || this.prisma;
      const existing = await client.workflowStepProgress.findFirst({
        where: { stepId },
        orderBy: { startedAt: 'desc' },
      });

      if (!existing) {
        throw new Error(`No progress record found for step: ${stepId}`);
      }

      const completedAt = new Date();
      const duration =
        completionData.duration ||
        (existing.startedAt
          ? completedAt.getTime() - existing.startedAt.getTime()
          : 0);

      return await client.workflowStepProgress.update({
        where: { id: existing.id },
        data: {
          status: 'COMPLETED',
          completedAt,
          duration,
          result: completionData.result,
          executionData: JSON.parse(
            JSON.stringify({
              executionType: 'MCP_ONLY',
              phase: 'COMPLETED',
              mcpResults: completionData.mcpResults,
              totalDuration: duration,
            }),
          ),
          validationResults: completionData.validationResults
            ? JSON.parse(JSON.stringify(completionData.validationResults))
            : undefined,
        },
        include: this.buildInclude(),
      });
    } catch (error) {
      this.logger.error(`Failed to complete step ${stepId}:`, error);
      throw error;
    }
  }

  async failStep(
    stepId: string,
    failureData: StepFailureData,
    tx?: PrismaTransaction,
  ): Promise<StepProgressWithRelations> {
    try {
      const client = tx || this.prisma;
      const existing = await client.workflowStepProgress.findFirst({
        where: { stepId },
        orderBy: { startedAt: 'desc' },
      });

      if (!existing) {
        throw new Error(`No progress record found for step: ${stepId}`);
      }

      return await client.workflowStepProgress.update({
        where: { id: existing.id },
        data: {
          status: 'FAILED',
          failedAt: new Date(),
          result: 'FAILURE',
          errorDetails: JSON.parse(
            JSON.stringify({
              errors: failureData.errors,
              mcpResults: failureData.mcpResults,
              errorDetails: failureData.errorDetails,
              timestamp: new Date().toISOString(),
            }),
          ),
        },
        include: this.buildInclude(),
      });
    } catch (error) {
      this.logger.error(`Failed to fail step ${stepId}:`, error);
      throw error;
    }
  }

  // ===================================================================
  // PROGRESS SUMMARY & ANALYTICS
  // ===================================================================

  async getProgressSummary(roleId: string): Promise<StepProgressSummary> {
    try {
      const progressRecords = await this.prisma.workflowStepProgress.findMany({
        where: { roleId },
      });

      const totalSteps = progressRecords.length;
      const completedSteps = progressRecords.filter(
        (p) => p.status === 'COMPLETED',
      ).length;
      const failedSteps = progressRecords.filter(
        (p) => p.status === 'FAILED',
      ).length;
      const inProgressSteps = progressRecords.filter(
        (p) => p.status === 'IN_PROGRESS',
      ).length;

      const completedRecords = progressRecords.filter(
        (p) => p.status === 'COMPLETED' && p.duration,
      );
      const averageExecutionTime =
        completedRecords.length > 0
          ? completedRecords.reduce((sum, p) => sum + (p.duration || 0), 0) /
            completedRecords.length
          : 0;

      const successRate =
        totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

      return {
        roleId,
        totalSteps,
        completedSteps,
        failedSteps,
        inProgressSteps,
        averageExecutionTime,
        successRate,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get progress summary for role ${roleId}:`,
        error,
      );
      throw error;
    }
  }

  async getExecutionProgressSummary(
    executionId: string,
  ): Promise<ExecutionProgressSummary> {
    try {
      const progressRecords = await this.prisma.workflowStepProgress.findMany({
        where: { executionId },
        include: this.buildInclude(),
        orderBy: { startedAt: 'desc' },
      });

      const totalSteps = progressRecords.length;
      const completedSteps = progressRecords.filter(
        (p) => p.status === 'COMPLETED',
      ).length;
      const currentStep =
        progressRecords.find((p) => p.status === 'IN_PROGRESS') || undefined;
      const recentProgress = progressRecords.slice(0, 5);

      return {
        executionId,
        totalSteps,
        completedSteps,
        currentStep,
        recentProgress,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get execution progress summary for ${executionId}:`,
        error,
      );
      throw error;
    }
  }

  async findByTaskId(
    taskId: string,
    include?: StepProgressIncludeOptions,
  ): Promise<StepProgressWithRelations[]> {
    try {
      return await this.prisma.workflowStepProgress.findMany({
        where: { taskId },
        include: this.buildInclude(include),
        orderBy: { startedAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(
        `Failed to find step progress by task ID ${taskId}:`,
        error,
      );
      throw error;
    }
  }

  async getCurrentStep(
    executionId: string,
    include?: StepProgressIncludeOptions,
  ): Promise<StepProgressWithRelations | null> {
    try {
      return await this.prisma.workflowStepProgress.findFirst({
        where: {
          executionId,
          status: 'IN_PROGRESS',
        },
        include: this.buildInclude(include),
        orderBy: { startedAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(
        `Failed to get current step for execution ${executionId}:`,
        error,
      );
      throw error;
    }
  }

  async getRecentProgress(
    executionId: string,
    limit: number = 10,
    include?: StepProgressIncludeOptions,
  ): Promise<StepProgressWithRelations[]> {
    try {
      return await this.prisma.workflowStepProgress.findMany({
        where: { executionId },
        include: this.buildInclude(include),
        orderBy: { startedAt: 'desc' },
        take: limit,
      });
    } catch (error) {
      this.logger.error(
        `Failed to get recent progress for execution ${executionId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Find incomplete step progress for a role
   */
  async findIncompleteForRole(
    roleId: string,
  ): Promise<StepProgressWithRelations | null> {
    try {
      return await this.prisma.workflowStepProgress.findFirst({
        where: {
          roleId,
          status: {
            in: ['NOT_STARTED', 'IN_PROGRESS'],
          },
        },
        include: this.buildInclude(),
        orderBy: {
          updatedAt: 'desc',
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to find incomplete step progress for role ${roleId}:`,
        error,
      );
      throw error;
    }
  }

  // ===================================================================
  // TRANSACTION SUPPORT
  // ===================================================================

  async withTransaction<T>(
    fn: (tx: PrismaTransaction) => Promise<T>,
  ): Promise<T> {
    try {
      return await this.prisma.$transaction(fn);
    } catch (error) {
      this.logger.error('Transaction failed:', error);
      throw error;
    }
  }

  // ===================================================================
  // PRIVATE HELPER METHODS
  // ===================================================================

  private buildInclude(include?: StepProgressIncludeOptions): any {
    if (!include) {
      return {
        step: {
          include: {
            role: true,
          },
        },
        role: true,
        execution: true,
        task: true,
      };
    }

    const result: any = {};

    if (include.step) {
      if (typeof include.step === 'boolean') {
        result.step = {
          include: {
            role: true,
          },
        };
      } else {
        result.step = {
          include: include.step.include || { role: true },
        };
      }
    }

    if (include.role) {
      result.role = true;
    }

    if (include.execution) {
      result.execution = true;
    }

    if (include.task) {
      result.task = true;
    }

    return result;
  }
}
