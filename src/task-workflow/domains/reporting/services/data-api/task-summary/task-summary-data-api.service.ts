/**
 * Task Summary Data API Service
 *
 * Focused service providing real data for task-summary.hbs template.
 * Uses proper separation of concerns:
 * - ReportDataAccessService: Pure Prisma API interface
 * - This service: Business logic + data transformation
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  TaskSummaryTemplateData,
  TaskSummaryDataService,
  TaskSummaryItem,
} from './task-summary-template.interface';

// Data Access Layer (Prisma API)
import { ReportDataAccessService } from '../foundation/report-data-access.service';
import { CoreMetricsService } from '../foundation/core-metrics.service';
import { TaskSummaryAnalyticsService } from './task-summary-analytics.service';

@Injectable()
export class TaskSummaryDataApiService implements TaskSummaryDataService {
  private readonly logger = new Logger(TaskSummaryDataApiService.name);

  constructor(
    private readonly reportDataAccess: ReportDataAccessService,
    private readonly coreMetricsService: CoreMetricsService,
    private readonly taskSummaryAnalyticsService: TaskSummaryAnalyticsService,
  ) {}

  /**
   * Get comprehensive task summary data using real analytics
   */
  async getTaskSummaryData(
    startDate: Date,
    endDate: Date,
    filters?: Record<string, string>,
  ): Promise<TaskSummaryTemplateData> {
    this.logger.debug('Generating task summary with REAL analytics data');

    // Build where clause using data access service
    const whereClause = this.reportDataAccess.buildWhereClause(
      startDate,
      endDate,
      filters as any,
    );

    // Get real base metrics using existing data access
    const baseMetrics = await this.reportDataAccess.getBaseMetrics(whereClause);

    // Transform to new template format (extracted from legacy method)
    return {
      generatedAt: new Date(),
      dateRange: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
      },
      filters,

      // Real metrics from base metrics
      metrics: {
        totalTasks: baseMetrics.tasks.totalTasks,
        completedTasks: baseMetrics.tasks.completedTasks,
        completionRate: Math.round(baseMetrics.tasks.completionRate),
        inProgressTasks: baseMetrics.tasks.inProgressTasks,
        avgTimeInProgress: this.formatDuration(
          baseMetrics.tasks.avgCompletionTimeHours,
        ),
        highPriorityTasks: this.calculateHighPriorityCount(
          baseMetrics.tasks.priorityDistribution.filter(
            (p: { priority: string | null; count: number }) =>
              p.priority !== null,
          ) as { priority: string; count: number }[],
        ),
      },

      // Generate task items from owner data
      tasks: await this.getRealTaskItems(whereClause),

      // Chart data from real metrics (extracted from legacy method)
      statusDistribution: {
        labels: ['Completed', 'In Progress', 'Not Started'],
        data: [
          baseMetrics.tasks.completedTasks,
          baseMetrics.tasks.inProgressTasks,
          baseMetrics.tasks.notStartedTasks || 0,
        ],
      },

      priorityDistribution: {
        labels: baseMetrics.tasks.priorityDistribution.map(
          (p: { priority: string | null; count: number }) =>
            p.priority || 'Unknown',
        ),
        data: baseMetrics.tasks.priorityDistribution.map(
          (p: { priority: string | null; count: number }) => p.count,
        ),
      },

      // Generate insights from real data
      insights: this.generateInsights(baseMetrics.tasks),
      recommendations: this.generateRecommendations(baseMetrics.tasks),

      // Enhanced analytics (NEW) - Rich workflow insights
      enhancedMetrics: await this.getEnhancedMetrics(
        whereClause,
        baseMetrics.tasks,
      ),
    };
  }

  /**
   * Get enhanced metrics using the analytics aggregator service
   */
  private async getEnhancedMetrics(
    whereClause: any,
    _taskMetrics: any,
  ): Promise<any> {
    try {
      // Extract task IDs from recent tasks for detailed analytics
      const recentTasks = await this.reportDataAccess.getRecentTasks(
        whereClause,
        10,
      );
      const taskIds = recentTasks.map((task) => task.taskId);

      // Get enhanced metrics using the analytics service
      return await this.taskSummaryAnalyticsService.getEnhancedMetrics(
        taskIds,
        whereClause,
      );
    } catch (error) {
      this.logger.error('Failed to get enhanced metrics:', error);
      return null; // Return null instead of dummy data
    }
  }

  // ===== BUSINESS LOGIC METHODS =====

  /**
   * Get real task items from database instead of generating fake data
   */
  private async getRealTaskItems(whereClause: any): Promise<TaskSummaryItem[]> {
    try {
      // Use proper abstraction instead of direct Prisma access
      const realTasks = await this.reportDataAccess.getRecentTasks(
        whereClause,
        10,
      );

      // Transform real tasks to template format
      return realTasks.map((task) => ({
        taskId: task.taskId,
        name: task.name,
        status: task.status as TaskSummaryItem['status'],
        priority: task.priority as TaskSummaryItem['priority'],
        owner: task.owner,
        creationDate: task.creationDate,
      }));
    } catch (error) {
      this.logger.error('Failed to fetch real tasks:', error);
      return []; // Return empty array instead of fake data
    }
  }

  /**
   * Generate insights from real task metrics
   */
  private generateInsights(taskMetrics: any): string[] {
    const insights: string[] = [];

    if (taskMetrics.completionRate > 80) {
      insights.push(
        `Strong completion rate of ${taskMetrics.completionRate.toFixed(1)}% indicates effective workflow`,
      );
    } else if (taskMetrics.completionRate < 50) {
      insights.push(
        `Completion rate of ${taskMetrics.completionRate.toFixed(1)}% suggests need for process improvement`,
      );
    }

    if (taskMetrics.inProgressTasks > taskMetrics.totalTasks * 0.6) {
      insights.push(
        'High work-in-progress detected - consider focusing efforts on completion',
      );
    }

    if (taskMetrics.avgCompletionTimeHours > 48) {
      insights.push(
        'Average completion time exceeds 2 days - investigate potential bottlenecks',
      );
    }

    return insights.length > 0
      ? insights
      : ['System operating within normal parameters'];
  }

  /**
   * Generate recommendations from real task metrics
   */
  private generateRecommendations(taskMetrics: any): string[] {
    const recommendations: string[] = [];

    if (taskMetrics.completionRate < 80) {
      recommendations.push(
        'Focus on completing existing tasks before starting new ones',
      );
    }

    if (taskMetrics.inProgressTasks > taskMetrics.totalTasks * 0.5) {
      recommendations.push(
        'Consider limiting work-in-progress to improve flow',
      );
    }

    const highPriorityCount = this.calculateHighPriorityCount(
      taskMetrics.priorityDistribution,
    );
    if (highPriorityCount > taskMetrics.totalTasks * 0.3) {
      recommendations.push(
        'High number of high-priority tasks - review priority assignment process',
      );
    }

    recommendations.push(
      'Continue monitoring task progress and team performance',
    );

    return recommendations;
  }

  // ===== UTILITY METHODS (extracted from legacy) =====

  private formatDuration(hours: number): string {
    if (!hours || hours <= 0) return 'N/A';
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${hours.toFixed(1)}h`;
    return `${Math.round(hours / 24)}d`;
  }

  private calculateHighPriorityCount(
    priorityDistribution: Array<{ priority: string; count: number }>,
  ): number {
    return priorityDistribution
      .filter((p) => p.priority === 'High' || p.priority === 'Critical')
      .reduce((sum, p) => sum + p.count, 0);
  }
}
