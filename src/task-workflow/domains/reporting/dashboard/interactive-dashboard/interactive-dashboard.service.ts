import { Injectable, Logger } from '@nestjs/common';
import { ReportDataService } from '../../shared/report-data.service';
import { ReportTransformService } from '../../shared/report-transform.service';
import { ReportMetadataService } from '../../shared/report-metadata.service';
import { InteractiveDashboardGeneratorService } from './interactive-dashboard-generator.service';
import { DashboardDataAggregatorService } from './dashboard-data-aggregator.service';
import { DashboardChartBuilderService } from './dashboard-chart-builder.service';
import { ReportFilters } from '../../shared/types';
import {
  InteractiveDashboardData as TypeSafeInteractiveDashboardData,
  TaskSummary,
  DelegationSummary,
} from '../../shared/types/report-data.types';

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
    completionTrend: any;
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
    private readonly metadataService: ReportMetadataService,
    private readonly dashboardGenerator: InteractiveDashboardGeneratorService,
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
   * Generate HTML dashboard using dedicated generator service (PROPERLY MIGRATED)
   */
  async generateHtmlDashboard(filters: ReportFilters = {}): Promise<string> {
    const dashboardData = await this.generateDashboard(filters);

    // Transform to type-safe structure matching InteractiveDashboardData interface
    const typeSafeData: TypeSafeInteractiveDashboardData = {
      title: 'Interactive Workflow Dashboard',
      subtitle: 'Real-time workflow analytics and task management',
      metrics: {
        totalTasks: dashboardData.summary.totalTasks,
        completedTasks: dashboardData.summary.completedTasks,
        inProgressTasks: dashboardData.summary.inProgressTasks,
        completionRate: dashboardData.summary.completionRate,
        averageCompletionTime: dashboardData.summary.averageCompletionTime,
        totalDelegations: dashboardData.summary.totalDelegations,
        delegationSuccessRate: dashboardData.summary.delegationSuccessRate,
      },
      charts: {
        statusDistribution: dashboardData.chartData.statusDistribution,
        priorityDistribution: dashboardData.chartData.priorityDistribution,
        completionTrend: dashboardData.chartData.completionTrend,
        rolePerformance: dashboardData.chartData.rolePerformance,
      },
      tasks: dashboardData.recentActivity.recentTasks.map(
        (task): TaskSummary => ({
          taskId: task.taskId,
          name: task.name,
          status: task.status as any, // Type assertion for compatibility
          priority: 'Medium' as any, // Default since not in recentTasks
          owner: task.owner || 'Unassigned',
          createdAt: new Date(task.lastUpdate),
          duration: 0, // Calculate from timestamps if available
        }),
      ),
      delegations: dashboardData.recentActivity.recentDelegations.map(
        (delegation, index): DelegationSummary => ({
          id: index + 1,
          taskId: delegation.taskName || 'unknown',
          fromMode: delegation.fromRole as any,
          toMode: delegation.toRole as any,
          delegationTimestamp: delegation.timestamp,
          success: delegation.success || false,
          duration: 0, // Calculate from timestamps if available
          taskName: delegation.taskName,
        }),
      ),
      filters: {}, // Empty filters for now - type compatibility
      metadata: {
        generatedAt: dashboardData.metadata.generatedAt,
        version: dashboardData.metadata.version,
        generatedBy: dashboardData.metadata.generatedBy,
        reportType: 'interactive-dashboard',
      },
    };

    this.logger.log(
      'Delegating HTML generation to dedicated generator service',
    );
    this.logger.log(`Tasks: ${typeSafeData.tasks.length}`);
    this.logger.log(`Delegations: ${typeSafeData.delegations.length}`);

    // Use the dedicated generator service following SRP
    return this.dashboardGenerator.generateInteractiveDashboard(typeSafeData);
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
        dashboardData.workflowMetrics.bottlenecks &&
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
