import { Injectable } from '@nestjs/common';
import {
  TaskWithRelations,
  ImplementationPlanWithRelations,
  SubtaskWithRelations,
} from '../../shared/types';

@Injectable()
export class ImplementationPlanBuilderService {
  /**
   * Build task information for implementation plan report
   */
  buildTaskInfo(task: TaskWithRelations) {
    return {
      taskId: task.id,
      name: task.name,
      slug: task.slug,
      status: task.status,
      priority: task.priority,
      owner: task.owner,
    };
  }

  /**
   * Build detailed implementation plan information with subtasks
   */
  buildPlanDetails(
    implementationPlans: ImplementationPlanWithRelations[],
    subtasks: SubtaskWithRelations[],
  ) {
    return implementationPlans.map((plan) => {
      const planSubtasks = subtasks
        .filter((subtask) => subtask.planId === plan.id)
        .sort((a, b) => a.sequenceNumber - b.sequenceNumber);

      return {
        id: plan.id,
        overview: plan.overview,
        approach: plan.approach,
        technicalDecisions: plan.technicalDecisions,
        filesToModify: plan.filesToModify,
        createdBy: plan.createdBy,
        createdAt: plan.createdAt.toISOString(),
        subtasks: planSubtasks.map((subtask) => ({
          id: subtask.id,
          name: subtask.name,
          description: subtask.description,
          status: subtask.status,
          sequenceNumber: subtask.sequenceNumber,
          batchId: subtask.batchId,
        })),
      };
    });
  }

  /**
   * Build batch summary from subtasks
   */
  buildBatchSummary(subtasks: SubtaskWithRelations[]) {
    const batchGroups = this.groupSubtasksByBatch(subtasks);

    return Object.entries(batchGroups).map(([batchId, batchSubtasks]) => {
      const completedCount = batchSubtasks.filter(
        (s) => s.status === 'completed',
      ).length;
      const inProgressCount = batchSubtasks.filter(
        (s) => s.status === 'in-progress',
      ).length;

      let status: 'not-started' | 'in-progress' | 'completed';
      if (completedCount === batchSubtasks.length) {
        status = 'completed';
      } else if (inProgressCount > 0 || completedCount > 0) {
        status = 'in-progress';
      } else {
        status = 'not-started';
      }

      return {
        batchId,
        taskCount: batchSubtasks.length,
        completedCount,
        status,
      };
    });
  }

  /**
   * Build file modification summary
   */
  buildFileModificationSummary(
    implementationPlans: ImplementationPlanWithRelations[],
  ) {
    const allFiles = implementationPlans.flatMap((plan) => plan.filesToModify);
    const uniqueFiles = [...new Set(allFiles)];

    return {
      totalFiles: uniqueFiles.length,
      filesByType: this.categorizeFiles(uniqueFiles),
      modificationScope: this.assessModificationScope(uniqueFiles),
    };
  }

  private groupSubtasksByBatch(subtasks: SubtaskWithRelations[]) {
    return subtasks.reduce(
      (groups, subtask) => {
        const batchId = subtask.batchId || 'default';
        if (!groups[batchId]) {
          groups[batchId] = [];
        }
        groups[batchId].push(subtask);
        return groups;
      },
      {} as Record<string, SubtaskWithRelations[]>,
    );
  }

  private categorizeFiles(files: string[]) {
    const categories = {
      services: files.filter((f) => f.includes('.service.')).length,
      controllers: files.filter((f) => f.includes('.controller.')).length,
      modules: files.filter((f) => f.includes('.module.')).length,
      types: files.filter(
        (f) => f.includes('.type.') || f.includes('.interface.'),
      ).length,
      tests: files.filter((f) => f.includes('.spec.') || f.includes('.test.'))
        .length,
      other: 0,
    };

    categories.other =
      files.length -
      Object.values(categories).reduce((sum, count) => sum + count, 0);
    return categories;
  }

  private assessModificationScope(
    files: string[],
  ): 'small' | 'medium' | 'large' {
    if (files.length <= 5) return 'small';
    if (files.length <= 15) return 'medium';
    return 'large';
  }
}
