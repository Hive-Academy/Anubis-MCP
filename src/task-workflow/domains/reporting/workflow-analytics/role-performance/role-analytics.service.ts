import { Injectable } from '@nestjs/common';
import { FormattedTaskData, FormattedDelegationData } from '../../shared/types';

@Injectable()
export class RoleAnalyticsService {
  /**
   * Calculate comparative analysis between roles
   */
  calculateComparativeAnalysis(
    roleMetrics: Array<{
      role: string;
      tasksReceived: number;
      tasksCompleted: number;
      averageCompletionTime: number;
      successRate: number;
      delegationEfficiency: number;
      workloadDistribution: number;
      qualityScore: number;
    }>,
  ) {
    // Top performers by different metrics
    const topPerformers = [
      ...this.getTopPerformers(roleMetrics, 'successRate', 'Success Rate'),
      ...this.getTopPerformers(
        roleMetrics,
        'delegationEfficiency',
        'Delegation Efficiency',
      ),
      ...this.getTopPerformers(roleMetrics, 'qualityScore', 'Overall Quality'),
    ];

    // Improvement areas
    const improvementAreas = this.identifyImprovementAreas(roleMetrics);

    return {
      topPerformers,
      improvementAreas,
    };
  }

  /**
   * Calculate time series analysis for role performance trends
   */
  calculateTimeSeriesAnalysis(
    _tasks: FormattedTaskData[],
    delegations: FormattedDelegationData[],
  ) {
    const monthlyMetrics: Record<
      string,
      Record<
        string,
        {
          completionRate: number;
          averageDuration: number;
          taskCount: number;
        }
      >
    > = {};

    // Group delegations by month and role
    delegations.forEach((d) => {
      const month = new Date(d.delegationTimestamp).toISOString().slice(0, 7);

      if (!monthlyMetrics[month]) {
        monthlyMetrics[month] = {};
      }

      if (!monthlyMetrics[month][d.toMode]) {
        monthlyMetrics[month][d.toMode] = {
          completionRate: 0,
          averageDuration: 0,
          taskCount: 0,
        };
      }

      monthlyMetrics[month][d.toMode].taskCount++;
      if (d.success) {
        monthlyMetrics[month][d.toMode].completionRate++;
      }
      if (d.duration > 0) {
        monthlyMetrics[month][d.toMode].averageDuration += d.duration;
      }
    });

    // Calculate final metrics
    const performanceTrends = Object.entries(monthlyMetrics)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, roleData]) => {
        const roleMetrics: Record<
          string,
          {
            completionRate: number;
            averageDuration: number;
            taskCount: number;
          }
        > = {};

        Object.entries(roleData).forEach(([role, metrics]) => {
          roleMetrics[role] = {
            completionRate:
              metrics.taskCount > 0
                ? Math.round(
                    (metrics.completionRate / metrics.taskCount) * 100 * 10,
                  ) / 10
                : 0,
            averageDuration:
              metrics.taskCount > 0
                ? Math.round(
                    (metrics.averageDuration / metrics.taskCount) * 10,
                  ) / 10
                : 0,
            taskCount: metrics.taskCount,
          };
        });

        return {
          period,
          roleMetrics,
        };
      });

    return {
      performanceTrends,
    };
  }

  /**
   * Calculate workload analysis and balance recommendations
   */
  calculateWorkloadAnalysis(
    _tasks: FormattedTaskData[],
    delegations: FormattedDelegationData[],
  ) {
    const currentWorkload = this.calculateCurrentWorkload(delegations);
    const balanceRecommendations =
      this.generateBalanceRecommendations(currentWorkload);

    return {
      currentWorkload,
      balanceRecommendations,
    };
  }

  private getTopPerformers(
    roleMetrics: Array<{ role: string; [key: string]: any }>,
    metric: string,
    metricName: string,
  ) {
    return roleMetrics
      .sort((a, b) => b[metric] - a[metric])
      .slice(0, 3)
      .map((role, index) => ({
        role: role.role,
        metric: metricName,
        value: role[metric],
        rank: index + 1,
      }));
  }

  private identifyImprovementAreas(
    roleMetrics: Array<{
      role: string;
      successRate: number;
      averageCompletionTime: number;
      delegationEfficiency: number;
      qualityScore: number;
    }>,
  ) {
    const improvementAreas: Array<{
      role: string;
      issue: string;
      impact: 'low' | 'medium' | 'high';
      recommendation: string;
    }> = [];

    roleMetrics.forEach((role) => {
      if (role.successRate < 70) {
        improvementAreas.push({
          role: role.role,
          issue: 'Low success rate',
          impact: 'high',
          recommendation:
            'Review task complexity and provide additional training or support',
        });
      }

      if (role.averageCompletionTime > 48) {
        improvementAreas.push({
          role: role.role,
          issue: 'Slow completion time',
          impact: 'medium',
          recommendation: 'Analyze bottlenecks and optimize workflow processes',
        });
      }

      if (role.delegationEfficiency < 60) {
        improvementAreas.push({
          role: role.role,
          issue: 'High redelegation rate',
          impact: 'high',
          recommendation:
            'Improve initial task assessment and delegation criteria',
        });
      }
    });

    return improvementAreas;
  }

  private calculateCurrentWorkload(delegations: FormattedDelegationData[]) {
    const workloadStats: Record<
      string,
      {
        activeTasks: number;
        pendingTasks: number;
      }
    > = {};

    // Count active and pending tasks by role
    delegations.forEach((d) => {
      if (!workloadStats[d.toMode]) {
        workloadStats[d.toMode] = { activeTasks: 0, pendingTasks: 0 };
      }

      // Simplified workload calculation
      if (d.success === null) {
        workloadStats[d.toMode].pendingTasks++;
      } else if (d.success === true) {
        workloadStats[d.toMode].activeTasks++;
      }
    });

    return Object.entries(workloadStats).map(([role, stats]) => {
      const totalLoad = stats.activeTasks + stats.pendingTasks;
      let capacity: 'underutilized' | 'optimal' | 'overloaded';

      if (totalLoad < 5) {
        capacity = 'underutilized';
      } else if (totalLoad <= 15) {
        capacity = 'optimal';
      } else {
        capacity = 'overloaded';
      }

      return {
        role,
        activeTasks: stats.activeTasks,
        pendingTasks: stats.pendingTasks,
        capacity,
      };
    });
  }

  private generateBalanceRecommendations(
    currentWorkload: Array<{
      role: string;
      capacity: 'underutilized' | 'optimal' | 'overloaded';
    }>,
  ): string[] {
    const recommendations: string[] = [];

    const overloaded = currentWorkload.filter(
      (w) => w.capacity === 'overloaded',
    );
    const underutilized = currentWorkload.filter(
      (w) => w.capacity === 'underutilized',
    );

    if (overloaded.length > 0 && underutilized.length > 0) {
      recommendations.push(
        `Consider redistributing tasks from overloaded roles (${overloaded.map((r) => r.role).join(', ')}) ` +
          `to underutilized roles (${underutilized.map((r) => r.role).join(', ')})`,
      );
    }

    if (overloaded.length > 0) {
      recommendations.push(
        `Review task complexity and delegation criteria for overloaded roles: ${overloaded.map((r) => r.role).join(', ')}`,
      );
    }

    if (underutilized.length > 0) {
      recommendations.push(
        `Consider expanding responsibilities or cross-training for underutilized roles: ${underutilized.map((r) => r.role).join(', ')}`,
      );
    }

    return recommendations;
  }
}
