import { Injectable } from '@nestjs/common';
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
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get tasks with comprehensive relations
   */
  async getTasks(filters: ReportFilters = {}): Promise<TaskWithRelations[]> {
    const where = this.buildTaskWhereClause(filters);

    const tasks = await this.prisma.task.findMany({
      where,
      include: {
        delegationRecords: {
          include: {
            task: true,
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
      orderBy: { createdAt: 'desc' },
    });

    return tasks as TaskWithRelations[];
  }

  /**
   * Get single task with relations
   */
  async getTask(taskId: number): Promise<TaskWithRelations | null> {
    return (await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        delegationRecords: {
          include: {
            task: {
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
  }

  /**
   * Get delegation records with relations
   */
  async getDelegationRecords(
    filters: ReportFilters = {},
  ): Promise<DelegationRecordWithRelations[]> {
    const where = this.buildDelegationWhereClause(filters);

    return (await this.prisma.delegationRecord.findMany({
      where,
      include: {
        task: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: { delegationTimestamp: 'desc' },
    })) as DelegationRecordWithRelations[];
  }

  /**
   * Get workflow transitions with relations
   */
  async getWorkflowTransitions(
    filters: ReportFilters = {},
  ): Promise<WorkflowTransitionWithRelations[]> {
    const where = this.buildWorkflowWhereClause(filters);

    return (await this.prisma.workflowTransition.findMany({
      where,
      include: {
        task: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: { transitionTimestamp: 'desc' },
    })) as WorkflowTransitionWithRelations[];
  }

  /**
   * Get implementation plans with relations
   */
  async getImplementationPlans(
    taskId: number,
  ): Promise<ImplementationPlanWithRelations[]> {
    return (await this.prisma.implementationPlan.findMany({
      where: { taskId },
      include: {
        subtasks: {
          orderBy: { sequenceNumber: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    })) as ImplementationPlanWithRelations[];
  }

  /**
   * Get subtasks for a specific task
   */
  async getSubtasks(taskId: number): Promise<SubtaskWithRelations[]> {
    // First get implementation plan IDs for this task
    const implementationPlans = await this.prisma.implementationPlan.findMany({
      where: { taskId },
      select: { id: true },
    });

    const planIds = implementationPlans.map((plan) => plan?.id);

    return (await this.prisma.subtask.findMany({
      where: {
        planId: { in: planIds },
      },
      include: {
        implementationPlan: { select: { id: true, overview: true } },
      },
      orderBy: { sequenceNumber: 'asc' },
    })) as SubtaskWithRelations[];
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
    const where = this.buildTaskWhereClause(filters);

    // Task statistics
    const tasks = await this.prisma.task.findMany({
      where,
      select: {
        status: true,
        priority: true,
        createdAt: true,
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
        toMode: true,
        delegationTimestamp: true,
        fromMode: true,
        message: true,
        taskId: true,
      },
    });

    const delegationStats = {
      total: delegations.length,
      successful: delegations.filter((d) => d.toMode === 'completed').length,
      failed: delegations.filter((d) => d.toMode === 'needs-changes').length,
      byRole: this.groupByField(delegations, 'toMode'),
    };

    // Performance statistics
    const completedTasks = tasks.filter((t) => t.completionDate);
    const completedDelegations = delegations.filter(
      (d) => d.delegationTimestamp,
    );

    const performanceStats = {
      averageTaskDuration: this.calculateAverageDuration(
        completedTasks.map((t) => ({
          start: t.createdAt,
          end: t.completionDate!,
        })),
      ),
      averageDelegationDuration: this.calculateAverageDuration(
        completedDelegations.map((d) => ({
          start: d.delegationTimestamp,
          end: d.delegationTimestamp,
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
