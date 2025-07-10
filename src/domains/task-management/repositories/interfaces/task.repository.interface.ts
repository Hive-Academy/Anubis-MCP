import { Task } from '../../../../../generated/prisma';
import {
  CreateTaskData,
  PrismaTransaction,
  TaskOrderByInput,
  TaskWhereInput,
  TaskWithRelations,
  UpdateTaskData,
} from '../types/task.types';

export interface ITaskRepository {
  // Basic CRUD Operations
  findById(id: number, include?: TaskIncludeOptions): Promise<Task | null>;
  findBySlug(slug: string, include?: TaskIncludeOptions): Promise<Task | null>;
  create(data: CreateTaskData): Promise<TaskWithRelations>;
  update(id: number, data: UpdateTaskData): Promise<TaskWithRelations>;
  delete(id: number): Promise<Task>;

  // Query Operations
  findMany(options?: TaskFindManyOptions): Promise<TaskWithRelations[]>;
  findByStatus(
    status: string,
    include?: TaskIncludeOptions,
  ): Promise<TaskWithRelations[]>;
  findByPriority(
    priority: string,
    include?: TaskIncludeOptions,
  ): Promise<TaskWithRelations[]>;
  findByOwner(
    owner: string,
    include?: TaskIncludeOptions,
  ): Promise<TaskWithRelations[]>;

  // Relationship Loading
  findWithSubtasks(id: number): Promise<Task | null>;
  findWithAllRelations(id: number): Promise<Task | null>;

  // Utility Operations
  ensureUniqueSlug(baseSlug: string, excludeId?: number): Promise<string>;
  isSlugTaken(slug: string, excludeId?: number): Promise<boolean>;
  count(where?: TaskWhereInput): Promise<number>;

  // Transaction Support
  createWithTransaction(
    data: CreateTaskData,
    tx?: PrismaTransaction,
  ): Promise<TaskWithRelations>;
  updateWithTransaction(
    id: number,
    data: UpdateTaskData,
    tx?: PrismaTransaction,
  ): Promise<TaskWithRelations>;
}

export interface TaskIncludeOptions {
  taskDescription?: boolean;
  codebaseAnalysis?: boolean;
  researchReports?: boolean;
  subtasks?: boolean;
  delegationRecords?: boolean;
  codeReviews?: boolean;
  completionReports?: boolean;
  workflowExecutions?: boolean;
}

export interface TaskFindManyOptions {
  where?: TaskWhereInput;
  include?: TaskIncludeOptions;
  orderBy?: TaskOrderByInput;
  skip?: number;
  take?: number;
}
