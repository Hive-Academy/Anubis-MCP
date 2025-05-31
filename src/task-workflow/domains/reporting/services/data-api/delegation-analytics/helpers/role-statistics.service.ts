import { Injectable, Logger } from '@nestjs/common';

/**
 * Role Statistics Service
 *
 * Single Responsibility: Calculate role-based statistics and efficiency metrics
 * Handles: Role delegation counts, efficiency calculations, most efficient role detection
 */
@Injectable()
export class RoleStatisticsService {
  private readonly logger = new Logger(RoleStatisticsService.name);

  /**
   * Calculate role statistics from delegations
   */
  calculateRoleStats(delegations: any[]): {
    boomerang: number;
    researcher: number;
    architect: number;
    'senior-developer': number;
    'code-review': number;
  } {
    const roleStats = {
      architect: 0,
      'senior-developer': 0,
      'code-review': 0,
      boomerang: 0,
      researcher: 0,
    };

    delegations.forEach((delegation) => {
      if (
        delegation.toMode &&
        Object.prototype.hasOwnProperty.call(roleStats, delegation.toMode)
      ) {
        roleStats[delegation.toMode as keyof typeof roleStats]++;
      }
    });

    this.logger.debug(`Role stats calculated: ${JSON.stringify(roleStats)}`);
    return roleStats;
  }

  /**
   * Calculate enhanced role efficiency with weighted scoring
   * - Successful delegations: 1.0 weight
   * - Pending delegations: 0.7 weight (work in progress)
   * - Failed delegations: 0.0 weight
   */
  calculateRoleEfficiency(delegations: any[]): {
    boomerang: number;
    researcher: number;
    architect: number;
    'senior-developer': number;
    'code-review': number;
  } {
    const roleEfficiency = {
      'senior-developer': 0,
      'code-review': 0,
      boomerang: 0,
      researcher: 0,
      architect: 0,
    };

    // Calculate enhanced efficiency based on successful task completion
    Object.keys(roleEfficiency).forEach((role) => {
      const roleDelegations = delegations.filter((d) => d.toMode === role);
      const roleSuccessful = roleDelegations.filter(
        (d) => d.success === true,
      ).length;
      const rolePending = roleDelegations.filter(
        (d) => d.success === null,
      ).length;
      const roleTotal = roleDelegations.length;

      if (roleTotal > 0) {
        // Enhanced efficiency calculation with weighted scoring
        const weightedScore = roleSuccessful * 1.0 + rolePending * 0.7;
        const efficiency = Math.min(weightedScore / roleTotal, 1.0);
        // Round to 3 decimal places to avoid floating point precision issues
        roleEfficiency[role as keyof typeof roleEfficiency] =
          Math.round(efficiency * 1000) / 1000;
      }
    });

    this.logger.debug(
      `Enhanced role efficiency calculated: ${JSON.stringify(roleEfficiency)}`,
    );
    return roleEfficiency;
  }

  /**
   * Find the most efficient role based on efficiency scores
   */
  findMostEfficientRole(roleEfficiency: Record<string, number>): string {
    let maxEfficiency = 0;
    let mostEfficientRole = '';

    Object.entries(roleEfficiency).forEach(([role, efficiency]) => {
      if (efficiency > maxEfficiency) {
        maxEfficiency = efficiency;
        mostEfficientRole = role;
      }
    });

    // Only return a role if it actually has some efficiency
    return maxEfficiency > 0 ? mostEfficientRole : 'N/A';
  }

  /**
   * Calculate role-specific completion times
   */
  calculateRoleCompletionTimes(
    delegations: any[],
    roleStats: Record<string, number>,
  ): Record<string, number> {
    const roleCompletionTimes: Record<string, number> = {};

    Object.keys(roleStats).forEach((role) => {
      const roleCompletedDelegations = delegations.filter(
        (d) => d.toMode === role && d.completionTimestamp,
      );

      if (roleCompletedDelegations.length > 0) {
        const totalTime = roleCompletedDelegations.reduce((sum, d) => {
          const start = new Date(d.delegationTimestamp).getTime();
          const end = new Date(d.completionTimestamp).getTime();
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return sum + (end - start);
        }, 0);

        roleCompletionTimes[role] =
          totalTime / roleCompletedDelegations.length / (1000 * 60 * 60); // Convert to hours
      } else {
        roleCompletionTimes[role] = 0;
      }
    });

    return roleCompletionTimes;
  }

  /**
   * Calculate average completion time across all roles
   */
  calculateAverageCompletionTime(
    roleCompletionTimes: Record<string, number>,
  ): number {
    const times = Object.values(roleCompletionTimes);
    const validTimes = times.filter((time) => time > 0);

    return validTimes.length > 0
      ? validTimes.reduce((sum, time) => sum + time, 0) / validTimes.length
      : 0;
  }
}
