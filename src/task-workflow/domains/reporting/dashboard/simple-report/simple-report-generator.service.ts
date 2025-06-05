import { Injectable, Logger } from '@nestjs/common';
import { SimpleReportData } from '../../shared/types/report-data.types';

/**
 * Simple Report Generator Service
 *
 * This service is focused solely on generating simple summary reports
 * following the Single Responsibility Principle and domain architecture.
 */
@Injectable()
export class SimpleReportGeneratorService {
  private readonly logger = new Logger(SimpleReportGeneratorService.name);

  /**
   * Generate simple report HTML using type-safe data
   */
  generateSimpleReport(data: SimpleReportData): string {
    this.logger.log('Generating type-safe simple report HTML');
    this.logger.log(`Tasks: ${data.tasks.length}`);

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    ${this.generateHead(data.title)}
</head>
<body class="bg-gray-50 font-sans">
    <div class="max-w-4xl mx-auto py-8 px-4">
        ${this.generateHeader(data.title)}
        ${this.generateSummarySection(data.summary)}
        ${this.generateTasksList(data.tasks)}
        ${this.generateFooter(data.metadata)}
    </div>
</body>
</html>`;
  }

  private generateHead(title: string): string {
    return `
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(title)} - Simple Report</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />`;
  }

  private generateHeader(title: string): string {
    return `
    <header class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div class="flex items-center space-x-3">
            <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <i class="fas fa-file-alt text-white"></i>
            </div>
            <h1 class="text-2xl font-bold text-gray-900">${this.escapeHtml(title)}</h1>
        </div>
    </header>`;
  }

  private generateSummarySection(summary: SimpleReportData['summary']): string {
    return `
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Summary</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="text-center">
                <div class="text-2xl font-bold text-blue-600">${summary.totalTasks}</div>
                <div class="text-sm text-gray-600">Total Tasks</div>
            </div>
            <div class="text-center">
                <div class="text-2xl font-bold text-green-600">${summary.completedTasks}</div>
                <div class="text-sm text-gray-600">Completed</div>
            </div>
            <div class="text-center">
                <div class="text-2xl font-bold text-yellow-600">${summary.inProgressTasks}</div>
                <div class="text-sm text-gray-600">In Progress</div>
            </div>
            <div class="text-center">
                <div class="text-2xl font-bold text-purple-600">${summary.completionRate}%</div>
                <div class="text-sm text-gray-600">Completion Rate</div>
            </div>
        </div>
    </div>`;
  }

  private generateTasksList(tasks: SimpleReportData['tasks']): string {
    if (!tasks || tasks.length === 0) {
      return `
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <i class="fas fa-inbox text-gray-400 text-4xl mb-4"></i>
          <p class="text-gray-500">No tasks found</p>
      </div>`;
    }

    return `
    <div class="bg-white rounded-lg shadow-sm border border-gray-200">
        <div class="p-6 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900">Tasks</h2>
        </div>
        <div class="divide-y divide-gray-200">
            ${tasks
              .map(
                (task) => `
                <div class="p-6 hover:bg-gray-50">
                    <div class="flex items-center justify-between">
                        <div class="flex-1">
                            <h3 class="text-sm font-medium text-gray-900">${this.escapeHtml(task.name)}</h3>
                            <p class="text-sm text-gray-500">${this.escapeHtml(task.taskId)}</p>
                            ${task.taskSlug ? `<p class="text-xs text-blue-600">${this.escapeHtml(task.taskSlug)}</p>` : ''}
                        </div>
                        <div class="flex items-center space-x-4">
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${this.getStatusClasses(task.status)}">
                                ${task.status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                            </span>
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${this.getPriorityClasses(task.priority)}">
                                ${task.priority}
                            </span>
                            <span class="text-sm text-gray-500">${task.owner}</span>
                        </div>
                    </div>
                </div>
            `,
              )
              .join('')}
        </div>
    </div>`;
  }

  private generateFooter(metadata: SimpleReportData['metadata']): string {
    return `
    <footer class="mt-8 text-center text-sm text-gray-500">
        Generated by ${this.escapeHtml(metadata.generatedBy)} • ${this.formatDate(metadata.generatedAt)}
    </footer>`;
  }

  private getStatusClasses(status: string): string {
    const statusMap: Record<string, string> = {
      completed: 'bg-green-100 text-green-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      'needs-review': 'bg-yellow-100 text-yellow-800',
      'not-started': 'bg-gray-100 text-gray-800',
      'needs-changes': 'bg-red-100 text-red-800',
      paused: 'bg-orange-100 text-orange-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return statusMap[status] || 'bg-gray-100 text-gray-800';
  }

  private getPriorityClasses(priority: string): string {
    const priorityMap: Record<string, string> = {
      Critical: 'bg-red-100 text-red-800',
      High: 'bg-orange-100 text-orange-800',
      Medium: 'bg-yellow-100 text-yellow-800',
      Low: 'bg-green-100 text-green-800',
    };
    return priorityMap[priority] || 'bg-gray-100 text-gray-800';
  }

  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  private formatDate(dateString: string): string {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  }
}
