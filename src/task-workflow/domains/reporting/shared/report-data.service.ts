import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { IReportDataService } from './interfaces';
import {
  TaskWithRelations,
  DelegationRecordWithRelations,
  WorkflowTransitionWithRelations,
  ImplementationPlanWithRelations,
  SubtaskWithRelations,
  ReportFilters,
} from './types';

/**
 * Centralized data fetching service for all reports
 * Follows KISS principle with focused Prisma queries
 * Max 200 lines following architecture guidelines
 */
@Injectable()
export class ReportDataService implements IReportDataService {
  private readonly logger = new Logger(ReportDataService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get tasks with comprehensive relations
   */
  async getTasks(filters: ReportFilters = {}): Promise<TaskWithRelations[]> {
    try {
      const where = this.buildTaskWhereClause(filters);

      const tasks = await this.prisma.task.findMany({
        where,
        include: {
          delegationRecords: {
            include: {
              subtask: {
                select: { id: true, name: true },
              },
            },
            orderBy: { delegationTimestamp: 'asc' },
          },
          workflowTransitions: {
            orderBy: { transitionTimestamp: 'asc' },
          },
          implementationPlans: {
            include: {
              subtasks: {
                orderBy: { sequenceNumber: 'asc' },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
          codebaseAnalysis: true,
          taskDescription: true,
        },
        orderBy: { creationDate: 'desc' },
      });

      return tasks as TaskWithRelations[];
    } catch (error) {
      this.logger.error(`Failed to fetch tasks: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get single task with relations
   */
  async getTask(taskId: string): Promise<TaskWithRelations | null> {
    try {
      return (await this.prisma.task.findUnique({
        where: { taskId },
        include: {
          delegationRecords: {
            include: {
              subtask: {
                select: { id: true, name: true },
              },
            },
            orderBy: { delegationTimestamp: 'asc' },
          },
          workflowTransitions: {
            orderBy: { transitionTimestamp: 'asc' },
          },
          implementationPlans: {
            include: {
              subtasks: {
                orderBy: { sequenceNumber: 'asc' },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
          codebaseAnalysis: true,
          taskDescription: true,
        },
      })) as TaskWithRelations | null;
    } catch (error) {
      this.logger.error(`Failed to fetch task ${taskId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get delegation records with relations
   */
  async getDelegationRecords(
    filters: ReportFilters = {},
  ): Promise<DelegationRecordWithRelations[]> {
    try {
      const where = this.buildDelegationWhereClause(filters);

      return (await this.prisma.delegationRecord.findMany({
        where,
        include: {
          subtask: {
            select: { id: true, name: true },
          },
          task: {
            select: { taskId: true, name: true, taskSlug: true },
          },
        },
        orderBy: { delegationTimestamp: 'desc' },
      })) as DelegationRecordWithRelations[];
    } catch (error) {
      this.logger.error(`Failed to fetch delegation records: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get workflow transitions with relations
   */
  async getWorkflowTransitions(
    filters: ReportFilters = {},
  ): Promise<WorkflowTransitionWithRelations[]> {
    try {
      const where = this.buildWorkflowWhereClause(filters);

      return (await this.prisma.workflowTransition.findMany({
        where,
        include: {
          task: {
            select: { taskId: true, name: true, taskSlug: true },
          },
        },
        orderBy: { transitionTimestamp: 'desc' },
      })) as WorkflowTransitionWithRelations[];
    } catch (error) {
      this.logger.error(
        `Failed to fetch workflow transitions: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Get implementation plans with relations
   */
  async getImplementationPlans(
    taskId: string,
  ): Promise<ImplementationPlanWithRelations[]> {
    try {
      return (await this.prisma.implementationPlan.findMany({
        where: { taskId },
        include: {
          subtasks: {
            orderBy: { sequenceNumber: 'asc' },
          },
        },
        orderBy: { createdAt: 'asc' },
      })) as ImplementationPlanWithRelations[];
    } catch (error) {
      this.logger.error(
        `Failed to fetch implementation plans for ${taskId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Get subtasks for a specific task
   */
  async getSubtasks(taskId: string): Promise<SubtaskWithRelations[]> {
    try {
      // First get implementation plan IDs for this task
      const implementationPlans = await this.prisma.implementationPlan.findMany(
        {
          where: { taskId },
          select: { id: true },
        },
      );

      const planIds = implementationPlans.map((plan) => plan.id);

      return (await this.prisma.subtask.findMany({
        where: {
          planId: { in: planIds },
        },
        include: {
          plan: { select: { id: true, overview: true } },
        },
        orderBy: { sequenceNumber: 'asc' },
      })) as SubtaskWithRelations[];
    } catch (error) {
      this.logger.error(
        `Failed to fetch subtasks for ${taskId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Get aggregated statistics
   */
  async getAggregatedStats(filters: ReportFilters = {}): Promise<{
    taskStats: {
      total: number;
      byStatus: Record<string, number>;
      byPriority: Record<string, number>;
    };
    delegationStats: {
      total: number;
      successful: number;
      failed: number;
      byRole: Record<string, number>;
    };
    performanceStats: {
      averageTaskDuration: number;
      averageDelegationDuration: number;
      completionRate: number;
    };
  }> {
    try {
      const where = this.buildTaskWhereClause(filters);

      // Task statistics
      const tasks = await this.prisma.task.findMany({
        where,
        select: {
          status: true,
          priority: true,
          creationDate: true,
          completionDate: true,
        },
      });

      const taskStats = {
        total: tasks.length,
        byStatus: this.groupByField(tasks, 'status'),
        byPriority: this.groupByField(tasks, 'priority'),
      };

      // Delegation statistics
      const delegations = await this.prisma.delegationRecord.findMany({
        where: this.buildDelegationWhereClause(filters),
        select: {
          success: true,
          toMode: true,
          delegationTimestamp: true,
          completionTimestamp: true,
        },
      });

      const delegationStats = {
        total: delegations.length,
        successful: delegations.filter((d) => d.success === true).length,
        failed: delegations.filter((d) => d.success === false).length,
        byRole: this.groupByField(delegations, 'toMode'),
      };

      // Performance statistics
      const completedTasks = tasks.filter((t) => t.completionDate);
      const completedDelegations = delegations.filter(
        (d) => d.completionTimestamp,
      );

      const performanceStats = {
        averageTaskDuration: this.calculateAverageDuration(
          completedTasks.map((t) => ({
            start: t.creationDate,
            end: t.completionDate!,
          })),
        ),
        averageDelegationDuration: this.calculateAverageDuration(
          completedDelegations.map((d) => ({
            start: d.delegationTimestamp,
            end: d.completionTimestamp!,
          })),
        ),
        completionRate:
          tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0,
      };

      return {
        taskStats,
        delegationStats,
        performanceStats,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch aggregated stats: ${error.message}`);
      throw error;
    }
  }

  // Private helper methods
  private buildTaskWhereClause(
    filters: ReportFilters,
  ): Record<string, unknown> {
    const where: Record<string, unknown> = {};

    if (filters.status) where.status = filters.status;
    if (filters.owner) where.owner = filters.owner;
    if (filters.priority) where.priority = filters.priority;
    if (filters.taskId) where.taskId = filters.taskId;

    if (filters.startDate || filters.endDate) {
      where.creationDate = {};
      if (filters.startDate) {
        (where.creationDate as Record<string, unknown>).gte = new Date(
          filters.startDate,
        );
      }
      if (filters.endDate) {
        (where.creationDate as Record<string, unknown>).lte = new Date(
          filters.endDate,
        );
      }
    }

    return where;
  }

  private buildDelegationWhereClause(
    filters: ReportFilters,
  ): Record<string, unknown> {
    const where: Record<string, unknown> = {};

    if (filters.taskId) where.taskId = filters.taskId;

    if (filters.startDate || filters.endDate) {
      where.delegationTimestamp = {};
      if (filters.startDate) {
        (where.delegationTimestamp as Record<string, unknown>).gte = new Date(
          filters.startDate,
        );
      }
      if (filters.endDate) {
        (where.delegationTimestamp as Record<string, unknown>).lte = new Date(
          filters.endDate,
        );
      }
    }

    return where;
  }

  private buildWorkflowWhereClause(
    filters: ReportFilters,
  ): Record<string, unknown> {
    const where: Record<string, unknown> = {};

    if (filters.taskId) where.taskId = filters.taskId;

    if (filters.startDate || filters.endDate) {
      where.transitionTimestamp = {};
      if (filters.startDate) {
        (where.transitionTimestamp as Record<string, unknown>).gte = new Date(
          filters.startDate,
        );
      }
      if (filters.endDate) {
        (where.transitionTimestamp as Record<string, unknown>).lte = new Date(
          filters.endDate,
        );
      }
    }

    return where;
  }

  private groupByField<T extends Record<string, unknown>>(
    items: T[],
    field: keyof T,
  ): Record<string, number> {
    return items.reduce(
      (acc, item) => {
        const value = String(item[field] || 'Unknown');
        acc[value] = (acc[value] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  private calculateAverageDuration(
    durations: Array<{ start: Date; end: Date }>,
  ): number {
    if (durations.length === 0) return 0;

    const totalHours = durations.reduce((sum, { start, end }) => {
      return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }, 0);

    return Math.round(totalHours / durations.length);
  }
}
