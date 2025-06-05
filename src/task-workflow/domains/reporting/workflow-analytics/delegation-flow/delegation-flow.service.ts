import { Injectable, Logger } from '@nestjs/common';
import { ReportDataService } from '../../shared/report-data.service';
import { ReportTransformService } from '../../shared/report-transform.service';
import { ReportRenderService } from '../../shared/report-render.service';
import { ReportMetadataService } from '../../shared/report-metadata.service';
import { DelegationAnalyticsService } from './delegation-analytics.service';
import { DelegationSummaryService } from './delegation-summary.service';
import {
  TaskWithRelations,
  FormattedDelegationData,
  FormattedWorkflowData,
  ReportFilters,
  TemplateContext,
} from '../../shared/types';

export interface DelegationFlowReportData {
  task: {
    taskId: string;
    name: string;
    taskSlug?: string | null;
    status: string;
    currentOwner: string | null;
    totalDelegations: number;
    redelegationCount: number;
  };
  delegationChain: FormattedDelegationData[];
  workflowTransitions: FormattedWorkflowData[];
  summary: {
    totalDelegations: number;
    successfulDelegations: number;
    failedDelegations: number;
    averageDelegationDuration: number;
    mostCommonPath: string[];
    redelegationPoints: Array<{
      fromMode: string;
      toMode: string;
      count: number;
      reasons: string[];
    }>;
    roleInvolvement: Array<{
      role: string;
      timeAsOwner: number;
      tasksReceived: number;
      tasksDelegated: number;
      successRate: number;
    }>;
  };
  metadata: {
    generatedAt: string;
    reportType: 'delegation-flow';
    version: string;
    generatedBy: string;
  };
}

@Injectable()
export class DelegationFlowService {
  private readonly logger = new Logger(DelegationFlowService.name);

  constructor(
    private readonly dataService: ReportDataService,
    private readonly transformService: ReportTransformService,
    private readonly renderService: ReportRenderService,
    private readonly metadataService: ReportMetadataService,
    private readonly analyticsService: DelegationAnalyticsService,
    private readonly summaryService: DelegationSummaryService,
  ) {}

  /**
   * Generate delegation flow report for a specific task
   */
  async generateReport(taskId: string): Promise<DelegationFlowReportData> {
    try {
      this.logger.log(`Generating delegation flow report for: ${taskId}`);

      // Get task with delegation data using shared service
      const task = await this.dataService.getTask(taskId);
      if (!task) {
        throw new Error(`Task not found: ${taskId}`);
      }

      // Get delegation and workflow data
      const delegationRecords = await this.dataService.getDelegationRecords({
        taskId,
      });
      const workflowTransitions = await this.dataService.getWorkflowTransitions(
        {
          taskId,
        },
      );

      // Transform data using shared service
      const delegationChain =
        this.transformService.formatDelegationData(delegationRecords);
      const workflowData =
        this.transformService.formatWorkflowData(workflowTransitions);

      // Calculate summary using dedicated service
      const summary = this.summaryService.calculateDelegationSummary(
        delegationChain,
        delegationRecords,
      );

      // Generate metadata
      const metadata = this.metadataService.generateMetadata(
        'delegation-flow',
        'delegation-flow-service',
      );

      return {
        task: this.formatTaskInfo(task, delegationRecords),
        delegationChain,
        workflowTransitions: workflowData,
        summary,
        metadata: {
          generatedAt: metadata.generatedAt,
          reportType: 'delegation-flow' as const,
          version: metadata.version,
          generatedBy: metadata.generatedBy || 'delegation-flow-service',
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to generate delegation flow report: ${error.message}`,
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
        title: `Delegation Flow Report - ${reportData.task.name}`,
        chartData: this.transformService.prepareChartData(
          reportData.delegationChain,
          'delegation-timeline',
        ),
      },
      metadata: reportData.metadata,
    };

    return this.renderService.renderTemplate(
      'delegation-flow',
      templateContext,
    );
  }

  /**
   * Generate delegation analytics across multiple tasks
   */
  async generateAnalytics(filters: ReportFilters = {}) {
    try {
      this.logger.log('Generating cross-task delegation analytics');

      const tasks = await this.dataService.getTasks(filters);
      const allDelegations =
        await this.dataService.getDelegationRecords(filters);

      // Use dedicated analytics service
      const analytics =
        this.analyticsService.calculateCrossTaskAnalytics(allDelegations);
      const metadata = this.metadataService.generateMetadata(
        'delegation-analytics',
        'delegation-flow-service',
      );

      return {
        analytics,
        taskCount: tasks.length,
        totalDelegations: allDelegations.length,
        metadata: {
          ...metadata,
          generatedBy: metadata.generatedBy || 'delegation-flow-service',
          reportType: 'delegation-analytics' as const,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to generate delegation analytics: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Format task information with delegation count
   */
  private formatTaskInfo(task: TaskWithRelations, delegationRecords: any[]) {
    return {
      taskId: task.taskId,
      name: task.name,
      taskSlug: task.taskSlug,
      status: task.status,
      currentOwner: task.owner || 'Unassigned',
      totalDelegations: delegationRecords.length,
      redelegationCount: this.calculateRedelegationCount(delegationRecords),
    };
  }

  /**
   * Calculate redelegation count from delegation records
   */
  private calculateRedelegationCount(delegations: any[]): number {
    return delegations.filter((d) => d.success === false).length;
  }
}
