import { Injectable } from '@nestjs/common';
import {
  FormattedTaskData,
  FormattedDelegationData,
  SubtaskWithRelations,
} from '../../shared/types';

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
        Date.now() - new Date(s.createdAt).getTime() > 48 * 60 * 60 * 1000, // 48 hours
    );

    stuckSubtasks.forEach((s) => {
      blockers.push({
        type: 'stuck-subtask',
        description: `Subtask "${s.name}" has been in progress for over 48 hours`,
        severity: 'medium',
        identifiedAt: s.createdAt.toISOString(),
      });
    });

    return blockers.slice(0, 10); // Limit to top 10 blockers
  }
}
