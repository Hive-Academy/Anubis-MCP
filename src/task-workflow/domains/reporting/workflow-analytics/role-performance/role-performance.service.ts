import { Injectable, Logger } from '@nestjs/common';
import { ReportDataService } from '../../shared/report-data.service';
import { ReportTransformService } from '../../shared/report-transform.service';
import { ReportRenderService } from '../../shared/report-render.service';
import { ReportMetadataService } from '../../shared/report-metadata.service';
import { RoleMetricsCalculatorService } from './role-metrics-calculator.service';
import { RoleAnalyticsService } from './role-analytics.service';
import { ReportFilters, TemplateContext } from '../../shared/types';

export interface RolePerformanceData {
  roleMetrics: Array<{
    role: string;
    tasksReceived: number;
    tasksCompleted: number;
    averageCompletionTime: number;
    successRate: number;
    delegationEfficiency: number;
    workloadDistribution: number;
    qualityScore: number;
  }>;
  comparativeAnalysis: {
    topPerformers: Array<{
      role: string;
      metric: string;
      value: number;
      rank: number;
    }>;
    improvementAreas: Array<{
      role: string;
      issue: string;
      impact: 'low' | 'medium' | 'high';
      recommendation: string;
    }>;
  };
  timeSeriesAnalysis: {
    performanceTrends: Array<{
      period: string;
      roleMetrics: Record<
        string,
        {
          completionRate: number;
          averageDuration: number;
          taskCount: number;
        }
      >;
    }>;
  };
  workloadAnalysis: {
    currentWorkload: Array<{
      role: string;
      activeTasks: number;
      pendingTasks: number;
      capacity: 'underutilized' | 'optimal' | 'overloaded';
    }>;
    balanceRecommendations: string[];
  };
  metadata: {
    generatedAt: string;
    reportType: 'role-performance';
    version: string;
    generatedBy: string;
    analysisTimeframe: {
      startDate?: string;
      endDate?: string;
    };
  };
}

@Injectable()
export class RolePerformanceService {
  private readonly logger = new Logger(RolePerformanceService.name);

  constructor(
    private readonly dataService: ReportDataService,
    private readonly transformService: ReportTransformService,
    private readonly renderService: ReportRenderService,
    private readonly metadataService: ReportMetadataService,
    private readonly metricsCalculator: RoleMetricsCalculatorService,
    private readonly analyticsService: RoleAnalyticsService,
  ) {}

