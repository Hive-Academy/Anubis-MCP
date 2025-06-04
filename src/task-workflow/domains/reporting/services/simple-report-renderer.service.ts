import { Injectable, Logger } from '@nestjs/common';
import { SimpleReportService, SimpleReportData } from './simple-report.service';
import * as fs from 'fs';
import * as path from 'path';
import Handlebars from 'handlebars';

@Injectable()
export class SimpleReportRenderer {
  private readonly logger = new Logger(SimpleReportRenderer.name);
  private templateCache = new Map<string, HandlebarsTemplateDelegate>();

  constructor(private readonly simpleReportService: SimpleReportService) {}

  /**
   * Generate interactive HTML report
   */
  async generateInteractiveReport(
    reportType: string = 'interactive-dashboard',
    filters: any = {},
    basePath: string = process.cwd(),
  ): Promise<{ filePath: string; reportData: SimpleReportData }> {
    try {
      this.logger.log(`Generating interactive report: ${reportType}`);

      // 1. Get data from SimpleReportService
      const reportData =
        await this.simpleReportService.generateReportData(filters);

      // 2. Load and compile template
      const template = this.loadTemplate(reportType);

      // 3. Render HTML with JSON data embedded
      const html = template({
        // Pass the entire JSON data to be embedded in the template
        jsonData: JSON.stringify(reportData, null, 2),

        // Also pass individual fields for potential server-side rendering
        reportData,

        // Metadata
        generatedAt: new Date().toISOString(),
        reportType,
        filters: JSON.stringify(filters),
      });

      // 4. Save to file
      const fileName = this.generateFileName(reportType, filters);
      const outputDir = path.join(basePath, 'workflow-reports', 'interactive');

      // Ensure directory exists
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const filePath = path.join(outputDir, fileName);

      fs.writeFileSync(filePath, html, 'utf8');

      this.logger.log(`Report generated successfully: ${filePath}`);

      return {
        filePath,
        reportData,
      };
    } catch (error) {
      this.logger.error(
        `Failed to generate report: ${error.message}`,
        error.stack,
      );
      throw new Error(`Report generation failed: ${error.message}`);
    }
  }

