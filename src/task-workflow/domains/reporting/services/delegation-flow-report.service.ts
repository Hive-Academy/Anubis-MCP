import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';

export interface DelegationFlowData {
  task: TaskInfo;
  delegationChain: DelegationStep[];
  workflowTransitions: WorkflowTransition[];
  summary: DelegationSummary;
  metadata: {
    generatedAt: string;
    reportType: 'delegation-flow';
  };
}

export interface TaskInfo {
  taskId: string;
  name: string;
  taskSlug?: string;
  status: string;
  currentOwner: string;
  totalDelegations: number;
  redelegationCount: number;
}

export interface DelegationStep {
  id: number;
  fromMode: string;
  toMode: string;
  delegationTimestamp: string;
  completionTimestamp?: string;
  success?: boolean;
  rejectionReason?: string;
  duration?: number; // in hours
  subtaskId?: number;
  subtaskName?: string;
}

export interface WorkflowTransition {
  id: number;
  fromMode: string;
  toMode: string;
  transitionTimestamp: string;
  reason?: string;
}

export interface DelegationSummary {
  totalDelegations: number;
  successfulDelegations: number;
  failedDelegations: number;
  averageDelegationDuration: number;
  mostCommonPath: string[];
  redelegationPoints: RedelegationPoint[];
  roleInvolvement: RoleInvolvement[];
}

export interface RedelegationPoint {
  fromMode: string;
  toMode: string;
  count: number;
  reasons: string[];
}

export interface RoleInvolvement {
  role: string;
  timeAsOwner: number; // hours
  tasksReceived: number;
  tasksDelegated: number;
  successRate: number;
}

