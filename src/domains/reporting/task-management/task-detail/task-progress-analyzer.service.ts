import { Injectable } from '@nestjs/common';
import {
  FormattedDelegationData,
  FormattedTaskData,
  SubtaskWithRelations,
} from '../../shared/types';
import { TaskDetailData } from '../../shared/types/report-data.types';

/**
 * Task Progress Analyzer Service
 *
 * Focused service for analyzing task progress and calculating metrics.
 * Handles progress calculations, timeline analysis, and completion predictions.
 * Follows Single Responsibility Principle by focusing solely on progress analysis.
 */
@Injectable()
export class TaskProgressAnalyzerService {
  /**
   * Calculate comprehensive workflow progress
   */
  calculateWorkflowProgress(
    task: FormattedTaskData,
    delegations: FormattedDelegationData[],
    subtasks: SubtaskWithRelations[],
  ) {
    // Determine current stage
    const latestDelegation = delegations.sort(
      (a, b) =>
        new Date(b.delegationTimestamp).getTime() -
        new Date(a.delegationTimestamp).getTime(),
    )[0];

    const currentStage = latestDelegation?.toMode || 'not-started';

    // Calculate completion percentage
    const completedSubtasks = subtasks.filter(
      (s) => s.status === 'completed',
    ).length;
    const totalSubtasks = subtasks.length;
    const completionPercentage =
      totalSubtasks > 0
        ? Math.round((completedSubtasks / totalSubtasks) * 100)
        : 0;

    // Calculate time in current stage
    const timeInCurrentStage = latestDelegation
      ? Date.now() - new Date(latestDelegation.delegationTimestamp).getTime()
      : Date.now() - new Date(task.creationDate).getTime();

    // Estimate time remaining (simplified)
    const averageStageTime = this.calculateAverageStageTime(delegations);
    const estimatedTimeRemaining = Math.max(
      0,
      averageStageTime - timeInCurrentStage / (1000 * 60 * 60),
    ); // Convert to hours

    // Identify blockers (simplified)
    const blockers = this.identifyBlockers(delegations, subtasks);

    return {
      currentStage,
      completionPercentage,
      timeInCurrentStage:
        Math.round((timeInCurrentStage / (1000 * 60 * 60)) * 10) / 10, // Hours
      estimatedTimeRemaining: Math.round(estimatedTimeRemaining * 10) / 10,
      blockers,
    };
  }

  private calculateAverageStageTime(
    delegations: FormattedDelegationData[],
  ): number {
    const completedDelegations = delegations.filter((d) => d.duration > 0);
    if (completedDelegations.length === 0) return 24; // Default 24 hours

    const totalTime = completedDelegations.reduce(
      (sum, d) => sum + d.duration,
      0,
    );
    return totalTime / completedDelegations.length;
  }

  private identifyBlockers(
    delegations: FormattedDelegationData[],
    subtasks: SubtaskWithRelations[],
  ): Array<{
    type: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    identifiedAt: string;
  }> {
    const blockers: Array<{
      type: string;
      description: string;
      severity: 'low' | 'medium' | 'high';
      identifiedAt: string;
    }> = [];

    // Check for failed delegations
    const failedDelegations = delegations.filter((d) => d.success === false);
    failedDelegations.forEach((d) => {
      blockers.push({
        type: 'delegation-failure',
        description: `Delegation to ${d.toMode} failed`,
        severity: 'high',
        identifiedAt: d.delegationTimestamp,
      });
    });

    // Check for stuck subtasks
    const stuckSubtasks = subtasks.filter(
      (s) =>
        s.status === 'in-progress' &&
        s.startedAt &&
        Date.now() - new Date(s.startedAt).getTime() > 48 * 60 * 60 * 1000, // 48 hours
    );

    stuckSubtasks.forEach((s) => {
      blockers.push({
        type: 'stuck-subtask',
        description: `Subtask "${s.name}" has been in progress for over 48 hours`,
        severity: 'medium',
        identifiedAt: s.startedAt?.toISOString() || new Date().toISOString(),
      });
    });

    return blockers.slice(0, 10); // Limit to top 10 blockers
  }

  /**
   * Calculate overall task progress metrics
   */
  calculateTaskProgress(data: TaskDetailData): {
    overallProgress: number;
    completionRate: number;
    totalSubtasks: number;
    completedSubtasks: number;
    inProgressSubtasks: number;
    notStartedSubtasks: number;
    estimatedCompletion?: string;
  } {
    const subtasks = data.subtasks || [];
    const totalSubtasks = subtasks.length;

    if (totalSubtasks === 0) {
      return {
        overallProgress: 0,
        completionRate: 0,
        totalSubtasks: 0,
        completedSubtasks: 0,
        inProgressSubtasks: 0,
        notStartedSubtasks: 0,
      };
    }

    const completedSubtasks = subtasks.filter(
      (s) => s.status === 'completed',
    ).length;
    const inProgressSubtasks = subtasks.filter(
      (s) => s.status === 'in-progress',
    ).length;
    const notStartedSubtasks = subtasks.filter(
      (s) => s.status === 'not-started',
    ).length;

    const completionRate = Math.round(
      (completedSubtasks / totalSubtasks) * 100,
    );
    const overallProgress = this.calculateWeightedProgress(subtasks);

    return {
      overallProgress,
      completionRate,
      totalSubtasks,
      completedSubtasks,
      inProgressSubtasks,
      notStartedSubtasks,
      estimatedCompletion: this.estimateCompletion(data),
    };
  }

