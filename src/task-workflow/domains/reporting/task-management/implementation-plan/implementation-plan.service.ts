import { Injectable, Logger } from '@nestjs/common';
import { ReportDataService } from '../../shared/report-data.service';
import { ReportTransformService } from '../../shared/report-transform.service';
import { ReportMetadataService } from '../../shared/report-metadata.service';
import { ImplementationPlanBuilderService } from './implementation-plan-builder.service';
import { ImplementationPlanAnalyzerService } from './implementation-plan-analyzer.service';
import { ImplementationPlanGeneratorService } from './view/implementation-plan-generator.service';
import {
  ImplementationPlanReportData,
  Priority,
  Role,
  TaskStatus,
} from '../../shared/types/report-data.types';
import {
  TaskWithRelations,
  ImplementationPlanWithRelations,
} from '../../shared/types';

/**
 * Implementation Plan Service (Refactored)
 *
 * Main orchestrator for implementation plan report generation following clean architecture.
 * Focuses on data fetching, transformation, and coordination while delegating HTML generation
 * to the specialized ImplementationPlanGeneratorService.
 *
 * Architecture:
 * - Uses shared services for data fetching and transformation
 * - Uses builder and analyzer services for data preparation
 * - Delegates HTML generation to ImplementationPlanGeneratorService
 * - Maintains clean dependencies and follows Single Responsibility Principle
 */
@Injectable()
export class ImplementationPlanService {
  private readonly logger = new Logger(ImplementationPlanService.name);

  constructor(
    private readonly reportDataService: ReportDataService,
    private readonly reportTransformService: ReportTransformService,
    private readonly reportMetadataService: ReportMetadataService,
    private readonly builderService: ImplementationPlanBuilderService,
    private readonly analyzerService: ImplementationPlanAnalyzerService,
    private readonly generatorService: ImplementationPlanGeneratorService,
  ) {}

  /**
   * Generate implementation plan report using clean architecture pattern
   */
  async generateImplementationPlanReport(taskId: string): Promise<string> {
    this.logger.log(
      `Generating implementation plan report for task: ${taskId}`,
    );

    try {
      // Fetch comprehensive task data with implementation plans and subtasks
      const taskData: TaskWithRelations | null =
        await this.reportDataService.getTask(taskId);

      if (!taskData) {
        return this.generateNotFoundPage(taskId);
      }

      // Use builder service to structure the data
      const taskInfo = this.builderService.buildTaskInfo(taskData);
      const planDetails = this.builderService.buildPlanDetails(
        taskData.implementationPlans || [],
        taskData.implementationPlans?.flatMap((p) => p.subtasks || []) || [],
      );
      const batchSummary = this.builderService.buildBatchSummary(
        taskData.implementationPlans?.flatMap((p) => p.subtasks || []) || [],
      );

      // Use analyzer service for execution analysis
      const executionAnalysis = this.analyzerService.analyzePlanExecution(
        taskData.implementationPlans?.flatMap((p) => p.subtasks || []) || [],
      );
      const executionGuidance = this.analyzerService.generateExecutionGuidance(
        taskData.implementationPlans || [],
        taskData.implementationPlans?.flatMap((p) => p.subtasks || []) || [],
      );
      const complexityScore = this.analyzerService.calculateComplexityScore(
        taskData.implementationPlans || [],
        taskData.implementationPlans?.flatMap((p) => p.subtasks || []) || [],
      );

      // Transform data to implementation plan report format
      const reportData = this.buildImplementationPlanReport(
        taskData,
        taskInfo,
        planDetails,
        batchSummary,
        executionAnalysis,
        executionGuidance,
        complexityScore,
      );

      // Use generator service to create HTML report
      const htmlReport =
        this.generatorService.generateImplementationPlan(reportData);

      this.logger.log(
        `Implementation plan report generated successfully for task: ${taskId}`,
      );
      return htmlReport;
    } catch (error) {
      this.logger.error(
        `Failed to generate implementation plan report for task ${taskId}:`,
        error,
      );
      return this.generateErrorPage(taskId, error);
    }
  }

