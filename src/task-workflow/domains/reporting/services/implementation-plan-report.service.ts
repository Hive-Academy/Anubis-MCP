/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';

export interface ImplementationPlanData {
  task: PlanTaskInfo;
  plans: PlanDetail[];
  batchSummary: BatchSummary[];
  overallProgress: OverallProgress;
  metadata: {
    generatedAt: string;
    reportType: 'implementation-plan';
  };
}

export interface PlanTaskInfo {
  taskId: string;
  name: string;
  taskSlug?: string;
  status: string;
  priority: string;
  owner: string;
}

export interface PlanDetail {
  id: number;
  overview: string;
  approach: string;
  technicalDecisions: any;
  filesToModify: string[];
  strategicGuidance?: any;
  strategicContext?: any;
  architecturalRationale?: string;
  createdBy: string;
  createdAt: string;

  // Subtask organization
  batches: BatchInfo[];
  totalSubtasks: number;
  completedSubtasks: number;
  progress: number;
}

export interface BatchInfo {
  batchId: string;
  batchTitle: string;
  subtasks: DetailedSubtask[];
  batchProgress: number;
  estimatedTotalDuration: number;
  actualTotalDuration: number;
  status: 'not-started' | 'in-progress' | 'completed' | 'needs-changes';
}

export interface DetailedSubtask {
  id: number;
  name: string;
  description: string;
  sequenceNumber: number;
  status: string;
  estimatedDuration?: string;
  startedAt?: string;
  completedAt?: string;
  actualDuration?: number;
  strategicGuidance?: any;
  qualityConstraints?: any;
  successCriteria?: any;
  architecturalRationale?: string;
}

export interface BatchSummary {
  batchId: string;
  batchTitle: string;
  totalSubtasks: number;
  completedSubtasks: number;
  inProgressSubtasks: number;
  progress: number;
  estimatedDuration: number;
  actualDuration: number;
  efficiency: number; // actual vs estimated
}

export interface OverallProgress {
  totalPlans: number;
  totalBatches: number;
  totalSubtasks: number;
  completedSubtasks: number;
  inProgressSubtasks: number;
  overallProgress: number;
  estimatedTotalDuration: number;
  actualTotalDuration: number;
  overallEfficiency: number;
  criticalPath: string[];
  bottlenecks: string[];
}

