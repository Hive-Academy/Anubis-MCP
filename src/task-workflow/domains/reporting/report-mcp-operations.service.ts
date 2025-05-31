// src/task-workflow/domains/reporting/report-mcp-operations.service.ts
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { promises as fs } from 'fs';
import { ZodSchema, z } from 'zod';
import { ReportGeneratorFactoryService } from './services/generators/report-generator-factory.service';
import {
  RenderOptions,
  ReportRenderingService,
} from './report-rendering.service';
import * as path from 'path';
import { ReportingConfigService } from './services/infrastructure/reporting-config.service';

// Zod schemas for MCP tool parameters
const GenerateReportInputSchema = z.object({
  reportType: z.enum([
    'task_summary',
    'delegation_analytics',
    'performance_dashboard',
    'comprehensive',
    'implementation_plan_analytics',
    'code_review_insights',
    'delegation_flow_analysis',
    'task_progress_health',
    'implementation_execution',
    'code_review_quality',
    'delegation_flow_analysis_task',
    'research_documentation',
    'communication_collaboration',
  ]).describe(`Type of report to generate. Available report types:

** AGGREGATE ANALYTICS REPORTS:**
• task_summary - Overview of task completion rates, status distribution, and basic metrics
• delegation_analytics - Deep dive into delegation patterns, handoff efficiency, and role performance
• performance_dashboard - Real-time performance metrics with trending and benchmarks

** SPECIALIZED AGGREGATE INSIGHTS:**
• implementation_plan_analytics - Analysis of implementation plan quality, subtask breakdown, and execution patterns
• code_review_insights - Code review approval rates, common issues, and quality trends
• delegation_flow_analysis - Detailed workflow analysis showing delegation paths and bottlenecks

** COMPREHENSIVE:**
• comprehensive - Complete analysis combining all report types with executive summary

** INDIVIDUAL TASK REPORTS (B005):**
• task_progress_health - Individual task progress and health analysis (requires taskId filter)
• implementation_execution - Task implementation execution analysis (requires taskId filter)
• code_review_quality - Task-specific code review quality metrics (requires taskId filter)
• delegation_flow_analysis_task - Individual task delegation flow analysis (requires taskId filter)
• research_documentation - Task research and documentation quality (requires taskId filter)
• communication_collaboration - Task communication and collaboration metrics (requires taskId filter)

**Example Usage:**
- For daily standup: "performance_dashboard" 
- For sprint retrospective: "delegation_analytics"
- For quarterly review: "comprehensive"
- For individual task analysis: "task_progress_health" with taskId filter`),
  startDate: z
    .string()
    .optional()
    .describe('Start date for the report period (ISO 8601 format)'),
  endDate: z
    .string()
    .optional()
    .describe('End date for the report period (ISO 8601 format)'),
  owner: z.string().optional().describe('Filter tasks by owner'),
  mode: z.string().optional().describe('Filter tasks by current mode'),
  priority: z
    .string()
    .optional()
    .describe('Filter tasks by priority (Low, Medium, High, Critical)'),
  taskId: z
    .string()
    .optional()
    .describe(
      'Task ID for individual task reports (required for task_progress_health, implementation_execution, code_review_quality, delegation_flow_analysis_task, research_documentation, communication_collaboration)',
    ),
  outputFormat: z.enum(['pdf', 'png', 'jpeg', 'html']).default('pdf')
    .describe(`Output format for the report:

** DOCUMENT FORMATS:**
• pdf - Professional PDF document (recommended for sharing and archiving)
• html - Interactive HTML with charts and responsive design

** IMAGE FORMATS:**
• png - High-quality PNG image (great for presentations and dashboards)
• jpeg - Compressed JPEG image (smaller file size, good for quick sharing)

**Format Recommendations:**
- Executive reports: PDF
- Dashboard displays: PNG
- Interactive analysis: HTML
- Quick sharing: JPEG`),
  includeCharts: z
    .boolean()
    .default(true)
    .describe('Whether to include charts in the report'),
  landscape: z
    .boolean()
    .default(false)
    .describe('Use landscape orientation (PDF only)'),
  fullPage: z
    .boolean()
    .default(true)
    .describe('Capture full page (image formats only)'),
  returnAsBase64: z
    .boolean()
    .default(false)
    .describe(
      'Return report content as base64 encoded string instead of file path',
    ),
  basePath: z
    .string()
    .optional()
    .describe(
      'Base directory for report generation (defaults to PROJECT_ROOT environment variable or current working directory). **IMPORTANT**: When using NPX package, always provide the project root path to ensure reports are generated in the correct location.',
    ),
});

