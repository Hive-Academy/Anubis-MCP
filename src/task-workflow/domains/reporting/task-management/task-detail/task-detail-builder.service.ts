import { Injectable, Logger } from '@nestjs/common';
import { TaskDetailData } from '../../shared/types/report-data.types';
import {
  TaskWithRelations,
  DelegationRecordWithRelations,
  ImplementationPlanWithRelations,
  SubtaskWithRelations,
} from '../../shared/types';

/**
 * Task Detail Builder Service
 *
 * Focused service for building and structuring task detail data.
 * Uses database types as source of truth and transforms to TaskDetailData structure.
 * Follows Single Responsibility Principle by focusing solely on data building.
 */
@Injectable()
export class TaskDetailBuilderService {
  private readonly logger = new Logger(TaskDetailBuilderService.name);

  /**
   * Build complete TaskDetailData structure from database entities
   * Uses database types as source of truth
   */
  buildTaskDetailData(
    task: TaskWithRelations,
    implementationPlans: ImplementationPlanWithRelations[],
    subtasks: SubtaskWithRelations[],
    delegations: DelegationRecordWithRelations[],
  ): TaskDetailData {
    this.logger.log(`Building task detail data for task: ${task.name}`);

    return {
      task: this.buildTaskInfo(task),
      description: task.taskDescription
        ? this.buildDescription(task.taskDescription)
        : undefined,
      implementationPlans: this.buildImplementationPlans(implementationPlans),
      subtasks: this.buildSubtasks(subtasks),
      codebaseAnalysis: task.codebaseAnalysis
        ? this.buildCodebaseAnalysis(task.codebaseAnalysis)
        : undefined,
      delegationHistory: this.buildDelegationHistory(delegations, task.name),
      metadata: this.buildMetadata(task.taskId),
    };
  }

  /**
   * Build task information section from database task
   */
  private buildTaskInfo(task: TaskWithRelations): TaskDetailData['task'] {
    return {
      taskId: task.taskId,
      name: task.name,
      taskSlug: task.taskSlug || undefined,
      status: task.status as any,
      priority: task.priority as any,
      owner: task.owner || 'Unassigned',
      currentMode: 'senior-developer', // Default mode
      createdAt: task.creationDate.toISOString(),
      completedAt: task.completionDate?.toISOString(),
      gitBranch: undefined, // Not in current schema
    };
  }

  /**
   * Build task description section from database description
   */
  private buildDescription(
    description: TaskWithRelations['taskDescription'],
  ): TaskDetailData['description'] {
    if (!description) return undefined;

    return {
      description: description.description,
      businessRequirements: description.businessRequirements || '',
      technicalRequirements: description.technicalRequirements || '',
      acceptanceCriteria: Array.isArray(description.acceptanceCriteria)
        ? (description.acceptanceCriteria as string[])
        : [],
    };
  }

  /**
   * Build implementation plans section from database plans
   */
  private buildImplementationPlans(
    plans: ImplementationPlanWithRelations[],
  ): TaskDetailData['implementationPlans'] {
    return plans.map((plan) => ({
      id: plan.id,
      overview: plan.overview,
      approach: plan.approach,
      technicalDecisions:
        typeof plan.technicalDecisions === 'string'
          ? { notes: plan.technicalDecisions }
          : plan.technicalDecisions || {},
      filesToModify: plan.filesToModify || [],
      createdBy: plan.createdBy,
      createdAt: plan.createdAt.toISOString(),
    }));
  }

  /**
   * Build subtasks section with batch organization from database subtasks
   */
  private buildSubtasks(
    subtasks: SubtaskWithRelations[],
  ): TaskDetailData['subtasks'] {
    return subtasks.map((subtask) => ({
      id: subtask.id,
      name: subtask.name,
      description: subtask.description,
      sequenceNumber: subtask.sequenceNumber,
      status: subtask.status as any,
      batchId: subtask.batchId || 'default',
      batchTitle: subtask.batchTitle || 'Implementation Batch',
      strategicGuidance: subtask.strategicGuidance || undefined,
    }));
  }

