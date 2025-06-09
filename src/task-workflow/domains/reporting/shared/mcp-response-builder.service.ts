import { Injectable } from '@nestjs/common';
import { McpReportResponse } from './mcp-types';

/**
 * MCP Response Builder Service
 * Handles standardized MCP response creation
 * Following KISS principle - single responsibility for response formatting
 */
@Injectable()
export class McpResponseBuilderService {
  /**
   * Build successful MCP response
   */
  buildSuccessResponse(
    reportId: string,
    reportType: string,
    processingTime: number,
    filePath?: string,
    data?: any,
    totalRecords: number = 0,
  ): McpReportResponse {
    return {
      success: true,
      reportId,
      filePath,
      data,
      message: `Report generated successfully: ${reportType}`,
      metadata: {
        generatedAt: new Date().toISOString(),
        reportType,
        totalRecords,
        processingTime,
      },
    };
  }

  /**
   * Build error MCP response
   */
  buildErrorResponse(
    reportId: string,
    reportType: string,
    error: Error,
    processingTime: number,
  ): McpReportResponse {
    return {
      success: false,
      reportId,
      message: `Report generation failed: ${error.message}`,
      metadata: {
        generatedAt: new Date().toISOString(),
        reportType,
        totalRecords: 0,
        processingTime,
      },
    };
  }

  /**
   * Extract total records count from result data
   */
  extractTotalRecords(result: any): number {
    if (!result) return 0;

    // Handle different result structures
    if (result.reportData?.tasks?.length) {
      return result.reportData.tasks.length as number;
    }
    if (result.task) {
      return 1;
    }
    if (result.summary?.totalTasks) {
      return result.summary.totalTasks as number;
    }
    if (Array.isArray(result)) {
      return result.length;
    }

    return 0;
  }
}
