import { Injectable, Logger } from '@nestjs/common';

/**
 * Timing Metrics Service
 *
 * Single Responsibility: Calculate time-based metrics for delegations
 * Handles: Handoff times, completion times, success rates, redelegation counts
 */
@Injectable()
export class TimingMetricsService {
  private readonly logger = new Logger(TimingMetricsService.name);

  /**
   * Calculate average handoff time between delegations
   */
  calculateAverageHandoffTime(delegations: any[]): number {
    let totalHandoffTime = 0;
    let handoffCount = 0;

    for (let i = 1; i < delegations.length; i++) {
      const prevDelegation = delegations[i - 1];
      const currentDelegation = delegations[i];

      if (prevDelegation.taskId === currentDelegation.taskId) {
        const timeDiff =
          new Date(currentDelegation.delegationTimestamp).getTime() -
          new Date(prevDelegation.delegationTimestamp).getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);

        if (hoursDiff > 0 && hoursDiff < 168) {
          // Ignore handoffs > 1 week (likely different work sessions)
          totalHandoffTime += hoursDiff;
          handoffCount++;
        }
      }
    }

    const avgHandoffTime =
      handoffCount > 0 ? totalHandoffTime / handoffCount : 0;
    this.logger.debug(
      `Average handoff time calculated: ${avgHandoffTime.toFixed(2)} hours`,
    );

    return avgHandoffTime;
  }

  /**
   * Calculate success rate with detailed breakdown
   */
  calculateSuccessRate(delegations: any[]): {
    successRate: number;
    successful: number;
    failed: number;
    pending: number;
    total: number;
  } {
    const successfulDelegations = delegations.filter(
      (d) => d.success === true,
    ).length;
    const failedDelegations = delegations.filter(
      (d) => d.success === false,
    ).length;
    const pendingDelegations = delegations.filter(
      (d) => d.success === null,
    ).length;
    const totalDelegations = delegations.length;

    // Success rate calculation: successful / (successful + failed)
    // Pending delegations are not included in success rate calculation
    const completedDelegations = successfulDelegations + failedDelegations;
    const successRate =
      completedDelegations > 0
        ? (successfulDelegations / completedDelegations) * 100
        : 0;

    this.logger.debug(
      `Success rate breakdown: ${successfulDelegations} successful, ${failedDelegations} failed, ${pendingDelegations} pending`,
    );

    return {
      successRate,
      successful: successfulDelegations,
      failed: failedDelegations,
      pending: pendingDelegations,
      total: totalDelegations,
    };
  }

  /**
   * Calculate delegation completion time for individual delegations
   */
  calculateDelegationCompletionTime(delegations: any[]): number {
    if (delegations.length === 0) return 0;

    const completionTimes = delegations
      .filter((d) => d.delegationTimestamp && d.completionTimestamp)
      .map((d) => {
        const start = new Date(d.delegationTimestamp);
        const end = new Date(d.completionTimestamp);
        return (end.getTime() - start.getTime()) / (1000 * 60 * 60); // hours
      });

    const avgTime =
      completionTimes.length > 0
        ? completionTimes.reduce((sum, time) => sum + time, 0) /
          completionTimes.length
        : 0;

    this.logger.debug(
      `Average delegation completion time: ${avgTime.toFixed(2)} hours`,
    );
    return avgTime;
  }

  /**
   * Generate weekly trends for the last 4 weeks
   */
  generateWeeklyTrends(delegations: any[]): {
    successful: number[];
    failed: number[];
  } {
    // Group delegations by week for the last 4 weeks
    const now = new Date();
    const fourWeeksAgo = new Date(now.getTime() - 4 * 7 * 24 * 60 * 60 * 1000);

    const weeklyData = { successful: [0, 0, 0, 0], failed: [0, 0, 0, 0] };

    delegations
      .filter(
        (d) =>
          d.delegationTimestamp &&
          new Date(d.delegationTimestamp) >= fourWeeksAgo,
      )
      .forEach((delegation) => {
        const delegationDate = new Date(delegation.delegationTimestamp);
        const weekIndex = Math.floor(
          (now.getTime() - delegationDate.getTime()) /
            (7 * 24 * 60 * 60 * 1000),
        );

        if (weekIndex >= 0 && weekIndex < 4) {
          const arrayIndex = 3 - weekIndex; // Reverse order (oldest to newest)
          if (delegation.success === true) {
            weeklyData.successful[arrayIndex]++;
          } else if (delegation.success === false) {
            weeklyData.failed[arrayIndex]++;
          }
        }
      });

    this.logger.debug(`Weekly trends generated: ${JSON.stringify(weeklyData)}`);
    return weeklyData;
  }
}