  /**
   * Build implementation plan report data using specialized services
   */
  private buildImplementationPlanReport(
    taskData: TaskWithRelations,
    taskInfo: ReturnType<ImplementationPlanBuilderService['buildTaskInfo']>,
    _planDetails: ReturnType<
      ImplementationPlanBuilderService['buildPlanDetails']
    >,
    _batchSummary: ReturnType<
      ImplementationPlanBuilderService['buildBatchSummary']
    >,
    executionAnalysis: ReturnType<
      ImplementationPlanAnalyzerService['analyzePlanExecution']
    >,
    executionGuidance: ReturnType<
      ImplementationPlanAnalyzerService['generateExecutionGuidance']
    >,
    complexityScore: number,
  ): ImplementationPlanReportData {
    const metadata = this.reportMetadataService.generateMetadata(
      'implementation-plan',
      'implementation-plan-service',
    );

    // Group subtasks by batch using database data as source of truth
    const subtaskBatches = this.transformBatchesToReportFormat(
      taskData.implementationPlans || [],
    );

    // Calculate progress using analyzer results
    const progress = this.transformExecutionAnalysisToProgress(
      executionAnalysis,
      subtaskBatches,
    );

    return {
      task: {
        taskId: taskInfo.taskId || '',
        name: taskInfo.name || 'Unknown Task',
        taskSlug: taskInfo.taskSlug || '',
        status: (taskInfo.status as TaskStatus) || 'not-started',
        priority: (taskInfo.priority as Priority) || 'Medium',
        owner: taskInfo.owner || 'Unknown',
        currentMode: (taskData.currentMode as Role) || 'boomerang',
        createdAt: taskData.creationDate.toISOString(),
        completedAt: taskData.completionDate?.toISOString(),
        gitBranch: taskData.gitBranch || '',
      },
      implementationPlan: taskData.implementationPlans?.[0] as any,
      subtaskBatches,
      progress,
      executionAnalysis,
      executionGuidance,
      complexityScore,
      metadata: {
        generatedAt: metadata.generatedAt,
        reportType: 'implementation-plan' as const,
        version: metadata.version,
        generatedBy: metadata.generatedBy || 'implementation-plan-service',
      },
    };
  }

  /**
   * Transform builder service plan details to report format for subtask batches
   */
  private transformBatchesToReportFormat(
    implementationPlans: ImplementationPlanWithRelations[],
  ): ImplementationPlanReportData['subtaskBatches'] {
    const batchMap = new Map<
      string,
      {
        batchId: string;
        batchTitle: string;
        subtasks: Array<{
          id: number;
          name: string;
          description: string;
          sequenceNumber: number;
          status: TaskStatus;
          strategicGuidance?: Record<string, unknown>;
          qualityConstraints?: Record<string, unknown>;
          successCriteria?: string[];
          architecturalRationale?: string;
        }>;
      }
    >();

    // Process all implementation plans and their subtasks
    implementationPlans.forEach((plan) => {
      if (plan.subtasks) {
        plan.subtasks.forEach((subtask) => {
          const batchId = subtask.batchId || 'default';
          const batchTitle = subtask.batchTitle || 'Default Batch';

          if (!batchMap.has(batchId)) {
            batchMap.set(batchId, {
              batchId,
              batchTitle,
              subtasks: [],
            });
          }

          const batch = batchMap.get(batchId)!;
          batch.subtasks.push({
            id: subtask.id,
            name: subtask.name,
            description: subtask.description,
            sequenceNumber: subtask.sequenceNumber,
            status: this.normalizeTaskStatus(subtask.status),
            strategicGuidance: subtask.strategicGuidance as
              | Record<string, unknown>
              | undefined,
            qualityConstraints: subtask.qualityConstraints as
              | Record<string, unknown>
              | undefined,
            successCriteria: this.convertJsonToStringArray(
              subtask.successCriteria,
            ),
            architecturalRationale: subtask.architecturalRationale || undefined,
          });
        });
      }
    });

    // Convert map to array and sort subtasks by sequence number
    return Array.from(batchMap.values()).map((batch) => ({
      ...batch,
      subtasks: batch.subtasks.sort(
        (a, b) => a.sequenceNumber - b.sequenceNumber,
      ),
    }));
  }

  /**
   * Normalize task status to ensure type safety with TaskStatus enum
   */
  private normalizeTaskStatus(status: string): TaskStatus {
    const validStatuses: TaskStatus[] = [
      'not-started',
      'in-progress',
      'needs-review',
      'completed',
      'needs-changes',
      'paused',
      'cancelled',
    ];

    if (validStatuses.includes(status as TaskStatus)) {
      return status as TaskStatus;
    }

    // Default fallback for invalid status values
    return 'not-started';
  }

