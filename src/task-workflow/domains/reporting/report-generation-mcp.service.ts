import { Injectable, Logger } from '@nestjs/common';
import { SimpleReportRenderer } from './services/simple-report-renderer.service';
import { TaskDetailReportService } from './services/task-detail-report.service';
import { DelegationFlowReportService } from './services/delegation-flow-report.service';
import { ImplementationPlanReportService } from './services/implementation-plan-report.service';
import { WorkflowAnalyticsService } from './services/workflow-analytics.service';
import * as path from 'path';
import * as fs from 'fs';
import * as Handlebars from 'handlebars';

export interface McpReportRequest {
  reportType: string;
  filters?: {
    startDate?: string;
    endDate?: string;
    taskId?: string;
    owner?: string;
    priority?: string;
    status?: string;
  };
  basePath?: string;
  outputFormat?: 'html' | 'json';
}

export interface McpReportResponse {
  success: boolean;
  reportId: string;
  filePath?: string;
  data?: any;
  message: string;
  metadata: {
    generatedAt: string;
    reportType: string;
    totalRecords: number;
    processingTime: number;
  };
}

@Injectable()
export class ReportGenerationMcpService {
  private readonly logger = new Logger(ReportGenerationMcpService.name);

  constructor(
    private readonly simpleRenderer: SimpleReportRenderer,
    private readonly taskDetailService: TaskDetailReportService,
    private readonly delegationFlowService: DelegationFlowReportService,
    private readonly implementationPlanService: ImplementationPlanReportService,
    private readonly workflowAnalyticsService: WorkflowAnalyticsService,
  ) {}

