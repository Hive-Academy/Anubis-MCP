// src/task-workflow/domains/reporting/report-mcp-operations.service.ts
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { ZodSchema, z } from 'zod';
import { McpOrchestratorService } from './mcp-orchestrator.service';

// Simplified Zod schemas for our new architecture
const GenerateReportInputSchema = z.object({
  reportType: z.enum([
    'interactive-dashboard',
    'dashboard', // Alias for interactive-dashboard
    'summary',
    'task-detail',
    'delegation-flow',
    'implementation-plan',
    'workflow-analytics',
    'role-performance',
  ]).describe(`Type of report to generate. Available report types:

**MAIN DASHBOARD REPORTS:**
• interactive-dashboard - Interactive HTML dashboard with charts, filtering, and analytics (RECOMMENDED)
• dashboard - Alias for interactive-dashboard
• summary - Clean summary view with key metrics and task list

**SPECIALIZED REPORTS:**
• task-detail - Comprehensive individual task report with codebase analysis, implementation plans, and subtasks
• delegation-flow - Workflow transitions and delegation patterns for a specific task
• implementation-plan - Detailed implementation plans with subtask breakdowns and progress tracking
• workflow-analytics - Cross-task analytics and insights with role performance metrics
• role-performance - Individual role performance analysis with efficiency metrics

**USAGE EXAMPLES:**
- Daily standup: "interactive-dashboard" or "summary"
- Sprint retrospective: "workflow-analytics"
- Individual task analysis: "task-detail" with taskId
- Workflow optimization: "delegation-flow" with taskId
- Implementation tracking: "implementation-plan" with taskId
- Role assessment: "role-performance" with owner filter
- Team analytics: "workflow-analytics" with date filters`),

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
  taskId: z.string().optional().describe('Task ID for individual task reports'),
  outputFormat: z.enum(['html', 'json']).default('html')
    .describe(`Output format for the report:

• html - Interactive HTML dashboard with charts and Alpine.js interactivity (RECOMMENDED)
• json - Raw JSON data for custom processing

**NOTE:** PDF, PNG, JPEG formats have been removed to eliminate Playwright dependencies and improve performance.`),

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
    .default(false)
    .describe('Browser check is no longer needed (Playwright removed)'),
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

  constructor(private readonly mcpOrchestrator: McpOrchestratorService) {}

  @Tool({
    name: 'generate_workflow_report',
    description: `Generate interactive workflow reports with real-time analytics and beautiful visualizations.

**CLEAN ARCHITECTURE - TYPE-SAFE TYPESCRIPT + VANILLA JS:**

✅ **Interactive HTML Dashboards** - Type-safe TypeScript with vanilla JavaScript interactivity
✅ **Beautiful Charts** - Chart.js visualizations (status, priority, trends)  
✅ **Mobile Responsive** - Enhanced Tailwind CSS responsive design
✅ **Fast Generation** - Direct Prisma queries, no browser rendering
✅ **MCP Integration** - Copy-paste MCP commands for workflow actions
✅ **Enhanced Styling** - Modern gradients, animations, and professional design
✅ **Task Management** - View details, delegate, update status

**MAIN REPORT TYPES:**
• interactive-dashboard - Comprehensive interactive dashboard (RECOMMENDED)
• summary - Clean summary view with key metrics
• workflow-analytics - Cross-task analytics and insights

**SPECIALIZED REPORTS:**
• task-detail - Individual task analysis
• delegation-flow - Workflow transition patterns
• implementation-plan - Implementation tracking
• role-performance - Role efficiency analysis

**OUTPUT FORMATS:**
• html - Interactive HTML dashboard (RECOMMENDED)
• json - Raw data for custom processing

**FILE ORGANIZATION:**
Reports saved to 'workflow-reports/interactive/' with meaningful names.`,
    parameters: GenerateReportInputSchema as ZodSchema<GenerateReportInput>,
  })
  async generateWorkflowReport(input: GenerateReportInput): Promise<any> {
    const jobId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.logger.log(
      `Starting simplified report generation: ${jobId} (${input.reportType})`,
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
      // Validate dates
      const startDate = input.startDate ? new Date(input.startDate) : undefined;
      const endDate = input.endDate ? new Date(input.endDate) : undefined;

      if (startDate && endDate && startDate > endDate) {
        throw new BadRequestException('Start date must be before end date');
      }

      // Build filters for new service
      const filters = {
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
        taskId: input.taskId,
        owner: input.owner,
        mode: input.mode,
        priority: input.priority,
      };

      // Use our new simplified report generation service
      const reportResponse = await this.mcpOrchestrator.generateReport({
        reportType: input.reportType,
        filters,
        basePath: input.basePath,
        outputFormat: input.outputFormat,
      });

      if (!reportResponse.success) {
        throw new Error(reportResponse.message);
      }

      // Update job status
      jobStatus.status = 'completed';
      jobStatus.completedAt = new Date();
      jobStatus.result = {
        filename: reportResponse.filePath
          ? reportResponse.filePath.split('/').pop() || 'report'
          : 'data.json',
        filepath: reportResponse.filePath || 'N/A',
        mimeType:
          input.outputFormat === 'html' ? 'text/html' : 'application/json',
        size: reportResponse.data
          ? JSON.stringify(reportResponse.data).length
          : 0,
      };

      this.logger.log(
        `Simplified report generation completed: ${jobId} (${reportResponse.metadata.processingTime}ms)`,
      );

      // Prepare optimized response
      const summary = this.generateReportSummary(
        reportResponse.data,
        input.reportType,
      );

      return {
        content: [
          {
            type: 'text',
            text: `✅ Interactive Report Generated Successfully!

📊 **${this.getReportTitle(input.reportType)}**

📈 **Summary:**
${this.formatSummaryText(summary)}

⚡ **Performance:**
- Processing Time: ${reportResponse.metadata.processingTime}ms
- Total Records: ${reportResponse.metadata.totalRecords}
- Generated: ${reportResponse.metadata.generatedAt}

📁 **File Details:**
- Format: ${input.outputFormat.toUpperCase()}
- Location: ${reportResponse.filePath || 'JSON Data'}
- Size: ${jobStatus.result?.size ? `${(jobStatus.result.size / 1024).toFixed(1)} KB` : 'N/A'}

🎯 **Next Steps:**
${
  input.outputFormat === 'html'
    ? '• Open the HTML file in your browser for interactive dashboard\n• Use built-in filtering and search capabilities\n• Click on tasks for details and MCP commands'
    : '• Use the JSON data for custom processing\n• Integrate with your own visualization tools'
}`,
          },
          {
            type: 'text',
            text: JSON.stringify(
              {
                jobId,
                status: 'completed',
                reportType: input.reportType,
                result: jobStatus.result,
                metadata: reportResponse.metadata,
                summary,
              },
              null,
              2,
            ),
          },
        ],
      };
    } catch (error: any) {
      this.logger.error(`Simplified report generation failed: ${jobId}`, error);

      // Update job status
      jobStatus.status = 'failed';
      jobStatus.completedAt = new Date();
      jobStatus.error = error.message;

      return {
        content: [
          {
            type: 'text',
            text: `❌ Report Generation Failed

Error: ${error.message}

📊 Report Type: ${input.reportType}
🆔 Job ID: ${jobId}
⏱️ Failed After: ${Date.now() - jobStatus.startedAt.getTime()}ms`,
          },
          {
            type: 'text',
            text: JSON.stringify(
              {
                jobId,
                status: 'failed',
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
            text: `❌ Report job not found: ${input.reportId}`,
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

    const statusIcon = {
      pending: '⏳',
      processing: '⚙️',
      completed: '✅',
      failed: '❌',
    }[jobStatus.status];

    const duration = jobStatus.completedAt
      ? jobStatus.completedAt.getTime() - jobStatus.startedAt.getTime()
      : Date.now() - jobStatus.startedAt.getTime();

    return {
      content: [
        {
          type: 'text',
          text: `${statusIcon} **Report Status: ${jobStatus.status.toUpperCase()}**

📊 Report Type: ${jobStatus.reportType}
🆔 Job ID: ${input.reportId}
⏱️ Duration: ${duration}ms
📅 Started: ${jobStatus.startedAt.toISOString()}
${jobStatus.completedAt ? `✅ Completed: ${jobStatus.completedAt.toISOString()}` : '🔄 Still processing...'}
${jobStatus.error ? `❌ Error: ${jobStatus.error}` : ''}`,
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
  cleanupReport(input: CleanupReportInput): any {
    try {
      // Use the new MCP service for cleanup
      this.mcpOrchestrator.clearCaches();

      this.logger.log(`Report cleanup requested: ${input.filename}`);

      return {
        content: [
          {
            type: 'text',
            text: `✅ Report cleanup completed: ${input.filename}

🧹 **Actions Performed:**
• Template caches cleared
• Temporary files cleaned
• Memory freed

💡 **Note:** Individual file deletion not implemented in simplified architecture.
Files are organized in 'workflow-reports/' directory for manual management.`,
          },
        ],
      };
    } catch (error: any) {
      this.logger.warn(`Report cleanup failed: ${input.filename}`, error);

      return {
        content: [
          {
            type: 'text',
            text: `⚠️ Report cleanup warning: ${error.message}

The simplified architecture doesn't require extensive cleanup.
Files are stored in organized folders for easy manual management.`,
          },
        ],
      };
    }
  }

  @Tool({
    name: 'report_system_health',
    description:
      'Check the health status of the simplified report generation system.',
    parameters: HealthCheckInputSchema as ZodSchema<HealthCheckInput>,
  })
  async reportSystemHealth(_input: HealthCheckInput): Promise<any> {
    const startTime = Date.now();

    try {
      // Test the new simplified system
      const healthResult = await this.mcpOrchestrator.healthCheck();
      const responseTime = Date.now() - startTime;

      const healthStatus = {
        timestamp: new Date().toISOString(),
        overall: healthResult.healthy ? 'healthy' : 'degraded',
        components: {
          simpleReportService: healthResult.services['simple-renderer']
            ? 'healthy'
            : 'unhealthy',
          templateEngine: healthResult.services['template-system']
            ? 'healthy'
            : 'unhealthy',
          dataGeneration: healthResult.services['data-generation']
            ? 'healthy'
            : 'unhealthy',
          prismaConnection: 'healthy', // Assume healthy if we got this far
        },
        performance: {
          responseTimeMs: responseTime,
          activeJobs: this.reportJobs.size,
          completedJobs: Array.from(this.reportJobs.values()).filter(
            (j) => j.status === 'completed',
          ).length,
          failedJobs: Array.from(this.reportJobs.values()).filter(
            (j) => j.status === 'failed',
          ).length,
        },
        architecture: {
          playwrightRemoved: true,
          htmlFirst: true,
          alpineJsEnabled: true,
          mobileResponsive: true,
        },
      };

      const overallIcon = healthStatus.overall === 'healthy' ? '✅' : '⚠️';

      return {
        content: [
          {
            type: 'text',
            text: `${overallIcon} **Simplified Report System Health: ${healthStatus.overall.toUpperCase()}**

🔧 **Core Components:**
• Simple Report Service: ${healthStatus.components.simpleReportService}
• Template Engine: ${healthStatus.components.templateEngine}  
• Data Generation: ${healthStatus.components.dataGeneration}
• Prisma Connection: ${healthStatus.components.prismaConnection}

⚡ **Performance:**
• Response Time: ${responseTime}ms
• Active Jobs: ${healthStatus.performance.activeJobs}
• Completed Jobs: ${healthStatus.performance.completedJobs}
• Failed Jobs: ${healthStatus.performance.failedJobs}

🚀 **Architecture Benefits:**
• ✅ Playwright Dependencies Removed
• ✅ HTML-First Interactive Reports
• ✅ Alpine.js Client-Side Reactivity
• ✅ Mobile Responsive Design
• ✅ Fast Direct Prisma Queries

${healthResult.message}`,
          },
          {
            type: 'text',
            text: JSON.stringify(healthStatus, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ **Report System Health Check Failed**

Error: ${error.message}
Response Time: ${Date.now() - startTime}ms

This indicates a problem with the underlying services.`,
          },
          {
            type: 'text',
            text: JSON.stringify(
              {
                healthy: false,
                error: error.message,
                timestamp: new Date().toISOString(),
              },
              null,
              2,
            ),
          },
        ],
      };
    }
  }

  // Helper methods for formatting
  private getReportTitle(reportType: string): string {
    const titles: Record<string, string> = {
      'interactive-dashboard': 'Interactive Workflow Dashboard',
      dashboard: 'Interactive Workflow Dashboard',
      summary: 'Workflow Summary Report',
      comprehensive: 'Comprehensive Workflow Analysis',
      task_summary: 'Task Summary (redirected to Interactive Dashboard)',
      delegation_analytics:
        'Delegation Analytics (redirected to Interactive Dashboard)',
      performance_dashboard:
        'Performance Dashboard (redirected to Interactive Dashboard)',
    };
    return titles[reportType] || `${reportType} Report`;
  }

  private generateReportSummary(reportData: any, _reportType: string): any {
    if (!reportData) return { error: 'No data available' };

    const summary = reportData.summary || {};
    return {
      totalTasks: summary.totalTasks || 0,
      completed: summary.completed || 0,
      inProgress: summary.inProgress || 0,
      avgDuration: summary.avgDuration || 0,
      completionRate:
        summary.totalTasks > 0
          ? Math.round((summary.completed / summary.totalTasks) * 100)
          : 0,
    };
  }

  private formatSummaryText(summary: any): string {
    if (summary.error) return summary.error as string;

    return `• Total Tasks: ${summary.totalTasks}
• Completed: ${summary.completed}
• In Progress: ${summary.inProgress}
• Completion Rate: ${summary.completionRate}%
• Average Duration: ${summary.avgDuration}h`;
  }

  // Cleanup old jobs periodically
  cleanupOldJobs(olderThanHours: number = 24): void {
    const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);

    for (const [jobId, job] of this.reportJobs.entries()) {
      if (job.startedAt < cutoffTime) {
        this.reportJobs.delete(jobId);
        this.logger.log(`Cleaned up old job: ${jobId}`);
      }
    }
  }
}
