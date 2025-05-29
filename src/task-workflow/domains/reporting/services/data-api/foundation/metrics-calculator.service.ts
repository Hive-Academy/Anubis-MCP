// src/task-workflow/domains/reporting/services/metrics-calculator.service.ts

import { Injectable, Logger } from '@nestjs/common';
import {
  CodeReviewInsights,
  CodeReviewMetrics,
  DelegationFlowMetrics,
  DelegationMetrics,
  ImplementationPlanMetrics,
  PerformanceMetrics,
  TaskMetrics,
  TaskProgressHealthMetrics,
} from '../../interfaces/metrics.interface';
import { IMetricsCalculatorService } from '../../interfaces/service-contracts.interface';
import { AdvancedAnalyticsService } from '../analytics/advanced-analytics.service';
import { TaskHealthAnalysisService } from '../analytics/task-health-analysis.service';
import { CoreMetricsService } from './core-metrics.service';

type WhereClause = Record<string, any>;

/**
 * Specialized service for calculating workflow metrics
 * Follows SRP: Single responsibility for metric calculations
 * Follows OCP: Open for extension via new metric types
 * Follows DIP: Depends on abstractions (interfaces) not concretions
 */
@Injectable()
export class MetricsCalculatorService implements IMetricsCalculatorService {
  private readonly logger = new Logger(MetricsCalculatorService.name);

  constructor(
    private readonly coreMetrics: CoreMetricsService,
    private readonly advancedAnalytics: AdvancedAnalyticsService,
    private readonly taskHealthAnalysis: TaskHealthAnalysisService,
  ) {}

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

  async getImplementationPlanMetrics(
    whereClause: WhereClause,
  ): Promise<ImplementationPlanMetrics> {
    return this.advancedAnalytics.getImplementationPlanMetrics(whereClause);
  }

  async getCodeReviewInsights(
    whereClause: WhereClause,
  ): Promise<CodeReviewInsights> {
    return this.advancedAnalytics.getCodeReviewInsights(whereClause);
  }

  async getDelegationFlowMetrics(
    whereClause: WhereClause,
  ): Promise<DelegationFlowMetrics> {
    return this.advancedAnalytics.getDelegationFlowMetrics(whereClause);
  }

  // Individual Task Metrics Methods - Simplified implementations
  async getTaskProgressHealthMetrics(
    taskId: string,
  ): Promise<TaskProgressHealthMetrics> {
    return this.taskHealthAnalysis.getTaskProgressHealthMetrics(taskId);
  }

  // Delegate individual task metrics to TaskHealthAnalysisService
  getImplementationExecutionMetrics(taskId: string): any {
    return this.taskHealthAnalysis.getImplementationExecutionMetrics(taskId);
  }

  getCodeReviewQualityMetrics(taskId: string): any {
    return this.taskHealthAnalysis.getCodeReviewQualityMetrics(taskId);
  }

  getTaskDelegationFlowMetrics(taskId: string): any {
    return this.taskHealthAnalysis.getTaskDelegationFlowMetrics(taskId);
  }

  getResearchDocumentationMetrics(taskId: string): any {
    return this.taskHealthAnalysis.getResearchDocumentationMetrics(taskId);
  }

  getCommunicationCollaborationMetrics(taskId: string): any {
    return this.taskHealthAnalysis.getCommunicationCollaborationMetrics(taskId);
  }
}
