import { Subtask, SubtaskDependency } from '../../../../../generated/prisma';
import {
  CreateSubtaskData,
  PrismaTransaction,
  SubtaskBatchData,
  SubtaskOrderByInput,
  SubtaskWhereInput,
  SubtaskWithDependencies,
  SubtaskWithRelations,
  UpdateSubtaskData,
} from '../types/subtask.types';

export interface ISubtaskRepository {
  // Basic CRUD Operations
  findById(
    id: number,
    include?: SubtaskIncludeOptions,
  ): Promise<SubtaskWithRelations | null>;
  findByName(
    name: string,
    taskId: number,
    include?: SubtaskIncludeOptions,
  ): Promise<SubtaskWithRelations | null>;
  create(data: CreateSubtaskData): Promise<SubtaskWithRelations>;
  update(id: number, data: UpdateSubtaskData): Promise<SubtaskWithRelations>;
  delete(id: number): Promise<Subtask>;

  // Query Operations
  findMany(options?: SubtaskFindManyOptions): Promise<SubtaskWithRelations[]>;
  findByTaskId(
    taskId: number,
    include?: SubtaskIncludeOptions,
  ): Promise<SubtaskWithRelations[]>;
  findByStatus(
    status: string,
    taskId?: number,
    include?: SubtaskIncludeOptions,
  ): Promise<SubtaskWithRelations[]>;
  findByBatchId(
    batchId: string,
    taskId: number,
    include?: SubtaskIncludeOptions,
  ): Promise<SubtaskWithRelations[]>;
  findBySequenceRange(
    taskId: number,
    startSeq: number,
    endSeq: number,
  ): Promise<SubtaskWithRelations[]>;

  // Dependency Management
  findWithDependencies(id: number): Promise<SubtaskWithDependencies | null>;
  findDependents(subtaskId: number): Promise<SubtaskWithRelations[]>;
  findDependencies(subtaskId: number): Promise<SubtaskWithRelations[]>;
  validateDependencies(
    subtaskId: number,
    dependencies: string[],
  ): Promise<boolean>;
  createDependency(
    dependentSubtaskId: number,
    requiredSubtaskId: number,
  ): Promise<SubtaskDependency>;
  removeDependency(
    dependentSubtaskId: number,
    requiredSubtaskId: number,
  ): Promise<void>;

  // Batch Operations
  createBatch(batchData: SubtaskBatchData): Promise<SubtaskWithRelations[]>;
  findNextSubtask(
    taskId: number,
    currentSubtaskId?: number,
  ): Promise<SubtaskWithRelations | null>;
  findAvailableSubtasks(taskId: number): Promise<SubtaskWithRelations[]>;
  updateBatchStatus(
    batchId: string,
    taskId: number,
    status: string,
  ): Promise<SubtaskWithRelations[]>;

  // Progress Tracking
  getTaskProgress(taskId: number): Promise<SubtaskProgressSummary>;
  getBatchProgress(
    batchId: string,
    taskId: number,
  ): Promise<BatchProgressSummary>;
  getCompletionEvidence(id: number): Promise<SubtaskCompletionEvidence | null>;
  updateCompletionEvidence(
    id: number,
    evidence: SubtaskCompletionEvidence,
  ): Promise<SubtaskWithRelations>;

  // Utility Operations
  getNextSequenceNumber(taskId: number, batchId?: string): Promise<number>;
  reorderSubtasks(reorderMap: Record<number, number>): Promise<void>;
  count(where?: SubtaskWhereInput): Promise<number>;

  // Transaction Support
  createWithTransaction(
    data: CreateSubtaskData,
    tx?: PrismaTransaction,
  ): Promise<SubtaskWithRelations>;
  updateWithTransaction(
    id: number,
    data: UpdateSubtaskData,
    tx?: PrismaTransaction,
  ): Promise<SubtaskWithRelations>;
  createBatchWithTransaction(
    batchData: SubtaskBatchData,
    tx?: PrismaTransaction,
  ): Promise<SubtaskWithRelations[]>;
}

export interface SubtaskIncludeOptions {
  task?: boolean;
  dependencies?: boolean;
  dependents?: boolean;
  completionEvidence?: boolean;
}

export interface SubtaskFindManyOptions {
  where?: SubtaskWhereInput;
  include?: SubtaskIncludeOptions;
  orderBy?: SubtaskOrderByInput;
  skip?: number;
  take?: number;
}

export interface SubtaskProgressSummary {
  totalSubtasks: number;
  completedSubtasks: number;
  inProgressSubtasks: number;
  notStartedSubtasks: number;
  progressPercentage: number;
  batchSummaries: BatchProgressSummary[];
}

export interface BatchProgressSummary {
  batchId: string;
  batchTitle: string;
  totalSubtasks: number;
  completedSubtasks: number;
  progressPercentage: number;
}

export interface SubtaskCompletionEvidence {
  acceptanceCriteriaVerification?: Record<string, string>;
  implementationSummary?: string;
  filesModified?: string[];
  testingResults?: {
    unitTests?: string;
    integrationTests?: string;
    manualTesting?: string;
  };
  qualityAssurance?: {
    codeQuality?: string;
    performance?: string;
    security?: string;
  };
  duration?: string;
}
