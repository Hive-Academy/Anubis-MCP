import { Injectable, Logger } from '@nestjs/common';
import { ReportDataService } from '../../shared/report-data.service';
import { ReportMetadataService } from '../../shared/report-metadata.service';
import { ReportTransformService } from '../../shared/report-transform.service';
import { ReportFilters } from '../../shared/types';
import { RolePerformanceData } from '../../shared/types/report-data.types';
import { RoleAnalyticsService } from './role-analytics.service';
import { RoleMetricsCalculatorService } from './role-metrics-calculator.service';
import { RolePerformanceGeneratorService } from './role-performance-generator.service';

// Note: RolePerformanceData interface moved to shared/types/report-data.types.ts
// to avoid duplication and ensure consistency across the application

@Injectable()
export class RolePerformanceService {
  private readonly logger = new Logger(RolePerformanceService.name);

  constructor(
    private readonly dataService: ReportDataService,
    private readonly transformService: ReportTransformService,
    private readonly metadataService: ReportMetadataService,
    private readonly metricsCalculator: RoleMetricsCalculatorService,
    private readonly analyticsService: RoleAnalyticsService,
    private readonly rolePerformanceGenerator: RolePerformanceGeneratorService,
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
   * Generate HTML report using dedicated generator service
   */
  async generateHtmlReport(filters: ReportFilters = {}): Promise<string> {
    const reportData = await this.generateReport(filters);

    // Now using the same interface - no casting needed
    return this.rolePerformanceGenerator.generateRolePerformance(reportData);
  }
}
