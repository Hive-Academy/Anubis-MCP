import { Injectable, Logger } from '@nestjs/common';
import {
  WorkflowExecution,
  ExecutionPhase,
  ExecutionMode,
  Prisma,
} from '../../../../../generated/prisma';
import { PrismaService } from '../../../../prisma/prisma.service';
import { IWorkflowExecutionRepository } from '../interfaces/workflow-execution.repository.interface';
import {
  WorkflowExecutionWithRelations,
  WorkflowExecutionIncludeOptions,
  WorkflowExecutionFindManyOptions,
  CreateWorkflowExecutionData,
  UpdateWorkflowExecutionData,
  ExecutionStatistics,
  ExecutionProgressSummary,
  PrismaTransaction,
} from '../types/workflow-execution.types';

@Injectable()
export class WorkflowExecutionRepository
  implements IWorkflowExecutionRepository
{
  private readonly logger = new Logger(WorkflowExecutionRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  // ===================================================================
  // BASIC CRUD OPERATIONS
  // ===================================================================

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
        select: options?.select,
      });
    } catch (error) {
      this.logger.error('Failed to find many executions:', error);
      throw error;
    }
  }

  async create(data: CreateWorkflowExecutionData): Promise<WorkflowExecution> {
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
      });
    } catch (error) {
      this.logger.error('Failed to create execution:', error);
      throw error;
    }
  }

  async update(
    id: string,
    data: UpdateWorkflowExecutionData,
  ): Promise<WorkflowExecution> {
    try {
      return await this.prisma.workflowExecution.update({
        where: { id },
        data,
      });
    } catch (error) {
      this.logger.error(`Failed to update execution ${id}:`, error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.workflowExecution.delete({
        where: { id },
      });
    } catch (error) {
      this.logger.error(`Failed to delete execution ${id}:`, error);
      throw error;
    }
  }

  async count(options?: WorkflowExecutionFindManyOptions): Promise<number> {
    try {
      return await this.prisma.workflowExecution.count({
        where: options?.where,
      });
    } catch (error) {
      this.logger.error('Failed to count executions:', error);
      throw error;
    }
  }

  // ===================================================================
  // EXECUTION QUERY OPERATIONS
  // ===================================================================

  async findByTaskId(
    taskId: number,
    include?: WorkflowExecutionIncludeOptions,
  ): Promise<WorkflowExecutionWithRelations[]> {
    try {
      return await this.prisma.workflowExecution.findMany({
        where: { taskId },
        include: this.buildInclude(include),
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(
        `Failed to find executions by task ID ${taskId}:`,
        error,
      );
      throw error;
    }
  }

  async findLatestByTaskId(
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
        `Failed to find latest execution by task ID ${taskId}:`,
        error,
      );
      throw error;
    }
  }

  async findByCurrentRole(
    roleId: string,
    include?: WorkflowExecutionIncludeOptions,
  ): Promise<WorkflowExecutionWithRelations[]> {
    try {
      return await this.prisma.workflowExecution.findMany({
        where: { currentRoleId: roleId },
        include: this.buildInclude(include),
        orderBy: { updatedAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(
        `Failed to find executions by current role ${roleId}:`,
        error,
      );
      throw error;
    }
  }

  async findByCurrentStep(
    stepId: string,
    include?: WorkflowExecutionIncludeOptions,
  ): Promise<WorkflowExecutionWithRelations[]> {
    try {
      return await this.prisma.workflowExecution.findMany({
        where: { currentStepId: stepId },
        include: this.buildInclude(include),
        orderBy: { updatedAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(
        `Failed to find executions by current step ${stepId}:`,
        error,
      );
      throw error;
    }
  }

  async findByPhase(
    phase: ExecutionPhase,
    include?: WorkflowExecutionIncludeOptions,
  ): Promise<WorkflowExecutionWithRelations[]> {
    try {
      return await this.prisma.workflowExecution.findMany({
        where: {
          executionState: {
            path: ['phase'],
            equals: phase,
          },
        },
        include: this.buildInclude(include),
        orderBy: { updatedAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(`Failed to find executions by phase ${phase}:`, error);
      throw error;
    }
  }

  async findByExecutionMode(
    mode: ExecutionMode,
    include?: WorkflowExecutionIncludeOptions,
  ): Promise<WorkflowExecutionWithRelations[]> {
    try {
      return await this.prisma.workflowExecution.findMany({
        where: { executionMode: mode },
        include: this.buildInclude(include),
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(`Failed to find executions by mode ${mode}:`, error);
      throw error;
    }
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
    include?: WorkflowExecutionIncludeOptions,
  ): Promise<WorkflowExecutionWithRelations[]> {
    try {
      return await this.prisma.workflowExecution.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: this.buildInclude(include),
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(`Failed to find executions by date range:`, error);
      throw error;
    }
  }

  // ===================================================================
  // EXECUTION STATE MANAGEMENT
  // ===================================================================

  async findActiveExecutions(
    include?: WorkflowExecutionIncludeOptions,
  ): Promise<WorkflowExecutionWithRelations[]> {
    try {
      return await this.prisma.workflowExecution.findMany({
        where: {
          AND: [
            { completedAt: null },
            {
              OR: [
                {
                  executionState: {
                    path: ['phase'],
                    in: ['initialized', 'in-progress'],
                  },
                },
                {
                  executionState: {
                    path: ['phase'],
                    equals: null,
                  },
                },
              ],
            },
          ],
        },
        include: this.buildInclude(include),
        orderBy: { updatedAt: 'desc' },
      });
    } catch (error) {
      this.logger.error('Failed to find active executions:', error);
      throw error;
    }
  }

  async findCompletedExecutions(
    include?: WorkflowExecutionIncludeOptions,
  ): Promise<WorkflowExecutionWithRelations[]> {
    try {
      return await this.prisma.workflowExecution.findMany({
        where: {
          OR: [
            { completedAt: { not: null } },
            {
              executionState: {
                path: ['phase'],
                equals: 'completed',
              },
            },
          ],
        },
        include: this.buildInclude(include),
        orderBy: { completedAt: 'desc' },
      });
    } catch (error) {
      this.logger.error('Failed to find completed executions:', error);
      throw error;
    }
  }

  async findFailedExecutions(
    include?: WorkflowExecutionIncludeOptions,
  ): Promise<WorkflowExecutionWithRelations[]> {
    try {
      return await this.prisma.workflowExecution.findMany({
        where: {
          OR: [
            {
              executionState: {
                path: ['phase'],
                equals: 'failed',
              },
            },
            {
              lastError: {
                not: null,
              },
            },
          ],
        },
        include: this.buildInclude(include),
        orderBy: { updatedAt: 'desc' },
      });
    } catch (error) {
      this.logger.error('Failed to find failed executions:', error);
      throw error;
    }
  }

  async findPausedExecutions(
    include?: WorkflowExecutionIncludeOptions,
  ): Promise<WorkflowExecutionWithRelations[]> {
    try {
      return await this.prisma.workflowExecution.findMany({
        where: {
          executionState: {
            path: ['phase'],
            equals: 'paused',
          },
        },
        include: this.buildInclude(include),
        orderBy: { updatedAt: 'desc' },
      });
    } catch (error) {
      this.logger.error('Failed to find paused executions:', error);
      throw error;
    }
  }

  async findStuckExecutions(
    thresholdHours: number = 24,
    include?: WorkflowExecutionIncludeOptions,
  ): Promise<WorkflowExecutionWithRelations[]> {
    try {
      const thresholdDate = new Date(
        Date.now() - thresholdHours * 60 * 60 * 1000,
      );

      return await this.prisma.workflowExecution.findMany({
        where: {
          AND: [
            { completedAt: null },
            {
              OR: [
                {
                  executionState: {
                    path: ['phase'],
                    equals: 'in-progress',
                  },
                },
                {
                  currentStepId: {
                    not: null,
                  },
                },
              ],
            },
            {
              updatedAt: {
                lt: thresholdDate,
              },
            },
          ],
        },
        include: this.buildInclude(include),
        orderBy: { updatedAt: 'asc' },
      });
    } catch (error) {
      this.logger.error('Failed to find stuck executions:', error);
      throw error;
    }
  }

  // ===================================================================
  // EXECUTION PROGRESS MANAGEMENT
  // ===================================================================

  async updateExecutionProgress(
    id: string,
    progressData: {
      stepsCompleted?: number;
      totalSteps?: number;
      progressPercentage?: number;
      currentStepId?: string;
      currentRoleId?: string;
    },
  ): Promise<WorkflowExecution> {
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
      });
    } catch (error) {
      this.logger.error(`Failed to update execution progress ${id}:`, error);
      throw error;
    }
  }

  async updateExecutionState(
    id: string,
    stateUpdates: Record<string, any>,
  ): Promise<WorkflowExecution> {
    try {
      const execution = await this.prisma.workflowExecution.findUniqueOrThrow({
        where: { id },
        select: { executionState: true },
      });

      const currentState =
        (execution.executionState as Record<string, any>) || {};
      const newState = { ...currentState, ...stateUpdates };

      return await this.prisma.workflowExecution.update({
        where: { id },
        data: {
          executionState: newState,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(`Failed to update execution state ${id}:`, error);
      throw error;
    }
  }

  async updateExecutionContext(
    id: string,
    contextUpdates: Record<string, any>,
  ): Promise<WorkflowExecution> {
    try {
      const execution = await this.prisma.workflowExecution.findUniqueOrThrow({
        where: { id },
        select: { executionContext: true },
      });

      const currentContext =
        (execution.executionContext as Record<string, any>) || {};
      const newContext = { ...currentContext, ...contextUpdates };

      return await this.prisma.workflowExecution.update({
        where: { id },
        data: {
          executionContext: newContext,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(`Failed to update execution context ${id}:`, error);
      throw error;
    }
  }

  async markExecutionCompleted(
    id: string,
    completionData?: {
      finalState?: Record<string, any>;
      completionNotes?: string;
    },
  ): Promise<WorkflowExecution> {
    try {
      const updateData: any = {
        completedAt: new Date(),
        progressPercentage: 100,
        updatedAt: new Date(),
      };

      if (completionData?.finalState) {
        const execution = await this.prisma.workflowExecution.findUniqueOrThrow(
          {
            where: { id },
            select: { executionState: true },
          },
        );

        const currentState =
          (execution.executionState as Record<string, any>) || {};
        updateData.executionState = {
          ...currentState,
          ...completionData.finalState,
          phase: 'completed',
        };
      } else {
        updateData.executionState = {
          phase: 'completed',
        };
      }

      return await this.prisma.workflowExecution.update({
        where: { id },
        data: updateData,
      });
    } catch (error) {
      this.logger.error(`Failed to mark execution completed ${id}:`, error);
      throw error;
    }
  }

  async markExecutionFailed(
    id: string,
    error: {
      message: string;
      stack?: string;
      code?: string;
      details?: Record<string, any>;
    },
  ): Promise<WorkflowExecution> {
    try {
      const execution = await this.prisma.workflowExecution.findUniqueOrThrow({
        where: { id },
        select: { executionState: true, recoveryAttempts: true },
      });

      const currentState =
        (execution.executionState as Record<string, any>) || {};
      const newState = {
        ...currentState,
        phase: 'failed',
        lastFailure: {
          timestamp: new Date().toISOString(),
          error: error.message,
          stack: error.stack,
          code: error.code,
          details: error.details,
        },
      };

      return await this.prisma.workflowExecution.update({
        where: { id },
        data: {
          executionState: newState,
          lastError: {
            message: error.message,
            timestamp: new Date().toISOString(),
            stack: error.stack,
            code: error.code,
            details: error.details,
          },
          recoveryAttempts: execution.recoveryAttempts + 1,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(`Failed to mark execution failed ${id}:`, error);
      throw error;
    }
  }

  async pauseExecution(
    id: string,
    reason?: string,
  ): Promise<WorkflowExecution> {
    try {
      const execution = await this.prisma.workflowExecution.findUniqueOrThrow({
        where: { id },
        select: { executionState: true },
      });

      const currentState =
        (execution.executionState as Record<string, any>) || {};
      const newState = {
        ...currentState,
        phase: 'paused',
        pausedAt: new Date().toISOString(),
        pauseReason: reason,
      };

      return await this.prisma.workflowExecution.update({
        where: { id },
        data: {
          executionState: newState,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(`Failed to pause execution ${id}:`, error);
      throw error;
    }
  }

  async resumeExecution(
    id: string,
    resumeNotes?: string,
  ): Promise<WorkflowExecution> {
    try {
      const execution = await this.prisma.workflowExecution.findUniqueOrThrow({
        where: { id },
        select: { executionState: true },
      });

      const currentState =
        (execution.executionState as Record<string, any>) || {};
      const newState = {
        ...currentState,
        phase: 'in-progress',
        resumedAt: new Date().toISOString(),
        resumeNotes,
        pausedAt: undefined,
        pauseReason: undefined,
      };

      return await this.prisma.workflowExecution.update({
        where: { id },
        data: {
          executionState: newState,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(`Failed to resume execution ${id}:`, error);
      throw error;
    }
  }

  // ===================================================================
  // EXECUTION STATISTICS & ANALYTICS
  // ===================================================================

  async getExecutionStatistics(id: string): Promise<ExecutionStatistics> {
    try {
      const execution = await this.prisma.workflowExecution.findUniqueOrThrow({
        where: { id },
        include: {
          stepProgress: {
            include: {
              step: true,
            },
          },
        },
      });

      const stepProgress = execution.stepProgress || [];
      const totalSteps = stepProgress.length;
      const completedSteps = stepProgress.filter(
        (p) => p.status === 'COMPLETED',
      ).length;
      const failedSteps = stepProgress.filter(
        (p) => p.status === 'FAILED',
      ).length;
      const inProgressSteps = stepProgress.filter(
        (p) => p.status === 'IN_PROGRESS',
      ).length;

      // Calculate execution duration
      const startTime = execution.createdAt;
      const endTime = execution.completedAt || new Date();
      const totalDuration = endTime.getTime() - startTime.getTime();

      // Calculate step durations
      const stepDurations = stepProgress
        .filter((p) => p.startedAt && p.completedAt)
        .map((p) => p.completedAt!.getTime() - p.startedAt!.getTime());

      const averageStepDuration =
        stepDurations.length > 0
          ? stepDurations.reduce((a, b) => a + b, 0) / stepDurations.length
          : 0;

      return {
        executionId: id,
        totalDuration,
        totalSteps,
        completedSteps,
        failedSteps,
        inProgressSteps,
        notStartedSteps:
          totalSteps - completedSteps - failedSteps - inProgressSteps,
        completionPercentage: execution.progressPercentage || 0,
        averageStepDuration,
        executionMode: execution.executionMode,
        recoveryAttempts: execution.recoveryAttempts,
        currentPhase: (execution.executionState as any)?.phase || 'unknown',
        startedAt: execution.createdAt,
        completedAt: execution.completedAt,
        lastUpdated: execution.updatedAt,
        errorCount: failedSteps,
        successRate: totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0,
        failureRate: totalSteps > 0 ? (failedSteps / totalSteps) * 100 : 0,
      };
    } catch (error) {
      this.logger.error(`Failed to get execution statistics for ${id}:`, error);
      throw error;
    }
  }

  async getExecutionProgressSummary(
    id: string,
  ): Promise<ExecutionProgressSummary> {
    try {
      const execution = await this.prisma.workflowExecution.findUniqueOrThrow({
        where: { id },
        include: {
          stepProgress: {
            include: {
              step: {
                include: {
                  role: true,
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      });

      const stepProgress = execution.stepProgress || [];
      const currentStep = stepProgress.find((p) => p.status === 'IN_PROGRESS');
      const lastCompletedStep = stepProgress
        .filter((p) => p.status === 'COMPLETED')
        .sort((a, b) => b.completedAt!.getTime() - a.completedAt!.getTime())[0];

      const nextSteps = stepProgress
        .filter((p) => p.status === 'NOT_STARTED')
        .slice(0, 3)
        .map((p) => ({
          stepId: p.stepId,
          stepName: p.step.name,
          roleName: p.step.role.name,
          estimatedDuration: p.step.estimatedDuration,
        }));

      const recentActivity = stepProgress
        .filter((p) => p.status === 'COMPLETED' || p.status === 'FAILED')
        .sort((a, b) => {
          const aTime = p.completedAt || p.failedAt || p.updatedAt;
          const bTime = p.completedAt || p.failedAt || p.updatedAt;
          return bTime.getTime() - aTime.getTime();
        })
        .slice(0, 5)
        .map((p) => ({
          stepId: p.stepId,
          stepName: p.step.name,
          status: p.status,
          completedAt: p.completedAt,
          duration:
            p.startedAt && p.completedAt
              ? p.completedAt.getTime() - p.startedAt.getTime()
              : undefined,
        }));

      return {
        executionId: id,
        currentPhase: (execution.executionState as any)?.phase || 'unknown',
        overallProgress: execution.progressPercentage || 0,
        stepsCompleted: execution.stepsCompleted || 0,
        totalSteps: execution.totalSteps || stepProgress.length,
        currentStep: currentStep
          ? {
              stepId: currentStep.stepId,
              stepName: currentStep.step.name,
              roleName: currentStep.step.role.name,
              startedAt: currentStep.startedAt,
              estimatedDuration: currentStep.step.estimatedDuration,
            }
          : undefined,
        lastCompletedStep: lastCompletedStep
          ? {
              stepId: lastCompletedStep.stepId,
              stepName: lastCompletedStep.step.name,
              completedAt: lastCompletedStep.completedAt!,
              duration:
                lastCompletedStep.startedAt && lastCompletedStep.completedAt
                  ? lastCompletedStep.completedAt.getTime() -
                    lastCompletedStep.startedAt.getTime()
                  : undefined,
            }
          : undefined,
        nextSteps,
        recentActivity,
        estimatedTimeRemaining: 0, // TODO: Calculate based on remaining steps and average duration
        blockers: [], // TODO: Identify current blockers
        warnings: [], // TODO: Identify potential issues
      };
    } catch (error) {
      this.logger.error(
        `Failed to get execution progress summary for ${id}:`,
        error,
      );
      throw error;
    }
  }

  async getGlobalExecutionStatistics(): Promise<{
    totalExecutions: number;
    activeExecutions: number;
    completedExecutions: number;
    failedExecutions: number;
    averageExecutionTime: number;
    successRate: number;
  }> {
    try {
      const [total, active, completed, failed] = await Promise.all([
        this.prisma.workflowExecution.count(),
        this.prisma.workflowExecution.count({
          where: {
            AND: [
              { completedAt: null },
              {
                executionState: {
                  path: ['phase'],
                  in: ['initialized', 'in-progress'],
                },
              },
            ],
          },
        }),
        this.prisma.workflowExecution.count({
          where: {
            completedAt: { not: null },
          },
        }),
        this.prisma.workflowExecution.count({
          where: {
            executionState: {
              path: ['phase'],
              equals: 'failed',
            },
          },
        }),
      ]);

      // Calculate average execution time for completed executions
      const completedExecutions = await this.prisma.workflowExecution.findMany({
        where: {
          completedAt: { not: null },
        },
        select: {
          createdAt: true,
          completedAt: true,
        },
      });

      const executionTimes = completedExecutions
        .filter((e) => e.completedAt)
        .map((e) => e.completedAt!.getTime() - e.createdAt.getTime());

      const averageExecutionTime =
        executionTimes.length > 0
          ? executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length
          : 0;

      const successRate = total > 0 ? (completed / total) * 100 : 0;

      return {
        totalExecutions: total,
        activeExecutions: active,
        completedExecutions: completed,
        failedExecutions: failed,
        averageExecutionTime,
        successRate,
      };
    } catch (error) {
      this.logger.error('Failed to get global execution statistics:', error);
      throw error;
    }
  }

  // ===================================================================
  // EXECUTION RECOVERY & CLEANUP
  // ===================================================================

  async findExecutionsNeedingRecovery(
    maxRecoveryAttempts: number = 3,
  ): Promise<WorkflowExecutionWithRelations[]> {
    try {
      return await this.prisma.workflowExecution.findMany({
        where: {
          AND: [
            {
              executionState: {
                path: ['phase'],
                equals: 'failed',
              },
            },
            {
              recoveryAttempts: {
                lt: maxRecoveryAttempts,
              },
            },
            {
              lastError: {
                not: null,
              },
            },
          ],
        },
        include: {
          task: true,
          stepProgress: {
            include: {
              step: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'asc',
        },
      });
    } catch (error) {
      this.logger.error('Failed to find executions needing recovery:', error);
      throw error;
    }
  }

  async cleanupOldExecutions(
    olderThanDays: number = 30,
    keepCompleted: boolean = true,
  ): Promise<number> {
    try {
      const cutoffDate = new Date(
        Date.now() - olderThanDays * 24 * 60 * 60 * 1000,
      );

      const whereClause: any = {
        createdAt: {
          lt: cutoffDate,
        },
      };

      if (keepCompleted) {
        whereClause.AND = [
          {
            completedAt: null,
          },
          {
            executionState: {
              path: ['phase'],
              not: 'completed',
            },
          },
        ];
      }

      const result = await this.prisma.workflowExecution.deleteMany({
        where: whereClause,
      });

      return result.count;
    } catch (error) {
      this.logger.error('Failed to cleanup old executions:', error);
      throw error;
    }
  }

  // ===================================================================
  // UTILITY OPERATIONS
  // ===================================================================

  async validateExecutionExists(id: string): Promise<boolean> {
    try {
      const execution = await this.prisma.workflowExecution.findUnique({
        where: { id },
        select: { id: true },
      });
      return !!execution;
    } catch (error) {
      this.logger.error(`Failed to validate execution exists ${id}:`, error);
      return false;
    }
  }

  async duplicateExecution(
    id: string,
    newTaskId?: number,
  ): Promise<WorkflowExecution> {
    try {
      const originalExecution =
        await this.prisma.workflowExecution.findUniqueOrThrow({
          where: { id },
          include: {
            stepProgress: true,
          },
        });

      return await this.prisma.$transaction(async (tx) => {
        // Create the duplicated execution
        const duplicatedExecution = await tx.workflowExecution.create({
          data: {
            taskId: newTaskId || originalExecution.taskId,
            currentRoleId: originalExecution.currentRoleId,
            currentStepId: null, // Reset current step
            executionState: {
              phase: 'initialized',
              duplicatedFrom: id,
              originalExecutionId: id,
            },
            executionMode: originalExecution.executionMode,
            executionContext: originalExecution.executionContext,
            stepsCompleted: 0,
            totalSteps: originalExecution.totalSteps,
            progressPercentage: 0,
            maxRecoveryAttempts: originalExecution.maxRecoveryAttempts,
            recoveryAttempts: 0,
          },
        });

        return duplicatedExecution;
      });
    } catch (error) {
      this.logger.error(`Failed to duplicate execution ${id}:`, error);
      throw error;
    }
  }

  // ===================================================================
  // TRANSACTION SUPPORT
  // ===================================================================

  async createWithTransaction(
    data: CreateWorkflowExecutionData,
    transaction?: PrismaTransaction,
  ): Promise<WorkflowExecution> {
    const tx = transaction || this.prisma;

    try {
      return await tx.workflowExecution.create({
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
      });
    } catch (error) {
      this.logger.error('Failed to create execution with transaction:', error);
      throw error;
    }
  }

  async updateWithTransaction(
    id: string,
    data: UpdateWorkflowExecutionData,
    transaction?: PrismaTransaction,
  ): Promise<WorkflowExecution> {
    const tx = transaction || this.prisma;

    try {
      return await tx.workflowExecution.update({
        where: { id },
        data,
      });
    } catch (error) {
      this.logger.error(
        `Failed to update execution ${id} with transaction:`,
        error,
      );
      throw error;
    }
  }

  async deleteWithTransaction(
    id: string,
    transaction?: PrismaTransaction,
  ): Promise<void> {
    const tx = transaction || this.prisma;

    try {
      await tx.workflowExecution.delete({
        where: { id },
      });
    } catch (error) {
      this.logger.error(
        `Failed to delete execution ${id} with transaction:`,
        error,
      );
      throw error;
    }
  }

  // ===================================================================
  // PRIVATE HELPER METHODS
  // ===================================================================

  private buildInclude(include?: WorkflowExecutionIncludeOptions): any {
    if (!include) return undefined;

    const result: any = {};

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
          where: include.stepProgress.where,
          orderBy: include.stepProgress.orderBy,
          take: include.stepProgress.take,
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

    if (include.transitions) {
      if (typeof include.transitions === 'boolean') {
        result.transitions = true;
      } else {
        result.transitions = {
          where: include.transitions.where,
          orderBy: include.transitions.orderBy,
          take: include.transitions.take,
        };
      }
    }

    return result;
  }
}