  /**
   * Transform execution analysis to progress format for the report
   */
  private transformExecutionAnalysisToProgress(
    executionAnalysis: ReturnType<
      ImplementationPlanAnalyzerService['analyzePlanExecution']
    >,
    subtaskBatches: ImplementationPlanReportData['subtaskBatches'],
  ): ImplementationPlanReportData['progress'] {
    const totalBatches = subtaskBatches.length;
    const completedBatches = subtaskBatches.filter((batch) =>
      batch.subtasks.every((subtask) => subtask.status === 'completed'),
    ).length;

    const totalSubtasks = executionAnalysis.totalSubtasks;
    const completedSubtasks = executionAnalysis.completedSubtasks;
    const overallCompletion =
      totalSubtasks > 0
        ? Math.round((completedSubtasks / totalSubtasks) * 100)
        : 0;

    // Calculate estimated time remaining based on remaining subtasks
    const remainingSubtasks = totalSubtasks - completedSubtasks;
    const estimatedTimeRemaining =
      this.calculateEstimatedTime(remainingSubtasks);

    return {
      overallCompletion,
      batchesCompleted: completedBatches,
      totalBatches,
      totalSubtasks,
      completedSubtasks,
      estimatedTimeRemaining,
    };
  }

  /**
   * Calculate estimated time remaining
   */
  private calculateEstimatedTime(remainingSubtasks: number): string {
    if (remainingSubtasks === 0) return 'Complete';
    if (remainingSubtasks <= 5) return '1-2 hours';
    if (remainingSubtasks <= 10) return '2-4 hours';
    return `${Math.ceil(remainingSubtasks / 3)} hours`;
  }

  /**
   * Generate not found page for invalid task IDs
   */
  private generateNotFoundPage(taskId: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Task Not Found - Implementation Plan Report</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
</head>
<body class="bg-gray-50 min-h-screen">
    <div class="container mx-auto px-4 py-8">
        <div class="bg-white rounded-xl shadow-lg p-12 text-center">
            <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i class="fas fa-exclamation-triangle text-red-600 text-2xl"></i>
            </div>
            <h1 class="text-2xl font-bold text-gray-900 mb-2">Implementation Plan Not Found</h1>
            <p class="text-gray-600 mb-4">The task "${this.escapeHtml(taskId)}" could not be found or has no implementation plan.</p>
            <div class="text-sm text-gray-500">
                <p>Please verify the task ID and ensure the task has an implementation plan.</p>
            </div>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate error page for system errors
   */
  private generateErrorPage(taskId: string, error: any): string {
    const errorMessage = error?.message || 'Unknown error';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Error - Implementation Plan Report</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
</head>
<body class="bg-gray-50 min-h-screen">
    <div class="container mx-auto px-4 py-8">
        <div class="bg-white rounded-xl shadow-lg p-12 text-center">
            <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i class="fas fa-bug text-red-600 text-2xl"></i>
            </div>
            <h1 class="text-2xl font-bold text-gray-900 mb-2">Report Generation Error</h1>
            <p class="text-gray-600 mb-4">An error occurred while generating the implementation plan report for task "${this.escapeHtml(taskId)}".</p>
            <div class="text-sm text-gray-500">
                <p>Error: ${this.escapeHtml(errorMessage)}</p>
            </div>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Convert JSON field from database to string array safely
   */
  private convertJsonToStringArray(
    jsonField: Record<string, unknown> | null | undefined,
  ): string[] | undefined {
    if (!jsonField) {
      return undefined;
    }

    // If it's already an array of strings
    if (Array.isArray(jsonField)) {
      return jsonField.map(String);
    }

    // If it's an object, try to extract an array property
    if (typeof jsonField === 'object') {
      // Look for common array property names
      const arrayProps = ['criteria', 'items', 'list', 'values'];
      for (const prop of arrayProps) {
        if (jsonField[prop] && Array.isArray(jsonField[prop])) {
          return (jsonField[prop] as unknown[]).map(String);
        }
      }

      // If no array found, return keys as strings
      return Object.keys(jsonField);
    }

    return undefined;
  }

  /**
   * Escape HTML to prevent XSS attacks with improved type safety
   */
  private escapeHtml(text: string | null | undefined): string {
    if (text === null || text === undefined) {
      return '';
    }

    if (typeof text !== 'string') {
      return String(text);
    }

    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
