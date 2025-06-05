import { Injectable } from '@nestjs/common';
import {
  FormattedDelegationData,
  DelegationRecordWithRelations,
} from '../../shared/types';

@Injectable()
export class TaskQualityAnalyzerService {
  /**
   * Calculate comprehensive quality metrics
   */
  calculateQualityMetrics(
    delegations: FormattedDelegationData[],
    rawDelegations: DelegationRecordWithRelations[],
  ) {
    // Process quality metrics
    const successfulDelegations = delegations.filter(
      (d) => d.success === true,
    ).length;
    const totalDelegations = delegations.length;
    const delegationEfficiency =
      totalDelegations > 0
        ? Math.round((successfulDelegations / totalDelegations) * 100 * 10) / 10
        : 0;

    const redelegationCount = rawDelegations.filter(
      (d) => d.success === false,
    ).length;

    const averageStageTime = this.calculateAverageStageTime(delegations);

    // Quality gates (simplified - based on delegation success)
    const qualityGatesPassed = Math.min(
      5,
      Math.floor(delegationEfficiency / 20),
    );

    return {
      codeQuality: {
        // These would be populated from actual code analysis tools
        testCoverage: undefined,
        codeComplexity: undefined,
        maintainabilityIndex: undefined,
      },
      processQuality: {
        delegationEfficiency,
        redelegationCount,
        averageStageTime: Math.round(averageStageTime * 10) / 10,
        qualityGatesPassed,
      },
    };
  }

  private calculateAverageStageTime(
    delegations: FormattedDelegationData[],
  ): number {
    const completedDelegations = delegations.filter((d) => d.duration > 0);
    if (completedDelegations.length === 0) return 24; // Default 24 hours

    const totalTime = completedDelegations.reduce(
      (sum, d) => sum + d.duration,
      0,
    );
    return totalTime / completedDelegations.length;
  }
}