  /**
   * Build codebase analysis section from database analysis
   */
  private buildCodebaseAnalysis(
    analysis: TaskWithRelations['codebaseAnalysis'],
  ): TaskDetailData['codebaseAnalysis'] {
    if (!analysis) return undefined;

    return {
      architectureFindings: analysis.architectureFindings || {},
      problemsIdentified: analysis.problemsIdentified || {},
      implementationContext: analysis.implementationContext || {},
      integrationPoints: analysis.integrationPoints || {},
      qualityAssessment: analysis.qualityAssessment || {},
      filesCovered: Array.isArray(analysis.filesCovered)
        ? (analysis.filesCovered as string[])
        : [],
      technologyStack: analysis.technologyStack || {},
      analyzedBy: analysis.analyzedBy || 'system',
      analyzedAt:
        analysis.analyzedAt?.toISOString() || new Date().toISOString(),
    };
  }

  /**
   * Build delegation history section from database delegations
   */
  private buildDelegationHistory(
    delegations: DelegationRecordWithRelations[],
    taskName: string,
  ): TaskDetailData['delegationHistory'] {
    return delegations.map((delegation) => ({
      id: delegation.id,
      taskId: delegation.taskId,
      fromMode: delegation.fromMode as any,
      toMode: delegation.toMode as any,
      delegationTimestamp: delegation.delegationTimestamp.toISOString(),
      completionTimestamp: delegation.completionTimestamp?.toISOString(),
      duration: this.calculateDelegationDuration(delegation),
      success: delegation.success || undefined,
      taskName: taskName,
    }));
  }

  /**
   * Calculate delegation duration in hours
   */
  private calculateDelegationDuration(
    delegation: DelegationRecordWithRelations,
  ): number {
    if (!delegation.completionTimestamp) return 0;

    const start = delegation.delegationTimestamp.getTime();
    const end = delegation.completionTimestamp.getTime();
    return Math.round((end - start) / (1000 * 60 * 60)); // Convert to hours
  }

  /**
   * Build metadata section
   */
  private buildMetadata(taskId: string): TaskDetailData['metadata'] {
    return {
      generatedAt: new Date().toISOString(),
      version: '1.0.0',
      generatedBy: 'task-detail-builder-service',
      reportType: 'task-detail',
      taskId: taskId,
    };
  }

  /**
   * Build batch summary for progress tracking
   */
  buildBatchSummary(subtasks: TaskDetailData['subtasks']): Record<
    string,
    {
      batchId: string;
      batchTitle: string;
      totalSubtasks: number;
      completedSubtasks: number;
      inProgressSubtasks: number;
      completionRate: number;
    }
  > {
    const batches = subtasks.reduce(
      (groups, subtask) => {
        const batchId = subtask.batchId;
        if (!groups[batchId]) {
          groups[batchId] = [];
        }
        groups[batchId].push(subtask);
        return groups;
      },
      {} as Record<string, TaskDetailData['subtasks']>,
    );

    const batchSummary: Record<string, any> = {};

    Object.entries(batches).forEach(([batchId, batchSubtasks]) => {
      const totalSubtasks = batchSubtasks.length;
      const completedSubtasks = batchSubtasks.filter(
        (s) => s.status === 'completed',
      ).length;
      const inProgressSubtasks = batchSubtasks.filter(
        (s) => s.status === 'in-progress',
      ).length;

      const completionRate = Math.round(
        (completedSubtasks / totalSubtasks) * 100,
      );

      batchSummary[batchId] = {
        batchId: batchId,
        batchTitle: batchSubtasks[0]?.batchTitle || 'Implementation Batch',
        totalSubtasks,
        completedSubtasks,
        inProgressSubtasks,
        completionRate,
      };
    });

    return batchSummary;
  }
}
