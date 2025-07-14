import { CodeReview, Prisma } from '../../../../../generated/prisma';
import {
  CodeReviewSummary,
  CodeReviewWithRelations,
  PrismaTransaction,
  UpdateCodeReviewData,
} from '../types/code-review.types';

export interface ICodeReviewRepository {
  // Basic CRUD Operations
  findById(
    id: number,
    include?: CodeReviewIncludeOptions,
  ): Promise<CodeReviewWithRelations | null>;
  findByTaskId(
    taskId: number,
    include?: CodeReviewIncludeOptions,
  ): Promise<CodeReviewWithRelations | null>;
  create(data: Prisma.CodeReviewCreateInput): Promise<CodeReviewWithRelations>;
  update(
    id: number,
    data: UpdateCodeReviewData,
  ): Promise<CodeReviewWithRelations>;
  delete(id: number): Promise<CodeReview>;

  // Query Operations
  findMany(
    options?: CodeReviewFindManyOptions,
  ): Promise<CodeReviewWithRelations[]>;
  findByStatus(
    status: CodeReviewStatus,
    include?: CodeReviewIncludeOptions,
  ): Promise<CodeReviewWithRelations[]>;
  findByDateRange(
    startDate: Date,
    endDate: Date,
    taskId?: number,
  ): Promise<CodeReviewWithRelations[]>;
  findLatestByTaskId(taskId: number): Promise<CodeReviewWithRelations | null>;

  // Review Management
  findReviewSummary(taskId: number): Promise<CodeReviewSummary>;
  findPendingReviews(limit?: number): Promise<CodeReviewWithRelations[]>;
  findApprovedReviews(taskId?: number): Promise<CodeReviewWithRelations[]>;
  findReviewsNeedingChanges(
    taskId?: number,
  ): Promise<CodeReviewWithRelations[]>;

  // Status Management
  updateReviewStatus(
    id: number,
    status: CodeReviewStatus,
  ): Promise<CodeReviewWithRelations>;
  getReviewStatistics(taskId?: number): Promise<ReviewStatistics>;

  // Utility Operations
  count(where?: Prisma.CodeReviewWhereInput): Promise<number>;
  hasApprovedReview(taskId: number): Promise<boolean>;

  // Transaction Support
  createWithTransaction(
    data: Prisma.CodeReviewCreateInput,
    tx?: PrismaTransaction,
  ): Promise<CodeReviewWithRelations>;
  updateWithTransaction(
    id: number,
    data: UpdateCodeReviewData,
    tx?: PrismaTransaction,
  ): Promise<CodeReviewWithRelations>;
}

export interface CodeReviewIncludeOptions {
  task?: boolean;
}

export interface CodeReviewFindManyOptions {
  where?: Prisma.CodeReviewWhereInput;
  include?: CodeReviewIncludeOptions;
  orderBy?: Prisma.CodeReviewOrderByWithRelationInput;
  skip?: number;
  take?: number;
}

export interface ReviewStatistics {
  totalReviews: number;
  approvedCount: number;
  needsChangesCount: number;
  approvedWithReservationsCount: number;
  averageReviewTime: number | null;
}

export type CodeReviewStatus =
  | 'APPROVED'
  | 'APPROVED_WITH_RESERVATIONS'
  | 'NEEDS_CHANGES';
