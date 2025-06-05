import { Injectable, Logger } from '@nestjs/common';
import { TaskDetailService } from '../task-management/task-detail/task-detail.service';
import { DelegationFlowService } from '../workflow-analytics/delegation-flow/delegation-flow.service';
import { ImplementationPlanService } from '../task-management/implementation-plan/implementation-plan.service';
import { WorkflowAnalyticsService } from '../workflow-analytics/workflow-analytics/workflow-analytics.service';
import { InteractiveDashboardService } from '../dashboard/interactive-dashboard/interactive-dashboard.service';
import { McpReportRequest } from './mcp-types';

/**
 * MCP Report Router Service
 * Routes MCP requests to appropriate feature services
 * Following KISS principle - single responsibility for request routing
 */
@Injectable()
export class McpReportRouterService {
  private readonly logger = new Logger(McpReportRouterService.name);

  constructor(
    private readonly taskDetailService: TaskDetailService,
    private readonly delegationFlowService: DelegationFlowService,
    private readonly implementationPlanService: ImplementationPlanService,
    private readonly workflowAnalyticsService: WorkflowAnalyticsService,
    private readonly interactiveDashboardService: InteractiveDashboardService,
  ) {}

  /**
   * Route request to appropriate service and generate report
   */
  async routeRequest(request: McpReportRequest): Promise<any> {
    this.logger.log(`Routing MCP request: ${request.reportType}`);

    const filters = this.processFilters(request.filters || {});

    switch (request.reportType) {
      case 'task-detail':
        return this.handleTaskDetailRequest(request, filters);

      case 'delegation-flow':
        return this.handleDelegationFlowRequest(request, filters);

      case 'implementation-plan':
        return this.handleImplementationPlanRequest(request, filters);

      case 'workflow-analytics':
        return this.handleWorkflowAnalyticsRequest(request, filters);

      case 'role-performance':
        return this.handleRolePerformanceRequest(request, filters);

      case 'interactive-dashboard':
      case 'dashboard':
        return this.handleDashboardRequest(request, filters);

      default:
        throw new Error(`Unsupported report type: ${request.reportType}`);
    }
  }

  /**
   * Handle task detail report request
   */
  private async handleTaskDetailRequest(
    request: McpReportRequest,
    _filters: any,
  ): Promise<any> {
    if (!request.filters?.taskId) {
      throw new Error('Task ID is required for task detail reports');
    }

    if (request.outputFormat === 'json') {
      return this.taskDetailService.generateReport(request.filters.taskId);
    } else {
      return this.taskDetailService.generateHtmlReport(request.filters.taskId);
    }
  }

  /**
   * Handle delegation flow report request
   */
  private async handleDelegationFlowRequest(
    request: McpReportRequest,
    _filters: any,
  ): Promise<any> {
    if (!request.filters?.taskId) {
      throw new Error('Task ID is required for delegation flow reports');
    }

    if (request.outputFormat === 'json') {
      return this.delegationFlowService.generateReport(request.filters.taskId);
    } else {
      return this.delegationFlowService.generateHtmlReport(
        request.filters.taskId,
      );
    }
  }

  /**
   * Handle implementation plan report request
   */
  private async handleImplementationPlanRequest(
    request: McpReportRequest,
    _filters: any,
  ): Promise<any> {
    if (!request.filters?.taskId) {
      throw new Error('Task ID is required for implementation plan reports');
    }

    if (request.outputFormat === 'json') {
      return this.implementationPlanService.generateReport(
        request.filters.taskId,
      );
    } else {
      return this.implementationPlanService.generateHtmlReport(
        request.filters.taskId,
      );
    }
  }

  /**
   * Handle workflow analytics report request
   */
  private async handleWorkflowAnalyticsRequest(
    request: McpReportRequest,
    filters: any,
  ): Promise<any> {
    if (request.outputFormat === 'json') {
      return this.workflowAnalyticsService.generateReport(filters);
    } else {
      return this.workflowAnalyticsService.generateHtmlReport(filters);
    }
  }

  /**
   * Handle role performance report request
   */
  private async handleRolePerformanceRequest(
    request: McpReportRequest,
    filters: any,
  ): Promise<any> {
    if (!request.filters?.owner) {
      throw new Error('Role/Owner is required for role performance reports');
    }

    // Route to workflow analytics service for role-specific analysis
    // Add owner filter for role-specific analysis
    const roleFilters = { ...filters, owner: request.filters.owner };

    if (request.outputFormat === 'json') {
      return this.workflowAnalyticsService.generateReport(roleFilters);
    } else {
      return this.workflowAnalyticsService.generateHtmlReport(roleFilters);
    }
  }

  /**
   * Handle dashboard report request
   */
  private async handleDashboardRequest(
    request: McpReportRequest,
    filters: any,
  ): Promise<any> {
    if (request.outputFormat === 'json') {
      return this.interactiveDashboardService.generateDashboard(filters);
    } else {
      return this.interactiveDashboardService.generateHtmlDashboard(filters);
    }
  }

  /**
   * Process and convert filter values
   */
  private processFilters(filters: any): any {
    const processed = { ...filters };

    // Convert string dates to Date objects if provided
    if (processed.startDate) {
      processed.startDate = new Date(processed.startDate);
    }
    if (processed.endDate) {
      processed.endDate = new Date(processed.endDate);
    }

    return processed;
  }
}
