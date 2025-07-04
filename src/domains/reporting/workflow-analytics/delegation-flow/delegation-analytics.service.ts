import { Injectable } from '@nestjs/common';
import { DelegationRecordWithRelations } from '../../shared/types';

@Injectable()
export class DelegationAnalyticsService {
  /**
   * Calculate cross-task delegation analytics
   */
  calculateCrossTaskAnalytics(allDelegations: DelegationRecordWithRelations[]) {
    // Cross-task delegation patterns analysis
    const roleTransitions: Record<string, number> = {};
    const roleEfficiency: Record<
      string,
      { total: number; successful: number }
    > = {};

    allDelegations.forEach((delegation) => {
      const transition = `${delegation.fromMode} → ${delegation.toMode}`;
      roleTransitions[transition] = (roleTransitions[transition] || 0) + 1;

      if (!roleEfficiency[delegation.toMode]) {
        roleEfficiency[delegation.toMode] = {
          total: 0,
          successful: 0,
        };
      }

      roleEfficiency[delegation.toMode].total++;
      if (delegation.success) {
        roleEfficiency[delegation.toMode].successful++;
      }
    });

    const mostCommonTransitions =
      this.getMostCommonTransitions(roleTransitions);
    const rolePerformance = this.calculateRolePerformance(roleEfficiency);

    return {
      mostCommonTransitions,
      rolePerformance,
      totalDelegations: allDelegations.length,
      overallSuccessRate: this.calculateOverallSuccessRate(allDelegations),
    };
  }

  /**
   * Get most common delegation transitions
   */
  private getMostCommonTransitions(roleTransitions: Record<string, number>) {
    return Object.entries(roleTransitions)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([transition, count]) => ({ transition, count }));
  }

  /**
   * Calculate role performance metrics
   */
  private calculateRolePerformance(
    roleEfficiency: Record<string, { total: number; successful: number }>,
  ) {
    return Object.entries(roleEfficiency)
      .map(([role, stats]) => ({
        role,
        successRate: (stats.successful / stats.total) * 100,
        totalTasks: stats.total,
      }))
      .sort((a, b) => b.successRate - a.successRate);
  }

  /**
   * Calculate overall success rate across all delegations
   */
  private calculateOverallSuccessRate(
    allDelegations: DelegationRecordWithRelations[],
  ): number {
    if (allDelegations.length === 0) return 0;

    const successfulDelegations = allDelegations.filter(
      (d) => d.success,
    ).length;
    return (successfulDelegations / allDelegations.length) * 100;
  }
}
