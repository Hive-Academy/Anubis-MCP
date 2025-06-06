/**
 * Shared service interfaces for the reporting system
 * Following Interface Segregation Principle
 */

import {
  ChartData,
  DelegationRecordWithRelations,
  FormattedDelegationData,
  FormattedTaskData,
  FormattedWorkflowData,
  PerformanceMetrics,
  ReportFilters,
  RoleAggregation,
  SummaryStats,
  TaskWithRelations,
  TemplateContext,
  TimeframeAggregation,
  TransformOptions,
  WorkflowTransitionWithRelations,
  ImplementationPlanWithRelations,
  SubtaskWithRelations,
} from './types';
import { ReportMetadata } from './types/report-data.types';

/**
 * Data fetching service interface
 * Handles all Prisma queries and data retrieval
 */
export interface IReportDataService {
  // Task data retrieval
  getTasks(filters?: ReportFilters): Promise<TaskWithRelations[]>;
  getTask(taskId: string): Promise<TaskWithRelations | null>;

  // Delegation and workflow data
  getDelegationRecords(
    filters?: ReportFilters,
  ): Promise<DelegationRecordWithRelations[]>;
  getWorkflowTransitions(
    filters?: ReportFilters,
  ): Promise<WorkflowTransitionWithRelations[]>;

  // Implementation data
  getImplementationPlans(
    taskId: string,
  ): Promise<ImplementationPlanWithRelations[]>;
  getSubtasks(taskId: string): Promise<SubtaskWithRelations[]>;

  // Aggregated statistics
  getAggregatedStats(filters?: ReportFilters): Promise<{
    taskStats: {
      total: number;
      byStatus: Record<string, number>;
      byPriority: Record<string, number>;
    };
    delegationStats: {
      total: number;
      successful: number;
      failed: number;
      byRole: Record<string, number>;
    };
    performanceStats: {
      averageTaskDuration: number;
      averageDelegationDuration: number;
      completionRate: number;
    };
  }>;
}

/**
 * Data transformation service interface
 * Handles data mapping, formatting, and processing
 */
export interface IReportTransformService {
  // Data formatting
  formatTaskData(
    task: TaskWithRelations,
    options?: TransformOptions,
  ): FormattedTaskData;
  formatDelegationData(
    delegations: DelegationRecordWithRelations[],
    options?: TransformOptions,
  ): FormattedDelegationData[];
  formatWorkflowData(
    transitions: WorkflowTransitionWithRelations[],
    options?: TransformOptions,
  ): FormattedWorkflowData[];

  // Chart data preparation
  prepareChartData(
    data: FormattedTaskData[] | FormattedDelegationData[],
    chartType: string,
  ): ChartData;

  // Statistical calculations
  calculateSummaryStats(data: FormattedTaskData[]): SummaryStats;
  calculatePerformanceMetrics(data: FormattedTaskData[]): PerformanceMetrics;

  // Data aggregation
  aggregateByTimeframe(
    data:
      | FormattedTaskData[]
      | FormattedDelegationData[]
      | FormattedWorkflowData[],
    timeframe: 'day' | 'week' | 'month',
  ): TimeframeAggregation[];
  aggregateByRole(
    data: FormattedDelegationData[] | FormattedTaskData[],
  ): RoleAggregation[];
}

/**
 * HTML rendering service interface
 * Handles type-safe HTML generation (replaces legacy Handlebars system)
 */
export interface IReportRenderService {
  // Type-safe HTML generation
  generateHTML(data: any, reportType: string): Promise<string>;

  // Context preparation (legacy, kept for compatibility)
  prepareTemplateContext(data: any, reportType: string): TemplateContext;

  // File output
  renderToFile(
    data: any,
    reportType: string,
    outputPath: string,
  ): Promise<void>;
}

/**
 * Metadata service interface
 * Handles common report metadata generation
 */
export interface IReportMetadataService {
  // Metadata generation
  generateMetadata(reportType: string, generatedBy?: string): ReportMetadata;

  // Data statistics
  calculateDataStats(
    data: unknown,
    reportType: string,
  ): {
    dataCount: number;
    complexity: 'low' | 'medium' | 'high';
    estimatedReadTime: string;
  };
}
