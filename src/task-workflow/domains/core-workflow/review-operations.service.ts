import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ReviewOperationsInput } from './schemas/review-operations.schema';
import { CodeReview, CompletionReport, Prisma } from 'generated/prisma';

// Type-safe interfaces for review operations
export interface ReviewOperationResult {
  success: boolean;
  data?: CodeReview | CompletionReport | ReviewSummary | CompletionSummary;
  error?: {
    message: string;
    code: string;
    operation: string;
  };
  metadata?: {
    operation: string;
    taskId: number;
    responseTime: number;
  };
}

export interface ReviewSummary {
  taskId: number;
  status: string;
  summary: string;
}

export interface CompletionSummary {
  taskId: number;
  summary: string;
  createdAt: Date;
}

/**
 * Review Operations Service (Internal)
 *
 * Internal service for code review and completion report management.
 * No longer exposed as MCP tool - used by workflow-rules MCP interface.
 *
 * SOLID Principles Applied:
 * - Single Responsibility: Focused on review and completion operations only
 * - Open/Closed: Extensible through input schema without modifying core logic
 * - Liskov Substitution: Consistent interface for all review operations
 * - Interface Segregation: Clean separation of review concerns
 * - Dependency Inversion: Depends on PrismaService abstraction
 */
@Injectable()
export class ReviewOperationsService {
  private readonly logger = new Logger(ReviewOperationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async executeReviewOperation(
    input: ReviewOperationsInput,
  ): Promise<ReviewOperationResult> {
    const startTime = performance.now();

    try {
      this.logger.debug(`Review Operation: ${input.operation}`, {
        taskId: input.taskId,
      });

      let result:
        | CodeReview
        | CompletionReport
        | ReviewSummary
        | CompletionSummary;

      switch (input.operation) {
        case 'create_review':
          result = await this.createReview(input);
          break;
        case 'update_review':
          result = await this.updateReview(input);
          break;
        case 'get_review':
          result = await this.getReview(input);
          break;
        case 'create_completion':
          result = await this.createCompletion(input);
          break;
        case 'get_completion':
          result = await this.getCompletion(input);
          break;
        default:
          throw new Error(`Unknown operation: ${String(input.operation)}`);
      }

      const responseTime = performance.now() - startTime;

      return {
        success: true,
        data: result,
        metadata: {
          operation: input.operation,
          taskId: input.taskId,
          responseTime: Math.round(responseTime),
        },
      };
    } catch (error: any) {
      this.logger.error(`Review operation failed:`, error);

      return {
        success: false,
        error: {
          message: error.message,
          code: 'REVIEW_OPERATION_FAILED',
          operation: input.operation,
        },
      };
    }
  }

  private async createReview(
    input: ReviewOperationsInput,
  ): Promise<CodeReview> {
    const { taskId, reviewData } = input;

    if (!reviewData) {
      throw new Error('Review data is required for creation');
    }

    const review = await this.prisma.codeReview.create({
      data: {
        task: { connect: { id: taskId } },
        status: reviewData.status,
        summary: reviewData.summary,
        strengths: reviewData.strengths || '',
        issues: reviewData.issues || '',
        acceptanceCriteriaVerification:
          reviewData.acceptanceCriteriaVerification || {},
        manualTestingResults: reviewData.manualTestingResults || '',
        requiredChanges: reviewData.requiredChanges || null,
      } satisfies Prisma.CodeReviewCreateInput,
    });

    return review;
  }

  private async updateReview(
    input: ReviewOperationsInput,
  ): Promise<CodeReview> {
    const { taskId, reviewData } = input;

    if (!reviewData) {
      throw new Error('Review data is required for update');
    }

    // Find the code review by taskId first
    const existingReview = await this.prisma.codeReview.findFirst({
      where: { taskId },
    });

    if (!existingReview) {
      throw new Error(`Code review not found for task ${taskId}`);
    }

    const updateData: Prisma.CodeReviewUpdateInput = {};

    if (reviewData.status) updateData.status = reviewData.status;
    if (reviewData.summary) updateData.summary = reviewData.summary;
    if (reviewData.strengths) updateData.strengths = reviewData.strengths;
    if (reviewData.issues) updateData.issues = reviewData.issues;
    if (reviewData.acceptanceCriteriaVerification) {
      updateData.acceptanceCriteriaVerification =
        reviewData.acceptanceCriteriaVerification;
    }
    if (reviewData.manualTestingResults) {
      updateData.manualTestingResults = reviewData.manualTestingResults;
    }
    if (reviewData.requiredChanges) {
      updateData.requiredChanges = reviewData.requiredChanges;
    }

    const review = await this.prisma.codeReview.update({
      where: { id: existingReview.id },
      data: updateData,
    });

    return review;
  }

  private async getReview(
    input: ReviewOperationsInput,
  ): Promise<CodeReview | ReviewSummary> {
    const { taskId, includeDetails } = input;

    const review = await this.prisma.codeReview.findFirst({
      where: { taskId },
    });

    if (!review) {
      throw new Error(`Code review not found for task ${taskId}`);
    }

    if (!includeDetails) {
      // Return summary only
      return {
        taskId: review.taskId,
        status: review.status,
        summary: review.summary,
      } as ReviewSummary;
    }

    return review;
  }

  private async createCompletion(
    input: ReviewOperationsInput,
  ): Promise<CompletionReport> {
    const { taskId, completionData } = input;

    if (!completionData) {
      throw new Error('Completion data is required for creation');
    }

    const completion = await this.prisma.completionReport.create({
      data: {
        task: { connect: { id: taskId } },
        summary: completionData.summary,
        filesModified: completionData.filesModified || [],
        acceptanceCriteriaVerification:
          completionData.acceptanceCriteriaVerification || {},
        delegationSummary: completionData.delegationSummary || '',
      } satisfies Prisma.CompletionReportCreateInput,
    });

    return completion;
  }

  private async getCompletion(
    input: ReviewOperationsInput,
  ): Promise<CompletionReport | CompletionSummary> {
    const { taskId, includeDetails } = input;

    const completion = await this.prisma.completionReport.findFirst({
      where: { taskId },
    });

    if (!completion) {
      throw new Error(`Completion report not found for task ${taskId}`);
    }

    if (!includeDetails) {
      // Return summary only
      return {
        taskId: completion.taskId,
        summary: completion.summary,
        createdAt: completion.createdAt,
      } as CompletionSummary;
    }

    return completion;
  }
}
