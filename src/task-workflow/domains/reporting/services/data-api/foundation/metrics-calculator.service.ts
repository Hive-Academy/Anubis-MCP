// src/task-workflow/domains/reporting/services/metrics-calculator.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { CoreMetricsService } from './core-metrics.service';
import type { TaskMetrics, CodeReviewMetrics } from './core-metrics.service';

// Import template-specific interfaces
import type { DelegationMetrics } from '../delegation-analytics/delegation-analytics-template.interface';
import type { PerformanceMetrics } from '../performance-dashboard/performance-dashboard-template.interface';

type WhereClause = Record<string, any>;

/**
 * Specialized service for calculating workflow metrics
 * Follows SRP: Single responsibility for metric calculations
 * Follows OCP: Open for extension via new metric types
 * Follows DIP: Depends on abstractions (interfaces) not concretions
 */
@Injectable()
export class MetricsCalculatorService {
  private readonly logger = new Logger(MetricsCalculatorService.name);

  constructor(private readonly coreMetrics: CoreMetricsService) {}

  async getTaskMetrics(whereClause: WhereClause): Promise<TaskMetrics> {
    return this.coreMetrics.getTaskMetrics(whereClause);
  }

  async getDelegationMetrics(
    whereClause: WhereClause,
  ): Promise<DelegationMetrics> {
    return this.coreMetrics.getDelegationMetrics(whereClause);
  }

  async getCodeReviewMetrics(
    whereClause: WhereClause,
  ): Promise<CodeReviewMetrics> {
    return this.coreMetrics.getCodeReviewMetrics(whereClause);
  }

  async getPerformanceMetrics(
    whereClause: WhereClause,
  ): Promise<PerformanceMetrics> {
    return this.coreMetrics.getPerformanceMetrics(whereClause);
  }

  // Individual task metric methods (simplified for now)
  getCodeReviewQualityMetrics(taskId: string): any {
    this.logger.debug(
      `Getting code review quality metrics for task: ${taskId}`,
    );
    // Return mock data for now
    return Promise.resolve({
      overallApprovalRate: 85,
      reworkCycles: 1,
      testingCoverage: { coveragePercent: 80 },
    });
  }

  getResearchDocumentationMetrics(taskId: string): any {
    this.logger.debug(
      `Getting research documentation metrics for task: ${taskId}`,
    );
    // Return mock data for now
    return Promise.resolve({
      researchReports: [],
      documentationQuality: { completeness: 75, overallScore: 80 },
      knowledgeCapture: { totalFindings: 3, knowledgeGaps: [] },
    });
  }
}