  /**
   * Calculate batch-specific progress metrics
   */
  calculateBatchProgress(subtasks: TaskDetailData['subtasks']): Record<
    string,
    {
      batchId: string;
      batchTitle: string;
      progress: number;
      totalSubtasks: number;
      completedSubtasks: number;
      inProgressSubtasks: number;
      status: 'not-started' | 'in-progress' | 'completed';
      estimatedDuration?: number;
    }
  > {
    if (!subtasks || subtasks.length === 0) return {};

    const batchGroups = this.groupSubtasksByBatch(subtasks);

    return Object.fromEntries(
      Object.entries(batchGroups).map(([batchId, batch]) => {
        const totalSubtasks = batch.subtasks.length;
        const completedSubtasks = batch.subtasks.filter(
          (s) => s.status === 'completed',
        ).length;
        const inProgressSubtasks = batch.subtasks.filter(
          (s) => s.status === 'in-progress',
        ).length;
        const progress =
          totalSubtasks > 0
            ? Math.round((completedSubtasks / totalSubtasks) * 100)
            : 0;

        let status: 'not-started' | 'in-progress' | 'completed';
        if (completedSubtasks === totalSubtasks) {
          status = 'completed';
        } else if (inProgressSubtasks > 0 || completedSubtasks > 0) {
          status = 'in-progress';
        } else {
          status = 'not-started';
        }

        return [
          batchId,
          {
            batchId: batch.batchId,
            batchTitle: batch.batchTitle,
            progress,
            totalSubtasks,
            completedSubtasks,
            inProgressSubtasks,
            status,
          },
        ];
      }),
    );
  }

  /**
   * Analyze delegation efficiency and workflow performance
   */
  analyzeDelegationEfficiency(
    delegations: TaskDetailData['delegationHistory'],
  ): {
    totalDelegations: number;
    successfulDelegations: number;
    failedDelegations: number;
    successRate: number;
    averageDuration: number;
    roleTransitions: Record<string, number>;
    bottlenecks: string[];
  } {
    if (!delegations || delegations.length === 0) {
      return {
        totalDelegations: 0,
        successfulDelegations: 0,
        failedDelegations: 0,
        successRate: 0,
        averageDuration: 0,
        roleTransitions: {},
        bottlenecks: [],
      };
    }

    const totalDelegations = delegations.length;
    const successfulDelegations = delegations.filter(
      (d) => d.success === true,
    ).length;
    const failedDelegations = delegations.filter(
      (d) => d.success === false,
    ).length;
    const successRate = Math.round(
      (successfulDelegations / totalDelegations) * 100,
    );

    const durations = delegations
      .filter((d) => d.duration && d.duration > 0)
      .map((d) => d.duration)
      .filter((duration): duration is number => duration !== undefined);
    const averageDuration =
      durations.length > 0
        ? Math.round(
            durations.reduce(
              (sum: number, duration: number) => sum + duration,
              0,
            ) / durations.length,
          )
        : 0;

    const roleTransitions = this.calculateRoleTransitions(delegations);
    const bottlenecks = this.identifyBottlenecks(delegations);

    return {
      totalDelegations,
      successfulDelegations,
      failedDelegations,
      successRate,
      averageDuration,
      roleTransitions,
      bottlenecks,
    };
  }

  /**
   * Generate timeline analysis for task progression
   */
  generateTimelineAnalysis(data: TaskDetailData): {
    taskCreated: string;
    firstDelegation?: string;
    lastActivity?: string;
    totalDuration?: number;
    phases: Array<{
      phase: string;
      startDate: string;
      endDate?: string;
      duration?: number;
      status: string;
    }>;
  } {
    const delegations = data.delegationHistory || [];
    const taskCreated = data.task.createdAt;

    const phases = this.extractWorkflowPhases(delegations);
    const firstDelegation =
      delegations.length > 0 ? delegations[0].delegationTimestamp : undefined;
    const lastActivity =
      delegations.length > 0
        ? delegations[delegations.length - 1].completionTimestamp ||
          delegations[delegations.length - 1].delegationTimestamp
        : undefined;

    const totalDuration = lastActivity
      ? Math.round(
          (new Date(lastActivity).getTime() - new Date(taskCreated).getTime()) /
            (1000 * 60 * 60),
        )
      : undefined;

    return {
      taskCreated,
      firstDelegation,
      lastActivity,
      totalDuration,
      phases,
    };
  }

