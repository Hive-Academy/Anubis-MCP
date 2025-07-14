import {
  CodebaseAnalysis,
  Prisma,
  Task,
  TaskDescription,
} from '../../../../../generated/prisma';

// Transaction type
export type PrismaTransaction = Prisma.TransactionClient;

// Input types
export type TaskWhereInput = Prisma.TaskWhereInput;
export type TaskOrderByInput = Prisma.TaskOrderByWithRelationInput;

// Comprehensive Task with all relations
export interface TaskWithRelations extends Task {
  taskDescription?: TaskDescription | null;
  codebaseAnalysis?: CodebaseAnalysis | null;
  subtasks?: Prisma.SubtaskGetPayload<Record<string, never>>[];
  delegationRecords?: Prisma.DelegationRecordGetPayload<
    Record<string, never>
  >[];
  researchReports?: Prisma.ResearchReportGetPayload<Record<string, never>>[];
  codeReviews?: Prisma.CodeReviewGetPayload<Record<string, never>>[];
  completionReports?: Prisma.CompletionReportGetPayload<
    Record<string, never>
  >[];
  workflowExecutions?: Prisma.WorkflowExecutionGetPayload<
    Record<string, never>
  >[];
}

// Create and Update data types
export interface CreateTaskData {
  name: string;
  slug?: string;
  status?: string;
  owner?: string;
  currentMode?: string;
  priority?: string;
  dependencies?: string[];
  gitBranch?: string;
  taskDescription?: {
    description?: string;
    businessRequirements?: string;
    technicalRequirements?: string;
    acceptanceCriteria?: string[];
  };
  codebaseAnalysis?: {
    architectureFindings?: any;
    problemsIdentified?: any;
    implementationContext?: any;
    qualityAssessment?: any;
    filesCovered?: string[];
    technologyStack?: any;
    analyzedBy?: string;
  };
}

export interface UpdateTaskData {
  name?: string;
  slug?: string;
  status?: string;
  owner?: string;
  currentMode?: string;
  priority?: string;
  dependencies?: string[];
  gitBranch?: string;
  taskDescription?: {
    description?: string;
    businessRequirements?: string;
    technicalRequirements?: string;
    acceptanceCriteria?: string[];
  };
  codebaseAnalysis?: {
    architectureFindings?: any;
    problemsIdentified?: any;
    implementationContext?: any;
    qualityAssessment?: any;
    filesCovered?: string[];
    technologyStack?: any;
    analyzedBy?: string;
  };
}