@Injectable()
export class DelegationFlowReportService {
  private readonly logger = new Logger(DelegationFlowReportService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate delegation flow report for a specific task
   */
  async generateDelegationFlowReport(
    taskId: string,
  ): Promise<DelegationFlowData> {
    try {
      this.logger.log(`Generating delegation flow report for: ${taskId}`);

      const task = await this.getTaskWithDelegationData(taskId);
      if (!task) {
        throw new Error(`Task not found: ${taskId}`);
      }

      const delegationChain = this.processDelegationChain(
        task.delegationRecords,
      );
      const workflowTransitions = this.processWorkflowTransitions(
        task.workflowTransitions,
      );
      const summary = this.calculateDelegationSummary(delegationChain);

      return {
        task: this.formatTaskInfo(task),
        delegationChain,
        workflowTransitions,
        summary,
        metadata: {
          generatedAt: new Date().toISOString(),
          reportType: 'delegation-flow',
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to generate delegation flow report: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Generate delegation analytics across multiple tasks
   */
  async generateDelegationAnalytics(filters: any = {}): Promise<any> {
    try {
      this.logger.log('Generating cross-task delegation analytics');

      const tasks = await this.getTasksWithDelegationData(filters);

      const allDelegations = tasks.flatMap((task) =>
        task.delegationRecords.map((delegation) => ({
          ...delegation,
          taskId: task.taskId,
          taskName: task.name,
        })),
      );

      const analytics = this.calculateCrossTaskAnalytics(allDelegations);

      return {
        analytics,
        taskCount: tasks.length,
        totalDelegations: allDelegations.length,
        metadata: {
          generatedAt: new Date().toISOString(),
          reportType: 'delegation-analytics',
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to generate delegation analytics: ${error.message}`,
      );
      throw error;
    }
  }

  private async getTaskWithDelegationData(taskId: string) {
    return await this.prisma.task.findUnique({
      where: { taskId },
      include: {
        delegationRecords: {
          include: {
            subtask: {
              select: { id: true, name: true },
            },
          },
          orderBy: { delegationTimestamp: 'asc' },
        },
        workflowTransitions: {
          orderBy: { transitionTimestamp: 'asc' },
        },
      },
    });
  }

  private async getTasksWithDelegationData(filters: any) {
    const where: any = {};

    if (filters.status) where.status = filters.status;
    if (filters.owner) where.owner = filters.owner;
    if (filters.startDate || filters.endDate) {
      where.creationDate = {};
      if (filters.startDate)
        where.creationDate.gte = new Date(filters.startDate);
      if (filters.endDate) where.creationDate.lte = new Date(filters.endDate);
    }

    return await this.prisma.task.findMany({
      where,
      include: {
        delegationRecords: {
          include: {
            subtask: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });
  }

  private formatTaskInfo(task: any): TaskInfo {
    return {
      taskId: task.taskId,
      name: task.name,
      taskSlug: task.taskSlug,
      status: task.status,
      currentOwner: task.owner || 'Unassigned',
      totalDelegations: task.delegationRecords.length,
      redelegationCount: task.redelegationCount,
    };
  }

  private processDelegationChain(delegationRecords: any[]): DelegationStep[] {
    return delegationRecords.map((record) => {
      const delegationTime = new Date(record.delegationTimestamp);
      const completionTime = record.completionTimestamp
        ? new Date(record.completionTimestamp)
        : null;
      const duration = completionTime
        ? (completionTime.getTime() - delegationTime.getTime()) /
          (1000 * 60 * 60)
        : null;

      return {
        id: record.id,
        fromMode: record.fromMode,
        toMode: record.toMode,
        delegationTimestamp: record.delegationTimestamp.toISOString(),
        completionTimestamp: record.completionTimestamp?.toISOString(),
        success: record.success,
        rejectionReason: record.rejectionReason,
        duration: duration ? Math.round(duration * 10) / 10 : undefined,
        subtaskId: record.subtaskId,
        subtaskName: record.subtask?.name,
      };
    });
  }

  private processWorkflowTransitions(transitions: any[]): WorkflowTransition[] {
    return transitions.map((transition) => ({
      id: transition.id,
      fromMode: transition.fromMode,
      toMode: transition.toMode,
      transitionTimestamp: transition.transitionTimestamp.toISOString(),
      reason: transition.reason,
    }));
  }

  private calculateDelegationSummary(
    delegationChain: DelegationStep[],
  ): DelegationSummary {
    const totalDelegations = delegationChain.length;
    const successfulDelegations = delegationChain.filter(
      (d) => d.success === true,
    ).length;
    const failedDelegations = delegationChain.filter(
      (d) => d.success === false,
    ).length;

    const completedDelegations = delegationChain.filter(
      (d) => d.duration !== undefined,
    );
    const averageDelegationDuration =
      completedDelegations.length > 0
        ? completedDelegations.reduce((sum, d) => sum + (d.duration || 0), 0) /
          completedDelegations.length
        : 0;

    // Calculate most common path
    const pathCounts: Record<string, number> = {};
    for (let i = 0; i < delegationChain.length - 1; i++) {
      const path = `${delegationChain[i].fromMode} → ${delegationChain[i].toMode}`;
      pathCounts[path] = (pathCounts[path] || 0) + 1;
    }
    const mostCommonPath = Object.entries(pathCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([path]) => path);

    // Calculate redelegation points
    const redelegationCounts: Record<
      string,
      { count: number; reasons: string[] }
    > = {};
    delegationChain
      .filter((d) => d.success === false)
      .forEach((d) => {
        const key = `${d.fromMode} → ${d.toMode}`;
        if (!redelegationCounts[key]) {
          redelegationCounts[key] = { count: 0, reasons: [] };
        }
        redelegationCounts[key].count++;
        if (
          d.rejectionReason &&
          !redelegationCounts[key].reasons.includes(d.rejectionReason)
        ) {
          redelegationCounts[key].reasons.push(d.rejectionReason);
        }
      });

    const redelegationPoints: RedelegationPoint[] = Object.entries(
      redelegationCounts,
    ).map(([path, data]) => {
      const [fromMode, toMode] = path.split(' → ');
      return {
        fromMode,
        toMode,
        count: data.count,
        reasons: data.reasons,
      };
    });

    // Calculate role involvement (simplified for single task)
    const roleStats: Record<
      string,
      { received: number; delegated: number; durations: number[] }
    > = {};
    delegationChain.forEach((d) => {
      if (!roleStats[d.toMode]) {
        roleStats[d.toMode] = { received: 0, delegated: 0, durations: [] };
      }
      if (!roleStats[d.fromMode]) {
        roleStats[d.fromMode] = { received: 0, delegated: 0, durations: [] };
      }

      roleStats[d.toMode].received++;
      roleStats[d.fromMode].delegated++;

      if (d.duration) {
        roleStats[d.toMode].durations.push(d.duration);
      }
    });

    const roleInvolvement: RoleInvolvement[] = Object.entries(roleStats).map(
      ([role, stats]) => ({
        role,
        timeAsOwner: stats.durations.reduce((sum, d) => sum + d, 0),
        tasksReceived: stats.received,
        tasksDelegated: stats.delegated,
        successRate:
          stats.delegated > 0 ? (stats.received / stats.delegated) * 100 : 100,
      }),
    );

    return {
      totalDelegations,
      successfulDelegations,
      failedDelegations,
      averageDelegationDuration:
        Math.round(averageDelegationDuration * 10) / 10,
      mostCommonPath,
      redelegationPoints,
      roleInvolvement,
    };
  }

  private calculateCrossTaskAnalytics(allDelegations: any[]) {
    // Cross-task delegation patterns analysis
    const roleTransitions: Record<string, number> = {};
    const roleEfficiency: Record<
      string,
      { total: number; successful: number; avgDuration: number }
    > = {};

    allDelegations.forEach((delegation) => {
      const transition = `${delegation.fromMode} → ${delegation.toMode}`;
      roleTransitions[transition] = (roleTransitions[transition] || 0) + 1;

      if (!roleEfficiency[delegation.toMode]) {
        roleEfficiency[delegation.toMode] = {
          total: 0,
          successful: 0,
          avgDuration: 0,
        };
      }

      roleEfficiency[delegation.toMode].total++;
      if (delegation.success) {
        roleEfficiency[delegation.toMode].successful++;
      }
    });

    const mostCommonTransitions = Object.entries(roleTransitions)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([transition, count]) => ({ transition, count }));

    const rolePerformance = Object.entries(roleEfficiency)
      .map(([role, stats]) => ({
        role,
        successRate: (stats.successful / stats.total) * 100,
        totalTasks: stats.total,
      }))
      .sort((a, b) => b.successRate - a.successRate);

    return {
      mostCommonTransitions,
      rolePerformance,
      totalDelegations: allDelegations.length,
      overallSuccessRate:
        (allDelegations.filter((d) => d.success).length /
          allDelegations.length) *
        100,
    };
  }
}
