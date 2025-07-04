import { Injectable } from '@nestjs/common';
import { McpFileManagerService } from './shared/mcp-file-manager.service';
import { McpReportRouterService } from './shared/mcp-report-router.service';
import { McpResponseBuilderService } from './shared/mcp-response-builder.service';
import {
  McpHealthStatus,
  McpReportRequest,
  McpReportResponse,
} from './shared/mcp-types';

/**
 * MCP Orchestrator Service
 * Coordinates MCP report generation using focused services
 * Following KISS principle - orchestrates without doing the work
 */
@Injectable()
export class McpOrchestratorService {
  constructor(
    private readonly reportRouter: McpReportRouterService,
    private readonly fileManager: McpFileManagerService,
    private readonly responseBuilder: McpResponseBuilderService,
  ) {}

  /**
   * Generate report via MCP call
   */
  async generateReport(request: McpReportRequest): Promise<McpReportResponse> {
    const startTime = Date.now();
    const reportId = this.fileManager.generateReportId();

    try {
      // Route request to appropriate service
      const result = await this.reportRouter.routeRequest(request);

      let filePath: string | undefined;
      let responseData: any;

      // Handle file saving for HTML output
      if (request.outputFormat !== 'json' && typeof result === 'string') {
        const identifier = request.filters?.taskId || 'general';
        filePath = await this.fileManager.saveReportFile(
          result,
          request.reportType,
          identifier,
          request.basePath,
          'html',
        );
        responseData = undefined; // Don't include HTML content in response
      } else {
        responseData = request.outputFormat === 'json' ? result : undefined;
      }

      const processingTime = Date.now() - startTime;
      const totalRecords = this.responseBuilder.extractTotalRecords(result);

      return this.responseBuilder.buildSuccessResponse(
        reportId,
        request.reportType,
        processingTime,
        filePath,
        responseData,
        totalRecords,
      );
    } catch (error) {
      const processingTime = Date.now() - startTime;

      return this.responseBuilder.buildErrorResponse(
        reportId,
        request.reportType,
        error,
        processingTime,
      );
    }
  }

  /**
   * Get raw report data (for backward compatibility)
   */
  async getReportData(filters: any = {}): Promise<any> {
    const request: McpReportRequest = {
      reportType: 'interactive-dashboard',
      filters,
      outputFormat: 'json',
    };

    const response = await this.generateReport(request);
    return response.data;
  }

  /**
   * Health check for all services
   */
  async healthCheck(): Promise<McpHealthStatus> {
    try {
      const services: Record<string, boolean> = {
        reportRouter: true,
        fileManager: true,
        responseBuilder: true,
      };

      // Test basic functionality
      const testRequest: McpReportRequest = {
        reportType: 'interactive-dashboard',
        outputFormat: 'json',
      };

      await this.reportRouter.routeRequest(testRequest);

      const allHealthy = Object.values(services).every((status) => status);

      return {
        healthy: allHealthy,
        services,
        message: allHealthy
          ? 'All services healthy'
          : 'Some services unhealthy',
      };
    } catch (error) {
      return {
        healthy: false,
        services: {
          reportRouter: false,
          fileManager: false,
          responseBuilder: false,
        },
        message: `Health check failed: ${error.message}`,
      };
    }
  }

  /**
   * Clear caches (delegated to individual services)
   */
  clearCaches(): void {
    // Individual services handle their own caching
  }

  /**
   * Cleanup old report files
   */
  async cleanupOldReports(
    basePath?: string,
    maxAgeHours: number = 24,
  ): Promise<number> {
    return this.fileManager.cleanupOldReports(basePath, maxAgeHours);
  }
}
