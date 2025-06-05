import { Injectable, Logger } from '@nestjs/common';
import { InteractiveDashboardGeneratorService } from '../dashboard/interactive-dashboard/interactive-dashboard-generator.service';
import { SimpleReportGeneratorService } from '../dashboard/simple-report/simple-report-generator.service';
import { TaskDetailGeneratorService } from '../task-management/task-detail/task-detail-generator.service';
import {
  InteractiveDashboardData,
  SimpleReportData,
  TaskDetailData,
  ImplementationPlanData,
  DelegationFlowData,
  RolePerformanceData,
  WorkflowAnalyticsData,
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
  private readonly logger = new Logger(HtmlGeneratorFactoryService.name);

  constructor(
    private readonly interactiveDashboardGenerator: InteractiveDashboardGeneratorService,
    private readonly simpleReportGenerator: SimpleReportGeneratorService,
    private readonly taskDetailGenerator: TaskDetailGeneratorService,
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
      | ImplementationPlanData
      | DelegationFlowData
      | RolePerformanceData
      | WorkflowAnalyticsData,
  ): string {
    this.logger.log(`Generating ${reportType} report using factory pattern`);

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
        // TODO: Create ImplementationPlanGeneratorService in task-management/implementation-plan/
        this.logger.warn('Implementation plan generator not yet implemented');
        throw new Error('Implementation plan generator not yet implemented');

      case 'delegation-flow':
        // TODO: Create DelegationFlowGeneratorService in workflow-analytics/delegation-flow/
        this.logger.warn('Delegation flow generator not yet implemented');
        throw new Error('Delegation flow generator not yet implemented');

      case 'role-performance':
        // TODO: Create RolePerformanceGeneratorService in workflow-analytics/role-performance/
        this.logger.warn('Role performance generator not yet implemented');
        throw new Error('Role performance generator not yet implemented');

      case 'workflow-analytics':
        // TODO: Create WorkflowAnalyticsGeneratorService in workflow-analytics/workflow-analytics/
        this.logger.warn('Workflow analytics generator not yet implemented');
        throw new Error('Workflow analytics generator not yet implemented');

      default:
        this.logger.error(`Unknown report type: ${reportType}`);
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
      'implementation-plan', // TODO: Implement
      'delegation-flow', // TODO: Implement
      'role-performance', // TODO: Implement
      'workflow-analytics', // TODO: Implement
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
    ];
    return implementedTypes.includes(reportType);
  }
}
