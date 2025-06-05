import { Injectable, Logger } from '@nestjs/common';
import { ReportDataService } from '../../shared/report-data.service';
import { ReportTransformService } from '../../shared/report-transform.service';
import { ReportRenderService } from '../../shared/report-render.service';
import { ReportMetadataService } from '../../shared/report-metadata.service';
import { DashboardDataAggregatorService } from './dashboard-data-aggregator.service';
import { DashboardChartBuilderService } from './dashboard-chart-builder.service';
import { ReportFilters, TemplateContext } from '../../shared/types';

export interface InteractiveDashboardData {
  summary: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    completionRate: number;
    averageCompletionTime: number;
    totalDelegations: number;
    delegationSuccessRate: number;
  };
  taskDistribution: {
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    byOwner: Record<string, number>;
  };
  workflowMetrics: {
    roleEfficiency: Array<{
      role: string;
      tasksCompleted: number;
      averageDuration: number;
      successRate: number;
    }>;
    delegationFlow: Array<{
      fromRole: string;
      toRole: string;
      count: number;
      successRate: number;
    }>;
    bottlenecks: Array<{
      stage: string;
      averageWaitTime: number;
      taskCount: number;
    }>;
  };
  recentActivity: {
    recentTasks: Array<{
      taskId: string;
      name: string;
      status: string;
      lastUpdate: string;
      owner?: string;
    }>;
    recentDelegations: Array<{
      taskName: string;
      fromRole: string;
      toRole: string;
      timestamp: string;
      success?: boolean;
    }>;
  };
  chartData: {
    statusDistribution: any;
    priorityDistribution: any;
    completionTrends: any;
    rolePerformance: any;
    delegationFlow: any;
  };
  metadata: {
    generatedAt: string;
    reportType: 'interactive-dashboard';
    version: string;
    generatedBy: string;
    refreshInterval: number;
  };
}

@Injectable()
export class InteractiveDashboardService {
  private readonly logger = new Logger(InteractiveDashboardService.name);

  constructor(
    private readonly dataService: ReportDataService,
    private readonly transformService: ReportTransformService,
    private readonly renderService: ReportRenderService,
    private readonly metadataService: ReportMetadataService,
    private readonly dataAggregator: DashboardDataAggregatorService,
    private readonly chartBuilder: DashboardChartBuilderService,
  ) {}

  /**
   * Generate interactive dashboard data
   */
  async generateDashboard(
    filters: ReportFilters = {},
  ): Promise<InteractiveDashboardData> {
    try {
      this.logger.log('Generating interactive dashboard');

      // Get all necessary data
      const tasks = await this.dataService.getTasks(filters);
      const delegations = await this.dataService.getDelegationRecords(filters);
      const transitions =
        await this.dataService.getWorkflowTransitions(filters);

      // Transform data
      const formattedTasks = tasks.map((task) =>
        this.transformService.formatTaskData(task),
      );
      const formattedDelegations =
        this.transformService.formatDelegationData(delegations);
      const formattedTransitions =
        this.transformService.formatWorkflowData(transitions);

      // Aggregate data using focused services
      const summary = this.dataAggregator.calculateSummaryMetrics(
        formattedTasks,
        formattedDelegations,
      );

      const taskDistribution = this.dataAggregator.calculateTaskDistribution(
        formattedTasks,
        tasks,
      );

      const workflowMetrics = this.dataAggregator.calculateWorkflowMetrics(
        formattedDelegations,
        formattedTransitions,
        delegations,
      );

      const recentActivity = this.dataAggregator.calculateRecentActivity(
        formattedTasks,
        formattedDelegations,
        tasks,
      );

      // Build chart data
      const chartData = this.chartBuilder.buildAllCharts(
        formattedTasks,
        formattedDelegations,
        taskDistribution,
        workflowMetrics,
      );

      // Generate metadata
      const metadata = this.metadataService.generateMetadata(
        'interactive-dashboard',
        'interactive-dashboard-service',
      );

      return {
        summary,
        taskDistribution,
        workflowMetrics,
        recentActivity: {
          ...recentActivity,
          recentTasks: recentActivity.recentTasks.map((t) => ({
            ...t,
            owner: t.owner || 'Unknown',
          })),
          recentDelegations: recentActivity.recentDelegations.map((d) => ({
            ...d,
            success: d.success || false,
          })),
        },
        chartData,
        metadata: {
          generatedAt: metadata.generatedAt,
          reportType: 'interactive-dashboard' as const,
          version: metadata.version,
          generatedBy: metadata.generatedBy || 'interactive-dashboard-service',
          refreshInterval: 300, // 5 minutes
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to generate interactive dashboard: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Generate HTML dashboard using shared render service
   */
  async generateHtmlDashboard(filters: ReportFilters = {}): Promise<string> {
    const dashboardData = await this.generateDashboard(filters);

    const templateContext: TemplateContext = {
      data: {
        ...dashboardData,
        title: 'Interactive Workflow Dashboard',
        filters: filters,
        hasFilters: Object.keys(filters).length > 0,
      },
      metadata: dashboardData.metadata,
    };

    return this.renderService.renderTemplate(
      'interactive-dashboard',
      templateContext,
    );
  }

  /**
   * Generate dashboard summary for quick overview
   */
  async generateQuickSummary(filters: ReportFilters = {}): Promise<{
    totalTasks: number;
    completionRate: number;
    activeIssues: number;
    topBottleneck: string;
    lastUpdate: string;
  }> {
    try {
      const dashboardData = await this.generateDashboard(filters);

      const activeIssues =
        dashboardData.recentActivity.recentDelegations.filter(
          (d) => d.success === false,
        ).length;

      const topBottleneck =
        dashboardData.workflowMetrics.bottlenecks.length > 0
          ? dashboardData.workflowMetrics.bottlenecks[0].stage
          : 'None identified';

      return {
        totalTasks: dashboardData.summary.totalTasks,
        completionRate: dashboardData.summary.completionRate,
        activeIssues,
        topBottleneck,
        lastUpdate: dashboardData.metadata.generatedAt,
      };
    } catch (error) {
      this.logger.error(`Failed to generate quick summary: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate filtered dashboard data for specific criteria
   */
  async generateFilteredDashboard(
    filterType: 'status' | 'priority' | 'owner',
    filterValue: string,
  ): Promise<InteractiveDashboardData> {
    const filters: ReportFilters = {
      [filterType]: filterValue,
    };

    return this.generateDashboard(filters);
  }
}
