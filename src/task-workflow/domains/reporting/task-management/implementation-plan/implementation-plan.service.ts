import { Injectable, Logger } from '@nestjs/common';
import { ReportDataService } from '../../shared/report-data.service';
import { ReportTransformService } from '../../shared/report-transform.service';
import { ReportRenderService } from '../../shared/report-render.service';
import { ReportMetadataService } from '../../shared/report-metadata.service';
import { ImplementationPlanBuilderService } from './implementation-plan-builder.service';
import { ImplementationPlanAnalyzerService } from './implementation-plan-analyzer.service';
import { TemplateContext } from '../../shared/types';

export interface ImplementationPlanData {
  task: {
    taskId: string;
    name: string;
    taskSlug?: string | null;
    status: string;
    priority?: string | null;
    owner?: string | null;
  };
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
  planAnalysis: {
    totalSubtasks: number;
    completedSubtasks: number;
    completionPercentage: number;
    batchSummary: Array<{
      batchId: string;
      taskCount: number;
      completedCount: number;
      status: 'not-started' | 'in-progress' | 'completed';
    }>;
    estimatedEffort: {
      totalHours: number;
      remainingHours: number;
      complexityScore: number;
    };
  };
  executionGuidance: {
    nextSteps: string[];
    dependencies: string[];
    riskFactors: Array<{
      risk: string;
      impact: 'low' | 'medium' | 'high';
      mitigation: string;
    }>;
    qualityChecks: string[];
  };
  metadata: {
    generatedAt: string;
    reportType: 'implementation-plan';
    version: string;
    generatedBy: string;
  };
}

@Injectable()
export class ImplementationPlanService {
  private readonly logger = new Logger(ImplementationPlanService.name);

  constructor(
    private readonly dataService: ReportDataService,
    private readonly transformService: ReportTransformService,
    private readonly renderService: ReportRenderService,
    private readonly metadataService: ReportMetadataService,
    private readonly planBuilder: ImplementationPlanBuilderService,
    private readonly planAnalyzer: ImplementationPlanAnalyzerService,
  ) {}

  /**
   * Generate implementation plan report for a specific task
   */
  async generateReport(taskId: string): Promise<ImplementationPlanData> {
    try {
      this.logger.log(`Generating implementation plan report for: ${taskId}`);

      // Get task and plan data
      const task = await this.dataService.getTask(taskId);
      if (!task) {
        throw new Error(`Task not found: ${taskId}`);
      }

      const implementationPlans =
        await this.dataService.getImplementationPlans(taskId);
      const subtasks = await this.dataService.getSubtasks(taskId);

      // Build plan details using focused services
      const taskInfo = this.planBuilder.buildTaskInfo(task);
      const planDetails = this.planBuilder.buildPlanDetails(
        implementationPlans,
        subtasks,
      );

      // Analyze plan execution
      const planAnalysis = this.planAnalyzer.analyzePlanExecution(subtasks);
      const executionGuidance = this.planAnalyzer.generateExecutionGuidance(
        implementationPlans,
        subtasks,
      );

      // Generate metadata
      const metadata = this.metadataService.generateMetadata(
        'implementation-plan',
        'implementation-plan-service',
      );

      return {
        task: taskInfo,
        implementationPlans: planDetails,
        planAnalysis,
        executionGuidance,
        metadata: {
          generatedAt: metadata.generatedAt,
          reportType: 'implementation-plan' as const,
          version: metadata.version,
          generatedBy: metadata.generatedBy || 'implementation-plan-service',
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to generate implementation plan report: ${error.message}`,
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
        title: `Implementation Plan - ${reportData.task.name}`,
        chartData: {
          completionProgress: {
            completed: reportData.planAnalysis.completedSubtasks,
            total: reportData.planAnalysis.totalSubtasks,
            percentage: reportData.planAnalysis.completionPercentage,
          },
          batchProgress: reportData.planAnalysis.batchSummary,
          effortEstimation: reportData.planAnalysis.estimatedEffort,
        },
      },
      metadata: reportData.metadata,
    };

    return this.renderService.renderTemplate(
      'implementation-plan',
      templateContext,
    );
  }

  /**
   * Generate execution summary for quick reference
   */
  async generateExecutionSummary(taskId: string): Promise<{
    nextActions: string[];
    blockers: string[];
    readyBatches: string[];
    completionStatus: string;
  }> {
    try {
      const reportData = await this.generateReport(taskId);

      const readyBatches = reportData.planAnalysis.batchSummary
        .filter((batch) => batch.status === 'not-started')
        .map((batch) => batch.batchId);

      const blockers = reportData.executionGuidance.riskFactors
        .filter((risk) => risk.impact === 'high')
        .map((risk) => risk.risk);

      const completionStatus = `${reportData.planAnalysis.completionPercentage}% complete (${reportData.planAnalysis.completedSubtasks}/${reportData.planAnalysis.totalSubtasks} subtasks)`;

      return {
        nextActions: reportData.executionGuidance.nextSteps.slice(0, 3),
        blockers,
        readyBatches,
        completionStatus,
      };
    } catch (error) {
      this.logger.error(
        `Failed to generate execution summary: ${error.message}`,
      );
      throw error;
    }
  }
}
