import { Injectable, Logger } from '@nestjs/common';
import { ReportDataService } from '../../shared/report-data.service';
import { ReportMetadataService } from '../../shared/report-metadata.service';
import { ReportTransformService } from '../../shared/report-transform.service';
import { ReportFilters, TaskWithRelations } from '../../shared/types';
import { DelegationFlowData } from '../../shared/types/report-data.types';
import { DelegationAnalyticsService } from './delegation-analytics.service';
import { DelegationFlowGeneratorService } from './delegation-flow-generator.service';
import { DelegationSummaryService } from './delegation-summary.service';

// Note: DelegationFlowData interface moved to shared/types/report-data.types.ts
// to avoid duplication and ensure consistency across the application

@Injectable()
export class DelegationFlowService {
  private readonly logger = new Logger(DelegationFlowService.name);

  constructor(
    private readonly dataService: ReportDataService,
    private readonly transformService: ReportTransformService,
    private readonly metadataService: ReportMetadataService,
    private readonly analyticsService: DelegationAnalyticsService,
    private readonly summaryService: DelegationSummaryService,
    private readonly delegationFlowGenerator: DelegationFlowGeneratorService,
  ) {}

  /**
   * Generate delegation flow report for a specific task
   */
  async generateReport(taskId: number): Promise<DelegationFlowData> {
    try {
      this.logger.log(`Generating delegation flow report for: ${taskId}`);

      // Get task with delegation data using shared service
      const task = await this.dataService.getTask(taskId);
      if (!task) {
        throw new Error(`Task not found: ${taskId}`);
      }
      this.logger.log(`Task found: ${task.name} (${task.id})`);

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
   * Generate HTML report using dedicated generator service
   */
  async generateHtmlReport(
    taskId: number,
    _basePath?: string,
  ): Promise<string> {
    const reportData = await this.generateReport(taskId);

    // Transform data to match generator expectations
    const delegationFlowData = this.transformDataForGenerator(reportData);

    return this.delegationFlowGenerator.generateDelegationFlow(
      delegationFlowData,
    );
  }

  /**
   * The generator now derives what it needs from the service data structure,
   * so we can pass the data through without transformation
   */
  private transformDataForGenerator(
    reportData: DelegationFlowData,
  ): DelegationFlowData {
    return reportData;
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
      id: task.id,
      name: task.name,
      slug: task.slug,
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
