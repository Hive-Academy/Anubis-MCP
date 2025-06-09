/**
 * Shared types for the reporting system
 * Following KISS principle with clear, focused interfaces
 */

import { ReportMetadata } from './types/report-data.types';

// Note: Main data interfaces are in shared/types/report-data.types.ts
// This file contains Prisma-related and formatting utility types

// Template rendering context (legacy interface, kept for compatibility)
export interface TemplateContext<T = unknown> {
  data: T;
  metadata: ReportMetadata;
}

// Data transformation options
export interface TransformOptions {
  includeMetadata?: boolean;
  dateFormat?: string;
  numberFormat?: string;
  filters?: ReportFilters;
}

// Common query filters
export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  status?:
    | 'not-started'
    | 'in-progress'
    | 'needs-review'
    | 'completed'
    | 'needs-changes'
    | 'paused'
    | 'cancelled';
  owner?: string;
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  taskId?: number;
  basePath?: string;
}

// Prisma query result types with proper relations
export interface TaskWithRelations {
  id: number;
  name: string;
  slug?: string | null;
  status: string;
  owner?: string | null;
  priority?: string | null;
  createdAt: Date;
  completionDate?: Date | null;
  delegationRecords?: DelegationRecordWithRelations[];
  workflowTransitions?: WorkflowTransitionWithRelations[];
  implementationPlans?: ImplementationPlanWithRelations[];
  subtasks?: SubtaskWithRelations[];
  codebaseAnalysis?: CodebaseAnalysisData;
  taskDescription?: TaskDescriptionData;
  currentMode?: string | null;
  gitBranch?: string | null;
}

export interface DelegationRecordWithRelations {
  id: number;
  taskId: number;
  subtaskId?: number | null;
  fromMode: string;
  toMode: string;
  delegationTimestamp: Date;
  completionTimestamp?: Date | null;
  success?: boolean | null;
  rejectionReason?: string | null;
  redelegationCount?: number;
  subtask?: {
    id: number;
    name: string;
  } | null;
  task?: {
    id: number;
    name: string;
    slug?: string | null;
  };
}

export interface WorkflowTransitionWithRelations {
  id: number;
  taskId: number;
  fromMode: string;
  toMode: string;
  transitionTimestamp: Date;
  reason?: string | null;
  task?: {
    id: number;
    name: string;
    slug?: string | null;
  };
}

export interface ImplementationPlanWithRelations {
  id: number;
  taskId: number;
  overview: string;
  approach: string;
  technicalDecisions: Record<string, unknown>;
  filesToModify: string[];
  strategicGuidance?: Record<string, unknown> | null;
  strategicContext?: Record<string, unknown> | null;
  verificationEvidence?: Record<string, unknown> | null;
  architecturalRationale?: string | null;
  redelegationContext?: Record<string, unknown> | null;
  issueAnalysis?: Record<string, unknown> | null;
  solutionStrategy?: Record<string, unknown> | null;
  qualityGates?: Record<string, unknown> | null;
  patternCompliance?: Record<string, unknown> | null;
  antiPatternPrevention?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  subtasks?: SubtaskWithRelations[];
}

export interface SubtaskWithRelations {
  id: number;
  taskId: number;
  planId: number;
  name: string;
  description: string;
  sequenceNumber: number;
  status: string;
  assignedTo?: string | null;
  estimatedDuration?: string | null;
  startedAt?: Date | null;
  completedAt?: Date | null;
  batchId?: string | null;
  batchTitle?: string | null;
  strategicGuidance?: Record<string, unknown> | null;
  qualityConstraints?: Record<string, unknown> | null;
  successCriteria?: Record<string, unknown> | null;
  architecturalRationale?: string | null;
  plan?: {
    id: number;
    overview: string;
  };
}

export interface CodebaseAnalysisData {
  id: number;
  taskId: number;
  architectureFindings: Record<string, unknown>;
  problemsIdentified: Record<string, unknown>;
  implementationContext: Record<string, unknown>;
  integrationPoints: Record<string, unknown>;
  qualityAssessment: Record<string, unknown>;
  filesCovered: Record<string, unknown>; // JSON array in Prisma
  technologyStack: Record<string, unknown>;
  analyzedAt: Date;
  updatedAt: Date;
  analyzedBy: string;
  analysisVersion: string;
}

export interface TaskDescriptionData {
  taskId: number;
  description: string;
  businessRequirements: string;
  technicalRequirements: string;
  acceptanceCriteria: Record<string, unknown>; // JSON in Prisma
  createdAt: Date;
  updatedAt: Date;
}