const GetReportStatusInputSchema = z.object({
  reportId: z
    .string()
    .describe('Unique identifier of the report generation request'),
});

const CleanupReportInputSchema = z.object({
  filename: z.string().describe('Filename of the report to cleanup'),
});

const HealthCheckInputSchema = z.object({
  checkBrowser: z
    .boolean()
    .default(true)
    .describe('Whether to check browser functionality'),
});

type GenerateReportInput = z.infer<typeof GenerateReportInputSchema>;
type GetReportStatusInput = z.infer<typeof GetReportStatusInputSchema>;
type CleanupReportInput = z.infer<typeof CleanupReportInputSchema>;
type HealthCheckInput = z.infer<typeof HealthCheckInputSchema>;

interface ReportJobStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  reportType: string;
  startedAt: Date;
  completedAt?: Date;
  result?: {
    filename: string;
    filepath: string;
    mimeType: string;
    size: number;
  };
  error?: string;
}

@Injectable()
export class ReportMcpOperationsService {
  private readonly logger = new Logger(ReportMcpOperationsService.name);
  private readonly reportJobs = new Map<string, ReportJobStatus>();

  constructor(
    private readonly reportGeneratorFactory: ReportGeneratorFactoryService,
    private readonly reportRenderer: ReportRenderingService,
    private readonly reportingConfig: ReportingConfigService,
  ) {}

