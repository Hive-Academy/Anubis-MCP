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

    const templateContext: TemplateContext = {
      data: {
        ...reportData,
        title: 'Role Performance Analysis Report',
        chartData: {
          roleComparison: reportData.roleMetrics,
          performanceTrends: reportData.timeSeriesAnalysis.performanceTrends,
          workloadDistribution: reportData.workloadAnalysis.currentWorkload,
        },
      },
      metadata: reportData.metadata,
    };

    return this.renderService.renderTemplate(
      'role-performance',
      templateContext,
    );
  }
}