  /**
   * Generate role performance analysis report
   */
  async generateReport(
    filters: ReportFilters = {},
  ): Promise<RolePerformanceData> {
    try {
      this.logger.log('Generating role performance analysis report');

      // Get data using shared services
      const tasks = await this.dataService.getTasks(filters);
      const delegations = await this.dataService.getDelegationRecords(filters);

      // Transform data
      const formattedTasks = tasks.map((task) =>
        this.transformService.formatTaskData(task),
      );
      const formattedDelegations =
        this.transformService.formatDelegationData(delegations);

      // Calculate metrics using focused services
      const roleMetrics = this.metricsCalculator.calculateRoleMetrics(
        formattedTasks,
        formattedDelegations,
        delegations,
      );

      const comparativeAnalysis =
        this.analyticsService.calculateComparativeAnalysis(roleMetrics);

      const timeSeriesAnalysis =
        this.analyticsService.calculateTimeSeriesAnalysis(
          formattedTasks,
          formattedDelegations,
        );

      const workloadAnalysis = this.analyticsService.calculateWorkloadAnalysis(
        formattedTasks,
        formattedDelegations,
      );

      // Generate metadata
      const metadata = this.metadataService.generateMetadata(
        'role-performance',
        'role-performance-service',
      );

      return {
        roleMetrics,
        comparativeAnalysis,
        timeSeriesAnalysis,
        workloadAnalysis,
        metadata: {
          generatedAt: metadata.generatedAt,
          reportType: 'role-performance' as const,
          version: metadata.version,
          generatedBy: metadata.generatedBy || 'role-performance-service',
          analysisTimeframe: {
            startDate: filters.startDate,
            endDate: filters.endDate,
          },
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to generate role performance report: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Generate HTML report using shared render service
   */
  async generateHtmlReport(filters: ReportFilters = {}): Promise<string> {
    const reportData = await this.generateReport(filters);

    // Use analytics service for insights and recommendations
    const insights = this.analyticsService.generateInsights?.(reportData) || [];
    const recommendations =
      this.analyticsService.generateRecommendations?.(reportData) || [];

    // Calculate summary metrics using metrics calculator
    const summaryMetrics = this.calculateSummaryMetrics(reportData.roleMetrics);

    // Prepare template context - keep it simple and focused
    const templateContext: TemplateContext = {
      data: {
        // Core data from report
        ...reportData,

        // Summary metrics for top-level display
        ...summaryMetrics,

        // Template-specific formatting
        owner: filters.owner || null,
        dateRange: this.formatDateRange(filters),
        title: filters.owner
          ? `${filters.owner} Role Performance Report`
          : 'Role Performance Analysis Report',

        // Enhanced role metrics with UI helpers
        roleMetrics: reportData.roleMetrics.map((role) => ({
          ...role,
          ...this.addUIHelpers(role),
        })),

        // Analytics data
        insights,
        recommendations,

        // Chart data (simplified)
        chartData: {
          roleComparison: reportData.roleMetrics,
          performanceTrends: reportData.timeSeriesAnalysis.performanceTrends,
          workloadDistribution: reportData.workloadAnalysis.currentWorkload,
          // Empty arrays for missing chart data to prevent template errors
          performanceTrendLabels: [],
          performanceTrendData: [],
          statusDistributionLabels: [],
          statusDistributionData: [],
          statusDistributionColors: [],
          priorityLabels: [],
          priorityData: [],
          priorityColors: [],
        },
      },
      metadata: reportData.metadata,
    };

    return this.renderService.renderTemplate(
      'role-performance',
      templateContext,
    );
  }

  /**
   * Calculate summary metrics from role metrics
   * Focused single responsibility
   */
  private calculateSummaryMetrics(roleMetrics: any[]) {
    if (roleMetrics.length === 0) {
      return {
        totalTasks: 0,
        completedTasks: 0,
        averageCompletionTime: 0,
        overallEfficiency: 0,
        delegationEfficiency: 0,
        qualityScore: 0,
        fastestTask: 0,
        redelegationRate: 0,
        qualityTrend: 'stable',
      };
    }

    const totalTasks = roleMetrics.reduce(
      (sum, role) => sum + role.tasksReceived,
      0,
    );
    const completedTasks = roleMetrics.reduce(
      (sum, role) => sum + role.tasksCompleted,
      0,
    );

    const averageCompletionTime =
      roleMetrics.reduce((sum, role) => sum + role.averageCompletionTime, 0) /
      roleMetrics.length;
    const overallEfficiency =
      roleMetrics.reduce((sum, role) => sum + role.successRate, 0) /
      roleMetrics.length;
    const delegationEfficiency =
      roleMetrics.reduce((sum, role) => sum + role.delegationEfficiency, 0) /
      roleMetrics.length;
    const qualityScore =
      roleMetrics.reduce((sum, role) => sum + role.qualityScore, 0) /
      roleMetrics.length;

    const fastestTask = Math.min(
      ...roleMetrics
        .map((role) => role.averageCompletionTime)
        .filter((time) => time > 0),
    );
    const redelegationRate =
      delegationEfficiency > 0 ? Math.max(0, 100 - delegationEfficiency) : 0;

    return {
      totalTasks,
      completedTasks,
      averageCompletionTime: Math.round(averageCompletionTime * 10) / 10,
      overallEfficiency: Math.round(overallEfficiency * 10) / 10,
      delegationEfficiency: Math.round(delegationEfficiency * 10) / 10,
      qualityScore: Math.round(qualityScore * 10) / 10,
      fastestTask: Math.round(fastestTask * 10) / 10,
      redelegationRate: Math.round(redelegationRate * 10) / 10,
      qualityTrend: 'stable', // Could be enhanced by analytics service
    };
  }

  /**
   * Add UI-specific helpers to role data
   * Single responsibility for UI formatting
   */
  private addUIHelpers(role: any) {
    return {
      color: this.getRoleColor(role.role),
      icon: this.getRoleIcon(role.role),
      taskCount: role.tasksReceived,
      efficiency: role.successRate,
      completionRate:
        role.tasksCompleted > 0
          ? Math.round((role.tasksCompleted / role.tasksReceived) * 100)
          : 0,
      speedIndex:
        role.averageCompletionTime > 0
          ? Math.max(0, 100 - (role.averageCompletionTime / 24) * 100)
          : 0,
      averageTime: role.averageCompletionTime,
      delegationCount: role.tasksReceived,
      trend: 'stable', // Could be enhanced by analytics service
      trendPercentage: 0,
    };
  }

  private formatDateRange(filters: ReportFilters): string {
    if (filters.startDate && filters.endDate) {
      return `${new Date(filters.startDate).toLocaleDateString()} - ${new Date(filters.endDate).toLocaleDateString()}`;
    }
    return 'All time';
  }

  private getRoleColor(role: string): string {
    const colors: Record<string, string> = {
      boomerang: 'blue',
      researcher: 'green',
      architect: 'purple',
      'senior-developer': 'orange',
      'code-review': 'red',
    };
    return colors[role] || 'gray';
  }

  private getRoleIcon(role: string): string {
    const icons: Record<string, string> = {
      boomerang: 'sync-alt',
      researcher: 'search',
      architect: 'drafting-compass',
      'senior-developer': 'code',
      'code-review': 'check-circle',
    };
    return icons[role] || 'user';
  }
}