  @Tool({
    name: 'generate_workflow_report',
    description: `Generate comprehensive workflow reports with analytics, charts, and recommendations. Supports multiple output formats including PDF, PNG, JPEG, and HTML.

**IMPORTANT FOR AI AGENTS**: Always provide the 'basePath' parameter with the project root directory to ensure reports are generated in the correct location. Use the current working directory or project root path.

** REPORT TYPES AVAILABLE:**

** Core Analytics:**
• task_summary - Task completion overview with status breakdown
• delegation_analytics - Delegation patterns and role efficiency analysis  
• performance_dashboard - Real-time metrics with performance trending

** Specialized Analysis:**
• implementation_plan_analytics - Implementation quality and execution patterns
• code_review_insights - Code review trends and quality metrics
• delegation_flow_analysis - Workflow bottleneck and delegation path analysis

** Executive Summary:**
• comprehensive - Complete analysis combining all metrics with recommendations

** OUTPUT FORMATS:**
• PDF - Professional documents (recommended for reports)
• HTML - Interactive dashboards with live charts
• PNG - High-quality images for presentations
• JPEG - Compressed images for quick sharing

** FILE ORGANIZATION:**
Reports are automatically organized in 'workflow-manager-mcp-reports' with meaningful names:
• Format: {reportType}_{dateRange}_{filters}_{timestamp}.{extension}
• Example: "performance_dashboard_2024-01-15_to_2024-01-22_owner-john_20240122_143052.pdf"`,
    parameters: GenerateReportInputSchema as ZodSchema<GenerateReportInput>,
  })
  async generateWorkflowReport(input: GenerateReportInput): Promise<any> {
    const jobId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.logger.log(
      `Starting report generation: ${jobId} (${input.reportType})`,
    );

    // Initialize job status
    const jobStatus: ReportJobStatus = {
      id: jobId,
      status: 'processing',
      reportType: input.reportType,
      startedAt: new Date(),
    };
    this.reportJobs.set(jobId, jobStatus);

    try {
      // Parse date filters if provided
      const startDate = input.startDate ? new Date(input.startDate) : undefined;
      const endDate = input.endDate ? new Date(input.endDate) : undefined;

      // Validate date range
      if (startDate && endDate && startDate > endDate) {
        throw new BadRequestException('Start date must be before end date');
      }

      // Build filters
      const filters = {
        ...(input.owner && { owner: input.owner }),
        ...(input.mode && { mode: input.mode }),
        ...(input.priority && { priority: input.priority }),
        ...(input.taskId && { taskId: input.taskId }),
      };

      // Ensure basePath is always set to PROJECT_ROOT or current working directory if not provided
      const effectiveBasePath =
        input.basePath || process.env.PROJECT_ROOT || process.cwd();

      this.logger.log(
        `Using base path: ${effectiveBasePath} (${input.basePath ? 'provided' : process.env.PROJECT_ROOT ? 'from PROJECT_ROOT env' : 'auto-detected'})`,
      );

      // Generate meaningful filename and folder structure
      const { filename, folderPath } = this.generateMeaningfulFilename(
        input.reportType,
        input.outputFormat,
        effectiveBasePath,
        startDate,
        endDate,
        filters,
      );

      this.logger.debug(`Generated filename: ${filename}`);
      this.logger.debug(`Generated folderPath: ${folderPath}`);
      this.logger.debug(`Input basePath: ${input.basePath}`);

      // Determine base path for temp and rendered files using effective base path
      const baseTempPath = path.join(
        effectiveBasePath,
        'workflow-reports',
        'temp',
      );
      const baseRenderedPath = folderPath;

      // Ensure directories exist
      await fs.mkdir(baseTempPath, { recursive: true });
      await fs.mkdir(baseRenderedPath, { recursive: true });

      this.logger.log(`Using organized report structure: ${baseRenderedPath}`);

      // Generate complete report using our new focused generator architecture
      this.logger.log(`Generating complete report for ${input.reportType}`);
      const reportFilters = {
        startDate,
        endDate,
        taskId: filters.taskId,
        owner: filters.owner,
        mode: filters.mode,
        priority: filters.priority,
      };

      const reportResult = await this.reportGeneratorFactory.generateReport(
        input.reportType as any, // TODO: Fix type mapping
        reportFilters,
      );

      const { htmlContent, reportData } = reportResult;

      let result: {
        filename: string;
        filepath: string;
        mimeType: string;
        size: number;
      };

      if (input.outputFormat === 'html') {
        // For HTML, save the content directly using organized structure
        const filepath = path.join(baseRenderedPath, filename);
        await fs.writeFile(filepath, htmlContent, 'utf-8');

        result = {
          filename,
          filepath,
          mimeType: 'text/html',
          size: htmlContent.length,
        };
      } else {
        // For PDF/image formats, use Playwright to render
        const renderOptions: RenderOptions = {
          format: input.outputFormat,
          landscape: input.landscape,
          fullPage: input.fullPage,
          printBackground: true,
          waitForTimeout: 10000,
        };

        this.logger.log(
          `Rendering ${input.outputFormat.toUpperCase()} with Playwright`,
        );
        const renderedReport = await this.reportRenderer.renderReport(
          htmlContent,
          renderOptions,
        );

        // Save the rendered report with meaningful name using organized structure
        const filepath = path.join(baseRenderedPath, filename);
        await fs.writeFile(filepath, renderedReport.buffer);

        result = {
          filename,
          filepath,
          mimeType: renderedReport.mimeType,
          size: renderedReport.size,
        };
      }

      // Update job status
      jobStatus.status = 'completed';
      jobStatus.completedAt = new Date();
      jobStatus.result = result;

      this.logger.log(
        `Report generation completed: ${jobId} (${result.filename})`,
      );

      // Prepare response - optimize for performance_dashboard to save tokens
      const response = {
        jobId,
        status: 'completed' as const,
        reportType: input.reportType,
        generatedAt: jobStatus.completedAt,
        processingTimeMs:
          jobStatus.completedAt.getTime() - jobStatus.startedAt.getTime(),
        result: {
          filename: result.filename,
          mimeType: result.mimeType,
          size: result.size,
          ...(input.returnAsBase64 && {
            content: await this.getReportAsBase64(result.filename),
          }),
          ...(!input.returnAsBase64 && {
            filepath: result.filepath,
          }),
        },
        summary: this.generateReportSummary(reportData, input.reportType),
      };

      // For performance_dashboard, return minimal response to save tokens
      if (input.reportType === 'performance_dashboard') {
        const summary = this.generateReportSummary(
          reportData,
          input.reportType,
        );
        return {
          content: [
            {
              type: 'text',
              text: `Performance Dashboard generated successfully!\n\nSummary:\n- Total Tasks: ${summary.totalTasks || 'N/A'}\n- Completion Rate: ${summary.completionRate || 'N/A'}\n- Processing Time: ${response.processingTimeMs}ms\n\nFile: ${result.filename} (${(result.size / 1024).toFixed(1)} KB)\nPath: ${result.filepath}`,
            },
          ],
        };
      }

      const summary = this.generateReportSummary(reportData, input.reportType);
      const summaryText =
        summary.reportType === 'individual_task'
          ? `Task: ${summary.taskName}\nTask ID: ${summary.taskId}\nRecommendations: ${summary.recommendationsCount}`
          : `Total Tasks: ${summary.totalTasks}\nCompletion Rate: ${summary.completionRate}\nTotal Delegations: ${summary.totalDelegations}\nCode Reviews: ${summary.codeReviews}\nRecommendations: ${summary.recommendationsCount}`;

      return {
        content: [
          {
            type: 'text',
            text: `Report generated successfully!\n\n**${reportData.title}**\n\nSummary:\n${summaryText}\n\nFile: ${result.filename} (${(result.size / 1024).toFixed(1)} KB)`,
          },
          {
            type: 'text',
            text: JSON.stringify(response, null, 2),
          },
        ],
      };
    } catch (error: any) {
      this.logger.error(`Report generation failed: ${jobId}`, error);

      // Update job status
      jobStatus.status = 'failed';
      jobStatus.completedAt = new Date();
      jobStatus.error = error.message;

      return {
        content: [
          {
            type: 'text',
            text: `Report generation failed: ${error.message}`,
          },
          {
            type: 'text',
            text: JSON.stringify(
              {
                jobId,
                status: 'failed' as const,
                error: error.message,
                reportType: input.reportType,
              },
              null,
              2,
            ),
          },
        ],
      };
    }
  }

