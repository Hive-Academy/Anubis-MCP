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
import {
  ReportType,
  WhereClause,
} from '../../interfaces/service-contracts.interface';
import {
  CodeReviewMetrics,
  DelegationMetrics,
  PerformanceMetrics,
  ReportFilters,
  TaskMetrics,
} from '../../interfaces/report-data.interface';
import { MetricsCalculatorService } from './metrics-calculator.service';

@Injectable()
export class ReportDataAccessService {
  private readonly logger = new Logger(ReportDataAccessService.name);

  constructor(private readonly metricsCalculator: MetricsCalculatorService) {}

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
      case 'task_progress_health':
        return await this.metricsCalculator.getTaskProgressHealthMetrics(
          taskId,
        );
      case 'implementation_execution':
        return this.metricsCalculator.getImplementationExecutionMetrics(taskId);
      case 'code_review_quality':
        return this.metricsCalculator.getCodeReviewQualityMetrics(taskId);
      case 'delegation_flow_analysis_task':
        return this.metricsCalculator.getTaskDelegationFlowMetrics(taskId);
      case 'research_documentation':
        return this.metricsCalculator.getResearchDocumentationMetrics(taskId);
      case 'communication_collaboration':
        return this.metricsCalculator.getCommunicationCollaborationMetrics(
          taskId,
        );
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

    return delegationMetrics.modeTransitions || [];
  }
}
