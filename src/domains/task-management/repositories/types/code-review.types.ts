import { Prisma, CodeReview, Task } from '../../../../../generated/prisma';
import { PrismaTransaction } from './task.types';

// Input types
export type CodeReviewWhereInput = Prisma.CodeReviewWhereInput;
export type CodeReviewOrderByInput = Prisma.CodeReviewOrderByWithRelationInput;

// CodeReview with relations
export type CodeReviewWithRelations = CodeReview & {
  task?: Task;
};

// Create and Update data types
export interface CreateCodeReviewData {
  taskId: number;
  status: 'APPROVED' | 'APPROVED_WITH_RESERVATIONS' | 'NEEDS_CHANGES';
  summary: string;
  strengths?: string;
  issues?: string;
  acceptanceCriteriaVerification?: Record<string, any>;
  manualTestingResults?: string;
  requiredChanges?: string;
}

export interface UpdateCodeReviewData {
  status?: 'APPROVED' | 'APPROVED_WITH_RESERVATIONS' | 'NEEDS_CHANGES';
  summary?: string;
  strengths?: string;
  issues?: string;
  acceptanceCriteriaVerification?: Record<string, any>;
  manualTestingResults?: string;
  requiredChanges?: string;
}

// Review summary and analysis types
export interface CodeReviewSummary {
  totalReviews: number;
  currentStatus:
    | 'APPROVED'
    | 'APPROVED_WITH_RESERVATIONS'
    | 'NEEDS_CHANGES'
    | null;
  lastReviewDate: Date | null;
  keyStrengths: string[];
  mainIssues: string[];
  approvalHistory: ReviewApprovalHistory[];
}

export interface ReviewApprovalHistory {
  status: 'APPROVED' | 'APPROVED_WITH_RESERVATIONS' | 'NEEDS_CHANGES';
  date: Date;
  summary: string;
}

// Re-export PrismaTransaction for convenience
export { PrismaTransaction };
