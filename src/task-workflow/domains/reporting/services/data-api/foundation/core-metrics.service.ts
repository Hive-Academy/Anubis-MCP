/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import {
  TaskMetrics,
  DelegationMetrics,
  CodeReviewMetrics,
  PerformanceMetrics,
  PriorityDistribution,
  OwnerDistribution,
  ModeTransition,
  FailureReason,
} from '../../interfaces/metrics.interface';

type WhereClause = Record<string, any>;

/**
 * Core Metrics Service
 *
 * Follows SRP: Single responsibility for basic workflow metrics
 * Handles: Task metrics, delegation metrics, code review metrics, performance metrics
 *
 * Extracted from MetricsCalculatorService to reduce complexity
 */
@Injectable()
export class CoreMetricsService {
  private readonly logger = new Logger(CoreMetricsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getTaskMetrics(whereClause: WhereClause): Promise<TaskMetrics> {
    try {
      // DEBUG: Log the whereClause and basic counts
      this.logger.debug('=== CORE METRICS DEBUG ===');
      this.logger.debug(
        `Where Clause: ${JSON.stringify(whereClause, null, 2)}`,
      );

      const allTasksCount = await this.prisma.task.count();
      const filteredTasksCount = await this.prisma.task.count({
        where: whereClause,
      });

      this.logger.debug(
        `Total tasks in database (no filters): ${allTasksCount}`,
      );
      this.logger.debug(`Tasks matching whereClause: ${filteredTasksCount}`);

      // Get sample tasks for debugging
      const sampleTasks = await this.prisma.task.findMany({
        take: 3,
        select: { taskId: true, name: true, creationDate: true, status: true },
      });
      this.logger.debug(
        `Sample tasks: ${JSON.stringify(sampleTasks, null, 2)}`,
      );
      this.logger.debug('=== END CORE METRICS DEBUG ===');

      const [
        totalTasks,
        completedTasks,
        inProgressTasks,
        notStartedTasks,
        priorityDistribution,
        tasksByOwner,
        completedTasksWithDates,
      ] = await Promise.all([
        this.prisma.task.count({ where: whereClause }),
        // FIX: Handle case-insensitive status matching for 'completed' vs 'Completed'
        this.prisma.task.count({
          where: {
            ...whereClause,
            OR: [{ status: 'completed' }, { status: 'Completed' }],
          },
        }),
        this.prisma.task.count({
          where: { ...whereClause, status: 'in-progress' },
        }),
        this.prisma.task.count({
          where: { ...whereClause, status: 'not-started' },
        }),
        this.prisma.task.groupBy({
          by: ['priority'],
          _count: true,
          where: whereClause,
        }),
        this.prisma.task.groupBy({
          by: ['owner'],
          _count: true,
          where: whereClause,
        }),
        this.prisma.task.findMany({
          where: {
            ...whereClause,
            // FIX: Handle case-insensitive status matching for completed tasks
            OR: [{ status: 'completed' }, { status: 'Completed' }],
            completionDate: { not: null },
          },
          select: {
            creationDate: true,
            completionDate: true,
          },
        }),
      ]);

      const avgCompletionTimeHours = this.calculateAverageCompletionTime(
        completedTasksWithDates,
      );

      return {
        totalTasks,
        completedTasks,
        inProgressTasks,
        notStartedTasks,
        completionRate:
          totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
        avgCompletionTimeHours,
        priorityDistribution:
          this.mapPriorityDistribution(priorityDistribution),
        tasksByOwner: this.mapOwnerDistribution(tasksByOwner),
      };
    } catch (error) {
      this.logger.error('Error calculating task metrics', error);
      return this.getDefaultTaskMetrics();
    }
  }

  async getDelegationMetrics(
    whereClause: WhereClause,
  ): Promise<DelegationMetrics> {
    try {
      const [delegations, modeTransitions, failureReasons, redelegationStats] =
        await Promise.all([
          this.prisma.delegationRecord.findMany({
            where: { task: whereClause },
          }),
          this.prisma.workflowTransition.groupBy({
            by: ['fromMode', 'toMode'],
            _count: true,
            where: { task: whereClause },
          }),
          this.prisma.delegationRecord.groupBy({
            by: ['rejectionReason'],
            _count: true,
            where: {
              task: whereClause,
              success: false,
              rejectionReason: { not: null },
            },
            orderBy: { _count: { rejectionReason: 'desc' } },
            take: 5,
          }),
          this.prisma.task.aggregate({
            _avg: { redelegationCount: true },
            _max: { redelegationCount: true },
            where: whereClause,
          }),
        ]);

      return {
        totalDelegations: delegations.length,
        successfulDelegations: delegations.filter((d) => d.success === true)
          .length,
        failedDelegations: delegations.filter((d) => d.success === false)
          .length,
        avgRedelegationCount: redelegationStats._avg.redelegationCount || 0,
        maxRedelegationCount: redelegationStats._max.redelegationCount || 0,
        modeTransitions: this.mapModeTransitions(modeTransitions),
        topFailureReasons: this.mapFailureReasons(failureReasons),
      };
    } catch (error) {
      this.logger.error('Error calculating delegation metrics', error);
      return this.getDefaultDelegationMetrics();
    }
  }

  async getCodeReviewMetrics(
    whereClause: WhereClause,
  ): Promise<CodeReviewMetrics> {
    try {
      const reviews = await this.prisma.codeReview.findMany({
        where: { task: whereClause },
        select: {
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      const totalReviews = reviews.length;
      const approvedReviews = reviews.filter(
        (r) => r.status === 'APPROVED',
      ).length;
      const approvedWithReservationsReviews = reviews.filter(
        (r) => r.status === 'APPROVED_WITH_RESERVATIONS',
      ).length;
      const needsChangesReviews = reviews.filter(
        (r) => r.status === 'NEEDS_CHANGES',
      ).length;

      const avgReviewTimeHours = this.calculateAverageReviewTime(reviews);

      return {
        totalReviews,
        approvedReviews,
        approvedWithReservationsReviews,
        needsChangesReviews,
        approvalRate:
          totalReviews > 0 ? (approvedReviews / totalReviews) * 100 : 0,
        avgReviewTimeHours,
      };
    } catch (error) {
      this.logger.error('Error calculating code review metrics', error);
      return this.getDefaultCodeReviewMetrics();
    }
  }

  async getPerformanceMetrics(
    whereClause: WhereClause,
  ): Promise<PerformanceMetrics> {
    try {
      const [tasks, delegations, subtasks] = await Promise.all([
        this.prisma.task.findMany({
          where: whereClause,
          include: {
            implementationPlans: {
              include: { subtasks: true },
            },
            delegationRecords: {
              orderBy: { delegationTimestamp: 'asc' },
              take: 1,
            },
          },
        }),
        this.prisma.delegationRecord.findMany({
          where: { task: whereClause },
        }),
        this.prisma.subtask.findMany({
          where: { task: whereClause },
        }),
      ]);

      const implementationEfficiency =
        this.calculateImplementationEfficiency(tasks);
      const avgSubtasksPerTask =
        tasks.length > 0 ? subtasks.length / tasks.length : 0;
      const avgTimeToFirstDelegation =
        this.calculateTimeToFirstDelegation(tasks);

      const modeActivity = this.calculateModeActivity(delegations);

      return {
        implementationEfficiency,
        avgSubtasksPerTask,
        mostActiveMode: modeActivity.mostActiveMode,
        leastActiveMode: modeActivity.leastActiveMode,
        timeToFirstDelegation: avgTimeToFirstDelegation,
      };
    } catch (error) {
      this.logger.error('Error calculating performance metrics', error);
      return this.getDefaultPerformanceMetrics();
    }
  }

  // Private calculation methods

  private calculateAverageCompletionTime(
    completedTasks: Array<{ creationDate: Date; completionDate: Date | null }>,
  ): number {
    if (completedTasks.length === 0) return 0;

    const totalHours = completedTasks.reduce((sum, task) => {
      if (!task.completionDate) return sum;
      const diffMs =
        task.completionDate.getTime() - task.creationDate.getTime();
      return sum + diffMs / (1000 * 60 * 60); // Convert to hours
    }, 0);

    return totalHours / completedTasks.length;
  }

  private calculateAverageReviewTime(
    reviews: Array<{ createdAt: Date; updatedAt: Date }>,
  ): number {
    if (reviews.length === 0) return 0;

    const totalHours = reviews.reduce((sum, review) => {
      const diffMs = review.updatedAt.getTime() - review.createdAt.getTime();
      return sum + diffMs / (1000 * 60 * 60); // Convert to hours
    }, 0);

    return totalHours / reviews.length;
  }

  private calculateImplementationEfficiency(tasks: any[]): number {
    if (tasks.length === 0) return 0;
    const completedTasks = tasks.filter((t) => t.status === 'completed').length;
    return (completedTasks / tasks.length) * 100;
  }

  private calculateModeActivity(delegations: any[]): {
    mostActiveMode: string | null;
    leastActiveMode: string | null;
  } {
    if (delegations.length === 0) {
      return { mostActiveMode: null, leastActiveMode: null };
    }

    const modeCount = delegations.reduce(
      (acc, delegation) => {
        acc[delegation.toMode] = (acc[delegation.toMode] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const modes = Object.entries(modeCount);
    const mostActive = modes.reduce((max, current) =>
      (current[1] as number) > (max[1] as number) ? current : max,
    );
    const leastActive = modes.reduce((min, current) =>
      (current[1] as number) < (min[1] as number) ? current : min,
    );

    return {
      mostActiveMode: mostActive[0],
      leastActiveMode: leastActive[0],
    };
  }

  private calculateTimeToFirstDelegation(tasks: any[]): number {
    const tasksWithDelegations = tasks.filter(
      (t) => t.delegationRecords && t.delegationRecords.length > 0,
    );

    if (tasksWithDelegations.length === 0) return 0;

    const totalHours = tasksWithDelegations.reduce((sum, task) => {
      const firstDelegation = task.delegationRecords[0];
      const diffMs =
        firstDelegation.delegationTimestamp.getTime() -
        task.creationDate.getTime();
      return sum + diffMs / (1000 * 60 * 60); // Convert to hours
    }, 0);

    return totalHours / tasksWithDelegations.length;
  }

  // Mapping methods

  private mapPriorityDistribution(data: any[]): PriorityDistribution[] {
    return data.map((item) => ({
      priority: item.priority || 'Unknown',
      count: item._count,
    }));
  }

  private mapOwnerDistribution(data: any[]): OwnerDistribution[] {
    return data.map((item) => ({
      owner: item.owner || 'Unassigned',
      count: item._count,
    }));
  }

  private mapModeTransitions(data: any[]): ModeTransition[] {
    return data.map((item) => ({
      fromMode: item.fromMode,
      toMode: item.toMode,
      count: item._count,
    }));
  }

  private mapFailureReasons(data: any[]): FailureReason[] {
    return data.map((item) => ({
      reason: item.rejectionReason,
      count: item._count,
    }));
  }

  // Default metrics methods

  private getDefaultTaskMetrics(): TaskMetrics {
    return {
      totalTasks: 0,
      completedTasks: 0,
      inProgressTasks: 0,
      notStartedTasks: 0,
      completionRate: 0,
      avgCompletionTimeHours: 0,
      priorityDistribution: [],
      tasksByOwner: [],
    };
  }

  private getDefaultDelegationMetrics(): DelegationMetrics {
    return {
      totalDelegations: 0,
      successfulDelegations: 0,
      failedDelegations: 0,
      avgRedelegationCount: 0,
      maxRedelegationCount: 0,
      modeTransitions: [],
      topFailureReasons: [],
    };
  }

  private getDefaultCodeReviewMetrics(): CodeReviewMetrics {
    return {
      totalReviews: 0,
      approvedReviews: 0,
      approvedWithReservationsReviews: 0,
      needsChangesReviews: 0,
      approvalRate: 0,
      avgReviewTimeHours: 0,
    };
  }

  private getDefaultPerformanceMetrics(): PerformanceMetrics {
    return {
      implementationEfficiency: 0,
      avgSubtasksPerTask: 0,
      mostActiveMode: null,
      leastActiveMode: null,
      timeToFirstDelegation: 0,
    };
  }
}
