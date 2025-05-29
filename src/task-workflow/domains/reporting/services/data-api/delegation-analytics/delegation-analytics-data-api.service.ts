/**
 * Delegation Analytics Data API Service
 *
 * Focused service providing delegation patterns and role efficiency data for delegation-analytics.hbs template.
 * Uses proper separation of concerns:
 * - ReportDataAccessService: Pure Prisma API interface
 * - This service: Business logic + data transformation for delegation analytics
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  DelegationAnalyticsTemplateData,
  DelegationAnalyticsDataService,
  DelegationMetrics,
  DelegationBottleneck,
} from '../../interfaces/templates/delegation-analytics-template.interface';

// Foundation services
import { ReportDataAccessService } from '../data/report-data-access.service';

@Injectable()
export class DelegationAnalyticsDataApiService
  implements DelegationAnalyticsDataService
{
  private readonly logger = new Logger(DelegationAnalyticsDataApiService.name);

  constructor(private readonly reportDataAccess: ReportDataAccessService) {}

  /**
   * Get comprehensive delegation analytics data
   */
  async getDelegationAnalyticsData(
    startDate: Date,
    endDate: Date,
    filters?: Record<string, string>,
  ): Promise<DelegationAnalyticsTemplateData> {
    this.logger.debug(
      'Generating delegation analytics with focused business logic',
    );

    // Build where clause using foundation service
    const whereClause = this.reportDataAccess.buildWhereClause(
      startDate,
      endDate,
      filters as any,
    );

    // Get base metrics using foundation service
    const baseMetrics = await this.reportDataAccess.getBaseMetrics(whereClause);

    // Generate focused delegation metrics
    const delegationMetrics = await this.generateDelegationMetrics(
      baseMetrics.delegations,
      startDate,
      endDate,
    );

    return {
      generatedAt: new Date(),
      dateRange: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
      },
      reportType: 'delegation_analytics',
      metrics: {
        delegations: delegationMetrics,
      },
    };
  }

  /**
   * Calculate role efficiency metrics with focused business logic
   */
  async calculateRoleEfficiency(
    startDate: Date,
    endDate: Date,
  ): Promise<DelegationMetrics['roleEfficiency']> {
    const whereClause = this.reportDataAccess.buildWhereClause(
      startDate,
      endDate,
    );
    const baseMetrics = await this.reportDataAccess.getBaseMetrics(whereClause);

    // Extract role performance from delegation metrics
    const rolePerformance = baseMetrics.delegations.rolePerformance || [];

    return {
      boomerang: this.calculateRoleEfficiencyScore(
        rolePerformance,
        'boomerang',
      ),
      researcher: this.calculateRoleEfficiencyScore(
        rolePerformance,
        'researcher',
      ),
      architect: this.calculateRoleEfficiencyScore(
        rolePerformance,
        'architect',
      ),
      'senior-developer': this.calculateRoleEfficiencyScore(
        rolePerformance,
        'senior-developer',
      ),
      'code-review': this.calculateRoleEfficiencyScore(
        rolePerformance,
        'code-review',
      ),
    };
  }

  /**
   * Analyze workflow bottlenecks with meaningful insights
   */
  async analyzeWorkflowBottlenecks(
    startDate: Date,
    endDate: Date,
  ): Promise<DelegationBottleneck[]> {
    const whereClause = this.reportDataAccess.buildWhereClause(
      startDate,
      endDate,
    );
    const baseMetrics = await this.reportDataAccess.getBaseMetrics(whereClause);

    const bottlenecks: DelegationBottleneck[] = [];

    // Analyze delegation patterns for bottlenecks
    if (baseMetrics.delegations.avgHandoffTime > 24) {
      bottlenecks.push({
        role: 'system-wide',
        issue: `High average handoff time: ${baseMetrics.delegations.avgHandoffTime.toFixed(1)} hours`,
        impact: 'high',
      });
    }

    if (baseMetrics.delegations.avgRedelegationCount > 1.5) {
      bottlenecks.push({
        role: 'workflow',
        issue: `High redelegation rate: ${baseMetrics.delegations.avgRedelegationCount.toFixed(1)} per task`,
        impact: 'medium',
      });
    }

    // Analyze role-specific bottlenecks
    const rolePerformance = baseMetrics.delegations.rolePerformance || [];
    rolePerformance.forEach((role: any) => {
      if (role.avgCompletionTime > 48) {
        bottlenecks.push({
          role: role.role,
          issue: `Slow completion time: ${role.avgCompletionTime.toFixed(1)} hours`,
          impact: role.avgCompletionTime > 72 ? 'high' : 'medium',
        });
      }
    });

    return bottlenecks;
  }

  /**
   * Generate role transition matrix for workflow analysis
   */
  async generateTransitionMatrix(
    startDate: Date,
    endDate: Date,
  ): Promise<DelegationMetrics['transitionMatrix']> {
    const whereClause = this.reportDataAccess.buildWhereClause(
      startDate,
      endDate,
    );
    const baseMetrics = await this.reportDataAccess.getBaseMetrics(whereClause);

    // Extract transition data from delegation metrics
    const transitions = baseMetrics.delegations.modeTransitions || [];

    const matrix: DelegationMetrics['transitionMatrix'] = {};
    const roles = [
      'boomerang',
      'researcher',
      'architect',
      'senior-developer',
      'code-review',
    ];

    // Initialize matrix
    roles.forEach((fromRole) => {
      matrix[fromRole] = {};
      roles.forEach((toRole) => {
        matrix[fromRole][toRole] = 0;
      });
    });

    // Populate matrix from transition data
    transitions.forEach((transition: any) => {
      const from = transition.fromMode || 'unknown';
      const to = transition.toMode || 'unknown';

      if (matrix[from] && matrix[from][to] !== undefined) {
        matrix[from][to]++;
      }
    });

    return matrix;
  }

  // ===== PRIVATE BUSINESS LOGIC METHODS =====

  /**
   * Generate comprehensive delegation metrics
   */
  private async generateDelegationMetrics(
    delegationData: any,
    startDate: Date,
    endDate: Date,
  ): Promise<DelegationMetrics> {
    // Calculate role efficiency
    const roleEfficiency = await this.calculateRoleEfficiency(
      startDate,
      endDate,
    );

    // Calculate role statistics
    const roleStats = this.calculateRoleStats(
      delegationData.rolePerformance || [],
    );

    // Generate transition matrix
    const transitionMatrix = await this.generateTransitionMatrix(
      startDate,
      endDate,
    );

    // Analyze bottlenecks
    const bottlenecks = await this.analyzeWorkflowBottlenecks(
      startDate,
      endDate,
    );

    // Calculate most efficient role
    const mostEfficientRole = this.findMostEfficientRole(roleEfficiency);

    // Generate weekly trends
    const weeklyTrends = this.generateWeeklyTrends(delegationData);

    return {
      roleStats,
      roleEfficiency,
      successRate: delegationData.successRate || 0,
      avgHandoffTime: delegationData.avgHandoffTime || 0,
      avgRedelegationCount: delegationData.avgRedelegationCount || 0,
      totalDelegations: delegationData.totalDelegations || 0,
      avgCompletionTime: delegationData.avgCompletionTime || 0,
      mostEfficientRole,
      bottlenecks,
      transitionMatrix,
      weeklyTrends,
    };
  }

  /**
   * Calculate role efficiency score with business logic
   */
  private calculateRoleEfficiencyScore(
    rolePerformance: any[],
    roleName: string,
  ): number {
    const roleData = rolePerformance.find((r) => r.role === roleName);

    if (!roleData) return 0.5; // Neutral score if no data

    // Business logic: efficiency based on completion time and success rate
    const timeEfficiency = Math.max(
      0,
      Math.min(1, (48 - (roleData.avgCompletionTime || 48)) / 48),
    );
    const successRate = (roleData.successRate || 50) / 100;

    return Math.round(((timeEfficiency + successRate) / 2) * 100) / 100;
  }

  /**
   * Calculate role statistics from performance data
   */
  private calculateRoleStats(
    rolePerformance: any[],
  ): DelegationMetrics['roleStats'] {
    const defaultStats = {
      boomerang: 0,
      researcher: 0,
      architect: 0,
      'senior-developer': 0,
      'code-review': 0,
    };

    rolePerformance.forEach((role) => {
      if (defaultStats.hasOwnProperty(role.role)) {
        defaultStats[role.role as keyof typeof defaultStats] =
          role.taskCount || 0;
      }
    });

    return defaultStats;
  }

  /**
   * Find the most efficient role based on efficiency scores
   */
  private findMostEfficientRole(
    roleEfficiency: DelegationMetrics['roleEfficiency'],
  ): string {
    let maxEfficiency = 0;
    let mostEfficient = 'boomerang';

    Object.entries(roleEfficiency).forEach(([role, efficiency]) => {
      if (efficiency > maxEfficiency) {
        maxEfficiency = efficiency;
        mostEfficient = role;
      }
    });

    return mostEfficient;
  }

  /**
   * Generate weekly trends for delegation success/failure
   */
  private generateWeeklyTrends(
    delegationData: any,
  ): DelegationMetrics['weeklyTrends'] {
    // Default trend data (could be enhanced with actual weekly calculations)
    const successful = delegationData.weeklySuccessful || [75, 80, 85, 82];
    const failed = delegationData.weeklyFailed || [25, 20, 15, 18];

    return {
      successful,
      failed,
    };
  }
}
