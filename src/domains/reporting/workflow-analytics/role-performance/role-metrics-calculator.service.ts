import { Injectable } from '@nestjs/common';
import {
  DelegationRecordWithRelations,
  FormattedTaskData,
  FormattedDelegationData,
} from '../../shared/types';

@Injectable()
export class RoleMetricsCalculatorService {
  /**
   * Calculate comprehensive role metrics
   */
  calculateRoleMetrics(
    _tasks: FormattedTaskData[],
    delegations: FormattedDelegationData[],
    rawDelegations: DelegationRecordWithRelations[],
  ) {
    const roleStats: Record<
      string,
      {
        tasksReceived: number;
        tasksCompleted: number;
        totalDuration: number;
        successfulDelegations: number;
        totalDelegations: number;
        completedDurations: number[];
      }
    > = {};

    // Initialize role stats from delegations
    delegations.forEach((d) => {
      if (!roleStats[d.toMode]) {
        roleStats[d.toMode] = {
          tasksReceived: 0,
          tasksCompleted: 0,
          totalDuration: 0,
          successfulDelegations: 0,
          totalDelegations: 0,
          completedDurations: [],
        };
      }

      roleStats[d.toMode].tasksReceived++;
      roleStats[d.toMode].totalDelegations++;

      if (d.success) {
        roleStats[d.toMode].successfulDelegations++;
      }

      if (d.duration > 0) {
        roleStats[d.toMode].totalDuration += d.duration;
        roleStats[d.toMode].completedDurations.push(d.duration);
        roleStats[d.toMode].tasksCompleted++;
      }
    });

    // Calculate metrics for each role
    return Object.entries(roleStats).map(([role, stats]) => {
      const averageCompletionTime =
        stats.completedDurations.length > 0
          ? stats.completedDurations.reduce((sum, d) => sum + d, 0) /
            stats.completedDurations.length
          : 0;

      const successRate =
        stats.totalDelegations > 0
          ? (stats.successfulDelegations / stats.totalDelegations) * 100
          : 0;

      const delegationEfficiency = this.calculateDelegationEfficiency(
        role,
        rawDelegations,
      );
      const workloadDistribution = this.calculateWorkloadDistribution(
        role,
        delegations,
      );
      const qualityScore = this.calculateQualityScore(
        successRate,
        averageCompletionTime,
        delegationEfficiency,
      );

      return {
        role,
        tasksReceived: stats.tasksReceived,
        tasksCompleted: stats.tasksCompleted,
        averageCompletionTime: Math.round(averageCompletionTime * 10) / 10,
        successRate: Math.round(successRate * 10) / 10,
        delegationEfficiency: Math.round(delegationEfficiency * 10) / 10,
        workloadDistribution: Math.round(workloadDistribution * 10) / 10,
        qualityScore: Math.round(qualityScore * 10) / 10,
      };
    });
  }

  private calculateDelegationEfficiency(
    role: string,
    delegations: DelegationRecordWithRelations[],
  ): number {
    const roleDelegations = delegations.filter((d) => d.toMode === role);
    if (roleDelegations.length === 0) return 0;

    const successfulDelegations = roleDelegations.filter(
      (d) => d.success === true,
    ).length;
    const redelegations = roleDelegations.filter(
      (d) => d.success === false,
    ).length;

    // Efficiency score based on success rate and redelegation penalty
    const baseEfficiency =
      (successfulDelegations / roleDelegations.length) * 100;
    const redelegationPenalty = (redelegations / roleDelegations.length) * 20; // 20% penalty per redelegation

    return Math.max(0, baseEfficiency - redelegationPenalty);
  }

  private calculateWorkloadDistribution(
    role: string,
    delegations: FormattedDelegationData[],
  ): number {
    const totalDelegations = delegations.length;
    const roleDelegations = delegations.filter((d) => d.toMode === role).length;

    if (totalDelegations === 0) return 0;

    return (roleDelegations / totalDelegations) * 100;
  }

  private calculateQualityScore(
    successRate: number,
    averageCompletionTime: number,
    delegationEfficiency: number,
  ): number {
    // Weighted quality score
    const successWeight = 0.4;
    const speedWeight = 0.3; // Lower completion time is better
    const efficiencyWeight = 0.3;

    // Normalize speed score (assuming 24 hours is baseline, lower is better)
    const speedScore =
      averageCompletionTime > 0
        ? Math.max(0, 100 - (averageCompletionTime / 24) * 100)
        : 0;

    return (
      successRate * successWeight +
      speedScore * speedWeight +
      delegationEfficiency * efficiencyWeight
    );
  }
}
