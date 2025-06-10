import { Injectable, Logger } from '@nestjs/common';
import { ReportDataService } from '../../shared/report-data.service';
import { ReportMetadataService } from '../../shared/report-metadata.service';
import { ReportTransformService } from '../../shared/report-transform.service';
import { ReportFilters } from '../../shared/types';
// Note: Using generator's expected data structure, not the types file interface
import { WorkflowAnalyticsCalculatorService } from './workflow-analytics-calculator.service';
import { WorkflowSummaryService } from './workflow-summary.service';
import { WorkflowAnalyticsGeneratorService } from './workflow-analytics-generator.service';

export interface WorkflowAnalyticsData {
  summary: {
    totalTasks: number;
    completedTasks: number;
    averageCompletionTime: number;
    totalDelegations: number;
    successfulDelegations: number;
    delegationSuccessRate: number;
  };
  taskAnalytics: {
    statusDistribution: Record<string, number>;
    priorityDistribution: Record<string, number>;
    completionTrends: Array<{
      period: string;
      completed: number;
      started: number;
    }>;
  };
  delegationAnalytics: {
    roleTransitions: Array<{
      fromMode: string;
      toMode: string;
      count: number;
      successRate: number;
    }>;
    averageDelegationDuration: Record<string, number>;
    redelegationHotspots: Array<{
      transition: string;
      count: number;
      reasons: string[];
    }>;
  };
  performanceMetrics: {
    roleEfficiency: Array<{
      role: string;
      tasksCompleted: number;
      averageDuration: number;
      successRate: number;
    }>;
    bottlenecks: Array<{
      stage: string;
      averageWaitTime: number;
      taskCount: number;
    }>;
  };
  metadata: {
    generatedAt: string;
    reportType: 'workflow-analytics';
    version: string;
    generatedBy: string;
    timeframe: {
      startDate?: string;
      endDate?: string;
    };
  };
}

@Injectable()
export class WorkflowAnalyticsService {
  private readonly logger = new Logger(WorkflowAnalyticsService.name);

  constructor(
    private readonly dataService: ReportDataService,
    private readonly transformService: ReportTransformService,
    private readonly metadataService: ReportMetadataService,
    private readonly summaryService: WorkflowSummaryService,
    private readonly analyticsCalculator: WorkflowAnalyticsCalculatorService,
    private readonly workflowAnalyticsGenerator: WorkflowAnalyticsGeneratorService,
  ) {}

  /**
   * Generate comprehensive workflow analytics report
   */
  async generateReport(
    filters: ReportFilters = {},
  ): Promise<WorkflowAnalyticsData> {
    try {
      this.logger.log('Generating workflow analytics report');

      // Get data using shared services
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

      // Calculate analytics using focused services
      const summary = this.summaryService.calculateSummaryStats(
        formattedTasks,
        formattedDelegations,
      );

      const taskAnalytics =
        this.analyticsCalculator.calculateTaskAnalytics(formattedTasks);

      const delegationAnalytics =
        this.analyticsCalculator.calculateDelegationAnalytics(
          formattedDelegations,
          delegations,
        );

      const performanceMetrics =
        this.analyticsCalculator.calculatePerformanceMetrics(
          formattedDelegations,
          formattedTransitions,
        );

      // Generate metadata
      const metadata = this.metadataService.generateMetadata(
        'workflow-analytics',
        'workflow-analytics-service',
      );

      return {
        summary,
        taskAnalytics,
        delegationAnalytics,
        performanceMetrics,
        metadata: {
          generatedAt: metadata.generatedAt,
          reportType: 'workflow-analytics' as const,
          version: metadata.version,
          generatedBy: metadata.generatedBy || 'workflow-analytics-service',
          timeframe: {
            startDate: filters.startDate,
            endDate: filters.endDate,
          },
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to generate workflow analytics report: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Generate HTML report using type-safe generator with real database data
   */
  async generateHtmlReport(filters: ReportFilters = {}): Promise<string> {
    const reportData = await this.generateReport(filters);

    // Pass the actual database data directly to the generator
    // No dummy data transformation needed - generator now works with real data structure
    return this.workflowAnalyticsGenerator.generateWorkflowAnalytics(
      reportData,
    );
  }
}