  /**
   * Calculate weighted progress considering subtask complexity and dependencies
   */
  private calculateWeightedProgress(
    subtasks: TaskDetailData['subtasks'],
  ): number {
    if (!subtasks || subtasks.length === 0) return 0;

    // Simple weighted calculation based on sequence number (later tasks might be more complex)
    let totalWeight = 0;
    let completedWeight = 0;

    subtasks.forEach((subtask) => {
      const weight = subtask.sequenceNumber || 1;
      totalWeight += weight;

      if (subtask.status === 'completed') {
        completedWeight += weight;
      } else if (subtask.status === 'in-progress') {
        completedWeight += weight * 0.5; // 50% credit for in-progress tasks
      }
    });

    return totalWeight > 0
      ? Math.round((completedWeight / totalWeight) * 100)
      : 0;
  }

  /**
   * Estimate completion date based on current progress and historical data
   */
  private estimateCompletion(data: TaskDetailData): string | undefined {
    const delegations = data.delegationHistory || [];
    const subtasks = data.subtasks || [];

    if (delegations.length === 0 || subtasks.length === 0) return undefined;

    const completedSubtasks = subtasks.filter(
      (s) => s.status === 'completed',
    ).length;
    const remainingSubtasks = subtasks.length - completedSubtasks;

    if (remainingSubtasks === 0) return 'Completed';

    // Calculate average time per completed subtask
    const completedDelegations = delegations.filter(
      (d) => d.duration && d.duration > 0,
    );
    if (completedDelegations.length === 0) return undefined;

    const averageTimePerSubtask =
      completedDelegations.reduce((sum, d) => sum + (d.duration || 0), 0) /
      completedSubtasks;
    const estimatedRemainingHours = remainingSubtasks * averageTimePerSubtask;

    const estimatedCompletion = new Date();
    estimatedCompletion.setHours(
      estimatedCompletion.getHours() + estimatedRemainingHours,
    );

    return estimatedCompletion.toISOString();
  }

  /**
   * Group subtasks by batch for analysis
   */
  private groupSubtasksByBatch(subtasks: TaskDetailData['subtasks']): Record<
    string,
    {
      batchId: string;
      batchTitle: string;
      subtasks: typeof subtasks;
    }
  > {
    return subtasks.reduce(
      (groups, subtask) => {
        const batchKey = subtask.batchId || 'default';
        if (!groups[batchKey]) {
          groups[batchKey] = {
            batchId: batchKey,
            batchTitle: subtask.batchTitle || 'Default Batch',
            subtasks: [],
          };
        }
        groups[batchKey].subtasks.push(subtask);
        return groups;
      },
      {} as Record<
        string,
        { batchId: string; batchTitle: string; subtasks: typeof subtasks }
      >,
    );
  }

  /**
   * Calculate role transition frequencies
   */
  private calculateRoleTransitions(
    delegations: TaskDetailData['delegationHistory'],
  ): Record<string, number> {
    const transitions: Record<string, number> = {};

    delegations.forEach((delegation) => {
      const transition = `${delegation.fromMode} → ${delegation.toMode}`;
      transitions[transition] = (transitions[transition] || 0) + 1;
    });

    return transitions;
  }

  /**
   * Identify workflow bottlenecks based on delegation patterns
   */
  private identifyBottlenecks(
    delegations: TaskDetailData['delegationHistory'],
  ): string[] {
    const bottlenecks: string[] = [];
    const roleDurations: Record<string, number[]> = {};

    // Group durations by role
    delegations.forEach((delegation) => {
      if (delegation.duration && delegation.duration > 0) {
        if (!roleDurations[delegation.toMode]) {
          roleDurations[delegation.toMode] = [];
        }
        roleDurations[delegation.toMode].push(delegation.duration);
      }
    });

    // Identify roles with consistently high durations
    Object.entries(roleDurations).forEach(([role, durations]) => {
      if (durations.length > 1) {
        const averageDuration =
          durations.reduce((sum, d) => sum + d, 0) / durations.length;
        const maxDuration = Math.max(...durations);

        // Flag as bottleneck if average duration is high or has very long outliers
        if (averageDuration > 24 || maxDuration > 72) {
          // 24h average or 72h max
          bottlenecks.push(role);
        }
      }
    });

    return bottlenecks;
  }

  /**
   * Extract workflow phases from delegation history
   */
  private extractWorkflowPhases(
    delegations: TaskDetailData['delegationHistory'],
  ): Array<{
    phase: string;
    startDate: string;
    endDate?: string;
    duration?: number;
    status: string;
  }> {
    if (delegations.length === 0) return [];

    const phases: Array<{
      phase: string;
      startDate: string;
      endDate?: string;
      duration?: number;
      status: string;
    }> = [];

    delegations.forEach((delegation, index) => {
      const nextDelegation = delegations[index + 1];

      phases.push({
        phase: delegation.toMode,
        startDate: delegation.delegationTimestamp,
        endDate:
          nextDelegation?.delegationTimestamp || delegation.completionTimestamp,
        duration: delegation.duration,
        status:
          delegation.success === true
            ? 'completed'
            : delegation.success === false
              ? 'failed'
              : 'in-progress',
      });
    });

    return phases;
  }
}
