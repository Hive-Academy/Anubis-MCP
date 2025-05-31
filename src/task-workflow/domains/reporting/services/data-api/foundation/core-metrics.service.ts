import { Injectable, Logger } from '@nestjs/common';

// Import specialized services
import { TaskMetricsService, TaskMetrics } from './task-metrics.service';
import { DelegationMetricsService } from './delegation-metrics.service';
import {
  CodeReviewMetricsService,
  CodeReviewMetrics,
} from './code-review-metrics.service';
import { ImplementationPlanMetricsService } from './implementation-plan-metrics.service';

// Import template interfaces
import type { DelegationMetrics } from '../delegation-analytics/delegation-analytics-template.interface';
import type { PerformanceMetrics } from '../performance-dashboard/performance-dashboard-template.interface';

type WhereClause = Record<string, any>;

/**
 * Core Metrics Service - Refactored to follow SOLID principles
 *
 * Follows SRP: Single responsibility for orchestrating metrics calculations
 * Follows DIP: Depends on abstractions (injected services) not concrete implementations
 * Follows OCP: Open for extension by adding new metric services
 *
 * This service now acts as a lightweight orchestrator that delegates to specialized services
 */
@Injectable()
export class CoreMetricsService {
  private readonly logger = new Logger(CoreMetricsService.name);

  constructor(
    private readonly taskMetricsService: TaskMetricsService,
    private readonly delegationMetricsService: DelegationMetricsService,
    private readonly codeReviewMetricsService: CodeReviewMetricsService,
    private readonly implementationPlanMetricsService: ImplementationPlanMetricsService,
  ) {}

  async getTaskMetrics(whereClause: WhereClause): Promise<TaskMetrics> {
    this.logger.debug(
      'Delegating task metrics calculation to TaskMetricsService',
    );
    return this.taskMetricsService.getTaskMetrics(whereClause);
  }

  async getDelegationMetrics(
    whereClause: WhereClause,
  ): Promise<DelegationMetrics> {
    this.logger.debug(
      'Delegating delegation metrics calculation to DelegationMetricsService',
    );
    return this.delegationMetricsService.getDelegationMetrics(whereClause);
  }

  async getCodeReviewMetrics(
    whereClause: WhereClause,
  ): Promise<CodeReviewMetrics> {
    this.logger.debug(
      'Delegating code review metrics calculation to CodeReviewMetricsService',
    );
    return this.codeReviewMetricsService.getCodeReviewMetrics(whereClause);
  }

  async getImplementationPlanMetrics(whereClause: WhereClause): Promise<any> {
    this.logger.debug(
      'Delegating implementation plan metrics calculation to ImplementationPlanMetricsService',
    );
    return this.implementationPlanMetricsService.getImplementationPlanMetrics(
      whereClause,
    );
  }

  getPerformanceMetrics(_whereClause: WhereClause): PerformanceMetrics {
    this.logger.debug(
      'Performance metrics calculation - returning default values for now',
    );
    // TODO: Create dedicated PerformanceMetricsService when needed
    return this.getDefaultPerformanceMetrics();
  }

  private getDefaultPerformanceMetrics(): PerformanceMetrics {
    return {
      averageCompletionTime: '0h',
      completionTimeTrend: 0,
      throughputRate: 0,
      throughputTrend: 0,
      redelegationRate: 0,
      redelegationTrend: 0,
      qualityScore: 0,
      qualityTrend: 0,
    };
  }
}
