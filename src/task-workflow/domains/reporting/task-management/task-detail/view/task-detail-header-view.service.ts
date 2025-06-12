import { Injectable, Logger } from '@nestjs/common';
import { TaskDetailData } from '../../../shared/types/report-data.types';

/**
 * Task Detail Header View Service (Enhanced)
 *
 * Focused service for generating modern, polished header and overview sections
 * of task detail reports. Enhanced to match the visual quality of the interactive dashboard.
 * Follows Single Responsibility Principle by handling only header-related HTML generation.
 */
@Injectable()
export class TaskDetailHeaderViewService {
  private readonly logger = new Logger(TaskDetailHeaderViewService.name);

  /**
   * Generate HTML head section with proper meta tags and enhanced styles
   */
  generateHead(taskName: string): string {
    return `
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(taskName)} - Task Detail Report</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
    <style>
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .gradient-bg { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .card-shadow { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
        .card-hover { transition: all 0.3s ease; }
        .card-hover:hover { transform: translateY(-2px); box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.1); }
        .progress-bar { background: linear-gradient(90deg, #10b981 0%, #059669 100%); }
        .status-glow { box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
    </style>`;
  }

  /**
   * Generate enhanced main header section with modern design
   */
  generateHeader(task: TaskDetailData['task']): string {
    return `
    <div class="gradient-bg text-white rounded-xl shadow-lg mb-8">
        <div class="p-8">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-6">
                    <div class="w-16 h-16 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                        <i class="fas fa-tasks text-white text-2xl"></i>
                    </div>
                    <div>
                        <h1 class="text-3xl font-bold text-white mb-2">${this.escapeHtml(task.name)}</h1>
                        <div class="flex items-center space-x-4 text-white text-opacity-90">
                            <span class="flex items-center">
                                <i class="fas fa-hashtag mr-2"></i>
                                ${this.escapeHtml(task.id.toString())}
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
                        <span class="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold ${this.getEnhancedStatusClasses(task.status)} status-glow">
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
   * Generate enhanced task overview section with modern card design
   */
  generateTaskOverview(task: TaskDetailData['task']): string {
    return `
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <!-- Task Information Card -->
        <div class="bg-white rounded-xl card-shadow card-hover p-6">
            <div class="flex items-center mb-4">
                <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <i class="fas fa-info-circle text-blue-600"></i>
                </div>
                <h2 class="text-xl font-semibold text-gray-900">Task Information</h2>
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

        <!-- Timeline Card -->
        <div class="bg-white rounded-xl card-shadow card-hover p-6">
            <div class="flex items-center mb-4">
                <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <i class="fas fa-clock text-green-600"></i>
                </div>
                <h2 class="text-xl font-semibold text-gray-900">Timeline</h2>
            </div>
            <div class="space-y-4">
                <div class="flex items-center space-x-4">
                    <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <div class="flex-1">
                        <div class="text-sm font-medium text-gray-900">Created</div>
                        <div class="text-sm text-gray-600">${this.formatDate(task.createdAt)}</div>
                    </div>
                </div>
                ${
                  task.completedAt
                    ? `
                <div class="flex items-center space-x-4">
                    <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div class="flex-1">
                        <div class="text-sm font-medium text-gray-900">Completed</div>
                        <div class="text-sm text-gray-600">${this.formatDate(task.completedAt)}</div>
                    </div>
                </div>
                `
                    : `
                <div class="flex items-center space-x-4">
                    <div class="w-3 h-3 bg-gray-300 rounded-full"></div>
                    <div class="flex-1">
                        <div class="text-sm font-medium text-gray-500">Not completed yet</div>
                        <div class="text-sm text-gray-400">In progress...</div>
                    </div>
                </div>
                `
                }
                ${this.calculateDuration(task.createdAt, task.completedAt)}
            </div>
        </div>
    </div>`;
  }

  /**
   * Generate enhanced footer section
   */
  generateFooter(metadata: TaskDetailData['metadata']): string {
    return `
    <footer class="mt-12 bg-gray-50 rounded-xl p-6 text-center">
        <div class="flex items-center justify-center space-x-4 text-sm text-gray-600">
            <span class="flex items-center">
                <i class="fas fa-robot mr-2"></i>
                Generated by ${this.escapeHtml(metadata.generatedBy)}
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
   * Calculate and display task duration
   */
  private calculateDuration(createdAt: string, completedAt?: string): string {
    const start = new Date(createdAt);
    const end = completedAt ? new Date(completedAt) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(
      (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    );

    return `
    <div class="mt-4 p-3 bg-gray-50 rounded-lg">
        <div class="text-sm font-medium text-gray-700">Duration</div>
        <div class="text-lg font-semibold text-gray-900">
            ${diffDays > 0 ? `${diffDays} days, ` : ''}${diffHours} hours
        </div>
        <div class="text-xs text-gray-500">${completedAt ? 'Total time' : 'Time elapsed'}</div>
    </div>`;
  }

  /**
   * Get enhanced CSS classes for task status badges
   */
  private getEnhancedStatusClasses(status: string): string {
    const statusMap: Record<string, string> = {
      completed: 'bg-green-500 text-white shadow-lg',
      'in-progress': 'bg-blue-500 text-white shadow-lg',
      'needs-review': 'bg-yellow-500 text-white shadow-lg',
      'not-started': 'bg-gray-500 text-white shadow-lg',
      'needs-changes': 'bg-red-500 text-white shadow-lg',
      paused: 'bg-orange-500 text-white shadow-lg',
      cancelled: 'bg-red-600 text-white shadow-lg',
    };
    return statusMap[status] || 'bg-gray-500 text-white shadow-lg';
  }

  /**
   * Get enhanced CSS classes for priority badges
   */
  private getEnhancedPriorityClasses(priority: string): string {
    const priorityMap: Record<string, string> = {
      Critical: 'bg-red-500 text-white shadow-lg',
      High: 'bg-orange-500 text-white shadow-lg',
      Medium: 'bg-yellow-500 text-white shadow-lg',
      Low: 'bg-green-500 text-white shadow-lg',
    };
    return priorityMap[priority] || 'bg-gray-500 text-white shadow-lg';
  }

  /**
   * Get status icons
   */
  private getStatusIcon(status: string): string {
    const iconMap: Record<string, string> = {
      completed: 'fas fa-check-circle',
      'in-progress': 'fas fa-play-circle',
      'needs-review': 'fas fa-eye',
      'not-started': 'fas fa-pause-circle',
      'needs-changes': 'fas fa-exclamation-circle',
      paused: 'fas fa-pause',
      cancelled: 'fas fa-times-circle',
    };
    return iconMap[status] || 'fas fa-question-circle';
  }

  /**
   * Get priority icons
   */
  private getPriorityIcon(priority: string): string {
    const iconMap: Record<string, string> = {
      Critical: 'fas fa-exclamation-triangle',
      High: 'fas fa-arrow-up',
      Medium: 'fas fa-minus',
      Low: 'fas fa-arrow-down',
    };
    return iconMap[priority] || 'fas fa-minus';
  }

  /**
   * Escape HTML characters for security
   */
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

  /**
   * Format date strings for display
   */
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
