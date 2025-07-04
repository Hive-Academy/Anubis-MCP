import { Injectable } from '@nestjs/common';
import { FormattedTaskData, FormattedDelegationData } from '../../shared/types';

@Injectable()
export class WorkflowSummaryService {
  /**
   * Calculate summary statistics for workflow analytics
   */
  calculateSummaryStats(
    tasks: FormattedTaskData[],
    delegations: FormattedDelegationData[],
  ) {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'completed').length;
    const completedTasksWithDuration = tasks.filter(
      (t) => t.status === 'completed' && t.duration > 0,
    );

    const averageCompletionTime =
      completedTasksWithDuration.length > 0
        ? completedTasksWithDuration.reduce((sum, t) => sum + t.duration, 0) /
          completedTasksWithDuration.length
        : 0;

    const totalDelegations = delegations.length;
    const successfulDelegations = delegations.filter(
      (d) => d.success === true,
    ).length;
    const delegationSuccessRate =
      totalDelegations > 0
        ? (successfulDelegations / totalDelegations) * 100
        : 0;

    return {
      totalTasks,
      completedTasks,
      averageCompletionTime: Math.round(averageCompletionTime * 10) / 10,
      totalDelegations,
      successfulDelegations,
      delegationSuccessRate: Math.round(delegationSuccessRate * 10) / 10,
    };
  }
}
