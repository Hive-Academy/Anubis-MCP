import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import type { DelegationMetrics } from '../delegation-analytics/delegation-analytics-template.interface';
import { RoleStatisticsService } from '../delegation-analytics/helpers/role-statistics.service';
import { TimingMetricsService } from '../delegation-analytics/helpers/timing-metrics.service';
import { WorkflowAnalysisService } from '../delegation-analytics/helpers/workflow-analysis.service';
import { DelegationDataQueryService } from '../delegation-analytics/helpers/delegation-data-query.service';

type WhereClause = Record<string, any>;

/**
 * Delegation Metrics Service (Refactored)
 *
 * Follows SRP: Orchestrates delegation metrics calculation using focused helper services
 * Handles: Coordination of metrics calculation, data aggregation, result formatting
 */
@Injectable()
export class DelegationMetricsService {
  private readonly logger = new Logger(DelegationMetricsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly roleStatisticsService: RoleStatisticsService,
    private readonly timingMetricsService: TimingMetricsService,
    private readonly workflowAnalysisService: WorkflowAnalysisService,
    private readonly delegationDataQueryService: DelegationDataQueryService,
  ) {}

  async getDelegationMetrics(
    whereClause: WhereClause,
  ): Promise<DelegationMetrics> {
    this.logger.debug('=== NEW DELEGATION ANALYTICS REQUEST ===');
    this.logger.debug(`WhereClause: ${JSON.stringify(whereClause)}`);

    try {
      // Get all delegations for debugging
      const allDelegations =
        await this.delegationDataQueryService.getAllDelegations();
      this.delegationDataQueryService.debugDelegationData(allDelegations);

      // Get filtered delegations
      const delegations =
        await this.delegationDataQueryService.getFilteredDelegations(
          whereClause,
        );

      // If no delegations found, return empty metrics
      if (delegations.length === 0) {
        this.logger.debug('No delegations found, returning empty metrics');
        return this.getEmptyMetrics();
      }

      // Get additional data needed for calculations
      const [modeTransitions, redelegationStats] = await Promise.all([
        this.delegationDataQueryService.getModeTransitions(whereClause),
        this.delegationDataQueryService.getRedelegationStats(whereClause),
      ]);

      // Calculate metrics using helper services
      const roleStats =
        this.roleStatisticsService.calculateRoleStats(delegations);
      const roleEfficiency =
        this.roleStatisticsService.calculateRoleEfficiency(delegations);
      const mostEfficientRole =
        this.roleStatisticsService.findMostEfficientRole(roleEfficiency);

      const successRateData =
        this.timingMetricsService.calculateSuccessRate(delegations);
      const avgHandoffTime =
        this.timingMetricsService.calculateAverageHandoffTime(delegations);
      const weeklyTrends =
        this.timingMetricsService.generateWeeklyTrends(delegations);

      const roleCompletionTimes =
        this.roleStatisticsService.calculateRoleCompletionTimes(
          delegations,
          roleStats,
        );
      const avgCompletionTime =
        this.roleStatisticsService.calculateAverageCompletionTime(
          roleCompletionTimes,
        );

      const transitionMatrix =
        this.workflowAnalysisService.buildTransitionMatrix(modeTransitions);
      const bottlenecks = this.workflowAnalysisService.analyzeBottlenecks(
        delegations,
        roleEfficiency,
        avgHandoffTime,
        redelegationStats._avg.redelegationCount || 0,
      );

      const finalMetrics = {
        totalDelegations: delegations.length,
        roleStats,
        roleEfficiency,
        successRate: Math.round(successRateData.successRate * 100) / 100,
        avgHandoffTime: Math.round(avgHandoffTime * 100) / 100,
        avgRedelegationCount:
          Math.round((redelegationStats._avg.redelegationCount || 0) * 100) /
          100,
        mostEfficientRole,
        avgCompletionTime: Math.round(avgCompletionTime * 100) / 100,
        transitionMatrix,
        weeklyTrends,
        bottlenecks,
      };

      this.logger.debug(
        `Final metrics being returned:`,
        JSON.stringify(finalMetrics, null, 2),
      );
      return finalMetrics;
    } catch (error) {
      this.logger.error('Error calculating delegation metrics', error);
      return this.getEmptyMetrics();
    }
  }

  /**
   * Get empty metrics structure for when no data is available
   */
  private getEmptyMetrics(): DelegationMetrics {
    return {
      totalDelegations: 0,
      roleStats: {
        architect: 0,
        'senior-developer': 0,
        'code-review': 0,
        boomerang: 0,
        researcher: 0,
      },
      roleEfficiency: {
        'senior-developer': 0,
        'code-review': 0,
        boomerang: 0,
        researcher: 0,
        architect: 0,
      },
      successRate: 0,
      avgHandoffTime: 0,
      avgRedelegationCount: 0,
      mostEfficientRole: 'N/A',
      avgCompletionTime: 0,
      transitionMatrix: {
        boomerang: {
          architect: 0,
          researcher: 0,
          'senior-developer': 0,
          'code-review': 0,
        },
        architect: {
          'senior-developer': 0,
          boomerang: 0,
          researcher: 0,
          'code-review': 0,
        },
        'senior-developer': {
          'code-review': 0,
          architect: 0,
          boomerang: 0,
          researcher: 0,
        },
        'code-review': {
          boomerang: 0,
          architect: 0,
          researcher: 0,
          'senior-developer': 0,
        },
        researcher: {
          architect: 0,
          boomerang: 0,
          'senior-developer': 0,
          'code-review': 0,
        },
      },
      weeklyTrends: {
        failed: [0, 0, 0, 0],
        successful: [0, 0, 0, 0],
      },
      bottlenecks: [],
    };
  }
}