  /**
   * Generate comprehensive report with multiple views
   */
  async generateComprehensiveReport(
    filters: any = {},
    basePath: string = process.cwd(),
  ): Promise<{
    dashboardPath: string;
    summaryPath: string;
    reportData: SimpleReportData;
  }> {
    try {
      const reportData =
        await this.simpleReportService.generateReportData(filters);

      // Generate main dashboard
      const dashboard = await this.generateInteractiveReport(
        'interactive-dashboard',
        filters,
        basePath,
      );

      // Generate summary report (simpler view)
      const summary = this.generateSummaryReport(reportData, filters, basePath);

      return {
        dashboardPath: dashboard.filePath,
        summaryPath: summary.filePath,
        reportData,
      };
    } catch (error) {
      this.logger.error(
        `Failed to generate comprehensive report: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Generate a simpler summary report
   */
  private generateSummaryReport(
    reportData: SimpleReportData,
    filters: any,
    basePath: string,
  ): { filePath: string } {
    const summaryTemplate = `
<!DOCTYPE html>
<html>
<head>
    <title>Workflow Summary Report</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</head>
<body class="bg-gray-50 p-8">
    <div class="max-w-4xl mx-auto">
        <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h1 class="text-3xl font-bold text-gray-900 mb-4">
                <i class="fas fa-chart-bar text-blue-600 mr-3"></i>
                Workflow Summary Report
            </h1>
            <p class="text-gray-600 mb-2">Generated: {{generatedAt}}</p>
            <p class="text-gray-600">Total Tasks: {{reportData.summary.totalTasks}}</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div class="bg-white rounded-lg shadow p-6 text-center">
                <div class="text-3xl font-bold text-blue-600">{{reportData.summary.totalTasks}}</div>
                <div class="text-gray-600">Total Tasks</div>
            </div>
            <div class="bg-white rounded-lg shadow p-6 text-center">
                <div class="text-3xl font-bold text-green-600">{{reportData.summary.completed}}</div>
                <div class="text-gray-600">Completed</div>
            </div>
            <div class="bg-white rounded-lg shadow p-6 text-center">
                <div class="text-3xl font-bold text-orange-600">{{reportData.summary.inProgress}}</div>
                <div class="text-gray-600">In Progress</div>
            </div>
            <div class="bg-white rounded-lg shadow p-6 text-center">
                <div class="text-3xl font-bold text-purple-600">{{reportData.summary.avgDuration}}h</div>
                <div class="text-gray-600">Avg Duration</div>
            </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-xl font-semibold mb-4">Task List</h2>
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        {{#each reportData.tasks}}
                        <tr>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="text-sm font-medium text-gray-900">{{name}}</div>
                                <div class="text-xs text-gray-500">{{taskId}}</div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <span class="px-2 py-1 text-xs rounded-full {{#statusClass status}}{{/statusClass}}">{{status}}</span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{priority}}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{duration}}h</td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="w-full bg-gray-200 rounded-full h-2">
                                    <div class="h-2 bg-blue-600 rounded-full" style="width: {{progress}}%"></div>
                                </div>
                                <span class="text-xs text-gray-600">{{progress}}%</span>
                            </td>
                        </tr>
                        {{/each}}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</body>
</html>`;

    // Register helper for status classes
    Handlebars.registerHelper('statusClass', function (status: string) {
      const classes: Record<string, string> = {
        completed: 'bg-green-100 text-green-800',
        'in-progress': 'bg-blue-100 text-blue-800',
        'not-started': 'bg-gray-100 text-gray-800',
        'needs-review': 'bg-yellow-100 text-yellow-800',
        'needs-changes': 'bg-red-100 text-red-800',
      };
      return classes[status] || 'bg-gray-100 text-gray-800';
    });

    const template = Handlebars.compile(summaryTemplate);
    const html = template({
      reportData,
      generatedAt: new Date().toLocaleString(),
      filters,
    });

    const fileName = this.generateFileName('summary', filters);
    const outputDir = path.join(basePath, 'workflow-reports', 'summary');

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filePath = path.join(outputDir, fileName);
    fs.writeFileSync(filePath, html, 'utf8');

    return { filePath };
  }

  /**
   * Load and cache handlebars template
   */
  private loadTemplate(templateName: string): HandlebarsTemplateDelegate {
    if (this.templateCache.has(templateName)) {
      return this.templateCache.get(templateName)!;
    }

    const templatePath = path.join(
      __dirname,
      '..',
      'templates',
      `${templateName}.hbs`,
    );

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found: ${templatePath}`);
    }

    const templateContent = fs.readFileSync(templatePath, 'utf8');
    const compiled = Handlebars.compile(templateContent);

    this.templateCache.set(templateName, compiled);
    return compiled;
  }

  /**
   * Generate filename with timestamp and filters
   */
  private generateFileName(reportType: string, filters: any): string {
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, '-')
      .slice(0, -5);

    let filterSuffix = '';
    if (filters.status) filterSuffix += `_status-${filters.status}`;
    if (filters.priority) filterSuffix += `_priority-${filters.priority}`;
    if (filters.owner) filterSuffix += `_owner-${filters.owner}`;

    return `${reportType}${filterSuffix}_${timestamp}.html`;
  }

  /**
   * Get report data only (for API endpoints)
   */
  async getReportDataOnly(filters: any = {}): Promise<SimpleReportData> {
    return await this.simpleReportService.generateReportData(filters);
  }

  /**
   * Clear template cache (useful for development)
   */
  clearTemplateCache(): void {
    this.templateCache.clear();
    this.logger.log('Template cache cleared');
  }
}
