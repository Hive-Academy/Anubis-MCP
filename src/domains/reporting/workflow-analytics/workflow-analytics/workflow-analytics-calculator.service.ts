import { Injectable } from '@nestjs/common';
import {
  DelegationRecordWithRelations,
  FormattedTaskData,
  FormattedDelegationData,
  FormattedWorkflowData,
} from '../../shared/types';

@Injectable()
export class WorkflowAnalyticsCalculatorService {
  /**
   * Calculate task analytics including status and priority distributions
   */
  calculateTaskAnalytics(tasks: FormattedTaskData[]) {
    // Status distribution
    const statusDistribution: Record<string, number> = {};
    tasks.forEach((task) => {
      statusDistribution[task.status] =
        (statusDistribution[task.status] || 0) + 1;
    });

    // Priority distribution
    const priorityDistribution: Record<string, number> = {};
    tasks.forEach((task) => {
      const priority = task.priority || 'Unknown';
      priorityDistribution[priority] =
        (priorityDistribution[priority] || 0) + 1;
    });

    // Completion trends (simplified - by month)
    const completionTrends = this.calculateCompletionTrends(tasks);

    return {
      statusDistribution,
      priorityDistribution,
      completionTrends,
    };
  }

  /**
   * Calculate delegation analytics including role transitions and hotspots
   */
  calculateDelegationAnalytics(
    delegations: FormattedDelegationData[],
    rawDelegations: DelegationRecordWithRelations[],
  ) {
    // Role transitions with success rates
    const transitionStats: Record<
      string,
      { total: number; successful: number }
    > = {};
    delegations.forEach((d) => {
      const key = `${d.fromMode} → ${d.toMode}`;
      if (!transitionStats[key]) {
        transitionStats[key] = { total: 0, successful: 0 };
      }
      transitionStats[key].total++;
      if (d.success) {
        transitionStats[key].successful++;
      }
    });

    const roleTransitions = Object.entries(transitionStats).map(
      ([transition, stats]) => {
        const [fromMode, toMode] = transition.split(' → ');
        return {
          fromMode,
          toMode,
          count: stats.total,
          successRate:
            Math.round((stats.successful / stats.total) * 100 * 10) / 10,
        };
      },
    );

    // Average delegation duration by role
    const roleDurations: Record<string, number[]> = {};
    delegations.forEach((d) => {
      if (d.duration > 0) {
        if (!roleDurations[d.toMode]) {
          roleDurations[d.toMode] = [];
        }
        roleDurations[d.toMode].push(d.duration);
      }
    });

    const averageDelegationDuration: Record<string, number> = {};
    Object.entries(roleDurations).forEach(([role, durations]) => {
      averageDelegationDuration[role] =
        Math.round(
          (durations.reduce((sum, d) => sum + d, 0) / durations.length) * 10,
        ) / 10;
    });

    // Redelegation hotspots
    const redelegationHotspots =
      this.calculateRedelegationHotspots(rawDelegations);

    return {
      roleTransitions,
      averageDelegationDuration,
      redelegationHotspots,
    };
  }

  /**
   * Calculate performance metrics including role efficiency and bottlenecks
   */
  calculatePerformanceMetrics(
    delegations: FormattedDelegationData[],
    _transitions: FormattedWorkflowData[],
  ) {
    // Role efficiency
    const roleStats: Record<
      string,
      {
        tasksCompleted: number;
        totalDuration: number;
        successful: number;
        total: number;
      }
    > = {};

    delegations.forEach((d) => {
      if (!roleStats[d.toMode]) {
        roleStats[d.toMode] = {
          tasksCompleted: 0,
          totalDuration: 0,
          successful: 0,
          total: 0,
        };
      }

      roleStats[d.toMode].total++;
      if (d.success) {
        roleStats[d.toMode].successful++;
      }
      if (d.duration > 0) {
        roleStats[d.toMode].totalDuration += d.duration;
        roleStats[d.toMode].tasksCompleted++;
      }
    });

    const roleEfficiency = Object.entries(roleStats).map(([role, stats]) => ({
      role,
      tasksCompleted: stats.tasksCompleted,
      averageDuration:
        stats.tasksCompleted > 0
          ? Math.round((stats.totalDuration / stats.tasksCompleted) * 10) / 10
          : 0,
      successRate:
        stats.total > 0
          ? Math.round((stats.successful / stats.total) * 100 * 10) / 10
          : 0,
    }));

    // Bottlenecks (simplified)
    const bottlenecks = this.calculateBottlenecks(delegations);

    return {
      roleEfficiency,
      bottlenecks,
    };
  }

  private calculateCompletionTrends(tasks: FormattedTaskData[]) {
    const trends: Record<string, { completed: number; started: number }> = {};

    tasks.forEach((task) => {
      const creationMonth = new Date(task.creationDate)
        .toISOString()
        .slice(0, 7); // YYYY-MM
      if (!trends[creationMonth]) {
        trends[creationMonth] = { completed: 0, started: 0 };
      }
      trends[creationMonth].started++;

      if (task.status === 'completed' && task.completionDate) {
        const completionMonth = new Date(task.completionDate)
          .toISOString()
          .slice(0, 7);
        if (!trends[completionMonth]) {
          trends[completionMonth] = { completed: 0, started: 0 };
        }
        trends[completionMonth].completed++;
      }
    });

    return Object.entries(trends)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, data]) => ({
        period,
        completed: data.completed,
        started: data.started,
      }));
  }

  private calculateRedelegationHotspots(
    delegations: DelegationRecordWithRelations[],
  ) {
    const hotspots: Record<string, { count: number; reasons: string[] }> = {};

    delegations
      .filter((d) => d.success === false)
      .forEach((d) => {
        const transition = `${d.fromMode} → ${d.toMode}`;
        if (!hotspots[transition]) {
          hotspots[transition] = { count: 0, reasons: [] };
        }
        hotspots[transition].count++;

        if (
          d.rejectionReason &&
          !hotspots[transition].reasons.includes(d.rejectionReason)
        ) {
          hotspots[transition].reasons.push(d.rejectionReason);
        }
      });

    return Object.entries(hotspots)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 10)
      .map(([transition, data]) => ({
        transition,
        count: data.count,
        reasons: data.reasons,
      }));
  }

  private calculateBottlenecks(delegations: FormattedDelegationData[]) {
    const stageWaitTimes: Record<string, number[]> = {};

    delegations.forEach((d) => {
      if (d.duration > 0) {
        if (!stageWaitTimes[d.toMode]) {
          stageWaitTimes[d.toMode] = [];
        }
        stageWaitTimes[d.toMode].push(d.duration);
      }
    });

    return Object.entries(stageWaitTimes)
      .map(([stage, waitTimes]) => ({
        stage,
        averageWaitTime:
          Math.round(
            (waitTimes.reduce((sum, t) => sum + t, 0) / waitTimes.length) * 10,
          ) / 10,
        taskCount: waitTimes.length,
      }))
      .sort((a, b) => b.averageWaitTime - a.averageWaitTime)
      .slice(0, 5);
  }
}
