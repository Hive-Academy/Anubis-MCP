import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

type WhereClause = Record<string, any>;

/**
 * Implementation Plan Metrics Service
 *
 * Follows SRP: Single responsibility for implementation plan-related metrics only
 * Handles: Plan quality, subtask analysis, creator statistics, execution patterns
 */
@Injectable()
export class ImplementationPlanMetricsService {
  private readonly logger = new Logger(ImplementationPlanMetricsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getImplementationPlanMetrics(whereClause: WhereClause): Promise<any> {
    try {
      this.logger.debug('Calculating implementation plan metrics');

      const [
        totalPlans,
        plansWithSubtasks,
        avgSubtasksPerPlan,
        planQualityData,
      ] = await Promise.all([
        this.prisma.implementationPlan.count({ where: { task: whereClause } }),
        this.prisma.implementationPlan.findMany({
          where: { task: whereClause },
          include: {
            subtasks: true,
          },
        }),
        this.prisma.implementationPlan.findMany({
          where: { task: whereClause },
          include: {
            _count: {
              select: { subtasks: true },
            },
          },
        }),
        this.prisma.implementationPlan.findMany({
          where: { task: whereClause },
          select: {
            overview: true,
            approach: true,
            technicalDecisions: true,
            createdBy: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
      ]);

      const avgSubtasks =
        avgSubtasksPerPlan.length > 0
          ? avgSubtasksPerPlan.reduce(
              (sum, plan) => sum + plan._count.subtasks,
              0,
            ) / avgSubtasksPerPlan.length
          : 0;

      return {
        totalPlans,
        avgSubtasksPerPlan: Math.round(avgSubtasks * 100) / 100,
        planQualityScore: this.calculatePlanQualityScore(planQualityData),
        plansWithSubtasks: plansWithSubtasks.length,
        qualityMetrics: this.calculateQualityMetrics(planQualityData),
        executionPatterns: this.calculateExecutionPatterns(plansWithSubtasks),
        creatorStats: this.calculateCreatorStats(planQualityData),
      };
    } catch (error) {
      this.logger.error('Error calculating implementation plan metrics', error);
      return {
        totalPlans: 0,
        avgSubtasksPerPlan: 0,
        planQualityScore: 0,
        plansWithSubtasks: 0,
        qualityMetrics: [],
        executionPatterns: [],
        creatorStats: [],
      };
    }
  }

  private calculatePlanQualityScore(planData: any[]): number {
    if (planData.length === 0) return 0;

    let totalScore = 0;
    planData.forEach((plan) => {
      let score = 0;
      if (plan.overview && plan.overview.length > 50) score += 25;
      if (plan.approach && plan.approach.length > 50) score += 25;
      if (plan.technicalDecisions && plan.technicalDecisions.length > 50)
        score += 25;
      if (plan.createdBy) score += 25;
      totalScore += score;
    });

    return Math.round((totalScore / (planData.length * 100)) * 100);
  }

  private calculateQualityMetrics(planData: any[]): any[] {
    const highQuality = planData.filter(
      (p) =>
        p.overview?.length > 100 &&
        p.approach?.length > 100 &&
        p.technicalDecisions?.length > 100,
    ).length;

    const mediumQuality = planData.filter(
      (p) =>
        (p.overview?.length > 50 ||
          p.approach?.length > 50 ||
          p.technicalDecisions?.length > 50) &&
        !(
          p.overview?.length > 100 &&
          p.approach?.length > 100 &&
          p.technicalDecisions?.length > 100
        ),
    ).length;

    const lowQuality = planData.length - highQuality - mediumQuality;

    return [
      {
        label: 'High Quality',
        count: highQuality,
        percentage: Math.round((highQuality / planData.length) * 100),
        color: '#10B981',
      },
      {
        label: 'Medium Quality',
        count: mediumQuality,
        percentage: Math.round((mediumQuality / planData.length) * 100),
        color: '#F59E0B',
      },
      {
        label: 'Low Quality',
        count: lowQuality,
        percentage: Math.round((lowQuality / planData.length) * 100),
        color: '#EF4444',
      },
    ];
  }

  private calculateExecutionPatterns(_plansWithSubtasks: any[]): any[] {
    // Return empty array if no real data available
    // TODO: Implement real execution pattern analysis based on actual subtask completion data
    return [];
  }

  private calculateCreatorStats(planData: any[]): any[] {
    const creatorCounts = planData.reduce((acc, plan) => {
      const creator = plan.createdBy || 'Unknown';
      acc[creator] = (acc[creator] || 0) + 1;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return acc;
    }, {});

    return Object.entries(creatorCounts).map(([creator, count]) => ({
      creator,
      count,
      percentage:
        planData.length > 0 ? ((count as number) / planData.length) * 100 : 0,
      color: this.getCreatorColor(creator),
    }));
  }

  private getCreatorColor(creator: string): string {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
    const hash = creator.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }
}
