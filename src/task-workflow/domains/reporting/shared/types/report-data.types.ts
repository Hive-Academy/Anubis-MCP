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
 * - ImplementationPlanData
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
  | 'researcher'
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
  taskSlug?: string;
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
  taskId: string;
  name: string;
  taskSlug?: string;
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
  taskSlug?: string;
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

export interface ImplementationPlan {
  id: number;
  overview: string;
  approach: string;
  technicalDecisions: Record<string, any>;
  filesToModify: string[];
  createdBy: string;
  createdAt: string;
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
    taskId: string;
    name: string;
    taskSlug?: string;
    status: TaskStatus;
    priority: Priority;
    owner: string;
    currentMode: Role;
    createdAt: string;
    completedAt?: string;
    gitBranch?: string;
  };
  description?: TaskDescription;
  implementationPlans: ImplementationPlan[];
  subtasks: Subtask[];
  codebaseAnalysis?: CodebaseAnalysis;
  delegationHistory: DelegationSummary[];
  metadata: ReportMetadata;
}

// ============================================================================
// IMPLEMENTATION PLAN DATA
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

export interface ImplementationPlanData {
  task: {
    taskId: string;
    name: string;
    taskSlug?: string;
    status: TaskStatus;
    priority: Priority;
  };
  plan: ImplementationPlan;
  batches: BatchInfo[];
  progress: {
    overallCompletion: number;
    batchesCompleted: number;
    totalBatches: number;
    estimatedTimeRemaining?: string;
  };
  metadata: ReportMetadata;
}

// ============================================================================
// DELEGATION FLOW DATA
// ============================================================================

export interface DelegationStep {
  id: number;
  fromMode: Role;
  toMode: Role;
  delegationTimestamp: string;
  completionTimestamp?: string;
  success?: boolean;
  message?: string;
  duration?: number;
  redelegationCount: number;
}

export interface WorkflowTransition {
  id: number;
  fromMode: Role;
  toMode: Role;
  transitionTimestamp: string;
  reason: string;
}

export interface DelegationFlowData {
  task: {
    taskId: string;
    name: string;
    taskSlug?: string;
    currentMode: Role;
    status: TaskStatus;
  };
  delegationChain: DelegationStep[];
  workflowTransitions: WorkflowTransition[];
  flowAnalysis: {
    totalDelegations: number;
    successfulDelegations: number;
    averageDelegationTime: number;
    redelegationCount: number;
    currentStage: Role;
    bottlenecks: string[];
  };
  visualFlow: {
    nodes: Array<{
      id: string;
      role: Role;
      status: 'completed' | 'current' | 'pending';
      timestamp?: string;
    }>;
    edges: Array<{
      from: string;
      to: string;
      type: 'delegation' | 'redelegation';
      timestamp: string;
    }>;
  };
  metadata: ReportMetadata;
}

// ============================================================================
// ROLE PERFORMANCE DATA
// ============================================================================

export interface RoleMetrics {
  role: Role;
  tasksHandled: number;
  averageCompletionTime: number;
  successRate: number;
  redelegationRate: number;
  currentLoad: number;
  efficiency: number;
}

export interface RolePerformanceData {
  targetRole?: Role;
  timeRange: {
    start: string;
    end: string;
  };
  roleMetrics: RoleMetrics[];
  performanceCharts: {
    efficiencyComparison: ChartConfiguration;
    taskDistribution: ChartConfiguration;
    completionTimes: ChartConfiguration;
    redelegationRates: ChartConfiguration;
  };
  insights: {
    topPerformer: Role;
    bottleneckRole: Role;
    recommendations: string[];
    trends: string[];
  };
  metadata: ReportMetadata;
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
  | ImplementationPlanData
  | DelegationFlowData
  | RolePerformanceData
  | WorkflowAnalyticsData;

export type ReportType =
  | 'interactive-dashboard'
  | 'simple-report'
  | 'task-detail'
  | 'implementation-plan'
  | 'delegation-flow'
  | 'role-performance'
  | 'workflow-analytics';