// Transformed data types for reporting
export interface FormattedTaskData {
  taskId: number;
  name: string;
  slug?: string | null;
  status: string;
  owner?: string | null;
  priority?: string | null;
  creationDate: string;
  completionDate?: string | null;
  duration: number; // in hours
  delegationCount?: number;
  transitionCount?: number;
  subtaskCount?: number;
}

export interface FormattedDelegationData {
  id: number;
  fromMode: string;
  toMode: string;
  delegationTimestamp: string;
  completionTimestamp?: string | null;
  success?: boolean | null;
  duration: number; // in hours
  subtaskName?: string;
  taskName?: string;
}

export interface FormattedWorkflowData {
  id: number;
  fromMode: string;
  toMode: string;
  transitionTimestamp: string;
  reason?: string | null;
  taskName?: string;
}

// Chart.js compatible data types
export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

// Summary statistics types
export interface SummaryStats {
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  completionRate: number;
}

export interface PerformanceMetrics {
  averageDuration: number;
  fastestCompletion: number;
  slowestCompletion: number;
  totalCompleted: number;
}

// Aggregated data types
export interface TimeframeAggregation {
  period: string;
  count: number;
  items: (
    | FormattedTaskData
    | FormattedDelegationData
    | FormattedWorkflowData
  )[];
}

export interface RoleAggregation {
  role: string;
  count: number;
  items: (FormattedTaskData | FormattedDelegationData)[];
}

// Alpine.js reactive data structure
export interface ReactiveData {
  [key: string]: any;
  filters?: Record<string, any>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Delegation Flow specific template data
export interface DelegationFlowTemplateData {
  task: {
    id: number;
    name: string;
    slug?: string | null;
    status: string;
    currentOwner: string | null;
    totalDelegations: number;
    redelegationCount: number;
  };
  delegations: Array<{
    id: number;
    fromRole: string;
    toRole: string;
    delegatedAt: string;
    duration: number;
    success?: boolean | null;
  }>;
  uniqueRoles: string[];
  averageDelegationTime: number;
  flowEfficiency: number;
  roleAnalysis: Array<{
    role: string;
    involvement: number;
    delegationsReceived: number;
    delegationsMade: number;
    averageHoldTime: number;
    efficiency: number;
  }>;
  commonPaths: Array<{
    fromRole: string;
    toRole: string;
    count: number;
    percentage: number;
  }>;
  escalationPatterns: Array<{
    fromRole: string;
    toRole: string;
    count: number;
    reason: string;
  }>;
  taskStartDate: string | Date;
  firstDelegation: string | Date;
  lastDelegation: string | Date;
  totalFlowTime: number;
  bottlenecks: Array<{
    role: string;
    averageHoldTime: number;
    delayCount: number;
  }>;
  fastTransitions: Array<{
    fromRole: string;
    toRole: string;
    averageTime: number;
  }>;
  optimizationTips: Array<{
    title: string;
    description: string;
    impact: string;
  }>;
  title: string;
  chartData: ChartData;
}

// Task Detail specific template data
export interface TaskDetailTemplateData {
  task: FormattedTaskData;
  description: TaskDescriptionData;
  implementationPlans: ImplementationPlanWithRelations[];
  delegationHistory: FormattedDelegationData[];
  workflowProgress: {
    completionPercentage: number;
    currentStage: string;
    stagesCompleted: number;
    totalStages: number;
  };
  qualityMetrics: {
    codeQuality: number;
    testCoverage: number;
    documentation: number;
  };
  title: string;
  chartData: {
    workflowProgress: {
      completion: number;
      stages: Array<{
        stage: string;
        duration: number;
        success?: boolean | null;
      }>;
    };
    qualityTrends: {
      codeQuality: number;
      testCoverage: number;
      documentation: number;
    };
  };
}

// Interactive Dashboard specific template data
export interface InteractiveDashboardTemplateData {
  summary: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    averageCompletionTime: number;
  };
  taskTable: {
    columns: Array<{
      key: string;
      label: string;
      sortable: boolean;
    }>;
    data: FormattedTaskData[];
  };
  delegationTable: {
    columns: Array<{
      key: string;
      label: string;
      sortable: boolean;
    }>;
    data: FormattedDelegationData[];
  };
  charts: {
    statusDistribution: ChartData;
    priorityDistribution: ChartData;
    delegationFlow: ChartData;
    timeline: ChartData;
  };
  title: string;
  filters: ReportFilters;
  hasFilters: boolean;
}

// Union type for all possible template data
export type TemplateData =
  | DelegationFlowTemplateData
  | TaskDetailTemplateData
  | InteractiveDashboardTemplateData
  | Record<string, unknown>; // Fallback for custom templates

// Legacy type definitions (kept for backward compatibility during migration)
