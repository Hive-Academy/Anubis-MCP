/**
 * Shared MCP types for the reporting system
 * Following KISS principle with clear, focused interfaces
 */

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

export interface McpHealthStatus {
  healthy: boolean;
  services: Record<string, boolean>;
  message: string;
}
