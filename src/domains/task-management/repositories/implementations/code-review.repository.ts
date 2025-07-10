import { Injectable } from '@nestjs/common';
import { CodeReview, Prisma } from '../../../../../generated/prisma';
import { PrismaService } from '../../../../prisma/prisma.service';
import {
  CodeReviewFindManyOptions,
  CodeReviewIncludeOptions,
  CodeReviewStatus,
  ICodeReviewRepository,
  ReviewStatistics,
} from '../interfaces/code-review.repository.interface';
import {
  CodeReviewSummary,
  CodeReviewWithRelations,
  PrismaTransaction,
  UpdateCodeReviewData,
} from '../types/code-review.types';

@Injectable()
export class CodeReviewRepository implements ICodeReviewRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(
    id: number,
    include?: CodeReviewIncludeOptions,
  ): Promise<CodeReviewWithRelations | null> {
    return this.prisma.codeReview.findUnique({
      where: { id },
      include: this.buildInclude(include),
    });
  }

  async findByTaskId(
    taskId: number,
    include?: CodeReviewIncludeOptions,
  ): Promise<CodeReviewWithRelations | null> {
    return this.prisma.codeReview.findFirst({
      where: { taskId },
      include: this.buildInclude(include),
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(
    data: Prisma.CodeReviewCreateInput,
  ): Promise<CodeReviewWithRelations> {
    return this.prisma.codeReview.create({
      data,
      include: { task: true },
    });
  }

  async update(
    id: number,
    data: UpdateCodeReviewData,
  ): Promise<CodeReviewWithRelations> {
    return this.prisma.codeReview.update({
      where: { id },
      data,
      include: { task: true },
    });
  }

  async delete(id: number): Promise<CodeReview> {
    return this.prisma.codeReview.delete({
      where: { id },
    });
  }

  async findMany(
    options?: CodeReviewFindManyOptions,
  ): Promise<CodeReviewWithRelations[]> {
    return this.prisma.codeReview.findMany({
      where: options?.where,
      include: this.buildInclude(options?.include),
      orderBy: options?.orderBy || { createdAt: 'desc' },
      skip: options?.skip,
      take: options?.take,
    });
  }

  async findByStatus(
    status: CodeReviewStatus,
    include?: CodeReviewIncludeOptions,
  ): Promise<CodeReviewWithRelations[]> {
    return this.prisma.codeReview.findMany({
      where: { status },
      include: this.buildInclude(include),
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
    taskId?: number,
  ): Promise<CodeReviewWithRelations[]> {
    return this.prisma.codeReview.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        ...(taskId && { taskId }),
      },
      include: { task: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findLatestByTaskId(
    taskId: number,
  ): Promise<CodeReviewWithRelations | null> {
    return this.prisma.codeReview.findFirst({
      where: { taskId },
      include: { task: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findReviewSummary(taskId: number): Promise<CodeReviewSummary> {
    const reviews = await this.prisma.codeReview.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
    });

    const totalReviews = reviews.length;
    const currentStatus =
      reviews.length > 0
        ? (reviews[0].status as
            | 'APPROVED'
            | 'APPROVED_WITH_RESERVATIONS'
            | 'NEEDS_CHANGES')
        : null;
    const lastReviewDate = reviews.length > 0 ? reviews[0].createdAt : null;

    // Extract key strengths
    const keyStrengths = reviews
      .map((review) => review.strengths)
      .filter((strength) => strength && strength.trim().length > 0)
      .slice(0, 5); // Top 5 strengths

    // Extract main issues
    const mainIssues = reviews
      .map((review) => review.issues)
      .filter((issue) => issue && issue.trim().length > 0)
      .slice(0, 5); // Top 5 issues

    // Build approval history
    const approvalHistory = reviews.map((review) => ({
      status: review.status as
        | 'APPROVED'
        | 'APPROVED_WITH_RESERVATIONS'
        | 'NEEDS_CHANGES',
      date: review.createdAt,
      summary: review.summary,
    }));

    return {
      totalReviews,
      currentStatus,
      lastReviewDate,
      keyStrengths,
      mainIssues,
      approvalHistory,
    };
  }

  async findPendingReviews(limit?: number): Promise<CodeReviewWithRelations[]> {
    return this.prisma.codeReview.findMany({
      where: {
        status: 'NEEDS_CHANGES',
      },
      include: { task: true },
      orderBy: { createdAt: 'asc' },
      ...(limit && { take: limit }),
    });
  }

  async findApprovedReviews(
    taskId?: number,
  ): Promise<CodeReviewWithRelations[]> {
    return this.prisma.codeReview.findMany({
      where: {
        status: {
          in: ['APPROVED', 'APPROVED_WITH_RESERVATIONS'],
        },
        ...(taskId && { taskId }),
      },
      include: { task: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findReviewsNeedingChanges(
    taskId?: number,
  ): Promise<CodeReviewWithRelations[]> {
    return this.prisma.codeReview.findMany({
      where: {
        status: 'NEEDS_CHANGES',
        ...(taskId && { taskId }),
      },
      include: { task: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateReviewStatus(
    id: number,
    status: CodeReviewStatus,
  ): Promise<CodeReviewWithRelations> {
    return this.prisma.codeReview.update({
      where: { id },
      data: { status },
      include: { task: true },
    });
  }

  async getReviewStatistics(taskId?: number): Promise<ReviewStatistics> {
    const where = taskId ? { taskId } : {};

    const [
      totalReviews,
      approvedCount,
      needsChangesCount,
      approvedWithReservationsCount,
    ] = await Promise.all([
      this.prisma.codeReview.count({ where }),
      this.prisma.codeReview.count({
        where: { ...where, status: 'APPROVED' },
      }),
      this.prisma.codeReview.count({
        where: { ...where, status: 'NEEDS_CHANGES' },
      }),
      this.prisma.codeReview.count({
        where: { ...where, status: 'APPROVED_WITH_RESERVATIONS' },
      }),
    ]);

    // Calculate average review time (simplified - could be enhanced with actual review duration tracking)
    const reviews = await this.prisma.codeReview.findMany({
      where,
      select: { createdAt: true, updatedAt: true },
    });

    const averageReviewTime =
      reviews.length > 0
        ? reviews.reduce((sum, review) => {
            const reviewTime =
              review.updatedAt.getTime() - review.createdAt.getTime();
            return sum + reviewTime;
          }, 0) / reviews.length
        : null;

    return {
      totalReviews,
      approvedCount,
      needsChangesCount,
      approvedWithReservationsCount,
      averageReviewTime,
    };
  }

  async count(where?: Prisma.CodeReviewWhereInput): Promise<number> {
    return this.prisma.codeReview.count({ where });
  }

  async hasApprovedReview(taskId: number): Promise<boolean> {
    const approvedReview = await this.prisma.codeReview.findFirst({
      where: {
        taskId,
        status: {
          in: ['APPROVED', 'APPROVED_WITH_RESERVATIONS'],
        },
      },
    });

    return !!approvedReview;
  }

  async createWithTransaction(
    data: Prisma.CodeReviewCreateInput,
    tx?: PrismaTransaction,
  ): Promise<CodeReviewWithRelations> {
    const prismaClient = tx || this.prisma;

    return prismaClient.codeReview.create({
      data,
      include: { task: true },
    });
  }

  async updateWithTransaction(
    id: number,
    data: UpdateCodeReviewData,
    tx?: PrismaTransaction,
  ): Promise<CodeReviewWithRelations> {
    const prismaClient = tx || this.prisma;

    return prismaClient.codeReview.update({
      where: { id },
      data,
      include: { task: true },
    });
  }

  private buildInclude(
    include?: CodeReviewIncludeOptions,
  ): Prisma.CodeReviewInclude | undefined {
    if (!include) return undefined;

    return {
      task: include.task,
    };
  }
}
