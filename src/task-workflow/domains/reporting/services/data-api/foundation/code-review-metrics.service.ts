import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

export interface CodeReviewMetrics {
  totalReviews: number;
  approvedReviews: number;
  approvedWithReservationsReviews: number;
  needsChangesReviews: number;
  approvalRate: number;
  avgReviewTimeHours: number;
}

type WhereClause = Record<string, any>;

/**
 * Code Review Metrics Service
 *
 * Follows SRP: Single responsibility for code review-related metrics only
 * Handles: Review counts, approval rates, review times
 */
@Injectable()
export class CodeReviewMetricsService {
  private readonly logger = new Logger(CodeReviewMetricsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getCodeReviewMetrics(
    whereClause: WhereClause,
  ): Promise<CodeReviewMetrics> {
    try {
      this.logger.debug('Calculating code review metrics');

      const reviews = await this.prisma.codeReview.findMany({
        where: { task: whereClause },
        select: {
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      const totalReviews = reviews.length;
      const approvedReviews = reviews.filter(
        (r) => r.status === 'APPROVED',
      ).length;
      const approvedWithReservationsReviews = reviews.filter(
        (r) => r.status === 'APPROVED_WITH_RESERVATIONS',
      ).length;
      const needsChangesReviews = reviews.filter(
        (r) => r.status === 'NEEDS_CHANGES',
      ).length;

      const avgReviewTimeHours = this.calculateAverageReviewTime(reviews);

      return {
        totalReviews,
        approvedReviews,
        approvedWithReservationsReviews,
        needsChangesReviews,
        approvalRate:
          totalReviews > 0 ? (approvedReviews / totalReviews) * 100 : 0,
        avgReviewTimeHours,
      };
    } catch (error) {
      this.logger.error('Error calculating code review metrics', error);
      return this.getDefaultCodeReviewMetrics();
    }
  }

  private calculateAverageReviewTime(
    reviews: Array<{ createdAt: Date; updatedAt: Date }>,
  ): number {
    if (reviews.length === 0) return 0;

    const totalHours = reviews.reduce((sum, review) => {
      const diffMs = review.updatedAt.getTime() - review.createdAt.getTime();
      return sum + diffMs / (1000 * 60 * 60); // Convert to hours
    }, 0);

    return totalHours / reviews.length;
  }

  private getDefaultCodeReviewMetrics(): CodeReviewMetrics {
    return {
      totalReviews: 0,
      approvedReviews: 0,
      approvedWithReservationsReviews: 0,
      needsChangesReviews: 0,
      approvalRate: 0,
      avgReviewTimeHours: 0,
    };
  }
}
