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
  DelegationFlowTemplateData,
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
      this.logger.log(`Task found: ${task.name} (${task.taskId})`);

      // Get delegation and workflow data
      const delegationRecords = await this.dataService.getDelegationRecords({
        taskId,
      });
      this.logger.log(`Delegation records found: ${delegationRecords.length}`);
      this.logger.log(
        `Delegation records:`,
        JSON.stringify(delegationRecords, null, 2),
      );

      const workflowTransitions = await this.dataService.getWorkflowTransitions(
        {
          taskId,
        },
      );
      this.logger.log(
        `Workflow transitions found: ${workflowTransitions.length}`,
      );

      // Transform data using shared service
      const delegationChain =
        this.transformService.formatDelegationData(delegationRecords);
      this.logger.log(
        `Delegation chain formatted: ${delegationChain.length} items`,
      );

      const workflowData =
        this.transformService.formatWorkflowData(workflowTransitions);

      // Calculate summary using dedicated service
      const summary = this.summaryService.calculateDelegationSummary(
        delegationChain,
        delegationRecords,
      );
      this.logger.log(`Summary calculated:`, JSON.stringify(summary, null, 2));

      // Generate metadata
      const metadata = this.metadataService.generateMetadata(
        'delegation-flow',
        'delegation-flow-service',
      );

      const result = {
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

      this.logger.log(`Final report data:`, JSON.stringify(result, null, 2));
      return result;
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
  async generateHtmlReport(taskId: string, basePath?: string): Promise<string> {
    const reportData = await this.generateReport(taskId);

    // Transform data to match template expectations
    const templateData = this.transformDataForTemplate(reportData);

    const templateContext: TemplateContext<DelegationFlowTemplateData> = {
      data: {
        ...templateData,
        title: `Delegation Flow Report - ${reportData.task.name}`,
        chartData: this.transformService.prepareChartData(
          reportData.delegationChain,
          'delegation-flow',
        ),
      } as DelegationFlowTemplateData,
      metadata: reportData.metadata,
    };

    return this.renderService.renderTemplate(
      'delegation-flow',
      templateContext,
      basePath,
    );
  }

  /**
   * Transform report data to match template expectations
   */
  private transformDataForTemplate(reportData: DelegationFlowReportData) {
    // Map delegationChain to delegations for template
    const delegations = reportData.delegationChain.map((delegation) => ({
      ...delegation,
      fromRole: delegation.fromMode,
      toRole: delegation.toMode,
      delegatedAt: delegation.delegationTimestamp,
    }));

    // Calculate unique roles
    const uniqueRoles = Array.from(
      new Set([
        ...delegations.map((d) => d.fromRole),
        ...delegations.map((d) => d.toRole),
      ]),
    );

    // Calculate average delegation time
    const completedDelegations = delegations.filter((d) => d.duration > 0);
    const averageDelegationTime =
      completedDelegations.length > 0
        ? Math.round(
            (completedDelegations.reduce((sum, d) => sum + d.duration, 0) /
              completedDelegations.length) *
              10,
          ) / 10
        : 0;

    // Calculate flow efficiency (successful delegations / total)
    const successfulDelegations = delegations.filter(
      (d) => d.success !== false,
    );
    const flowEfficiency =
      delegations.length > 0
        ? Math.round((successfulDelegations.length / delegations.length) * 100)
        : 0;

    // Transform role involvement to role analysis
    const roleAnalysis = reportData.summary.roleInvolvement.map((role) => ({
      role: role.role,
      involvement: Math.round((role.tasksReceived / delegations.length) * 100),
      delegationsReceived: role.tasksReceived,
      delegationsMade: role.tasksDelegated,
      averageHoldTime: Math.round(role.timeAsOwner * 10) / 10,
      efficiency: Math.round(role.successRate),
    }));

    // Transform most common paths
    const commonPaths = reportData.summary.mostCommonPath.map((path) => {
      const [fromRole, toRole] = path.split(' → ');
      const count = delegations.filter(
        (d) => `${d.fromRole} → ${d.toRole}` === path,
      ).length;
      return {
        fromRole,
        toRole,
        count,
        percentage: Math.round((count / delegations.length) * 100),
      };
    });

    // Transform redelegation points to escalation patterns
    const escalationPatterns = reportData.summary.redelegationPoints.map(
      (point) => ({
        fromRole: point.fromMode,
        toRole: point.toMode,
        count: point.count,
        reason: point.reasons[0] || 'Unknown reason',
      }),
    );

    // Calculate timeline data
    const taskStartDate = delegations[0]?.delegationTimestamp || new Date();
    const firstDelegation = delegations[0]?.delegationTimestamp || new Date();
    const lastDelegation =
      delegations[delegations.length - 1]?.delegationTimestamp || new Date();
    const totalFlowTime = delegations.reduce((sum, d) => sum + d.duration, 0);

    return {
      task: reportData.task, // Ensure task data is available at root level
      delegations,
      uniqueRoles,
      averageDelegationTime,
      flowEfficiency,
      roleAnalysis,
      commonPaths,
      escalationPatterns,
      taskStartDate,
      firstDelegation,
      lastDelegation,
      totalFlowTime,
      // Add missing fields for bottlenecks and optimization
      bottlenecks: [],
      fastTransitions: [],
      optimizationTips: [
        {
          title: 'Reduce Delegation Cycles',
          description: 'Consider consolidating similar role transitions',
          impact: 'Medium',
        },
      ],
    };
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
