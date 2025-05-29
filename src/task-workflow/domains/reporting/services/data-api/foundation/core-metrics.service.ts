/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

// Import the correct template-specific interfaces
import type { DelegationMetrics } from '../delegation-analytics/delegation-analytics-template.interface';
import type { PerformanceMetrics } from '../performance-dashboard/performance-dashboard-template.interface';

// Local supporting interfaces (moved from deleted metrics.interface.ts)
export interface TaskMetrics {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  notStartedTasks: number;
  completionRate: number;
  avgCompletionTimeHours: number;
  priorityDistribution: PriorityDistribution[];
  tasksByOwner: OwnerDistribution[];
}

export interface CodeReviewMetrics {
  totalReviews: number;
  approvedReviews: number;
  approvedWithReservationsReviews: number;
  needsChangesReviews: number;
  approvalRate: number;
  avgReviewTimeHours: number;
}

export interface PriorityDistribution {
  priority: string | null;
  count: number;
}

export interface OwnerDistribution {
  owner: string | null;
  count: number;
}

export interface ModeTransition {
  fromMode: string;
  toMode: string;
  count: number;
}

export interface FailureReason {
  reason: string | null;
  count: number;
}

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
      const [
        delegations,
        _modeTransitions,
        _failureReasons,
        redelegationStats,
      ] = await Promise.all([
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
        roleStats: {
          architect: 0,
          'senior-developer': 0,
          'code-review': 0,
          boomerang: 0,
          researcher: 0,
        },
        roleEfficiency: {
          'senior-developer': 0,
          'code-review': 0,
          boomerang: 0,
          researcher: 0,
          architect: 0,
        },
        successRate: 0,
        avgHandoffTime: 0,
        avgRedelegationCount: redelegationStats._avg.redelegationCount || 0,
        mostEfficientRole: '',
        avgCompletionTime: 0,
        transitionMatrix: {},
        weeklyTrends: {
          failed: [],
          successful: [],
        },
        bottlenecks: [],
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

      const _implementationEfficiency =
        this.calculateImplementationEfficiency(tasks);
      const _avgSubtasksPerTask =
        tasks.length > 0 ? subtasks.length / tasks.length : 0;
      const _avgTimeToFirstDelegation =
        this.calculateTimeToFirstDelegation(tasks);

      const _modeActivity = this.calculateModeActivity(delegations);

      return {
        averageCompletionTime: '0h',
        completionTimeTrend: 0,
        throughputRate: 0,
        throughputTrend: 0,
        redelegationRate: 0,
        redelegationTrend: 0,
        qualityScore: 0,
        qualityTrend: 0,
      };
    } catch (error) {
      this.logger.error('Error calculating performance metrics', error);
      return this.getDefaultPerformanceMetrics();
    }
  }

  async getImplementationPlanMetrics(whereClause: WhereClause): Promise<any> {
    try {
      const [
        totalPlans,
        plansWithSubtasks,
        avgSubtasksPerPlan,
        planQualityData,
      ] = await Promise.all([
        this.prisma.implementationPlan.count({ where: { task: whereClause } }),
        this.prisma.implementationPlan.findMany({
          where: { task: whereClause },
          include: {
            subtasks: true,
          },
        }),
        this.prisma.implementationPlan.findMany({
          where: { task: whereClause },
          include: {
            _count: {
              select: { subtasks: true },
            },
          },
        }),
        this.prisma.implementationPlan.findMany({
          where: { task: whereClause },
          select: {
            overview: true,
            approach: true,
            technicalDecisions: true,
            createdBy: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
      ]);

      const avgSubtasks =
        avgSubtasksPerPlan.length > 0
          ? avgSubtasksPerPlan.reduce(
              (sum, plan) => sum + plan._count.subtasks,
              0,
            ) / avgSubtasksPerPlan.length
          : 0;

      return {
        totalPlans,
        avgSubtasksPerPlan: Math.round(avgSubtasks * 100) / 100,
        planQualityScore: this.calculatePlanQualityScore(planQualityData),
        plansWithSubtasks: plansWithSubtasks.length,
        qualityMetrics: this.calculateQualityMetrics(planQualityData),
        executionPatterns: this.calculateExecutionPatterns(plansWithSubtasks),
        creatorStats: this.calculateCreatorStats(planQualityData),
      };
    } catch (error) {
      this.logger.error('Error calculating implementation plan metrics', error);
      return {
        totalPlans: 0,
        avgSubtasksPerPlan: 0,
        planQualityScore: 0,
        plansWithSubtasks: 0,
        qualityMetrics: [],
        executionPatterns: [],
        creatorStats: [],
      };
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

  private calculatePlanQualityScore(planData: any[]): number {
    if (planData.length === 0) return 0;

    let totalScore = 0;
    planData.forEach((plan) => {
      let score = 0;
      if (plan.overview && plan.overview.length > 50) score += 25;
      if (plan.approach && plan.approach.length > 50) score += 25;
      if (plan.technicalDecisions && plan.technicalDecisions.length > 50)
        score += 25;
      if (plan.createdBy) score += 25;
      totalScore += score;
    });

    return Math.round((totalScore / (planData.length * 100)) * 100);
  }

  private calculateQualityMetrics(planData: any[]): any[] {
    const highQuality = planData.filter(
      (p) =>
        p.overview?.length > 100 &&
        p.approach?.length > 100 &&
        p.technicalDecisions?.length > 100,
    ).length;
    const mediumQuality = planData.filter(
      (p) =>
        (p.overview?.length > 50 ||
          p.approach?.length > 50 ||
          p.technicalDecisions?.length > 50) &&
        !(
          p.overview?.length > 100 &&
          p.approach?.length > 100 &&
          p.technicalDecisions?.length > 100
        ),
    ).length;
    const lowQuality = planData.length - highQuality - mediumQuality;

    return [
      {
        label: 'High Quality',
        count: highQuality,
        percentage: Math.round((highQuality / planData.length) * 100),
        color: '#10B981',
      },
      {
        label: 'Medium Quality',
        count: mediumQuality,
        percentage: Math.round((mediumQuality / planData.length) * 100),
        color: '#F59E0B',
      },
      {
        label: 'Low Quality',
        count: lowQuality,
        percentage: Math.round((lowQuality / planData.length) * 100),
        color: '#EF4444',
      },
    ];
  }

  private calculateExecutionPatterns(_plansWithSubtasks: any[]): any[] {
    // Return empty array if no real data available
    // TODO: Implement real execution pattern analysis based on actual subtask completion data
    return [];
  }

  private calculateCreatorStats(planData: any[]): any[] {
    const creatorMap = new Map();

    planData.forEach((plan) => {
      const creator = plan.createdBy;
      // Skip plans without a creator instead of using "Unknown"
      if (!creator) return;

      if (!creatorMap.has(creator)) {
        creatorMap.set(creator, {
          creator,
          initials: creator.substring(0, 2).toUpperCase(),
          color: this.getCreatorColor(creator),
          plansCreated: 0,
          avgQuality: 0,
          qualityColor: '#10B981',
          avgSubtasks: 0,
          successRate: 0, // Will be calculated from real data
          successClass: 'text-gray-600', // Neutral until calculated
        });
      }

      const stats = creatorMap.get(creator);
      stats.plansCreated += 1;
    });

    return Array.from(creatorMap.values());
  }

  private getCreatorColor(creator: string): string {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
    const hash = creator.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }

  // Mapping methods

  private mapPriorityDistribution(data: any[]): PriorityDistribution[] {
    return data
      .filter((item) => item.priority !== null)
      .map((item) => ({
        priority: item.priority,
        count: item._count,
      }));
  }

  private mapOwnerDistribution(data: any[]): OwnerDistribution[] {
    return data
      .filter((item) => item.owner !== null)
      .map((item) => ({
        owner: item.owner,
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
      roleStats: {
        architect: 0,
        'senior-developer': 0,
        'code-review': 0,
        boomerang: 0,
        researcher: 0,
      },
      roleEfficiency: {
        'senior-developer': 0,
        'code-review': 0,
        boomerang: 0,
        researcher: 0,
        architect: 0,
      },
      successRate: 0,
      avgHandoffTime: 0,
      avgRedelegationCount: 0,
      mostEfficientRole: '',
      avgCompletionTime: 0,
      transitionMatrix: {},
      weeklyTrends: {
        failed: [],
        successful: [],
      },
      bottlenecks: [],
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
      averageCompletionTime: '0h',
      completionTimeTrend: 0,
      throughputRate: 0,
      throughputTrend: 0,
      redelegationRate: 0,
      redelegationTrend: 0,
      qualityScore: 0,
      qualityTrend: 0,
    };
  }
}
