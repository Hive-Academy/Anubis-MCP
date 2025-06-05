import { Injectable, Logger } from '@nestjs/common';
import { ReportDataService } from '../../shared/report-data.service';
import { ReportTransformService } from '../../shared/report-transform.service';
import { ReportRenderService } from '../../shared/report-render.service';
import { ReportMetadataService } from '../../shared/report-metadata.service';
import { TemplateDataValidatorService } from '../../shared/template-data-validator.service';
import {
  HtmlGeneratorService,
  DashboardData,
} from '../../shared/html-generator.service';
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
    private readonly templateValidator: TemplateDataValidatorService,
    private readonly htmlGenerator: HtmlGeneratorService,
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
   * Generate HTML dashboard using TypeScript template literals (NEW - Type Safe)
   */
  async generateTypeSafeDashboard(
    filters: ReportFilters = {},
  ): Promise<string> {
    const dashboardData = await this.generateDashboard(filters);

    // Transform to type-safe structure
    const typeSafeData: DashboardData = {
      title: 'Interactive Workflow Dashboard',
      metrics: dashboardData.summary,
      charts: {
        statusDistribution: dashboardData.chartData.statusDistribution,
        priorityDistribution: dashboardData.chartData.priorityDistribution,
        completionTrend: dashboardData.chartData.completionTrends,
        rolePerformance: dashboardData.chartData.rolePerformance,
      },
      taskTable: {
        data: dashboardData.recentActivity.recentTasks.map((task) => ({
          taskId: task.taskId,
          name: task.name,
          status: task.status,
          priority: 'Medium', // Default since not in recentTasks
          owner: task.owner || 'Unassigned',
          creationDate: task.lastUpdate,
          duration: 0, // Calculate from timestamps if available
        })),
      },
      delegationTable: {
        data: dashboardData.recentActivity.recentDelegations.map(
          (delegation, index) => ({
            id: index + 1,
            fromMode: delegation.fromRole,
            toMode: delegation.toRole,
            delegationTimestamp: delegation.timestamp,
            success: delegation.success || false,
            duration: 0, // Calculate from timestamps if available
            taskName: delegation.taskName,
          }),
        ),
      },
      metadata: {
        generatedAt: dashboardData.metadata.generatedAt,
        version: dashboardData.metadata.version,
        generatedBy: dashboardData.metadata.generatedBy,
      },
    };

    this.logger.log('Generating type-safe HTML dashboard');
    this.logger.log(`Task table rows: ${typeSafeData.taskTable.data.length}`);
    this.logger.log(
      `Delegation table rows: ${typeSafeData.delegationTable.data.length}`,
    );

    return this.htmlGenerator.generateInteractiveDashboard(typeSafeData);
  }

  /**
   * Generate HTML dashboard using shared render service (LEGACY - Handlebars)
   */
  async generateHtmlDashboard(filters: ReportFilters = {}): Promise<string> {
    const dashboardData = await this.generateDashboard(filters);

    // Transform data to match EXACT template structure
    const templateData = {
      title: 'Interactive Workflow Dashboard',

      // Template expects summary.metrics, not summary directly
      summary: {
        metrics: dashboardData.summary,
      },

      // Template expects charts.*, not chartData.*
      charts: {
        statusDistribution: dashboardData.chartData.statusDistribution,
        priorityDistribution: dashboardData.chartData.priorityDistribution,
        completionTrend: dashboardData.chartData.completionTrends,
        rolePerformance: dashboardData.chartData.rolePerformance,
      },

      // Create task table structure that template expects
      taskTable: {
        columns: [
          { key: 'taskId', label: 'Task ID', sortable: true, type: 'text' },
          { key: 'name', label: 'Name', sortable: true, type: 'text' },
          { key: 'status', label: 'Status', sortable: true, type: 'badge' },
          { key: 'priority', label: 'Priority', sortable: true, type: 'badge' },
          { key: 'owner', label: 'Owner', sortable: true, type: 'text' },
          {
            key: 'creationDate',
            label: 'Created',
            sortable: true,
            type: 'date',
          },
          {
            key: 'duration',
            label: 'Duration (hrs)',
            sortable: true,
            type: 'number',
          },
        ],
        data: dashboardData.recentActivity.recentTasks.map((task) => ({
          taskId: task.taskId,
          name: task.name,
          status: task.status,
          priority: 'Medium', // Default since not in recentTasks
          owner: task.owner || 'Unassigned',
          creationDate: task.lastUpdate, // Use lastUpdate as fallback for creationDate
          completionDate:
            task.status === 'completed' ? task.lastUpdate : undefined,
          duration: 24, // Default 24 hours - could be calculated from actual data
        })),
      },

      // Create delegation table structure that template expects
      delegationTable: {
        columns: [
          { key: 'id', label: 'ID', sortable: true, type: 'number' },
          {
            key: 'fromMode',
            label: 'From Role',
            sortable: true,
            type: 'badge',
          },
          {
            key: 'toMode',
            label: 'To Role',
            sortable: true,
            type: 'badge',
          },
          {
            key: 'delegationTimestamp',
            label: 'When',
            sortable: true,
            type: 'date',
          },
          {
            key: 'success',
            label: 'Status',
            sortable: true,
            type: 'badge',
          },
          {
            key: 'duration',
            label: 'Duration (hrs)',
            sortable: true,
            type: 'number',
          },
        ],
        data: dashboardData.recentActivity.recentDelegations.map(
          (delegation, index) => ({
            id: index + 1, // Generate sequential ID
            fromMode: delegation.fromRole,
            toMode: delegation.toRole,
            delegationTimestamp: delegation.timestamp,
            completionTimestamp: delegation.success
              ? delegation.timestamp
              : undefined,
            success: Boolean(delegation.success), // Ensure boolean type
            duration: 2, // Default 2 hours - could be calculated from actual data
            taskName: delegation.taskName,
          }),
        ),
      },

      // Include other data the template might need
      filters: filters,
      hasFilters: Object.keys(filters).length > 0,
      metadata: dashboardData.metadata,
    };

    // DEBUG: Log the data being passed to template
    this.logger.log(
      `Task table data count: ${templateData.taskTable.data.length}`,
    );
    this.logger.log(
      `Delegation table data count: ${templateData.delegationTable.data.length}`,
    );
    this.logger.log(
      `First task: ${JSON.stringify(templateData.taskTable.data[0] || 'none')}`,
    );
    this.logger.log(
      `First delegation: ${JSON.stringify(templateData.delegationTable.data[0] || 'none')}`,
    );

    // BULLETPROOF: Validate template data before rendering
    const validatedData =
      this.templateValidator.validateInteractiveDashboardData(templateData);

    // DEBUG: Log the validated data
    this.logger.log(
      `Validated task table data count: ${validatedData.taskTable.data.length}`,
    );
    this.logger.log(
      `Validated delegation table data count: ${validatedData.delegationTable.data.length}`,
    );

    const templateContext: TemplateContext = {
      data: validatedData,
      metadata: dashboardData.metadata,
    };

    return this.renderService.renderTemplate(
      'interactive-dashboard',
      templateContext,
      filters.basePath,
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
