/**
 * Comprehensive Type Definitions for All Report Types
 *
 * This file provides type-safe interfaces for all 7 report types in the workflow system,
 * ensuring compile-time safety and eliminating template-data contract violations.
 *
 * Report Types Covered:
 * - InteractiveDashboardData
 * - SimpleReportData
 * - TaskDetailData

 * - DelegationFlowData
 * - RolePerformanceData
 * - WorkflowAnalyticsData
 */

// ============================================================================
// SHARED COMMON TYPES
// ============================================================================

export type TaskStatus =
  | 'not-started'
  | 'in-progress'
  | 'needs-review'
  | 'completed'
  | 'needs-changes'
  | 'paused'
  | 'cancelled';
export type Priority = 'Low' | 'Medium' | 'High' | 'Critical';
export type Role =
  | 'boomerang'
  | 'architect'
  | 'senior-developer'
  | 'code-review';

/**
 * Common metadata for all reports
 */
export interface ReportMetadata {
  generatedAt: string;
  version: string;
  generatedBy: string;
  reportType: string;
  taskId?: string;
  slug?: string;
}

/**
 * Chart configuration for visualizations
 */
export interface ChartConfiguration {
  id: string;
  title: string;
  type: 'pie' | 'doughnut' | 'line' | 'bar' | 'area';
  labels: string[];
  data: number[];
  colors: string[];
  options?: Record<string, any>;
}

/**
 * Filter options for interactive reports
 */
export interface FilterOptions {
  status?: TaskStatus[];
  priority?: Priority[];
  owner?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
}

// ============================================================================
// INTERACTIVE DASHBOARD DATA
// ============================================================================

export interface TaskSummary {
  id: number;
  name: string;
  slug?: string;
  status: TaskStatus;
  priority: Priority;
  owner: string;
  createdAt: Date;
  completedAt?: Date;
  duration?: number;
}

export interface DelegationSummary {
  id: number;
  taskId: string;
  fromMode: Role;
  toMode: Role;
  delegationTimestamp: string;
  completionTimestamp?: string;
  success?: boolean;
  duration?: number;
  taskName?: string;
}

export interface DashboardMetrics {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  completionRate: number;
  averageCompletionTime: number;
  totalDelegations: number;
  delegationSuccessRate: number;
}

export interface InteractiveDashboardData {
  title: string;
  subtitle?: string;
  metrics: DashboardMetrics;
  charts: {
    statusDistribution: ChartConfiguration;
    priorityDistribution: ChartConfiguration;
    completionTrend: ChartConfiguration;
    rolePerformance: ChartConfiguration;
  };
  tasks: TaskSummary[];
  delegations: DelegationSummary[];
  filters: FilterOptions;
  metadata: ReportMetadata;
}

// ============================================================================
// SIMPLE REPORT DATA
// ============================================================================

export interface SimpleTaskInfo {
  taskId: string;
  name: string;
  slug?: string;
  status: TaskStatus;
  priority: Priority;
  owner: string;
  createdAt: string;
  completedAt?: string;
}

export interface SimpleReportData {
  title: string;
  summary: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    completionRate: number;
  };
  tasks: SimpleTaskInfo[];
  metadata: ReportMetadata;
}

// ============================================================================
// TASK DETAIL DATA
// ============================================================================

export interface TaskDescription {
  description: string;
  businessRequirements?: string;
  technicalRequirements?: string;
  acceptanceCriteria: string[];
}

export interface Subtask {
  id: number;
  name: string;
  description: string;
  sequenceNumber: number;
  status: TaskStatus;
  batchId: string;
  batchTitle: string;
  strategicGuidance?: Record<string, any>;
}

export interface CodebaseAnalysis {
  architectureFindings: Record<string, any>;
  problemsIdentified: Record<string, any>;
  implementationContext: Record<string, any>;
  integrationPoints: Record<string, any>;
  qualityAssessment: Record<string, any>;
  filesCovered: string[];
  technologyStack: Record<string, any>;
  analyzedBy: string;
  analyzedAt: string;
}

