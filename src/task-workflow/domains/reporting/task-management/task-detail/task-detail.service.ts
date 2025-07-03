import { Injectable } from '@nestjs/common';
import { ReportDataService } from '../../shared/report-data.service';
import { TaskDetailData } from '../../shared/types/report-data.types';
import { TaskDetailGeneratorService } from './view/task-detail-generator.service';

@Injectable()
export class TaskDetailService {
  constructor(
    private readonly dataService: ReportDataService,
    private readonly taskDetailGenerator: TaskDetailGeneratorService,
  ) {}

  /**
   * Generate detailed task analysis report using database types as source of truth
   */
  async generateReport(taskId: string): Promise<TaskDetailData> {
    // Get comprehensive task data from database
    const task = await this.dataService.getTask(parseInt(taskId));
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    const delegations = await this.dataService.getDelegationRecords({
      taskId: parseInt(taskId),
    });
    const subtasks = await this.dataService.getSubtasks(parseInt(taskId));

    // Transform database data to type-safe TaskDetailData structure
    const taskDetailData: TaskDetailData = {
      task: {
        id: task.id,
        name: task.name,
        slug: task.slug || undefined,
        status: task.status as any,
        priority: task.priority as any,
        owner: task.owner || 'Unassigned',
        currentMode: 'senior-developer', // Default mode
        createdAt: task.createdAt.toISOString(),
        completedAt: task.completionDate?.toISOString(),
        gitBranch: undefined, // Not in current schema
      },
      description: task.taskDescription
        ? {
            description: task.taskDescription.description,
            businessRequirements:
              task.taskDescription.businessRequirements || '',
            technicalRequirements:
              task.taskDescription.technicalRequirements || '',
            acceptanceCriteria: Array.isArray(
              task.taskDescription.acceptanceCriteria,
            )
              ? (task.taskDescription.acceptanceCriteria as string[])
              : [],
          }
        : undefined,

      subtasks: subtasks.map((subtask) => ({
        id: subtask.id,
        name: subtask.name,
        description: subtask.description,
        sequenceNumber: subtask.sequenceNumber,
        status: subtask.status as any,
        batchId: subtask.batchId || 'default',
        batchTitle: subtask.batchTitle || 'Implementation Batch',
        strategicGuidance: subtask.strategicGuidance || undefined,
      })),
      codebaseAnalysis: task.codebaseAnalysis
        ? {
            architectureFindings:
              task.codebaseAnalysis.architectureFindings || {},
            problemsIdentified: task.codebaseAnalysis.problemsIdentified || {},
            implementationContext:
              task.codebaseAnalysis.implementationContext || {},
            integrationPoints: task.codebaseAnalysis.integrationPoints || {},
            qualityAssessment: task.codebaseAnalysis.qualityAssessment || {},
            filesCovered: Array.isArray(task.codebaseAnalysis.filesCovered)
              ? task.codebaseAnalysis.filesCovered
              : [],
            technologyStack: task.codebaseAnalysis.technologyStack || {},
            analyzedBy: task.codebaseAnalysis.analyzedBy || 'system',
            analyzedAt:
              task.codebaseAnalysis.analyzedAt?.toISOString() ||
              new Date().toISOString(),
          }
        : undefined,
      delegationHistory: delegations.map((delegation) => ({
        id: delegation.id,
        taskId: String(delegation.taskId),
        fromMode: delegation.fromMode as any,
        toMode: delegation.toMode as any,
        delegationTimestamp: delegation.delegationTimestamp.toISOString(),
        completionTimestamp: delegation.completionTimestamp?.toISOString(),
        duration: this.calculateDelegationDuration(delegation),
        success: delegation.success || undefined,
        taskName: task.name,
      })),
      metadata: {
        generatedAt: new Date().toISOString(),
        version: '1.0.0',
        generatedBy: 'task-detail-service',
        reportType: 'task-detail',
        taskId: taskId,
      },
    };

    return taskDetailData;
  }

  /**
   * Generate HTML report using dedicated generator service
   */
  async generateHtmlReport(
    taskId: string,
    _basePath?: string,
  ): Promise<string> {
    const reportData = await this.generateReport(taskId);

    // Use the dedicated generator service following SRP
    return this.taskDetailGenerator.generateTaskDetail(reportData);
  }

  /**
   * Calculate delegation duration in hours
   */
  private calculateDelegationDuration(delegation: any): number {
    if (!delegation.completionTimestamp) return 0;

    const start = delegation.delegationTimestamp.getTime();
    const end = delegation.completionTimestamp.getTime();
    return Math.round((end - start) / (1000 * 60 * 60)); // Convert to hours
  }
}
