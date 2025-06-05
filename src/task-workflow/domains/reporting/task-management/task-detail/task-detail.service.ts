import { Injectable, Logger } from '@nestjs/common';
import { ReportDataService } from '../../shared/report-data.service';
import { ReportTransformService } from '../../shared/report-transform.service';
import { ReportRenderService } from '../../shared/report-render.service';
import { ReportMetadataService } from '../../shared/report-metadata.service';
import { TaskDetailBuilderService } from './task-detail-builder.service';
import { TaskProgressAnalyzerService } from './task-progress-analyzer.service';
import { TaskQualityAnalyzerService } from './task-quality-analyzer.service';
import { TemplateContext } from '../../shared/types';

export interface TaskDetailData {
  task: {
    taskId: string;
    name: string;
    taskSlug?: string | null;
    status: string;
    priority?: string | null;
    owner?: string | null;
    creationDate: string;
    completionDate?: string | null;
    duration: number;
    description?: {
      description: string;
      businessRequirements: string;
      technicalRequirements: string;
      acceptanceCriteria: Record<string, unknown>;
    };
    codebaseAnalysis?: {
      architectureFindings: Record<string, unknown>;
      problemsIdentified: Record<string, unknown>;
      implementationContext: Record<string, unknown>;
      integrationPoints: Record<string, unknown>;
      qualityAssessment: Record<string, unknown>;
      filesCovered: Record<string, unknown>;
      technologyStack: Record<string, unknown>;
    };
  };
  delegationHistory: Array<{
    id: number;
    fromMode: string;
    toMode: string;
    delegationTimestamp: string;
    completionTimestamp?: string | null;
    duration: number;
    success?: boolean | null;
    rejectionReason?: string | null;
  }>;
  implementationPlans: Array<{
    id: number;
    overview: string;
    approach: string;
    technicalDecisions: string | Record<string, unknown>;
    filesToModify: string[];
    createdBy: string;
    createdAt: string;
    subtasks: Array<{
      id: number;
      name: string;
      description: string;
      status: string;
      sequenceNumber: number;
      batchId?: string | null;
    }>;
  }>;
  workflowProgress: {
    currentStage: string;
    completionPercentage: number;
    timeInCurrentStage: number;
    estimatedTimeRemaining: number;
    blockers: Array<{
      type: string;
      description: string;
      severity: 'low' | 'medium' | 'high';
      identifiedAt: string;
    }>;
  };
  qualityMetrics: {
    codeQuality: {
      testCoverage?: number;
      codeComplexity?: number;
      maintainabilityIndex?: number;
    };
    processQuality: {
      delegationEfficiency: number;
      redelegationCount: number;
      averageStageTime: number;
      qualityGatesPassed: number;
    };
  };
  relatedTasks: Array<{
    taskId: string;
    name: string;
    relationship: 'dependency' | 'related' | 'blocker';
    status: string;
  }>;
  metadata: {
    generatedAt: string;
    reportType: 'task-detail';
    version: string;
    generatedBy: string;
  };
}

@Injectable()
export class TaskDetailService {
  private readonly logger = new Logger(TaskDetailService.name);

  constructor(
    private readonly dataService: ReportDataService,
    private readonly transformService: ReportTransformService,
    private readonly renderService: ReportRenderService,
    private readonly metadataService: ReportMetadataService,
    private readonly detailBuilder: TaskDetailBuilderService,
    private readonly progressAnalyzer: TaskProgressAnalyzerService,
    private readonly qualityAnalyzer: TaskQualityAnalyzerService,
  ) {}

  /**
   * Generate detailed task analysis report
   */
  async generateReport(taskId: string): Promise<TaskDetailData> {
    try {
      this.logger.log(`Generating task detail report for ${taskId}`);

      // Get comprehensive task data
      const task = await this.dataService.getTask(taskId);
      if (!task) {
        throw new Error(`Task ${taskId} not found`);
      }

      const delegations = await this.dataService.getDelegationRecords({
        taskId,
      });
      const implementationPlans =
        await this.dataService.getImplementationPlans(taskId);
      const subtasks = await this.dataService.getSubtasks(taskId);

      // Transform data
      const formattedTask = this.transformService.formatTaskData(task);
      const formattedDelegations =
        this.transformService.formatDelegationData(delegations);

      // Build comprehensive task detail using focused services
      const taskDetail = this.detailBuilder.buildTaskDetail(
        task,
        formattedTask,
      );
      const delegationHistory = this.detailBuilder.buildDelegationHistory(
        delegations,
        formattedDelegations,
      );
      const implementationPlansDetail =
        this.detailBuilder.buildImplementationPlansDetail(
          implementationPlans,
          subtasks,
        );

      const workflowProgress = this.progressAnalyzer.calculateWorkflowProgress(
        formattedTask,
        formattedDelegations,
        subtasks,
      );

      const qualityMetrics = this.qualityAnalyzer.calculateQualityMetrics(
        formattedDelegations,
        delegations,
      );

      const relatedTasks = await this.detailBuilder.findRelatedTasks(taskId);

      // Generate metadata
      const metadata = this.metadataService.generateMetadata(
        'task-detail',
        'task-detail-service',
      );

      return {
        task: taskDetail,
        delegationHistory,
        implementationPlans: implementationPlansDetail,
        workflowProgress,
        qualityMetrics,
        relatedTasks,
        metadata: {
          generatedAt: metadata.generatedAt,
          reportType: 'task-detail' as const,
          version: metadata.version,
          generatedBy: metadata.generatedBy || 'task-detail-service',
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to generate task detail report for ${taskId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Generate HTML report using shared render service
   */
  async generateHtmlReport(taskId: string): Promise<string> {
    const reportData = await this.generateReport(taskId);

    const templateContext: TemplateContext = {
      data: {
        ...reportData,
        title: `Task Detail Report - ${reportData.task.name}`,
        chartData: {
          workflowProgress: {
            completion: reportData.workflowProgress.completionPercentage,
            stages: reportData.delegationHistory.map((d) => ({
              stage: d.toMode,
              duration: d.duration,
              success: d.success,
            })),
          },
          qualityTrends: reportData.qualityMetrics,
        },
      },
      metadata: reportData.metadata,
    };

    return this.renderService.renderTemplate('task-detail', templateContext);
  }
}