  @Tool({
    name: 'get_report_status',
    description: 'Get the status of a report generation job by its job ID.',
    parameters: GetReportStatusInputSchema as ZodSchema<GetReportStatusInput>,
  })
  getReportStatus(input: GetReportStatusInput): any {
    const jobStatus = this.reportJobs.get(input.reportId);

    if (!jobStatus) {
      return {
        content: [
          {
            type: 'text',
            text: `Report job not found: ${input.reportId}`,
          },
          {
            type: 'text',
            text: JSON.stringify({
              notFound: true,
              reportId: input.reportId,
            }),
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: `Report Status: ${jobStatus.status}\nType: ${jobStatus.reportType}\nStarted: ${jobStatus.startedAt.toISOString()}\n${jobStatus.completedAt ? `Completed: ${jobStatus.completedAt.toISOString()}` : 'Still processing...'}`,
        },
        {
          type: 'text',
          text: JSON.stringify(jobStatus, null, 2),
        },
      ],
    };
  }

  @Tool({
    name: 'cleanup_report',
    description: 'Clean up a generated report file to free up disk space.',
    parameters: CleanupReportInputSchema as ZodSchema<CleanupReportInput>,
  })
  async cleanupReport(input: CleanupReportInput): Promise<any> {
    try {
      // Try to clean up from both possible locations
      await Promise.allSettled([
        this.reportRenderer.cleanupRenderedReport(input.filename),
      ]);

      this.logger.log(`Report cleanup requested: ${input.filename}`);

      return {
        content: [
          {
            type: 'text',
            text: `Report cleanup completed: ${input.filename}`,
          },
        ],
      };
    } catch (error: any) {
      this.logger.warn(`Report cleanup failed: ${input.filename}`, error);

      return {
        content: [
          {
            type: 'text',
            text: `Report cleanup failed: ${error.message}`,
          },
        ],
      };
    }
  }

  @Tool({
    name: 'report_system_health',
    description:
      'Check the health status of the report generation system, including browser functionality.',
    parameters: HealthCheckInputSchema as ZodSchema<HealthCheckInput>,
  })
  async reportSystemHealth(input: HealthCheckInput): Promise<any> {
    const healthStatus = {
      timestamp: new Date().toISOString(),
      overall: 'healthy' as 'healthy' | 'degraded' | 'unhealthy',
      components: {
        reportGenerator: 'healthy' as 'healthy' | 'unhealthy',
        templateEngine: 'healthy' as 'healthy' | 'unhealthy',
        browser: 'unknown' as 'healthy' | 'unhealthy' | 'unknown',
        fileSystem: 'healthy' as 'healthy' | 'unhealthy',
      },
      activeJobs: this.reportJobs.size,
      completedJobs: Array.from(this.reportJobs.values()).filter(
        (j) => j.status === 'completed',
      ).length,
      failedJobs: Array.from(this.reportJobs.values()).filter(
        (j) => j.status === 'failed',
      ).length,
    };

    try {
      // Check browser if requested
      if (input.checkBrowser) {
        const browserHealthy = await this.reportRenderer.healthCheck();
        healthStatus.components.browser = browserHealthy
          ? 'healthy'
          : 'unhealthy';

        if (!browserHealthy) {
          healthStatus.overall = 'degraded';
        }
      }
    } catch (_error: any) {
      healthStatus.overall = 'unhealthy';
      healthStatus.components.fileSystem = 'unhealthy';
    }

    return {
      content: [
        {
          type: 'text',
          text: `Report System Health: ${healthStatus.overall.toUpperCase()}\n\nComponents:\n- Report Generator: ${healthStatus.components.reportGenerator}\n- Template Engine: ${healthStatus.components.templateEngine}\n- Browser: ${healthStatus.components.browser}\n- File System: ${healthStatus.components.fileSystem}\n\nJobs: ${healthStatus.activeJobs} active, ${healthStatus.completedJobs} completed, ${healthStatus.failedJobs} failed`,
        },
        {
          type: 'text',
          text: JSON.stringify(healthStatus, null, 2),
        },
      ],
    };
  }

  // Helper method to get report summary from new simplified data structure
  private generateReportSummary(reportData: any, reportType: string): any {
    // Handle individual task reports
    if (
      reportType === 'task_progress_health' ||
      reportType === 'implementation_execution' ||
      reportType === 'code_review_quality' ||
      reportType === 'delegation_flow_analysis_task' ||
      reportType === 'research_documentation' ||
      reportType === 'communication_collaboration'
    ) {
      return {
        reportType: 'individual_task',
        taskId: reportData.taskId || 'Unknown',
        taskName: reportData.taskName || 'Unknown Task',
        recommendationsCount: reportData.recommendations?.length || 0,
      };
    }

    // Handle aggregate reports - extract from our new template data structure
    // Our TaskSummaryDataApiService returns: { metrics: { totalTasks, completionRate, ... }, ... }
    const metrics = reportData.metrics || {};

    // For delegation analytics, the data is nested under metrics.delegations
    const delegationMetrics = metrics.delegations || {};

    return {
      totalTasks: metrics.totalTasks || 0,
      completionRate: `${(metrics.completionRate || 0).toFixed(1)}%`, // Already a percentage number
      totalDelegations:
        delegationMetrics.totalDelegations || // For delegation analytics reports
        metrics.totalDelegations || // For other reports
        reportData.totalDelegations ||
        0,
      codeReviews: metrics.codeReviews || reportData.totalReviews || 0,
      recommendationsCount: reportData.recommendations?.length || 0,
    };
  }

  private async getReportAsBase64(filename: string): Promise<string> {
    try {
      return await this.reportRenderer.getReportAsBase64(filename);
    } catch {
      // Fallback to generator's temporary files
      const buffer = await fs.readFile('html');
      return buffer.toString('base64');
    }
  }

  // Cleanup old jobs periodically (called by scheduler if implemented)
  cleanupOldJobs(olderThanHours: number = 24): void {
    const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);

    for (const [jobId, job] of this.reportJobs.entries()) {
      if (job.startedAt < cutoffTime) {
        this.reportJobs.delete(jobId);
        this.logger.log(`Cleaned up old job: ${jobId}`);
      }
    }
  }

