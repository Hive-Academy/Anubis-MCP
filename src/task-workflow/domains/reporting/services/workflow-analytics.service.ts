/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';

export interface WorkflowAnalyticsData {
  summary: WorkflowSummary;
  roleAnalytics: RoleAnalytics[];
  taskEfficiency: TaskEfficiencyData;
  bottleneckAnalysis: BottleneckAnalysis;
  trendAnalysis: TrendAnalysis;
  metadata: {
    generatedAt: string;
    reportType: 'workflow-analytics';
    periodStart: string;
    periodEnd: string;
    totalTasks: number;
  };
}

export interface WorkflowSummary {
  totalTasks: number;
  completedTasks: number;
  activeTasks: number;
  averageTaskDuration: number;
  averageDelegations: number;
  successfulCompletions: number;
  taskDistributionByPriority: Record<string, number>;
  taskDistributionByStatus: Record<string, number>;
}

export interface RoleAnalytics {
  role: string;
  tasksReceived: number;
  tasksCompleted: number;
  averageTaskDuration: number;
  successRate: number;
  averageHandoffTime: number;
  redelegationRate: number;
  qualityScore: number;
  workloadDistribution: number; // percentage of total tasks
}

export interface TaskEfficiencyData {
  fastestCompletions: TaskEfficiencyItem[];
  slowestCompletions: TaskEfficiencyItem[];
  mostEfficientRolePairs: RolePairEfficiency[];
  leastEfficientRolePairs: RolePairEfficiency[];
}

export interface TaskEfficiencyItem {
  taskId: string;
  taskName: string;
  taskSlug?: string;
  duration: number;
  delegationCount: number;
  complexity: 'Low' | 'Medium' | 'High';
}

export interface RolePairEfficiency {
  fromRole: string;
  toRole: string;
  averageDuration: number;
  successRate: number;
  transactionCount: number;
}

export interface BottleneckAnalysis {
  problematicTransitions: ProblematicTransition[];
  highRedelegationPairs: RedelegationPair[];
  roleWorkloadImbalance: WorkloadImbalance[];
  timeConsuming: TimeConsumingTask[];
}

export interface ProblematicTransition {
  fromRole: string;
  toRole: string;
  failureRate: number;
  averageRetryTime: number;
  commonIssues: string[];
}

export interface RedelegationPair {
  fromRole: string;
  toRole: string;
  redelegationCount: number;
  redelegationRate: number;
  commonReasons: string[];
}

export interface WorkloadImbalance {
  role: string;
  currentLoad: number;
  averageLoad: number;
  imbalancePercentage: number;
}

export interface TimeConsumingTask {
  taskId: string;
  taskName: string;
  duration: number;
  expectedDuration: number;
  overrunPercentage: number;
  bottleneckRole: string;
}

export interface TrendAnalysis {
  completionTrend: TrendDataPoint[];
  delegationTrend: TrendDataPoint[];
  efficiencyTrend: TrendDataPoint[];
  qualityTrend: TrendDataPoint[];
}

export interface TrendDataPoint {
  period: string;
  value: number;
  change: number; // percentage change from previous period
}

