/**
 * Template Data Service
 *
 * Lightweight service that connects report generators to specific template data services.
 * No business logic - pure delegation to appropriate data API services.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ReportFilters } from '../../interfaces/report-data.interface';
import { TaskSummaryDataApiService } from '../report-templates-data-api/task-summary-data-api.service';

@Injectable()
export class TemplateDataService {
  private readonly logger = new Logger(TemplateDataService.name);

  constructor(private readonly taskSummaryDataApi: TaskSummaryDataApiService) {}

  /**
   * Get task summary data using the dedicated API service
   */
  async getTaskSummaryData(
    startDate?: Date,
    endDate?: Date,
    filters?: ReportFilters,
  ): Promise<any> {
    this.logger.debug('Delegating to TaskSummaryDataApiService');

    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default 30 days
    const end = endDate || new Date();

    return await this.taskSummaryDataApi.getTaskSummaryData(
      start,
      end,
      filters as Record<string, string>,
    );
  }

  /**
   * Get delegation analytics data (TODO: implement dedicated service)
   */
  getDelegationAnalyticsData(
    startDate?: Date,
    endDate?: Date,
    filters?: ReportFilters,
  ): Promise<any> {
    this.logger.debug('TODO: implement DelegationAnalyticsDataApiService');

    // Temporary fallback - return basic structure
    return Promise.resolve({
      generatedAt: new Date(),
      dateRange: {
        start: startDate?.toISOString().split('T')[0] || 'All time',
        end: endDate?.toISOString().split('T')[0] || 'Present',
      },
      filters,
      metrics: {
        totalDelegations: 0,
        avgHandoffTime: 'N/A',
        completionRate: 0,
      },
      delegations: [],
      insights: ['Delegation analytics service not yet implemented'],
      recommendations: ['Implement DelegationAnalyticsDataApiService'],
    });
  }

  /**
   * Get performance dashboard data (TODO: implement dedicated service)
   */
  getPerformanceDashboardData(
    startDate?: Date,
    endDate?: Date,
    filters?: ReportFilters,
  ): Promise<any> {
    this.logger.debug('TODO: implement PerformanceDashboardDataApiService');

    // Temporary fallback - return basic structure
    return Promise.resolve({
      generatedAt: new Date(),
      dateRange: {
        start: startDate?.toISOString().split('T')[0] || 'All time',
        end: endDate?.toISOString().split('T')[0] || 'Present',
      },
      filters,
      metrics: {
        totalTasks: 0,
        avgCompletionTime: 'N/A',
        throughput: 0,
      },
      performance: [],
      insights: ['Performance dashboard service not yet implemented'],
      recommendations: ['Implement PerformanceDashboardDataApiService'],
    });
  }

  // TODO: Add other template data methods as needed
  // These will be implemented as dedicated API services following the task summary pattern
}
