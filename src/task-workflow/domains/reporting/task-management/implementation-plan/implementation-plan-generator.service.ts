import { Injectable, Logger } from '@nestjs/common';
import { ImplementationPlanData } from '../../shared/types/report-data.types';

/**
 * Implementation Plan Generator Service
 *
 * This service is focused solely on generating implementation plan reports
 * following the Single Responsibility Principle and domain architecture.
 */
@Injectable()
export class ImplementationPlanGeneratorService {
  private readonly logger = new Logger(ImplementationPlanGeneratorService.name);

  /**
   * Generate implementation plan HTML using type-safe data
   */
  generateImplementationPlan(data: ImplementationPlanData): string {
    this.logger.log('Generating type-safe implementation plan HTML');
    this.logger.log(`Task: ${data.task.name}`);

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    ${this.generateHead(data.task.name)}
</head>
<body class="bg-gray-50 font-sans">
    <div class="max-w-6xl mx-auto py-8 px-4">
        ${this.generateHeader(data.task)}
        ${this.generatePlanOverview(data.plan)}
        ${this.generateBatchesSection(data.batches)}
        ${this.generateProgressSection(data.progress)}
        ${this.generateFooter(data.metadata)}
    </div>
    ${this.generateChartScripts(data)}
</body>
</html>`;
  }

  private generateHead(taskName: string): string {
    return `
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(taskName)} - Implementation Plan</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />`;
  }

  private generateHeader(task: ImplementationPlanData['task']): string {
    return `
    <header class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
                <div class="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                    <i class="fas fa-project-diagram text-white text-xl"></i>
                </div>
                <div>
                    <h1 class="text-2xl font-bold text-gray-900">Implementation Plan</h1>
                    <p class="text-lg text-gray-700">${this.escapeHtml(task.name)}</p>
                    <p class="text-sm text-gray-600">${this.escapeHtml(task.taskId)}</p>
                    ${task.taskSlug ? `<p class="text-xs text-purple-600">${this.escapeHtml(task.taskSlug)}</p>` : ''}
                </div>
            </div>
            <div class="flex items-center space-x-4">
                <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${this.getStatusClasses(task.status)}">
                    ${task.status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                </span>
                <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${this.getPriorityClasses(task.priority)}">
                    ${task.priority}
                </span>
            </div>
        </div>
    </header>`;
  }

  private generatePlanOverview(plan: ImplementationPlanData['plan']): string {
    return `
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Plan Overview</h2>
        <div class="space-y-4">
            <div>
                <h3 class="text-sm font-medium text-gray-700">Overview</h3>
                <p class="mt-1 text-sm text-gray-900">${this.escapeHtml(plan.overview)}</p>
            </div>
            <div>
                <h3 class="text-sm font-medium text-gray-700">Approach</h3>
                <p class="mt-1 text-sm text-gray-900">${this.escapeHtml(plan.approach)}</p>
            </div>
            <div>
                <h3 class="text-sm font-medium text-gray-700">Technical Decisions</h3>
                <div class="mt-1 bg-gray-50 rounded-lg p-4">
                    <pre class="text-sm text-gray-900 whitespace-pre-wrap">${JSON.stringify(plan.technicalDecisions, null, 2)}</pre>
                </div>
            </div>
            <div>
                <h3 class="text-sm font-medium text-gray-700">Files to Modify</h3>
                <ul class="mt-1 list-disc list-inside text-sm text-gray-900">
                    ${plan.filesToModify.map((file) => `<li class="font-mono">${this.escapeHtml(file)}</li>`).join('')}
                </ul>
            </div>
            <div class="flex items-center justify-between text-sm text-gray-600">
                <span>Created by: ${this.escapeHtml(plan.createdBy)}</span>
                <span>Created: ${this.formatDate(plan.createdAt)}</span>
            </div>
        </div>
    </div>`;
  }

  private generateBatchesSection(
    batches: ImplementationPlanData['batches'],
  ): string {
    if (!batches || batches.length === 0) {
      return `
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center mb-6">
          <i class="fas fa-layer-group text-gray-400 text-4xl mb-4"></i>
          <p class="text-gray-500">No implementation batches defined</p>
      </div>`;
    }

    return `
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Implementation Batches</h2>
        <div class="space-y-6">
            ${batches
              .map(
                (batch) => `
                <div class="border border-gray-200 rounded-lg p-4">
                    <div class="flex items-center justify-between mb-3">
                        <h3 class="text-md font-medium text-gray-900">${this.escapeHtml(batch.batchTitle)}</h3>
                        <span class="text-sm text-gray-600">${batch.batchId}</span>
                    </div>
                    <div class="grid grid-cols-4 gap-4 mb-4">
                        <div class="text-center">
                            <div class="text-lg font-bold text-blue-600">${batch.completionStatus.total}</div>
                            <div class="text-xs text-gray-600">Total</div>
                        </div>
                        <div class="text-center">
                            <div class="text-lg font-bold text-green-600">${batch.completionStatus.completed}</div>
                            <div class="text-xs text-gray-600">Completed</div>
                        </div>
                        <div class="text-center">
                            <div class="text-lg font-bold text-yellow-600">${batch.completionStatus.inProgress}</div>
                            <div class="text-xs text-gray-600">In Progress</div>
                        </div>
                        <div class="text-center">
                            <div class="text-lg font-bold text-gray-600">${batch.completionStatus.notStarted}</div>
                            <div class="text-xs text-gray-600">Not Started</div>
                        </div>
                    </div>
                    <div class="space-y-2">
                        ${batch.subtasks
                          .map(
                            (subtask) => `
                            <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <span class="text-sm text-gray-900">${subtask.sequenceNumber}. ${this.escapeHtml(subtask.name)}</span>
                                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${this.getStatusClasses(subtask.status)}">
                                    ${subtask.status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                                </span>
                            </div>
                        `,
                          )
                          .join('')}
                    </div>
                </div>
            `,
              )
              .join('')}
        </div>
    </div>`;
  }

  private generateProgressSection(
    progress: ImplementationPlanData['progress'],
  ): string {
    return `
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Progress Overview</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="text-center">
                <div class="text-3xl font-bold text-purple-600">${progress.overallCompletion}%</div>
                <div class="text-sm text-gray-600">Overall Completion</div>
                <div class="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div class="bg-purple-600 h-2 rounded-full" style="width: ${progress.overallCompletion}%"></div>
                </div>
            </div>
            <div class="text-center">
                <div class="text-3xl font-bold text-blue-600">${progress.batchesCompleted}/${progress.totalBatches}</div>
                <div class="text-sm text-gray-600">Batches Completed</div>
            </div>
            <div class="text-center">
                <div class="text-lg font-bold text-green-600">${progress.estimatedTimeRemaining || 'TBD'}</div>
                <div class="text-sm text-gray-600">Est. Time Remaining</div>
            </div>
        </div>
        <div class="mt-6">
            <canvas id="progressChart" width="400" height="200"></canvas>
        </div>
    </div>`;
  }

  private generateFooter(metadata: ImplementationPlanData['metadata']): string {
    return `
    <footer class="mt-8 text-center text-sm text-gray-500">
        Generated by ${this.escapeHtml(metadata.generatedBy)} • ${this.formatDate(metadata.generatedAt)}
    </footer>`;
  }

  private generateChartScripts(data: ImplementationPlanData): string {
    return `
    <script>
        // Progress Chart
        const ctx = document.getElementById('progressChart').getContext('2d');
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Completed', 'In Progress', 'Not Started'],
                datasets: [{
                    data: [
                        ${data.batches.reduce((sum, batch) => sum + batch.completionStatus.completed, 0)},
                        ${data.batches.reduce((sum, batch) => sum + batch.completionStatus.inProgress, 0)},
                        ${data.batches.reduce((sum, batch) => sum + batch.completionStatus.notStarted, 0)}
                    ],
                    backgroundColor: ['#10b981', '#f59e0b', '#6b7280'],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    </script>`;
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