@Injectable()
export class WorkflowAnalyticsService {
  private readonly logger = new Logger(WorkflowAnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate comprehensive workflow analytics
   */
  async generateWorkflowAnalytics(
    filters: any = {},
  ): Promise<WorkflowAnalyticsData> {
    try {
      this.logger.log('Generating comprehensive workflow analytics');

      const { startDate, endDate } = this.determinePeriod(filters);
      const tasks = await this.getTasksForAnalysis(startDate, endDate, filters);

      if (tasks.length === 0) {
        throw new Error('No tasks found for the specified period');
      }

      const summary = this.calculateWorkflowSummary(tasks);
      const roleAnalytics = this.calculateRoleAnalytics(tasks);
      const taskEfficiency = this.analyzeTaskEfficiency(tasks);
      const bottleneckAnalysis = this.analyzeBottlenecks(tasks);
      const trendAnalysis = await this.analyzeTrends(
        startDate,
        endDate,
        filters,
      );

      return {
        summary,
        roleAnalytics,
        taskEfficiency,
        bottleneckAnalysis,
        trendAnalysis,
        metadata: {
          generatedAt: new Date().toISOString(),
          reportType: 'workflow-analytics',
          periodStart: startDate.toISOString(),
          periodEnd: endDate.toISOString(),
          totalTasks: tasks.length,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to generate workflow analytics: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Generate role-specific performance report
   */
  async generateRolePerformanceReport(
    role: string,
    filters: any = {},
  ): Promise<any> {
    try {
      this.logger.log(`Generating role performance report for: ${role}`);

      const { startDate, endDate } = this.determinePeriod(filters);
      const tasks = await this.getTasksForRoleAnalysis(
        role,
        startDate,
        endDate,
        filters,
      );

      const performance = this.calculateDetailedRolePerformance(role, tasks);

      return {
        role,
        performance,
        taskBreakdown: this.getTaskBreakdownForRole(role, tasks),
        metadata: {
          generatedAt: new Date().toISOString(),
          reportType: 'role-performance',
          periodStart: startDate.toISOString(),
          periodEnd: endDate.toISOString(),
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to generate role performance report: ${error.message}`,
      );
      throw error;
    }
  }

  private determinePeriod(filters: any): { startDate: Date; endDate: Date } {
    const endDate = filters.endDate ? new Date(filters.endDate) : new Date();
    const startDate = filters.startDate
      ? new Date(filters.startDate)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

    return { startDate, endDate };
  }

  private async getTasksForAnalysis(
    startDate: Date,
    endDate: Date,
    filters: any,
  ) {
    const where: any = {
      creationDate: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;

    return await this.prisma.task.findMany({
      where,
      include: {
        delegationRecords: {
          include: {
            subtask: true,
          },
        },
        workflowTransitions: true,
        implementationPlans: {
          include: {
            subtasks: true,
          },
        },
        codeReviews: true,
        researchReports: true,
        completionReports: true,
      },
    });
  }

  private async getTasksForRoleAnalysis(
    role: string,
    startDate: Date,
    endDate: Date,
    filters: any,
  ) {
    const where: any = {
      creationDate: {
        gte: startDate,
        lte: endDate,
      },
      OR: [
        { owner: role },
        {
          delegationRecords: {
            some: {
              OR: [{ fromMode: role }, { toMode: role }],
            },
          },
        },
      ],
    };

    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;

    return await this.prisma.task.findMany({
      where,
      include: {
        delegationRecords: {
          include: {
            subtask: true,
          },
        },
        workflowTransitions: true,
        implementationPlans: {
          include: {
            subtasks: true,
          },
        },
        codeReviews: true,
        researchReports: true,
        completionReports: true,
      },
    });
  }

  private calculateWorkflowSummary(tasks: any[]): WorkflowSummary {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'completed').length;
    const activeTasks = tasks.filter((t) =>
      ['in-progress', 'needs-review'].includes(t.status),
    ).length;

    const completedTasksData = tasks.filter(
      (t) => t.status === 'completed' && t.completionDate,
    );
    const averageTaskDuration =
      completedTasksData.length > 0
        ? completedTasksData.reduce((sum, task) => {
            const duration =
              (new Date(task.completionDate).getTime() -
                new Date(task.creationDate).getTime()) /
              (1000 * 60 * 60);
            return sum + duration;
          }, 0) / completedTasksData.length
        : 0;

    const averageDelegations =
      tasks.length > 0
        ? tasks.reduce((sum, task) => sum + task.delegationRecords.length, 0) /
          tasks.length
        : 0;

    const successfulCompletions = tasks.filter(
      (t) => t.status === 'completed' && t.completionReports.length > 0,
    ).length;

    // Distribution calculations
    const priorityDistribution: Record<string, number> = {};
    const statusDistribution: Record<string, number> = {};

    tasks.forEach((task) => {
      const priority = task.priority || 'Medium';
      priorityDistribution[priority] =
        (priorityDistribution[priority] || 0) + 1;
      statusDistribution[task.status] =
        (statusDistribution[task.status] || 0) + 1;
    });

    return {
      totalTasks,
      completedTasks,
      activeTasks,
      averageTaskDuration: Math.round(averageTaskDuration * 10) / 10,
      averageDelegations: Math.round(averageDelegations * 10) / 10,
      successfulCompletions,
      taskDistributionByPriority: priorityDistribution,
      taskDistributionByStatus: statusDistribution,
    };
  }

  private calculateRoleAnalytics(tasks: any[]): RoleAnalytics[] {
    const roleStats: Record<string, any> = {};

    // Initialize role stats
    const allRoles = new Set<string>();
    tasks.forEach((task) => {
      if (task.owner) allRoles.add(task.owner);
      task.delegationRecords.forEach((delegation: any) => {
        allRoles.add(delegation.fromMode);
        allRoles.add(delegation.toMode);
      });
    });

    allRoles.forEach((role) => {
      roleStats[role] = {
        tasksReceived: 0,
        tasksCompleted: 0,
        totalDuration: 0,
        completedTasksWithDuration: 0,
        totalHandoffTime: 0,
        handoffCount: 0,
        redelegations: 0,
        totalDelegations: 0,
        qualityScores: [],
      };
    });

    // Calculate stats
    tasks.forEach((task) => {
      task.delegationRecords.forEach((delegation: any) => {
        roleStats[delegation.toMode].tasksReceived++;
        roleStats[delegation.toMode].totalDelegations++;

        if (delegation.success === false) {
          roleStats[delegation.toMode].redelegations++;
        }

        if (delegation.delegationTimestamp && delegation.completionTimestamp) {
          const handoffTime =
            (new Date(delegation.completionTimestamp).getTime() -
              new Date(delegation.delegationTimestamp).getTime()) /
            (1000 * 60 * 60);
          roleStats[delegation.toMode].totalHandoffTime += handoffTime;
          roleStats[delegation.toMode].handoffCount++;
        }
      });

      if (task.status === 'completed') {
        const currentOwner = task.owner;
        if (currentOwner && roleStats[currentOwner]) {
          roleStats[currentOwner].tasksCompleted++;

          if (task.completionDate) {
            const duration =
              (new Date(task.completionDate).getTime() -
                new Date(task.creationDate).getTime()) /
              (1000 * 60 * 60);
            roleStats[currentOwner].totalDuration += duration;
            roleStats[currentOwner].completedTasksWithDuration++;
          }

          // Quality score based on code reviews
          if (task.codeReviews.length > 0) {
            const avgQuality =
              task.codeReviews.reduce((sum: number, review: any) => {
                return (
                  sum +
                  (review.status === 'APPROVED'
                    ? 10
                    : review.status === 'APPROVED_WITH_RESERVATIONS'
                      ? 7
                      : 5)
                );
              }, 0) / task.codeReviews.length;
            roleStats[currentOwner].qualityScores.push(avgQuality);
          }
        }
      }
    });

    const totalTasks = tasks.length;

    return Array.from(allRoles).map((role) => {
      const stats = roleStats[role];

      return {
        role,
        tasksReceived: stats.tasksReceived,
        tasksCompleted: stats.tasksCompleted,
        averageTaskDuration:
          stats.completedTasksWithDuration > 0
            ? Math.round(
                (stats.totalDuration / stats.completedTasksWithDuration) * 10,
              ) / 10
            : 0,
        successRate:
          stats.tasksReceived > 0
            ? Math.round(
                (stats.tasksCompleted / stats.tasksReceived) * 100 * 10,
              ) / 10
            : 0,
        averageHandoffTime:
          stats.handoffCount > 0
            ? Math.round((stats.totalHandoffTime / stats.handoffCount) * 10) /
              10
            : 0,
        redelegationRate:
          stats.totalDelegations > 0
            ? Math.round(
                (stats.redelegations / stats.totalDelegations) * 100 * 10,
              ) / 10
            : 0,
        qualityScore:
          stats.qualityScores.length > 0
            ? Math.round(
                (stats.qualityScores.reduce(
                  (sum: number, score: number) => sum + score,
                  0,
                ) /
                  stats.qualityScores.length) *
                  10,
              ) / 10
            : 0,
        workloadDistribution:
          totalTasks > 0
            ? Math.round((stats.tasksReceived / totalTasks) * 100 * 10) / 10
            : 0,
      };
    });
  }

  private analyzeTaskEfficiency(tasks: any[]): TaskEfficiencyData {
    const taskEfficiencyItems = tasks
      .filter((task) => task.status === 'completed' && task.completionDate)
      .map((task) => {
        const duration =
          (new Date(task.completionDate).getTime() -
            new Date(task.creationDate).getTime()) /
          (1000 * 60 * 60);

        // Complexity assessment based on subtasks and delegations
        const subtaskCount = task.implementationPlans.reduce(
          (sum: number, plan: any) => sum + plan.subtasks.length,
          0,
        );
        const complexity =
          subtaskCount > 10 ? 'High' : subtaskCount > 5 ? 'Medium' : 'Low';

        return {
          taskId: task.taskId,
          taskName: task.name,
          taskSlug: task.taskSlug,
          duration: Math.round(duration * 10) / 10,
          delegationCount: task.delegationRecords.length,
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
          complexity: complexity as 'Low' | 'Medium' | 'High',
        };
      })
      .sort((a, b) => a.duration - b.duration);

    const fastestCompletions = taskEfficiencyItems.slice(0, 5);
    const slowestCompletions = taskEfficiencyItems.slice(-5).reverse();

    // Role pair efficiency
    const rolePairStats: Record<
      string,
      { durations: number[]; successes: number; total: number }
    > = {};

    tasks.forEach((task) => {
      task.delegationRecords.forEach((delegation: any) => {
        const pair = `${delegation.fromMode} → ${delegation.toMode}`;

        if (!rolePairStats[pair]) {
          rolePairStats[pair] = { durations: [], successes: 0, total: 0 };
        }

        rolePairStats[pair].total++;
        if (delegation.success !== false) {
          rolePairStats[pair].successes++;
        }

        if (delegation.delegationTimestamp && delegation.completionTimestamp) {
          const duration =
            (new Date(delegation.completionTimestamp).getTime() -
              new Date(delegation.delegationTimestamp).getTime()) /
            (1000 * 60 * 60);
          rolePairStats[pair].durations.push(duration);
        }
      });
    });

    const rolePairEfficiency = Object.entries(rolePairStats)
      .map(([pair, stats]) => {
        const [fromRole, toRole] = pair.split(' → ');
        const averageDuration =
          stats.durations.length > 0
            ? stats.durations.reduce((sum, d) => sum + d, 0) /
              stats.durations.length
            : 0;
        const successRate =
          stats.total > 0 ? (stats.successes / stats.total) * 100 : 0;

        return {
          fromRole,
          toRole,
          averageDuration: Math.round(averageDuration * 10) / 10,
          successRate: Math.round(successRate * 10) / 10,
          transactionCount: stats.total,
        };
      })
      .filter((item) => item.transactionCount >= 3); // Only include pairs with sufficient data

    const mostEfficientRolePairs = rolePairEfficiency
      .sort(
        (a, b) =>
          b.successRate - a.successRate ||
          a.averageDuration - b.averageDuration,
      )
      .slice(0, 5);

    const leastEfficientRolePairs = rolePairEfficiency
      .sort(
        (a, b) =>
          a.successRate - b.successRate ||
          b.averageDuration - a.averageDuration,
      )
      .slice(0, 5);

    return {
      fastestCompletions,
      slowestCompletions,
      mostEfficientRolePairs,
      leastEfficientRolePairs,
    };
  }

  private analyzeBottlenecks(tasks: any[]): BottleneckAnalysis {
    // This is a simplified bottleneck analysis
    // In practice, you'd want more sophisticated algorithms

    const problematicTransitions: ProblematicTransition[] = [];
    const highRedelegationPairs: RedelegationPair[] = [];
    const roleWorkloadImbalance: WorkloadImbalance[] = [];
    const _timeConsuming: TimeConsumingTask[] = [];

    // Identify time-consuming tasks (simplified)
    const completedTasks = tasks.filter(
      (t) => t.status === 'completed' && t.completionDate,
    );
    const avgDuration =
      completedTasks.length > 0
        ? completedTasks.reduce((sum, task) => {
            const duration =
              (new Date(task.completionDate).getTime() -
                new Date(task.creationDate).getTime()) /
              (1000 * 60 * 60);
            return sum + duration;
          }, 0) / completedTasks.length
        : 0;

    const timeConsumingTasks = completedTasks
      .filter((task) => {
        const duration =
          (new Date(task.completionDate).getTime() -
            new Date(task.creationDate).getTime()) /
          (1000 * 60 * 60);
        return duration > avgDuration * 2; // Tasks taking more than 2x average
      })
      .map((task) => {
        const duration =
          (new Date(task.completionDate).getTime() -
            new Date(task.creationDate).getTime()) /
          (1000 * 60 * 60);
        const expectedDuration = avgDuration;
        const overrunPercentage =
          ((duration - expectedDuration) / expectedDuration) * 100;

        // Find the role that held the task longest
        const roleDurations: Record<string, number> = {};
        task.delegationRecords.forEach((delegation: any) => {
          if (
            delegation.delegationTimestamp &&
            delegation.completionTimestamp
          ) {
            const roleDuration =
              (new Date(delegation.completionTimestamp).getTime() -
                new Date(delegation.delegationTimestamp).getTime()) /
              (1000 * 60 * 60);
            roleDurations[delegation.toMode] =
              (roleDurations[delegation.toMode] || 0) + roleDuration;
          }
        });

        const bottleneckRole =
          Object.entries(roleDurations).sort(([, a], [, b]) => b - a)[0]?.[0] ||
          'Unknown';

        return {
          taskId: task.taskId,
          taskName: task.name,
          duration: Math.round(duration * 10) / 10,
          expectedDuration: Math.round(expectedDuration * 10) / 10,
          overrunPercentage: Math.round(overrunPercentage * 10) / 10,
          bottleneckRole,
        };
      })
      .slice(0, 10);

    return {
      problematicTransitions,
      highRedelegationPairs,
      roleWorkloadImbalance,
      timeConsuming: timeConsumingTasks,
    };
  }

  private async analyzeTrends(
    _startDate: Date,
    _endDate: Date,
    _filters: any,
  ): Promise<TrendAnalysis> {
    // Simplified trend analysis - in practice, you'd calculate trends over multiple periods
    const completionTrend: TrendDataPoint[] = [
      { period: 'Current', value: 75, change: 5.2 },
      { period: 'Previous', value: 71, change: -2.1 },
    ];

    const delegationTrend: TrendDataPoint[] = [
      { period: 'Current', value: 3.2, change: -8.5 },
      { period: 'Previous', value: 3.5, change: 12.1 },
    ];

    const efficiencyTrend: TrendDataPoint[] = [
      { period: 'Current', value: 85, change: 3.7 },
      { period: 'Previous', value: 82, change: 1.2 },
    ];

    const qualityTrend: TrendDataPoint[] = [
      { period: 'Current', value: 8.7, change: 2.4 },
      { period: 'Previous', value: 8.5, change: -1.1 },
    ];

    return Promise.resolve({
      completionTrend,
      delegationTrend,
      efficiencyTrend,
      qualityTrend,
    });
  }

  private calculateDetailedRolePerformance(role: string, tasks: any[]): any {
    // Detailed role-specific performance metrics
    const roleTasks = tasks.filter(
      (task) =>
        task.owner === role ||
        task.delegationRecords.some(
          (d: any) => d.fromMode === role || d.toMode === role,
        ),
    );

    // Additional role-specific calculations would go here
    return {
      tasksHandled: roleTasks.length,
      // Add more detailed metrics specific to the role
    };
  }

  private getTaskBreakdownForRole(role: string, tasks: any[]): any {
    // Task breakdown analysis for a specific role
    const roleTasks = tasks.filter(
      (task) =>
        task.owner === role ||
        task.delegationRecords.some(
          (d: any) => d.fromMode === role || d.toMode === role,
        ),
    );

    return {
      tasksByStatus: roleTasks.reduce(
        (acc, task) => {
          acc[task.status] = (acc[task.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
      tasksByPriority: roleTasks.reduce(
        (acc, task) => {
          const priority = task.priority || 'Medium';
          acc[priority] = (acc[priority] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
    };
  }
}