export interface TaskDetailData {
  task: {
    id: number;
    name: string;
    slug?: string;
    status: TaskStatus;
    priority: Priority;
    owner: string;
    currentMode: Role;
    createdAt: string;
    completedAt?: string;
    gitBranch?: string;
  };
  description?: TaskDescription;
  subtasks: Subtask[];
  codebaseAnalysis?: CodebaseAnalysis;
  delegationHistory: DelegationSummary[];
  metadata: ReportMetadata;
}

// ============================================================================

// ============================================================================

export interface BatchInfo {
  batchId: string;
  batchTitle: string;
  subtasks: Subtask[];
  completionStatus: {
    total: number;
    completed: number;
    inProgress: number;
    notStarted: number;
  };
}

// ============================================================================
// DELEGATION FLOW DATA
// ============================================================================

// Import types for delegation flow data (using shared formatted types)
import { FormattedDelegationData, FormattedWorkflowData } from '../types';

export interface DelegationFlowData {
  task: {
    id: number;
    name: string;
    slug?: string | null;
    status: string;
    currentOwner: string | null;
    totalDelegations: number;
    redelegationCount: number;
  };
  delegationChain: FormattedDelegationData[];
  workflowTransitions: FormattedWorkflowData[];
  summary: {
    totalDelegations: number;
    successfulDelegations: number;
    failedDelegations: number;
    averageDelegationDuration: number;
    mostCommonPath: string[];
    redelegationPoints: Array<{
      fromMode: string;
      toMode: string;
      count: number;
      reasons: string[];
    }>;
    roleInvolvement: Array<{
      role: string;
      timeAsOwner: number;
      tasksReceived: number;
      tasksDelegated: number;
      successRate: number;
    }>;
  };
  metadata: {
    generatedAt: string;
    reportType: 'delegation-flow';
    version: string;
    generatedBy: string;
  };
}

// ============================================================================
// ROLE PERFORMANCE DATA
// ============================================================================

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

// ============================================================================
// WORKFLOW ANALYTICS DATA
// ============================================================================

export interface WorkflowPattern {
  pattern: string;
  frequency: number;
  averageTime: number;
  successRate: number;
  examples: string[];
}

export interface WorkflowBottleneck {
  stage: Role;
  averageDelay: number;
  frequency: number;
  impact: 'low' | 'medium' | 'high';
  recommendations: string[];
}

export interface WorkflowAnalyticsData {
  timeRange: {
    start: string;
    end: string;
  };
  overallMetrics: {
    totalWorkflows: number;
    completedWorkflows: number;
    averageWorkflowTime: number;
    successRate: number;
    mostCommonPattern: string;
  };
  patterns: WorkflowPattern[];
  bottlenecks: WorkflowBottleneck[];
  trends: {
    completionTrend: ChartConfiguration;
    volumeTrend: ChartConfiguration;
    efficiencyTrend: ChartConfiguration;
  };
  roleAnalysis: {
    roleUtilization: ChartConfiguration;
    roleEfficiency: ChartConfiguration;
    delegationPatterns: ChartConfiguration;
  };
  recommendations: {
    processImprovements: string[];
    resourceOptimization: string[];
    bottleneckResolution: string[];
  };
  metadata: ReportMetadata;
}

// ============================================================================
// EXPORT ALL TYPES
// ============================================================================

export type ReportData =
  | InteractiveDashboardData
  | SimpleReportData
  | TaskDetailData
  | DelegationFlowData
  | RolePerformanceData
  | WorkflowAnalyticsData;

export type ReportType =
  | 'interactive-dashboard'
  | 'simple-report'
  | 'task-detail'
  | 'delegation-flow'
  | 'role-performance'
  | 'workflow-analytics';
