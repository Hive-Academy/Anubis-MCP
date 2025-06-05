import { Injectable, Logger } from '@nestjs/common';
import { ReportDataService } from '../../shared/report-data.service';
import {
  TaskWithRelations,
  DelegationRecordWithRelations,
  ImplementationPlanWithRelations,
  SubtaskWithRelations,
  FormattedTaskData,
  FormattedDelegationData,
} from '../../shared/types';

@Injectable()
export class TaskDetailBuilderService {
  private readonly logger = new Logger(TaskDetailBuilderService.name);

  constructor(private readonly dataService: ReportDataService) {}

  /**
   * Build comprehensive task detail object
   */
  buildTaskDetail(task: TaskWithRelations, formattedTask: FormattedTaskData) {
    return {
      taskId: task.taskId,
      name: task.name,
      taskSlug: task.taskSlug,
      status: task.status,
      priority: task.priority,
      owner: task.owner,
      creationDate: formattedTask.creationDate,
      completionDate: formattedTask.completionDate,
      duration: formattedTask.duration,
      description: task.taskDescription
        ? {
            description: task.taskDescription.description,
            businessRequirements: task.taskDescription.businessRequirements,
            technicalRequirements: task.taskDescription.technicalRequirements,
            acceptanceCriteria: task.taskDescription.acceptanceCriteria,
          }
        : undefined,
      codebaseAnalysis: task.codebaseAnalysis
        ? {
            architectureFindings: task.codebaseAnalysis.architectureFindings,
            problemsIdentified: task.codebaseAnalysis.problemsIdentified,
            implementationContext: task.codebaseAnalysis.implementationContext,
            integrationPoints: task.codebaseAnalysis.integrationPoints,
            qualityAssessment: task.codebaseAnalysis.qualityAssessment,
            filesCovered: task.codebaseAnalysis.filesCovered,
            technologyStack: task.codebaseAnalysis.technologyStack,
          }
        : undefined,
    };
  }

  /**
   * Build delegation history with proper sorting and formatting
   */
  buildDelegationHistory(
    delegations: DelegationRecordWithRelations[],
    formattedDelegations: FormattedDelegationData[],
  ) {
    return delegations
      .sort(
        (a, b) =>
          new Date(a.delegationTimestamp).getTime() -
          new Date(b.delegationTimestamp).getTime(),
      )
      .map((delegation) => {
        const formatted = formattedDelegations.find(
          (fd) => fd.id === delegation.id,
        );

        return {
          id: delegation.id,
          fromMode: delegation.fromMode,
          toMode: delegation.toMode,
          delegationTimestamp: delegation.delegationTimestamp.toISOString(),
          completionTimestamp:
            delegation.completionTimestamp?.toISOString() || null,
          duration: formatted?.duration || 0,
          success: delegation.success,
          rejectionReason: delegation.rejectionReason,
        };
      });
  }

  /**
   * Build implementation plans detail with subtasks
   */
  buildImplementationPlansDetail(
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
   * Find related tasks based on similarity and dependencies
   */
  async findRelatedTasks(taskId: string): Promise<
    Array<{
      taskId: string;
      name: string;
      relationship: 'dependency' | 'related' | 'blocker';
      status: string;
    }>
  > {
    try {
      const allTasks = await this.dataService.getTasks({});

      // Find current task
      const currentTask = allTasks.find((t) => t.taskId === taskId);
      if (!currentTask) return [];

      // Find related tasks based on name similarity
      const relatedTasks = allTasks
        .filter((t) => t.taskId !== taskId)
        .filter((t) => {
          // Simple similarity check
          const nameWords = currentTask.name.toLowerCase().split(' ');
          const otherWords = t.name.toLowerCase().split(' ');
          const commonWords = nameWords.filter((word) =>
            otherWords.includes(word),
          );
          return commonWords.length > 0;
        })
        .slice(0, 5)
        .map((t) => ({
          taskId: t.taskId,
          name: t.name,
          relationship: 'related' as const,
          status: t.status,
        }));

      return relatedTasks;
    } catch (error) {
      this.logger.warn(
        `Failed to find related tasks for ${taskId}: ${error.message}`,
      );
      return [];
    }
  }
}
