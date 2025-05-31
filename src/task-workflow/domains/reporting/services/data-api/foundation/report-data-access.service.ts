/**
 * Report Data Access Service
 *
 * Pure Prisma API interface for report data access.
 * Provides raw database queries and basic filtering without business logic.
 *
 * Separation of Concerns:
 * - This service: Pure data access layer (Prisma queries)
 * - Business logic: Handled by specific data API services
 * - Data transformation: Handled by template data services
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

import { MetricsCalculatorService } from './metrics-calculator.service';

// Import template-specific interfaces
import type { DelegationMetrics } from '../delegation-analytics/delegation-analytics-template.interface';
import type { PerformanceMetrics } from '../performance-dashboard/performance-dashboard-template.interface';
import { TaskMetrics } from './task-metrics.service';
import { CodeReviewMetrics } from './code-review-metrics.service';

// Local type definitions (moved from deleted interface files)
type WhereClause = Record<string, any>;

type ReportType =
  | 'task_progress_health'
  | 'implementation_execution'
  | 'code_review_quality'
  | 'delegation_flow_analysis_task'
  | 'research_documentation'
  | 'communication_collaboration';

interface ReportFilters {
  owner?: string;
  mode?: string;
  priority?: string;
  taskId?: string;
}

@Injectable()
export class ReportDataAccessService {
  private readonly logger = new Logger(ReportDataAccessService.name);

  constructor(
    private readonly metricsCalculator: MetricsCalculatorService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Get base metrics for aggregate reports
   * Raw data access without transformation
   */
  async getBaseMetrics(whereClause: WhereClause): Promise<{
    tasks: TaskMetrics;
    delegations: DelegationMetrics;
    codeReviews: CodeReviewMetrics;
    performance: PerformanceMetrics;
  }> {
    this.logger.debug('Fetching base metrics for aggregate report');

    const [tasks, delegations, codeReviews, performance] = await Promise.all([
      this.metricsCalculator.getTaskMetrics(whereClause),
      this.metricsCalculator.getDelegationMetrics(whereClause),
      this.metricsCalculator.getCodeReviewMetrics(whereClause),
      this.metricsCalculator.getPerformanceMetrics(whereClause),
    ]);

    return { tasks, delegations, codeReviews, performance };
  }

  /**
   * Get individual task metrics
   * Pure data access for specific task reports
   */
  async getIndividualTaskMetrics(
    reportType: ReportType,
    taskId: string,
  ): Promise<any> {
    this.logger.debug(`Fetching individual task metrics for ${taskId}`);

    switch (reportType) {
      case 'code_review_quality':
        return await this.metricsCalculator.getCodeReviewQualityMetrics(taskId);
      case 'research_documentation':
        return this.metricsCalculator.getResearchDocumentationMetrics(taskId);
      default: {
        // Generic task metrics
        const whereClause = { taskId };
        return await this.metricsCalculator.getTaskMetrics(whereClause);
      }
    }
  }

  /**
   * Build where clause for database queries
   * Pure filtering logic without business rules
   */
  buildWhereClause(
    startDate?: Date,
    endDate?: Date,
    filters?: ReportFilters,
  ): WhereClause {
    const whereClause: WhereClause = {};

    if (startDate && endDate) {
      whereClause.creationDate = {
        gte: startDate,
        lte: endDate,
      };
    }

    if (filters) {
      if (filters.owner) {
        whereClause.owner = filters.owner;
      }
      if (filters.mode) {
        whereClause.currentMode = filters.mode;
      }
      if (filters.priority) {
        whereClause.priority = filters.priority;
      }
      if (filters.taskId) {
        whereClause.taskId = filters.taskId;
      }
    }

    return whereClause;
  }

  /**
   * Check if report type is for individual tasks
   * Utility method for routing queries
   */
  isIndividualTaskReport(reportType: ReportType): boolean {
    const individualTaskReports: ReportType[] = [
      'task_progress_health',
      'implementation_execution',
      'code_review_quality',
      'delegation_flow_analysis_task',
      'research_documentation',
      'communication_collaboration',
    ];

    return individualTaskReports.includes(reportType);
  }

  /**
   * Get research report data for a specific task
   * Pure data access for research reports
   */
  async getResearchReport(taskId: string): Promise<any> {
    this.logger.debug(`Fetching research report for task: ${taskId}`);
    return await this.metricsCalculator.getResearchDocumentationMetrics(taskId);
  }

  /**
   * Get workflow transitions for a specific task
   * Pure data access for workflow analysis
   */
  async getWorkflowTransitions(taskId: string): Promise<any[]> {
    this.logger.debug(`Fetching workflow transitions for task: ${taskId}`);

    const delegationMetrics = await this.metricsCalculator.getDelegationMetrics(
      { taskId },
    );

    // Return empty array if no transitions available
    return delegationMetrics.weeklyTrends?.successful || [];
  }

  /**
   * Get recent tasks with proper data mapping
   * Pure data access for task summary reports
   */
  async getRecentTasks(
    whereClause: WhereClause,
    limit: number = 10,
  ): Promise<
    Array<{
      taskId: string;
      name: string;
      status: string;
      priority: string | null;
      owner: string | null;
      creationDate: Date;
    }>
  > {
    this.logger.debug(`Fetching recent tasks with limit: ${limit}`);

    const tasks = await this.prisma.task.findMany({
      where: whereClause,
      select: {
        taskId: true,
        name: true,
        status: true,
        priority: true,
        owner: true,
        creationDate: true,
      },
      orderBy: { creationDate: 'desc' },
      take: limit,
    });

    return tasks;
  }
}
