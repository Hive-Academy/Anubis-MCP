import { Injectable } from '@nestjs/common';
import { InteractiveDashboardGeneratorService } from '../dashboard/interactive-dashboard/interactive-dashboard-generator.service';
import { SimpleReportGeneratorService } from '../dashboard/simple-report/simple-report-generator.service';
import { ImplementationPlanGeneratorService } from '../task-management/implementation-plan/view/implementation-plan-generator.service';
import { TaskDetailGeneratorService } from '../task-management/task-detail/view/task-detail-generator.service';
import { DelegationFlowGeneratorService } from '../workflow-analytics/delegation-flow/delegation-flow-generator.service';
import { RolePerformanceGeneratorService } from '../workflow-analytics/role-performance/role-performance-generator.service';
import { DelegationFlowData } from './types/report-data.types';

import { WorkflowAnalyticsGeneratorService } from '../workflow-analytics/workflow-analytics/workflow-analytics-generator.service';
import { WorkflowAnalyticsData } from '../workflow-analytics/workflow-analytics/workflow-analytics.service';
import {
  ImplementationPlanReportData,
  InteractiveDashboardData,
  RolePerformanceData,
  SimpleReportData,
  TaskDetailData,
} from './types/report-data.types';

/**
 * HTML Generator Factory Service
 *
 * This factory service coordinates between specialized generator services
 * following the Factory Pattern and maintaining Single Responsibility Principle.
 * Each report type is handled by its dedicated service in the appropriate domain folder.
 */
@Injectable()
export class HtmlGeneratorFactoryService {
  constructor(
    private readonly interactiveDashboardGenerator: InteractiveDashboardGeneratorService,
    private readonly simpleReportGenerator: SimpleReportGeneratorService,
    private readonly taskDetailGenerator: TaskDetailGeneratorService,
    private readonly implementationPlanGenerator: ImplementationPlanGeneratorService,
    private readonly workflowAnalyticsGenerator: WorkflowAnalyticsGeneratorService,
    private readonly delegationFlowGenerator: DelegationFlowGeneratorService,
    private readonly rolePerformanceGenerator: RolePerformanceGeneratorService,
  ) {}

  /**
   * Generate HTML for any report type using the appropriate specialized service
   */
  generateReport(
    reportType: string,
    data:
      | InteractiveDashboardData
      | SimpleReportData
      | TaskDetailData
      | ImplementationPlanReportData
      | DelegationFlowData
      | RolePerformanceData
      | WorkflowAnalyticsData,
  ): string {
    switch (reportType) {
      case 'interactive-dashboard':
      case 'dashboard':
        return this.interactiveDashboardGenerator.generateInteractiveDashboard(
          data as InteractiveDashboardData,
        );

      case 'summary':
      case 'simple-report':
        return this.simpleReportGenerator.generateSimpleReport(
          data as SimpleReportData,
        );

      case 'task-detail':
        return this.taskDetailGenerator.generateTaskDetail(
          data as TaskDetailData,
        );

      case 'implementation-plan':
        return this.implementationPlanGenerator.generateImplementationPlan(
          data as ImplementationPlanReportData,
        );

      case 'delegation-flow':
        // The data has been transformed by the service before reaching here
        return this.delegationFlowGenerator.generateDelegationFlow(
          data as DelegationFlowData,
        );

      case 'role-performance':
        return this.rolePerformanceGenerator.generateRolePerformance(
          data as RolePerformanceData,
        );

      case 'workflow-analytics':
        return this.workflowAnalyticsGenerator.generateWorkflowAnalytics(
          data as WorkflowAnalyticsData,
        );

      default:
        throw new Error(`Unsupported report type: ${reportType}`);
    }
  }

  /**
   * Get list of supported report types
   */
  getSupportedReportTypes(): string[] {
    return [
      'interactive-dashboard',
      'dashboard',
      'summary',
      'simple-report',
      'task-detail',
      'implementation-plan',
      'delegation-flow',
      'role-performance',
      'workflow-analytics',
    ];
  }

  /**
   * Check if a report type is supported
   */
  isReportTypeSupported(reportType: string): boolean {
    const implementedTypes = [
      'interactive-dashboard',
      'dashboard',
      'summary',
      'simple-report',
      'task-detail',
      'implementation-plan',
      'delegation-flow',
      'role-performance',
      'workflow-analytics',
    ];
    return implementedTypes.includes(reportType);
  }
}