  /**
   * Generate meaningful filename and folder structure for reports
   */
  private generateMeaningfulFilename(
    reportType: string,
    outputFormat: string,
    basePath: string,
    startDate?: Date,
    endDate?: Date,
    filters?: Record<string, any>,
  ): { filename: string; folderPath: string } {
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, '-')
      .slice(0, 19);

    // Build date range part
    let dateRange = '';
    if (startDate && endDate) {
      const start = startDate.toISOString().slice(0, 10);
      const end = endDate.toISOString().slice(0, 10);
      dateRange = `_${start}_to_${end}`;
    } else if (startDate) {
      dateRange = `_from_${startDate.toISOString().slice(0, 10)}`;
    } else if (endDate) {
      dateRange = `_until_${endDate.toISOString().slice(0, 10)}`;
    }

    // Build filters part
    let filtersStr = '';
    if (filters) {
      const filterParts = [];
      if (filters.owner) filterParts.push(`owner-${filters.owner}`);
      if (filters.mode) filterParts.push(`mode-${filters.mode}`);
      if (filters.priority) filterParts.push(`priority-${filters.priority}`);
      if (filters.taskId) filterParts.push(`task-${filters.taskId}`);
      if (filterParts.length > 0) {
        filtersStr = `_${filterParts.join('_')}`;
      }
    }

    // Generate filename
    const filename = `${reportType}${dateRange}${filtersStr}_${timestamp}.${outputFormat}`;

    // Determine folder path using provided basePath
    const folderPath = path.join(basePath, 'workflow-reports', 'rendered');

    return { filename, folderPath };
  }
}
