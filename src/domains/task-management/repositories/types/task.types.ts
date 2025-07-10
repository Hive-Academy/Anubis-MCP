import {
  Prisma,
  Task,
  TaskDescription,
  Subtask,
  DelegationRecord,
  ResearchReport,
  CodeReview,
  CompletionReport,
  CodebaseAnalysis,
  WorkflowExecution,
} from '../../../../../generated/prisma';

// Transaction type
export type PrismaTransaction = Prisma.TransactionClient;

// Input types
export type TaskWhereInput = Prisma.TaskWhereInput;
export type TaskOrderByInput = Prisma.TaskOrderByWithRelationInput;

// Comprehensive Task with all relations
export type TaskWithRelations = Task & {
  taskDescription?: TaskDescription | null;
  codebaseAnalysis?: CodebaseAnalysis | null;
  researchReports?: ResearchReport[];
  subtasks?: Subtask[];
  delegationRecords?: DelegationRecord[];
  codeReviews?: CodeReview[];
  completionReports?: CompletionReport[];
  workflowExecutions?: WorkflowExecution[];
};

// Task with subtasks specifically
export type TaskWithSubtasks = Task & {
  subtasks: Subtask[];
  taskDescription?: TaskDescription | null;
};

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
