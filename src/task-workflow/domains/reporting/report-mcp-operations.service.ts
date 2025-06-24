// src/task-workflow/domains/reporting/report-mcp-operations.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
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
  taskId: z.number().optional().describe('Task ID for individual task reports'),
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

type GenerateReportInput = z.infer<typeof GenerateReportInputSchema>;
type GetReportStatusInput = z.infer<typeof GetReportStatusInputSchema>;

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
  private readonly reportJobs = new Map<string, ReportJobStatus>();

  constructor(private readonly mcpOrchestrator: McpOrchestratorService) {}

  @Tool({
    name: 'generate_workflow_report',
    description: `Generates interactive workflow reports and analytics dashboards with rich visualizations and real-time data tracking.`,
    parameters: GenerateReportInputSchema as ZodSchema<GenerateReportInput>,
  })
  async generateWorkflowReport(input: GenerateReportInput): Promise<any> {
    const jobId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

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
        filters: {
          ...filters,
          taskId: filters.taskId ? String(filters.taskId) : undefined,
        },
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


📁 **File Details:**
- Location: ${reportResponse.filePath || 'JSON Data'}
- Size: ${jobStatus.result?.size ? `${(jobStatus.result.size / 1024).toFixed(1)} KB` : 'N/A'}
`,
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
    description: `Retrieves current status and results of a report generation request.`,
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
      }
    }
  }
}
