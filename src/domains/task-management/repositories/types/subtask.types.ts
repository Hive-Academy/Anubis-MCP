import {
  Prisma,
  Subtask,
  SubtaskDependency,
  Task,
} from '../../../../../generated/prisma';
import { PrismaTransaction } from './task.types';

// Re-export PrismaTransaction for use in interfaces
export { PrismaTransaction };

// Input types
export type SubtaskWhereInput = Prisma.SubtaskWhereInput;
export type SubtaskOrderByInput = Prisma.SubtaskOrderByWithRelationInput;

// Comprehensive Subtask with relations
export type SubtaskWithRelations = Subtask & {
  task?: Task;
  dependencies_from?: SubtaskDependency[];
  dependencies_to?: SubtaskDependency[];
};

// Subtask with dependency details
export type SubtaskWithDependencies = Subtask & {
  dependencies_from: (SubtaskDependency & {
    requiredSubtask: Subtask;
  })[];
  dependencies_to: (SubtaskDependency & {
    dependentSubtask: Subtask;
  })[];
};

// Create and Update data types
export interface CreateSubtaskData {
  taskId: number;
  name: string;
  description: string;
  batchId: string;
  batchTitle?: string;
  sequenceNumber: number;
  status?: string;
  implementationApproach?: string;
  acceptanceCriteria?: string[];
  dependencies?: string[];
  completionEvidence?: any;
}

export interface UpdateSubtaskData {
  name?: string;
  description?: string;
  batchId?: string;
  batchTitle?: string;
  sequenceNumber?: number;
  status?: string;
  implementationApproach?: string;
  acceptanceCriteria?: string[];
  dependencies?: string[];
  completionEvidence?: any;
}

// Batch creation data
export interface SubtaskBatchData {
  taskId: number;
  batchId: string;
  batchTitle: string;
  batchDescription?: string;
  subtasks: CreateSubtaskData[];
  batchDependencies?: string[];
}
