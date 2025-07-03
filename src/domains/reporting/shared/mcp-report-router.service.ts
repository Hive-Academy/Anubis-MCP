import { Injectable } from '@nestjs/common';
import { InteractiveDashboardService } from '../dashboard/interactive-dashboard/interactive-dashboard.service';

import { TaskDetailService } from '../task-management/task-detail/task-detail.service';
import { DelegationFlowService } from '../workflow-analytics/delegation-flow/delegation-flow.service';
import { RolePerformanceService } from '../workflow-analytics/role-performance/role-performance.service';
import { WorkflowAnalyticsService } from '../workflow-analytics/workflow-analytics/workflow-analytics.service';
import { McpReportRequest } from './mcp-types';

/**
 * MCP Report Router Service
 * Routes MCP requests to appropriate feature services
 * Following KISS principle - single responsibility for request routing
 */
@Injectable()
export class McpReportRouterService {
  constructor(
    private readonly taskDetailService: TaskDetailService,
    private readonly delegationFlowService: DelegationFlowService,

    private readonly workflowAnalyticsService: WorkflowAnalyticsService,
    private readonly rolePerformanceService: RolePerformanceService,
    private readonly interactiveDashboardService: InteractiveDashboardService,
  ) {}

  /**
   * Route request to appropriate service and generate report
   */
  async routeRequest(request: McpReportRequest): Promise<any> {
    const filters = this.processFilters(
      request.filters || {},
      request.basePath,
    );

    switch (request.reportType) {
      case 'interactive-dashboard':
      case 'dashboard':
        return this.handleDashboardRequest(request, filters);

      case 'summary':
        return this.handleSummaryRequest(request, filters);

      case 'task-detail':
        return this.handleTaskDetailRequest(request, filters);

      case 'delegation-flow':
        return this.handleDelegationFlowRequest(request, filters);

      case 'workflow-analytics':
        return this.handleWorkflowAnalyticsRequest(request, filters);

      case 'role-performance':
        return this.handleRolePerformanceRequest(request, filters);

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
      return this.delegationFlowService.generateReport(
        parseInt(request.filters.taskId),
      );
    } else {
      return this.delegationFlowService.generateHtmlReport(
        parseInt(request.filters.taskId),
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
    // Role performance reports can work with or without owner filter
    const roleFilters = { ...filters };
    if (request.filters?.owner) {
      roleFilters.owner = request.filters.owner;
    }

    if (request.outputFormat === 'json') {
      return this.rolePerformanceService.generateReport(roleFilters);
    } else {
      return this.rolePerformanceService.generateHtmlReport(roleFilters);
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
   * Handle summary report request
   */
  private async handleSummaryRequest(
    request: McpReportRequest,
    filters: any,
  ): Promise<any> {
    // Use the interactive dashboard service for summary reports
    if (request.outputFormat === 'json') {
      return this.interactiveDashboardService.generateDashboard(filters);
    } else {
      return this.interactiveDashboardService.generateHtmlDashboard(filters);
    }
  }

  /**
   * Process and convert filter values
   */
  private processFilters(filters: any, basePath?: string): any {
    const processed = { ...filters };

    // Add basePath to filters if provided
    if (basePath) {
      processed.basePath = basePath;
    }

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
