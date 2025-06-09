import { Injectable, Logger } from '@nestjs/common';
import { ImplementationPlanReportData } from '../../../shared/types/report-data.types';

/**
 * Implementation Plan Header View Service
 *
 * Focused service for generating modern, polished header and overview sections
 * of implementation plan reports. Follows Single Responsibility Principle by
 * handling only header-related HTML generation for implementation plans.
 *
 * Architecture:
 * - Pure presentation logic - NO data access services
 * - All data received from parent services via method parameters
 * - Follows clean architecture principles with clear separation of concerns
 */
@Injectable()
export class ImplementationPlanHeaderViewService {
  private readonly logger = new Logger(
    ImplementationPlanHeaderViewService.name,
  );

  /**
   * Generate HTML head section with proper meta tags and enhanced styles
   */
  generateHead(taskName: string): string {
    return `
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(taskName)} - Implementation Plan Report</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
    <style>
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .gradient-bg { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); }
        .card-shadow { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
        .card-hover { transition: all 0.3s ease; }
        .card-hover:hover { transform: translateY(-2px); box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.1); }
        .progress-bar { background: linear-gradient(90deg, #10b981 0%, #059669 100%); }
        .plan-glow { box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1); }
    </style>`;
  }

  /**
   * Generate enhanced main header section with implementation plan focus
   */
  generateHeader(task: ImplementationPlanReportData['task']): string {
    return `
    <div class="gradient-bg text-white rounded-xl shadow-lg mb-8">
        <div class="p-8">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-6">
                    <div class="w-16 h-16 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                        <i class="fas fa-project-diagram text-white text-2xl"></i>
                    </div>
                    <div>
                        <h1 class="text-3xl font-bold text-white mb-2">${this.escapeHtml(task.name)}</h1>
                        <p class="text-lg text-white text-opacity-90 mb-2">Implementation Plan Report</p>
                        <div class="flex items-center space-x-4 text-white text-opacity-90">
                            <span class="flex items-center">
                                <i class="fas fa-hashtag mr-2"></i>
                                ${this.escapeHtml(task.taskId)}
                            </span>
                            ${
                              task.slug
                                ? `
                            <span class="flex items-center">
                                <i class="fas fa-link mr-2"></i>
                                ${this.escapeHtml(task.slug)}
                            </span>
                            `
                                : ''
                            }
                        </div>
                    </div>
                </div>
                <div class="flex items-center space-x-4">
                    <div class="text-right">
                        <div class="text-white text-opacity-75 text-sm mb-1">Status</div>
                        <span class="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold ${this.getEnhancedStatusClasses(task.status)} plan-glow">
                            <i class="${this.getStatusIcon(task.status)} mr-2"></i>
                            ${task.status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                        </span>
                    </div>
                    <div class="text-right">
                        <div class="text-white text-opacity-75 text-sm mb-1">Priority</div>
                        <span class="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold ${this.getEnhancedPriorityClasses(task.priority)}">
                            <i class="${this.getPriorityIcon(task.priority)} mr-2"></i>
                            ${task.priority}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
  }

  /**
   * Generate plan overview section with implementation plan specific metrics
   */
  generatePlanOverview(
    task: ImplementationPlanReportData['task'],
    planMetrics?: any,
  ): string {
    return `
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <!-- Plan Information Card -->
        <div class="bg-white rounded-xl card-shadow card-hover p-6">
            <div class="flex items-center mb-4">
                <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                    <i class="fas fa-clipboard-list text-purple-600"></i>
                </div>
                <h2 class="text-xl font-semibold text-gray-900">Plan Information</h2>
            </div>
            <div class="space-y-4">
                <div class="flex justify-between items-center py-3 border-b border-gray-100">
                    <span class="text-sm font-medium text-gray-600">Owner</span>
                    <span class="text-sm font-semibold text-gray-900 flex items-center">
                        <i class="fas fa-user mr-2 text-gray-400"></i>
                        ${this.escapeHtml(task.owner)}
                    </span>
                </div>
                <div class="flex justify-between items-center py-3 border-b border-gray-100">
                    <span class="text-sm font-medium text-gray-600">Current Mode</span>
                    <span class="text-sm font-semibold text-gray-900 flex items-center">
                        <i class="fas fa-cog mr-2 text-gray-400"></i>
                        ${this.escapeHtml(task.currentMode)}
                    </span>
                </div>
                <div class="flex justify-between items-center py-3 border-b border-gray-100">
                    <span class="text-sm font-medium text-gray-600">Git Branch</span>
                    <span class="text-sm font-semibold text-gray-900 flex items-center">
                        <i class="fab fa-git-alt mr-2 text-gray-400"></i>
                        ${this.escapeHtml(task.gitBranch || 'Not specified')}
                    </span>
                </div>
            </div>
        </div>

        <!-- Implementation Metrics Card -->
        <div class="bg-white rounded-xl card-shadow card-hover p-6">
            <div class="flex items-center mb-4">
                <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <i class="fas fa-chart-line text-blue-600"></i>
                </div>
                <h2 class="text-xl font-semibold text-gray-900">Implementation Metrics</h2>
            </div>
            <div class="space-y-4">
                ${planMetrics ? this.generateMetricsContent(planMetrics) : this.generateDefaultMetrics()}
            </div>
        </div>
    </div>`;
  }

  /**
   * Generate enhanced footer section for implementation plans
   */
  generateFooter(metadata: ImplementationPlanReportData['metadata']): string {
    return `
    <footer class="mt-12 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 text-center">
        <div class="flex items-center justify-center space-x-4 text-sm text-gray-600">
            <span class="flex items-center">
                <i class="fas fa-cogs mr-2"></i>
                Implementation Plan Generated by ${this.escapeHtml(metadata.generatedBy)}
            </span>
            <span class="text-gray-400">•</span>
            <span class="flex items-center">
                <i class="fas fa-calendar mr-2"></i>
                ${this.formatDate(metadata.generatedAt)}
            </span>
        </div>
    </footer>`;
  }

  /**
   * Generate metrics content when available
   */
  private generateMetricsContent(metrics: any): string {
    return `
    <div class="grid grid-cols-2 gap-4">
        <!-- Total Batches -->
        <div class="flex items-center space-x-3">
            <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
            <div class="flex-1">
                <div class="text-sm font-medium text-gray-900">Total Batches</div>
                <div class="text-sm text-gray-600">${metrics.totalBatches || 0}</div>
            </div>
        </div>
        
        <!-- Completed Batches -->
        <div class="flex items-center space-x-3">
            <div class="w-3 h-3 bg-green-500 rounded-full"></div>
            <div class="flex-1">
                <div class="text-sm font-medium text-gray-900">Completed Batches</div>
                <div class="text-sm text-gray-600">${metrics.completedBatches || 0}</div>
            </div>
        </div>
        
        <!-- Total Subtasks -->
        <div class="flex items-center space-x-3">
            <div class="w-3 h-3 bg-purple-500 rounded-full"></div>
            <div class="flex-1">
                <div class="text-sm font-medium text-gray-900">Total Subtasks</div>
                <div class="text-sm text-gray-600">${metrics.totalSubtasks || 0}</div>
            </div>
        </div>
        
        <!-- Completed Subtasks -->
        <div class="flex items-center space-x-3">
            <div class="w-3 h-3 bg-emerald-500 rounded-full"></div>
            <div class="flex-1">
                <div class="text-sm font-medium text-gray-900">Completed Subtasks</div>
                <div class="text-sm text-gray-600">${metrics.completedSubtasks || 0}</div>
            </div>
        </div>
        
        <!-- Overall Completion Rate -->
        <div class="flex items-center space-x-3">
            <div class="w-3 h-3 bg-indigo-500 rounded-full"></div>
            <div class="flex-1">
                <div class="text-sm font-medium text-gray-900">Overall Progress</div>
                <div class="text-sm text-gray-600 font-semibold">${metrics.completionRate || '0%'}</div>
            </div>
        </div>
        
        <!-- Batch Completion Rate -->
        <div class="flex items-center space-x-3">
            <div class="w-3 h-3 bg-teal-500 rounded-full"></div>
            <div class="flex-1">
                <div class="text-sm font-medium text-gray-900">Batch Progress</div>
                <div class="text-sm text-gray-600 font-semibold">${metrics.batchCompletionRate || 0}%</div>
            </div>
        </div>
    </div>
    
    ${
      metrics.estimatedTimeRemaining &&
      metrics.estimatedTimeRemaining !== 'Not estimated'
        ? `
    <div class="mt-4 pt-4 border-t border-gray-200">
        <div class="flex items-center space-x-3">
            <div class="w-3 h-3 bg-amber-500 rounded-full"></div>
            <div class="flex-1">
                <div class="text-sm font-medium text-gray-900">Estimated Time Remaining</div>
                <div class="text-sm text-gray-600">${metrics.estimatedTimeRemaining}</div>
            </div>
        </div>
    </div>
    `
        : ''
    }
    
    ${
      metrics.complexityScore && metrics.complexityScore !== 'Not calculated'
        ? `
    <div class="mt-4 pt-4 border-t border-gray-200">
        <div class="flex items-center space-x-3">
            <div class="w-3 h-3 bg-red-500 rounded-full"></div>
            <div class="flex-1">
                <div class="text-sm font-medium text-gray-900">Complexity Score</div>
                <div class="text-sm text-gray-600">${metrics.complexityScore}</div>
            </div>
        </div>
    </div>
    `
        : ''
    }`;
  }

  /**
   * Generate default metrics when none available
   */
  private generateDefaultMetrics(): string {
    return `
    <div class="flex items-center space-x-4">
        <div class="w-3 h-3 bg-gray-300 rounded-full"></div>
        <div class="flex-1">
            <div class="text-sm font-medium text-gray-500">Plan Analysis</div>
            <div class="text-sm text-gray-400">Loading metrics...</div>
        </div>
    </div>
    <div class="flex items-center space-x-4">
        <div class="w-3 h-3 bg-gray-300 rounded-full"></div>
        <div class="flex-1">
            <div class="text-sm font-medium text-gray-500">Progress Tracking</div>
            <div class="text-sm text-gray-400">Analyzing implementation...</div>
        </div>
    </div>`;
  }

  /**
   * Get enhanced status classes for styling
   */
  private getEnhancedStatusClasses(status: string): string {
    const statusClasses = {
      'not-started': 'bg-gray-100 text-gray-800 border border-gray-200',
      'in-progress': 'bg-blue-100 text-blue-800 border border-blue-200',
      'needs-review': 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      completed: 'bg-green-100 text-green-800 border border-green-200',
      'needs-changes': 'bg-red-100 text-red-800 border border-red-200',
      paused: 'bg-orange-100 text-orange-800 border border-orange-200',
      cancelled: 'bg-gray-100 text-gray-600 border border-gray-200',
    };
    return (
      statusClasses[status as keyof typeof statusClasses] ||
      statusClasses['not-started']
    );
  }

  /**
   * Get enhanced priority classes for styling
   */
  private getEnhancedPriorityClasses(priority: string): string {
    const priorityClasses = {
      Low: 'bg-blue-100 text-blue-800 border border-blue-200',
      Medium: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      High: 'bg-orange-100 text-orange-800 border border-orange-200',
      Critical: 'bg-red-100 text-red-800 border border-red-200',
    };
    return (
      priorityClasses[priority as keyof typeof priorityClasses] ||
      priorityClasses['Medium']
    );
  }

  /**
   * Get status icon
   */
  private getStatusIcon(status: string): string {
    const statusIcons = {
      'not-started': 'fas fa-circle',
      'in-progress': 'fas fa-spinner',
      'needs-review': 'fas fa-eye',
      completed: 'fas fa-check-circle',
      'needs-changes': 'fas fa-exclamation-triangle',
      paused: 'fas fa-pause-circle',
      cancelled: 'fas fa-times-circle',
    } as const;
    return (
      statusIcons[status as keyof typeof statusIcons] ||
      statusIcons['not-started']
    );
  }

  /**
   * Get priority icon
   */
  private getPriorityIcon(priority: string): string {
    const priorityIcons = {
      Low: 'fas fa-arrow-down',
      Medium: 'fas fa-arrow-right',
      High: 'fas fa-arrow-up',
      Critical: 'fas fa-exclamation',
    };
    return (
      priorityIcons[priority as keyof typeof priorityIcons] ||
      priorityIcons['Medium']
    );
  }

  /**
   * Escape HTML to prevent XSS attacks
   */
  private escapeHtml(text: string): string {
    const div = { innerHTML: '' } as {
      innerHTML: string;
      textContent?: string;
    };
    div.textContent = text;
    return (
      div.innerHTML ||
      text.replace(/[&<>"']/g, (m) => {
        const escapeMap = {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        } as const;
        return escapeMap[m as keyof typeof escapeMap] || m;
      })
    );
  }

  /**
   * Format date string for display
   */
  private formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (_error) {
      return 'Invalid Date';
    }
  }
}
