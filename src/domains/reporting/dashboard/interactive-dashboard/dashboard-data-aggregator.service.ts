import { Injectable } from '@nestjs/common';
import {
  FormattedTaskData,
  FormattedDelegationData,
  FormattedWorkflowData,
  TaskWithRelations,
  DelegationRecordWithRelations,
} from '../../shared/types';

@Injectable()
export class DashboardDataAggregatorService {
  /**
   * Calculate summary metrics for dashboard overview
   */
  calculateSummaryMetrics(
    tasks: FormattedTaskData[],
    delegations: FormattedDelegationData[],
  ) {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'completed').length;
    const inProgressTasks = tasks.filter(
      (t) => t.status === 'in-progress',
    ).length;
    const completionRate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const completedTasksWithDuration = tasks.filter(
      (t) => t.status === 'completed' && t.duration > 0,
    );
    const averageCompletionTime =
      completedTasksWithDuration.length > 0
        ? Math.round(
            (completedTasksWithDuration.reduce(
              (sum, t) => sum + t.duration,
              0,
            ) /
              completedTasksWithDuration.length) *
              10,
          ) / 10
        : 0;

    const totalDelegations = delegations.length;
    const successfulDelegations = delegations.filter(
      (d) => d.success === true,
    ).length;
    const delegationSuccessRate =
      totalDelegations > 0
        ? Math.round((successfulDelegations / totalDelegations) * 100)
        : 0;

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      completionRate,
      averageCompletionTime,
      totalDelegations,
      delegationSuccessRate,
    };
  }

  /**
   * Calculate task distribution by various dimensions
   */
  calculateTaskDistribution(
    formattedTasks: FormattedTaskData[],
    rawTasks: TaskWithRelations[],
  ) {
    // Status distribution
    const byStatus = formattedTasks.reduce(
      (acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Priority distribution
    const byPriority = rawTasks.reduce(
      (acc, task) => {
        const priority = task.priority || 'Unknown';
        acc[priority] = (acc[priority] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Owner distribution
    const byOwner = rawTasks.reduce(
      (acc, task) => {
        const owner = task.owner || 'Unassigned';
        acc[owner] = (acc[owner] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      byStatus,
      byPriority,
      byOwner,
    };
  }

  /**
   * Calculate workflow metrics including role efficiency and bottlenecks
   */
  calculateWorkflowMetrics(
    delegations: FormattedDelegationData[],
    _transitions: FormattedWorkflowData[],
    rawDelegations: DelegationRecordWithRelations[],
  ) {
    const roleEfficiency = this.calculateRoleEfficiency(delegations);
    const delegationFlow = this.calculateDelegationFlow(delegations);
    const bottlenecks = this.calculateBottlenecks(delegations, rawDelegations);

    return {
      roleEfficiency,
      delegationFlow,
      bottlenecks,
    };
  }

  /**
   * Calculate recent activity for dashboard updates
   */
  calculateRecentActivity(
    _formattedTasks: FormattedTaskData[],
    delegations: FormattedDelegationData[],
    rawTasks: TaskWithRelations[],
  ) {
    // Recent tasks (last 10 updated)
    const recentTasks = rawTasks
      .sort((a, b) => {
        const aDate = a.completionDate || a.createdAt;
        const bDate = b.completionDate || b.createdAt;
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      })
      .slice(0, 10)
      .map((task) => ({
        id: task.id,
        name: task.name,
        status: task.status,
        lastUpdate: (task.completionDate || task.createdAt).toISOString(),
        owner: task.owner,
      }));

    // Recent delegations (last 10)
    const recentDelegations = delegations
      .sort(
        (a, b) =>
          new Date(b.delegationTimestamp).getTime() -
          new Date(a.delegationTimestamp).getTime(),
      )
      .slice(0, 10)
      .map((delegation) => ({
        taskName: delegation.taskName || 'Unknown Task',
        fromRole: delegation.fromMode,
        toRole: delegation.toMode,
        timestamp: delegation.delegationTimestamp,
        success: delegation.success,
      }));

    return {
      recentTasks,
      recentDelegations,
    };
  }

  private calculateRoleEfficiency(delegations: FormattedDelegationData[]) {
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

      // Handle success calculation: treat as successful if explicitly true,
      // or if success is null but delegation has been completed (has duration > 0)
      const isSuccessful =
        d.success === true || (d.success === null && d.duration > 0);
      if (isSuccessful) {
        roleStats[d.toMode].successful++;
      }

      if (d.duration > 0) {
        roleStats[d.toMode].totalDuration += d.duration;
        roleStats[d.toMode].tasksCompleted++;
      }
    });

    return Object.entries(roleStats).map(([role, stats]) => ({
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
  }

  private calculateDelegationFlow(delegations: FormattedDelegationData[]) {
    const flowStats: Record<string, { total: number; successful: number }> = {};

    delegations.forEach((d) => {
      const key = `${d.fromMode} → ${d.toMode}`;
      if (!flowStats[key]) {
        flowStats[key] = { total: 0, successful: 0 };
      }
      flowStats[key].total++;

      // Handle success calculation: treat as successful if explicitly true,
      // or if success is null but delegation has been completed (has duration > 0)
      const isSuccessful =
        d.success === true || (d.success === null && d.duration > 0);
      if (isSuccessful) {
        flowStats[key].successful++;
      }
    });

    return Object.entries(flowStats)
      .map(([flow, stats]) => {
        const [fromMode, toMode] = flow.split(' → ');
        return {
          fromMode,
          toMode,
          count: stats.total,
          successRate:
            Math.round((stats.successful / stats.total) * 100 * 10) / 10,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private calculateBottlenecks(
    delegations: FormattedDelegationData[],
    _rawDelegations: DelegationRecordWithRelations[],
  ) {
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
