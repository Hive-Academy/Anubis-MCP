import { Injectable } from '@nestjs/common';
import {
  FormattedDelegationData,
  DelegationRecordWithRelations,
} from '../../shared/types';

@Injectable()
export class DelegationSummaryService {
  /**
   * Calculate comprehensive delegation summary statistics
   */
  calculateDelegationSummary(
    delegationChain: FormattedDelegationData[],
    rawDelegations: DelegationRecordWithRelations[],
  ) {
    const totalDelegations = delegationChain.length;
    const successfulDelegations = delegationChain.filter(
      (d) => d.success === true,
    ).length;
    const failedDelegations = delegationChain.filter(
      (d) => d.success === false,
    ).length;

    // Calculate average duration for completed delegations
    const completedDelegations = delegationChain.filter(
      (d) => d.duration !== undefined && d.duration !== null,
    );
    const averageDelegationDuration =
      completedDelegations.length > 0
        ? completedDelegations.reduce((sum, d) => sum + (d.duration || 0), 0) /
          completedDelegations.length
        : 0;

    // Calculate most common delegation paths
    const mostCommonPath = this.calculateMostCommonPaths(delegationChain);

    // Calculate redelegation points
    const redelegationPoints = this.calculateRedelegationPoints(
      delegationChain,
      rawDelegations,
    );

    // Calculate role involvement statistics
    const roleInvolvement = this.calculateRoleInvolvement(delegationChain);

    return {
      totalDelegations,
      successfulDelegations,
      failedDelegations,
      averageDelegationDuration:
        Math.round(averageDelegationDuration * 10) / 10,
      mostCommonPath,
      redelegationPoints,
      roleInvolvement,
    };
  }

  /**
   * Calculate most common delegation paths
   */
  private calculateMostCommonPaths(
    delegationChain: FormattedDelegationData[],
  ): string[] {
    const pathCounts: Record<string, number> = {};

    for (let i = 0; i < delegationChain.length - 1; i++) {
      const path = `${delegationChain[i].fromMode} → ${delegationChain[i].toMode}`;
      pathCounts[path] = (pathCounts[path] || 0) + 1;
    }

    return Object.entries(pathCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([path]) => path);
  }

  /**
   * Calculate redelegation hotspots and reasons
   */
  private calculateRedelegationPoints(
    delegationChain: FormattedDelegationData[],
    rawDelegations: DelegationRecordWithRelations[],
  ) {
    const redelegationCounts: Record<
      string,
      { count: number; reasons: string[] }
    > = {};

    delegationChain
      .filter((d) => d.success === false)
      .forEach((d) => {
        const key = `${d.fromMode} → ${d.toMode}`;
        if (!redelegationCounts[key]) {
          redelegationCounts[key] = { count: 0, reasons: [] };
        }
        redelegationCounts[key].count++;

        // Find corresponding raw delegation for rejection reason
        const rawDelegation = rawDelegations.find(
          (raw) =>
            raw.id === d.id &&
            raw.fromMode === d.fromMode &&
            raw.toMode === d.toMode,
        );

        if (
          rawDelegation?.rejectionReason &&
          !redelegationCounts[key].reasons.includes(
            rawDelegation.rejectionReason,
          )
        ) {
          redelegationCounts[key].reasons.push(rawDelegation.rejectionReason);
        }
      });

    return Object.entries(redelegationCounts).map(([path, data]) => {
      const [fromMode, toMode] = path.split(' → ');
      return {
        fromMode,
        toMode,
        count: data.count,
        reasons: data.reasons,
      };
    });
  }

  /**
   * Calculate role involvement and performance statistics
   */
  private calculateRoleInvolvement(delegationChain: FormattedDelegationData[]) {
    const roleStats: Record<
      string,
      { received: number; delegated: number; durations: number[] }
    > = {};

    delegationChain.forEach((d) => {
      if (!roleStats[d.toMode]) {
        roleStats[d.toMode] = { received: 0, delegated: 0, durations: [] };
      }
      if (!roleStats[d.fromMode]) {
        roleStats[d.fromMode] = { received: 0, delegated: 0, durations: [] };
      }

      roleStats[d.toMode].received++;
      roleStats[d.fromMode].delegated++;

      if (d.duration) {
        roleStats[d.toMode].durations.push(d.duration);
      }
    });

    return Object.entries(roleStats).map(([role, stats]) => ({
      role,
      timeAsOwner: stats.durations.reduce((sum, d) => sum + d, 0),
      tasksReceived: stats.received,
      tasksDelegated: stats.delegated,
      successRate:
        stats.delegated > 0 ? (stats.received / stats.delegated) * 100 : 100,
    }));
  }
}