@Injectable()
export class ImplementationPlanReportService {
  private readonly logger = new Logger(ImplementationPlanReportService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate comprehensive implementation plan report
   */
  async generateImplementationPlanReport(
    taskId: string,
  ): Promise<ImplementationPlanData> {
    try {
      this.logger.log(`Generating implementation plan report for: ${taskId}`);

      const task = await this.getTaskWithImplementationData(taskId);
      if (!task) {
        throw new Error(`Task not found: ${taskId}`);
      }

      const plans = this.processImplementationPlans(task.implementationPlans);
      const batchSummary = this.calculateBatchSummaries(plans);
      const overallProgress = this.calculateOverallProgress(
        plans,
        batchSummary,
      );

      return {
        task: this.formatTaskInfo(task),
        plans,
        batchSummary,
        overallProgress,
        metadata: {
          generatedAt: new Date().toISOString(),
          reportType: 'implementation-plan',
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to generate implementation plan report: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Generate cross-task implementation analytics
   */
  async generateImplementationAnalytics(filters: any = {}): Promise<any> {
    try {
      this.logger.log('Generating implementation analytics across tasks');

      const tasks = await this.getTasksWithImplementationData(filters);

      const allPlans = tasks.flatMap((task) =>
        task.implementationPlans.map((plan) => ({
          ...plan,
          taskId: task.taskId,
          taskName: task.name,
        })),
      );

      const analytics = this.calculateImplementationAnalytics(allPlans);

      return {
        analytics,
        taskCount: tasks.length,
        totalPlans: allPlans.length,
        metadata: {
          generatedAt: new Date().toISOString(),
          reportType: 'implementation-analytics',
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to generate implementation analytics: ${error.message}`,
      );
      throw error;
    }
  }

  private async getTaskWithImplementationData(taskId: string) {
    return await this.prisma.task.findUnique({
      where: { taskId },
      include: {
        implementationPlans: {
          include: {
            subtasks: {
              orderBy: { sequenceNumber: 'asc' },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  private async getTasksWithImplementationData(filters: any) {
    const where: any = {};

    if (filters.status) where.status = filters.status;
    if (filters.owner) where.owner = filters.owner;
    if (filters.priority) where.priority = filters.priority;
    if (filters.startDate || filters.endDate) {
      where.creationDate = {};
      if (filters.startDate)
        where.creationDate.gte = new Date(filters.startDate);
      if (filters.endDate) where.creationDate.lte = new Date(filters.endDate);
    }

    return await this.prisma.task.findMany({
      where,
      include: {
        implementationPlans: {
          include: {
            subtasks: true,
          },
        },
      },
    });
  }

  private formatTaskInfo(task: any): PlanTaskInfo {
    return {
      taskId: task.taskId,
      name: task.name,
      taskSlug: task.taskSlug,
      status: task.status,
      priority: task.priority || 'Medium',
      owner: task.owner || 'Unassigned',
    };
  }

  private processImplementationPlans(plans: any[]): PlanDetail[] {
    return plans.map((plan) => {
      const batches = this.groupSubtasksByBatch(plan.subtasks);
      const totalSubtasks = plan.subtasks.length;
      const completedSubtasks = plan.subtasks.filter(
        (s: any) => s.status === 'completed',
      ).length;
      const progress =
        totalSubtasks > 0
          ? Math.round((completedSubtasks / totalSubtasks) * 100)
          : 0;

      return {
        id: plan.id,
        overview: plan.overview,
        approach: plan.approach,
        technicalDecisions: plan.technicalDecisions,
        filesToModify: Array.isArray(plan.filesToModify)
          ? plan.filesToModify
          : [],
        strategicGuidance: plan.strategicGuidance,
        strategicContext: plan.strategicContext,
        architecturalRationale: plan.architecturalRationale,
        createdBy: plan.createdBy,
        createdAt: plan.createdAt.toISOString(),
        batches,
        totalSubtasks,
        completedSubtasks,
        progress,
      };
    });
  }

  private groupSubtasksByBatch(subtasks: any[]): BatchInfo[] {
    const batchGroups: Record<string, any[]> = {};

    // Group subtasks by batchId, with fallback for unbatched subtasks
    subtasks.forEach((subtask) => {
      const batchId = subtask.batchId || 'unbatched';
      if (!batchGroups[batchId]) {
        batchGroups[batchId] = [];
      }
      batchGroups[batchId].push(subtask);
    });

    return Object.entries(batchGroups).map(([batchId, batchSubtasks]) => {
      const batchTitle = batchSubtasks[0]?.batchTitle || 'Unbatched Tasks';
      const completedSubtasks = batchSubtasks.filter(
        (s) => s.status === 'completed',
      ).length;
      const batchProgress =
        batchSubtasks.length > 0
          ? Math.round((completedSubtasks / batchSubtasks.length) * 100)
          : 0;

      // Calculate durations
      const estimatedTotalDuration = batchSubtasks.reduce((sum, s) => {
        const duration = this.parseDuration(s.estimatedDuration);
        return sum + duration;
      }, 0);

      const actualTotalDuration = batchSubtasks.reduce((sum, s) => {
        if (s.startedAt && s.completedAt) {
          const start = new Date(s.startedAt);
          const end = new Date(s.completedAt);
          const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
          return sum + duration;
        }
        return sum;
      }, 0);

      // Determine batch status
      const statuses = batchSubtasks.map((s) => s.status);
      let batchStatus:
        | 'not-started'
        | 'in-progress'
        | 'completed'
        | 'needs-changes' = 'not-started';

      if (statuses.every((s) => s === 'completed')) {
        batchStatus = 'completed';
      } else if (statuses.some((s) => s === 'needs-changes')) {
        batchStatus = 'needs-changes';
      } else if (
        statuses.some((s) => s === 'in-progress' || s === 'completed')
      ) {
        batchStatus = 'in-progress';
      }

      return {
        batchId,
        batchTitle,
        subtasks: batchSubtasks.map((s) => this.formatDetailedSubtask(s)),
        batchProgress,
        estimatedTotalDuration: Math.round(estimatedTotalDuration * 10) / 10,
        actualTotalDuration: Math.round(actualTotalDuration * 10) / 10,
        status: batchStatus,
      };
    });
  }

  private formatDetailedSubtask(subtask: any): DetailedSubtask {
    const actualDuration =
      subtask.startedAt && subtask.completedAt
        ? (new Date(subtask.completedAt).getTime() -
            new Date(subtask.startedAt).getTime()) /
          (1000 * 60 * 60)
        : undefined;

    return {
      id: subtask.id,
      name: subtask.name,
      description: subtask.description,
      sequenceNumber: subtask.sequenceNumber,
      status: subtask.status,
      estimatedDuration: subtask.estimatedDuration,
      startedAt: subtask.startedAt?.toISOString(),
      completedAt: subtask.completedAt?.toISOString(),
      actualDuration: actualDuration
        ? Math.round(actualDuration * 10) / 10
        : undefined,
      strategicGuidance: subtask.strategicGuidance,
      qualityConstraints: subtask.qualityConstraints,
      successCriteria: subtask.successCriteria,
      architecturalRationale: subtask.architecturalRationale,
    };
  }

  private calculateBatchSummaries(plans: PlanDetail[]): BatchSummary[] {
    const allBatches = plans.flatMap((plan) => plan.batches);

    return allBatches.map((batch) => ({
      batchId: batch.batchId,
      batchTitle: batch.batchTitle,
      totalSubtasks: batch.subtasks.length,
      completedSubtasks: batch.subtasks.filter((s) => s.status === 'completed')
        .length,
      inProgressSubtasks: batch.subtasks.filter(
        (s) => s.status === 'in-progress',
      ).length,
      progress: batch.batchProgress,
      estimatedDuration: batch.estimatedTotalDuration,
      actualDuration: batch.actualTotalDuration,
      efficiency:
        batch.estimatedTotalDuration > 0
          ? Math.round(
              (batch.estimatedTotalDuration / batch.actualTotalDuration) * 100,
            ) / 100
          : 1,
    }));
  }

  private calculateOverallProgress(
    plans: PlanDetail[],
    batchSummary: BatchSummary[],
  ): OverallProgress {
    const totalSubtasks = plans.reduce(
      (sum, plan) => sum + plan.totalSubtasks,
      0,
    );
    const completedSubtasks = plans.reduce(
      (sum, plan) => sum + plan.completedSubtasks,
      0,
    );
    const inProgressSubtasks = batchSummary.reduce(
      (sum, batch) => sum + batch.inProgressSubtasks,
      0,
    );

    const overallProgress =
      totalSubtasks > 0
        ? Math.round((completedSubtasks / totalSubtasks) * 100)
        : 0;

    const estimatedTotalDuration = batchSummary.reduce(
      (sum, batch) => sum + batch.estimatedDuration,
      0,
    );
    const actualTotalDuration = batchSummary.reduce(
      (sum, batch) => sum + batch.actualDuration,
      0,
    );
    const overallEfficiency =
      estimatedTotalDuration > 0
        ? Math.round((estimatedTotalDuration / actualTotalDuration) * 100) / 100
        : 1;

    // Identify critical path (longest sequence)
    const criticalPath = this.identifyCriticalPath(plans);

    // Identify bottlenecks (batches with low efficiency)
    const bottlenecks = batchSummary
      .filter((batch) => batch.efficiency < 0.8 && batch.actualDuration > 0)
      .map((batch) => batch.batchTitle);

    return {
      totalPlans: plans.length,
      totalBatches: batchSummary.length,
      totalSubtasks,
      completedSubtasks,
      inProgressSubtasks,
      overallProgress,
      estimatedTotalDuration,
      actualTotalDuration,
      overallEfficiency,
      criticalPath,
      bottlenecks,
    };
  }

  private identifyCriticalPath(plans: PlanDetail[]): string[] {
    // Simplified critical path - longest batch sequence
    const longestBatchSequence = plans.reduce((longest, plan) => {
      const batchNames = plan.batches.map((batch) => batch.batchTitle);
      return batchNames.length > longest.length ? batchNames : longest;
    }, [] as string[]);

    return longestBatchSequence;
  }

  private parseDuration(durationStr?: string): number {
    if (!durationStr) return 0;

    // Parse duration strings like "2h", "30m", "1.5h"
    const match = durationStr.match(
      /(\d+(?:\.\d+)?)\s*(h|hour|hours|m|min|minutes?)/i,
    );
    if (!match) return 0;

    const value = parseFloat(match[1]);
    const unit = match[2].toLowerCase();

    if (unit.startsWith('h')) {
      return value;
    } else if (unit.startsWith('m')) {
      return value / 60;
    }

    return 0;
  }

  private calculateImplementationAnalytics(allPlans: any[]) {
    // Cross-plan analytics
    const plansByCreator: Record<string, number> = {};
    const averageSubtasksPerPlan: number[] = [];
    const completionRatesByCreator: Record<
      string,
      { total: number; completed: number }
    > = {};

    allPlans.forEach((plan) => {
      plansByCreator[plan.createdBy] =
        (plansByCreator[plan.createdBy] || 0) + 1;
      averageSubtasksPerPlan.push(plan.subtasks.length);

      if (!completionRatesByCreator[plan.createdBy]) {
        completionRatesByCreator[plan.createdBy] = { total: 0, completed: 0 };
      }

      completionRatesByCreator[plan.createdBy].total += plan.subtasks.length;
      completionRatesByCreator[plan.createdBy].completed +=
        plan.subtasks.filter((s: any) => s.status === 'completed').length;
    });

    const creatorPerformance = Object.entries(completionRatesByCreator)
      .map(([creator, stats]) => ({
        creator,
        plansCreated: plansByCreator[creator],
        completionRate: (stats.completed / stats.total) * 100,
        totalSubtasks: stats.total,
      }))
      .sort((a, b) => b.completionRate - a.completionRate);

    const avgSubtasksPerPlan =
      averageSubtasksPerPlan.length > 0
        ? averageSubtasksPerPlan.reduce((sum, count) => sum + count, 0) /
          averageSubtasksPerPlan.length
        : 0;

    return {
      creatorPerformance,
      avgSubtasksPerPlan: Math.round(avgSubtasksPerPlan * 10) / 10,
      totalPlans: allPlans.length,
      mostProductiveCreator: creatorPerformance[0]?.creator || 'N/A',
    };
  }
}