  /**
   * Generate report via MCP call - Updated to support new report types
   */
  async generateReport(request: McpReportRequest): Promise<McpReportResponse> {
    const startTime = Date.now();
    const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      this.logger.log(`MCP Report Request: ${JSON.stringify(request)}`);

      // Convert string dates to Date objects if provided
      const filters = this.processFilters(request.filters || {});

      let result: any;
      let filePath: string | undefined;

      // Handle new focused report types first
      switch (request.reportType) {
        case 'task-detail':
          if (!request.filters?.taskId) {
            throw new Error('Task ID is required for task detail reports');
          }
          result = await this.generateTaskDetailReport({
            ...request,
            taskId: request.filters.taskId,
          });
          if (request.outputFormat !== 'json') {
            // Save HTML file
            const fileName = `task-detail-${request.filters.taskId}-${Date.now()}.html`;
            filePath = path.join(
              request.basePath || process.cwd(),
              'workflow-reports',
              'interactive',
              fileName,
            );
            await this.ensureDirectoryExists(path.dirname(filePath));
            await fs.promises.writeFile(filePath, result);
          }
          break;

        case 'delegation-flow':
          if (!request.filters?.taskId) {
            throw new Error('Task ID is required for delegation flow reports');
          }
          result = await this.generateDelegationFlowReport({
            ...request,
            taskId: request.filters.taskId,
          });
          if (request.outputFormat !== 'json') {
            const fileName = `delegation-flow-${request.filters.taskId}-${Date.now()}.html`;
            filePath = path.join(
              request.basePath || process.cwd(),
              'workflow-reports',
              'interactive',
              fileName,
            );
            await this.ensureDirectoryExists(path.dirname(filePath));
            await fs.promises.writeFile(filePath, result);
          }
          break;

        case 'implementation-plan':
          if (!request.filters?.taskId) {
            throw new Error(
              'Task ID is required for implementation plan reports',
            );
          }
          result = await this.generateImplementationPlanReport({
            ...request,
            taskId: request.filters.taskId,
          });
          if (request.outputFormat !== 'json') {
            const fileName = `implementation-plan-${request.filters.taskId}-${Date.now()}.html`;
            filePath = path.join(
              request.basePath || process.cwd(),
              'workflow-reports',
              'interactive',
              fileName,
            );
            await this.ensureDirectoryExists(path.dirname(filePath));
            await fs.promises.writeFile(filePath, result);
          }
          break;

        case 'workflow-analytics':
          result = await this.generateWorkflowAnalyticsReport({
            ...request,
            filters,
          });
          if (request.outputFormat !== 'json') {
            const fileName = `workflow-analytics-${Date.now()}.html`;
            filePath = path.join(
              request.basePath || process.cwd(),
              'workflow-reports',
              'interactive',
              fileName,
            );
            await this.ensureDirectoryExists(path.dirname(filePath));
            await fs.promises.writeFile(filePath, result);
          }
          break;

        case 'role-performance':
          if (!request.filters?.owner) {
            throw new Error(
              'Role/Owner is required for role performance reports',
            );
          }
          result = await this.generateRolePerformanceReport({
            ...request,
            owner: request.filters.owner,
            filters,
          });
          if (request.outputFormat !== 'json') {
            const fileName = `role-performance-${request.filters.owner}-${Date.now()}.html`;
            filePath = path.join(
              request.basePath || process.cwd(),
              'workflow-reports',
              'interactive',
              fileName,
            );
            await this.ensureDirectoryExists(path.dirname(filePath));
            await fs.promises.writeFile(filePath, result);
          }
          break;

        // Legacy report types
        case 'interactive-dashboard':
        case 'dashboard':
          result = await this.simpleRenderer.generateInteractiveReport(
            'interactive-dashboard',
            filters,
            request.basePath,
          );
          filePath = result.filePath;
          break;

        case 'comprehensive':
          result = await this.simpleRenderer.generateComprehensiveReport(
            filters,
            request.basePath,
          );
          filePath = result.dashboardPath;
          break;

        case 'summary': {
          result = await this.simpleRenderer.generateInteractiveReport(
            'interactive-dashboard',
            filters,
            request.basePath,
          );
          // Also generate summary view
          const summaryResult =
            await this.simpleRenderer.generateComprehensiveReport(
              filters,
              request.basePath,
            );
          filePath = summaryResult.summaryPath;
          break;
        }

        // For data-only requests or unknown types
        case 'task_summary':
        case 'performance_dashboard':
        case 'delegation_analytics':
        default:
          if (request.outputFormat === 'json') {
            result = {
              reportData: await this.simpleRenderer.getReportDataOnly(filters),
            };
          } else {
            // Default to interactive dashboard for any unknown report type
            result = await this.simpleRenderer.generateInteractiveReport(
              'interactive-dashboard',
              filters,
              request.basePath,
            );
            filePath = result.filePath;
          }
          break;
      }

      const processingTime = Date.now() - startTime;

      const response: McpReportResponse = {
        success: true,
        reportId,
        filePath,
        data: request.outputFormat === 'json' ? result : undefined,
        message: `Report generated successfully: ${request.reportType}`,
        metadata: {
          generatedAt: new Date().toISOString(),
          reportType: request.reportType,
          totalRecords:
            result.reportData?.tasks?.length || (result.task ? 1 : 0),
          processingTime,
        },
      };

      this.logger.log(`MCP Report Success: ${reportId} (${processingTime}ms)`);
      return response;
    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.logger.error(`MCP Report Failed: ${reportId}`, error);

      return {
        success: false,
        reportId,
        message: `Report generation failed: ${error.message}`,
        metadata: {
          generatedAt: new Date().toISOString(),
          reportType: request.reportType,
          totalRecords: 0,
          processingTime,
        },
      };
    }
  }

  /**
   * Get report data only (for API endpoints or embedding)
   */
  async getReportData(filters: any = {}): Promise<any> {
    try {
      const processedFilters = this.processFilters(filters);
      return await this.simpleRenderer.getReportDataOnly(processedFilters);
    } catch (error) {
      this.logger.error(`Failed to get report data: ${error.message}`);
      throw error;
    }
  }

  /**
   * Health check for the reporting system
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    services: Record<string, boolean>;
    message: string;
  }> {
    try {
      // Test data generation
      const testData = await this.simpleRenderer.getReportDataOnly({});

      return {
        healthy: true,
        services: {
          'simple-renderer': true,
          'template-system': true,
          'data-generation': testData.tasks.length >= 0,
        },
        message: 'All reporting services operational',
      };
    } catch (error) {
      return {
        healthy: false,
        services: {
          'simple-renderer': false,
          'template-system': false,
          'data-generation': false,
        },
        message: `Health check failed: ${error.message}`,
      };
    }
  }

  /**
   * Process and validate filters
   */
  private processFilters(filters: any): any {
    const processed = { ...filters };

    // Convert date strings to Date objects
    if (processed.startDate && typeof processed.startDate === 'string') {
      processed.startDate = new Date(processed.startDate);
    }
    if (processed.endDate && typeof processed.endDate === 'string') {
      processed.endDate = new Date(processed.endDate);
    }

    // Validate status values
    if (processed.status) {
      const validStatuses = [
        'not-started',
        'in-progress',
        'needs-review',
        'completed',
        'needs-changes',
        'paused',
        'cancelled',
      ];
      if (!validStatuses.includes(processed.status)) {
        this.logger.warn(
          `Invalid status filter: ${processed.status}, ignoring`,
        );
        delete processed.status;
      }
    }

    // Validate priority values
    if (processed.priority) {
      const validPriorities = ['Low', 'Medium', 'High', 'Critical'];
      if (!validPriorities.includes(processed.priority)) {
        this.logger.warn(
          `Invalid priority filter: ${processed.priority}, ignoring`,
        );
        delete processed.priority;
      }
    }

    return processed;
  }

  /**
   * Clear caches (useful for development)
   */
  async clearCaches(): Promise<void> {
    await Promise.resolve(this.simpleRenderer.clearTemplateCache());
    this.logger.log('All caches cleared');
  }

  /**
   * Generate detailed task report with full context
   */
  private async generateTaskDetailReport(request: any): Promise<any> {
    const reportData = await this.taskDetailService.generateTaskDetailReport(
      request.taskId,
    );

    if (request.outputFormat === 'json') {
      return reportData;
    }

    // Use task detail template
    const templatePath = path.join(
      __dirname,
      'templates',
      'task-detail-report.hbs',
    );

    return await this.renderTemplate(templatePath, {
      ...reportData,
      jsonData: JSON.stringify(reportData),
    });
  }

  /**
   * Generate delegation flow report
   */
  private async generateDelegationFlowReport(request: any): Promise<any> {
    const reportData =
      await this.delegationFlowService.generateDelegationFlowReport(
        request.taskId,
      );

    if (request.outputFormat === 'json') {
      return reportData;
    }

    const templatePath = path.join(
      __dirname,
      'templates',
      'delegation-flow-report.hbs',
    );

    return await this.renderTemplate(templatePath, {
      ...reportData,
      jsonData: JSON.stringify(reportData),
    });
  }

  /**
   * Generate implementation plan report
   */
  private async generateImplementationPlanReport(request: any): Promise<any> {
    const reportData =
      await this.implementationPlanService.generateImplementationPlanReport(
        request.taskId,
      );

    if (request.outputFormat === 'json') {
      return reportData;
    }

    const templatePath = path.join(
      __dirname,
      'templates',
      'implementation-plan-report.hbs',
    );

    return await this.renderTemplate(templatePath, {
      ...reportData,
      jsonData: JSON.stringify(reportData),
    });
  }

  /**
   * Generate workflow analytics report
   */
  private async generateWorkflowAnalyticsReport(request: any): Promise<any> {
    const reportData =
      await this.workflowAnalyticsService.generateWorkflowAnalytics(
        request.filters,
      );

    if (request.outputFormat === 'json') {
      return reportData;
    }

    const templatePath = path.join(
      __dirname,
      'templates',
      'workflow-analytics-report.hbs',
    );

    return await this.renderTemplate(templatePath, {
      ...reportData,
      jsonData: JSON.stringify(reportData),
    });
  }

  /**
   * Generate role performance report
   */
  private async generateRolePerformanceReport(request: any): Promise<any> {
    const reportData =
      await this.workflowAnalyticsService.generateRolePerformanceReport(
        request.owner,
        request.filters,
      );

    if (request.outputFormat === 'json') {
      return reportData;
    }

    const templatePath = path.join(
      __dirname,
      'templates',
      'role-performance-report.hbs',
    );

    return await this.renderTemplate(templatePath, {
      ...reportData,
      jsonData: JSON.stringify(reportData),
    });
  }

  private async renderTemplate(
    templatePath: string,
    data: any,
  ): Promise<string> {
    try {
      const templateContent = await fs.promises.readFile(templatePath, 'utf-8');
      const template = Handlebars.compile(templateContent);
      return template(data);
    } catch (error) {
      this.logger.error(
        `Failed to render template ${templatePath}: ${error.message}`,
      );
      throw new Error(`Template rendering failed: ${error.message}`);
    }
  }

  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.promises.mkdir(dirPath, { recursive: true });
    } catch (_error) {
      // Directory might already exist, ignore error
    }
  }
}
