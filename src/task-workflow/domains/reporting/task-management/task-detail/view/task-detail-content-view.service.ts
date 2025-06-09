import { Injectable, Logger } from '@nestjs/common';
import { TaskDetailData } from '../../../shared/types/report-data.types';

/**
 * Task Detail Content View Service (Enhanced)
 *
 * Focused service for generating modern, polished main content sections of task detail reports.
 * Enhanced to match the visual quality of the interactive dashboard with better visual hierarchy,
 * enhanced card design, progress visualization, and improved data presentation.
 * Handles description, implementation plans, subtasks, and delegation history.
 */
@Injectable()
export class TaskDetailContentViewService {
  private readonly logger = new Logger(TaskDetailContentViewService.name);

  /**
   * Generate enhanced task description section with modern card design
   */
  generateDescription(description: TaskDetailData['description']): string {
    if (!description) return '';

    return `
    <div class="bg-white rounded-xl card-shadow card-hover p-6 mb-8">
        <div class="flex items-center mb-6">
            <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                <i class="fas fa-file-alt text-purple-600"></i>
            </div>
            <h2 class="text-xl font-semibold text-gray-900">Description</h2>
        </div>
        <div class="space-y-6">
            ${
              description.description
                ? `
            <div class="bg-gray-50 rounded-lg p-4">
                <h3 class="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <i class="fas fa-align-left mr-2 text-gray-500"></i>
                    Overview
                </h3>
                <p class="text-sm text-gray-900 leading-relaxed">${this.escapeHtml(description.description)}</p>
            </div>
            `
                : ''
            }
            ${
              description.businessRequirements
                ? `
            <div class="bg-blue-50 rounded-lg p-4">
                <h3 class="text-sm font-semibold text-blue-700 mb-2 flex items-center">
                    <i class="fas fa-briefcase mr-2 text-blue-500"></i>
                    Business Requirements
                </h3>
                <p class="text-sm text-gray-900 leading-relaxed">${this.escapeHtml(description.businessRequirements)}</p>
            </div>
            `
                : ''
            }
            ${
              description.technicalRequirements
                ? `
            <div class="bg-green-50 rounded-lg p-4">
                <h3 class="text-sm font-semibold text-green-700 mb-2 flex items-center">
                    <i class="fas fa-cogs mr-2 text-green-500"></i>
                    Technical Requirements
                </h3>
                <p class="text-sm text-gray-900 leading-relaxed">${this.escapeHtml(description.technicalRequirements)}</p>
            </div>
            `
                : ''
            }
            ${
              description.acceptanceCriteria &&
              description.acceptanceCriteria.length > 0
                ? `
            <div class="bg-yellow-50 rounded-lg p-4">
                <h3 class="text-sm font-semibold text-yellow-700 mb-3 flex items-center">
                    <i class="fas fa-check-square mr-2 text-yellow-500"></i>
                    Acceptance Criteria
                </h3>
                <div class="space-y-2">
                    ${description.acceptanceCriteria
                      .map(
                        (criteria, index) => `
                    <div class="flex items-start space-x-3">
                        <div class="w-6 h-6 bg-yellow-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span class="text-xs font-semibold text-yellow-800">${index + 1}</span>
                        </div>
                        <p class="text-sm text-gray-900 leading-relaxed">${this.escapeHtml(criteria)}</p>
                    </div>
                    `,
                      )
                      .join('')}
                </div>
            </div>
            `
                : ''
            }
        </div>
    </div>`;
  }

  /**
   * Generate enhanced implementation plans section with modern design
   */
  generateImplementationPlans(
    plans: TaskDetailData['implementationPlans'],
  ): string {
    if (!plans || plans.length === 0) return '';

    return `
    <div class="bg-white rounded-xl card-shadow card-hover p-6 mb-8">
        <div class="flex items-center mb-6">
            <div class="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                <i class="fas fa-project-diagram text-indigo-600"></i>
            </div>
            <h2 class="text-xl font-semibold text-gray-900">Implementation Plans</h2>
            <span class="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                ${plans.length} plan${plans.length !== 1 ? 's' : ''}
            </span>
        </div>
        <div class="space-y-6">
            ${plans
              .map(
                (plan, index) => `
            <div class="border border-gray-200 rounded-xl p-6 hover:border-indigo-300 transition-colors">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-semibold text-gray-900 flex items-center">
                        <div class="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center mr-3">
                            <span class="text-white text-sm font-bold">${index + 1}</span>
                        </div>
                        Plan #${plan.id}
                    </h3>
                    <div class="flex items-center text-xs text-gray-500">
                        <i class="fas fa-user mr-1"></i>
                        ${this.escapeHtml(plan.createdBy)}
                        <span class="mx-2">•</span>
                        <i class="fas fa-calendar mr-1"></i>
                        ${this.formatDate(plan.createdAt)}
                    </div>
                </div>
                
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    ${
                      plan.overview
                        ? `
                    <div class="bg-blue-50 rounded-lg p-4">
                        <h4 class="text-sm font-semibold text-blue-700 mb-2 flex items-center">
                            <i class="fas fa-eye mr-2 text-blue-500"></i>
                            Overview
                        </h4>
                        <p class="text-sm text-gray-900">${this.escapeHtml(plan.overview)}</p>
                    </div>
                    `
                        : ''
                    }
                    
                    ${
                      plan.approach
                        ? `
                    <div class="bg-green-50 rounded-lg p-4">
                        <h4 class="text-sm font-semibold text-green-700 mb-2 flex items-center">
                            <i class="fas fa-route mr-2 text-green-500"></i>
                            Approach
                        </h4>
                        <p class="text-sm text-gray-900">${this.escapeHtml(plan.approach)}</p>
                    </div>
                    `
                        : ''
                    }
                </div>
                
                ${
                  plan.technicalDecisions
                    ? `
                <div class="mt-4 bg-gray-50 rounded-lg p-4">
                    <h4 class="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <i class="fas fa-code mr-2 text-gray-500"></i>
                        Technical Decisions
                    </h4>
                    <div class="bg-white rounded-lg p-3 border border-gray-200">
                        <pre class="text-xs text-gray-900 whitespace-pre-wrap overflow-x-auto">${JSON.stringify(plan.technicalDecisions, null, 2)}</pre>
                    </div>
                </div>
                `
                    : ''
                }
                
                ${
                  plan.filesToModify && plan.filesToModify.length > 0
                    ? `
                <div class="mt-4 bg-orange-50 rounded-lg p-4">
                    <h4 class="text-sm font-semibold text-orange-700 mb-3 flex items-center">
                        <i class="fas fa-file-code mr-2 text-orange-500"></i>
                        Files to Modify (${plan.filesToModify.length})
                    </h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                        ${plan.filesToModify
                          .map(
                            (file) => `
                        <div class="bg-white rounded-lg p-2 border border-orange-200 text-xs font-mono text-gray-700 flex items-center">
                            <i class="fas fa-file mr-2 text-orange-400"></i>
                            ${this.escapeHtml(file)}
                        </div>
                        `,
                          )
                          .join('')}
                    </div>
                </div>
                `
                    : ''
                }
            </div>
            `,
              )
              .join('')}
        </div>
    </div>`;
  }

  /**
   * Generate enhanced subtasks section with progress visualization
   */
  generateSubtasks(subtasks: TaskDetailData['subtasks']): string {
    if (!subtasks || subtasks.length === 0) return '';

    // Group subtasks by batch
    const batchGroups = subtasks.reduce(
      (groups, subtask) => {
        const batchKey = subtask.batchId || 'default';
        if (!groups[batchKey]) {
          groups[batchKey] = {
            batchId: batchKey,
            batchTitle: subtask.batchTitle || 'Default Batch',
            subtasks: [],
          };
        }
        groups[batchKey].subtasks.push(subtask);
        return groups;
      },
      {} as Record<
        string,
        { batchId: string; batchTitle: string; subtasks: typeof subtasks }
      >,
    );

    return `
    <div class="bg-white rounded-xl card-shadow card-hover p-6 mb-8">
        <div class="flex items-center mb-6">
            <div class="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mr-3">
                <i class="fas fa-list-check text-emerald-600"></i>
            </div>
            <h2 class="text-xl font-semibold text-gray-900">Implementation Subtasks</h2>
            <span class="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                ${subtasks.length} subtask${subtasks.length !== 1 ? 's' : ''}
            </span>
        </div>
        <div class="space-y-8">
            ${Object.values(batchGroups)
              .map((batch) => {
                const completedCount = batch.subtasks.filter(
                  (s) => s.status === 'completed',
                ).length;
                const progressPercentage = Math.round(
                  (completedCount / batch.subtasks.length) * 100,
                );

                return `
            <div class="border border-gray-200 rounded-xl p-6 hover:border-emerald-300 transition-colors">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-semibold text-gray-900 flex items-center">
                        <div class="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center mr-3">
                            <i class="fas fa-layer-group text-white text-sm"></i>
                        </div>
                        ${this.escapeHtml(batch.batchTitle)}
                    </h3>
                    <div class="text-right">
                        <div class="text-sm font-semibold text-gray-900">${completedCount}/${batch.subtasks.length} completed</div>
                        <div class="text-xs text-gray-500">${progressPercentage}% progress</div>
                    </div>
                </div>
                
                <!-- Progress Bar -->
                <div class="mb-6">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm font-medium text-gray-700">Batch Progress</span>
                        <span class="text-sm font-semibold text-emerald-600">${progressPercentage}%</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-3">
                        <div class="progress-bar h-3 rounded-full transition-all duration-300" style="width: ${progressPercentage}%"></div>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    ${batch.subtasks
                      .sort((a, b) => a.sequenceNumber - b.sequenceNumber)
                      .map(
                        (subtask) => `
                    <div class="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                        <div class="flex items-start justify-between mb-3">
                            <div class="flex items-start space-x-3">
                                <div class="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${this.getSubtaskStatusClasses(subtask.status)}">
                                    <i class="${this.getSubtaskStatusIcon(subtask.status)} text-xs"></i>
                                </div>
                                <div class="flex-1">
                                    <h4 class="text-sm font-semibold text-gray-900 mb-1">${this.escapeHtml(subtask.name)}</h4>
                                    <p class="text-xs text-gray-600 leading-relaxed">${this.escapeHtml(subtask.description)}</p>
                                </div>
                            </div>
                            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${this.getEnhancedStatusClasses(subtask.status)} ml-2">
                                ${subtask.status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                            </span>
                        </div>
                        <div class="flex items-center justify-between text-xs text-gray-500">
                            <span class="flex items-center">
                                <i class="fas fa-sort-numeric-up mr-1"></i>
                                Sequence ${subtask.sequenceNumber}
                            </span>
                            <span class="flex items-center">
                                <i class="fas fa-layer-group mr-1"></i>
                                ${this.escapeHtml(subtask.batchId)}
                            </span>
                        </div>
                    </div>
                    `,
                      )
                      .join('')}
                </div>
            </div>
            `;
              })
              .join('')}
        </div>
    </div>`;
  }

  /**
   * Generate enhanced delegation history section
   */
  generateDelegationHistory(
    delegations: TaskDetailData['delegationHistory'],
  ): string {
    if (!delegations || delegations.length === 0) {
      return `
      <div class="bg-white rounded-xl card-shadow card-hover p-6 mb-8">
          <div class="flex items-center mb-6">
              <div class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                  <i class="fas fa-exchange-alt text-gray-400"></i>
              </div>
              <h2 class="text-xl font-semibold text-gray-900">Delegation History</h2>
          </div>
          <div class="text-center py-8">
              <i class="fas fa-inbox text-gray-300 text-4xl mb-4"></i>
              <p class="text-gray-500">No delegation history available for this task.</p>
          </div>
      </div>`;
    }

    return `
    <div class="bg-white rounded-xl card-shadow card-hover p-6 mb-8">
        <div class="flex items-center mb-6">
            <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <i class="fas fa-exchange-alt text-blue-600"></i>
            </div>
            <h2 class="text-xl font-semibold text-gray-900">Delegation History</h2>
            <span class="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                ${delegations.length} delegation${delegations.length !== 1 ? 's' : ''}
            </span>
        </div>
        <div class="space-y-4">
            ${delegations
              .map(
                (delegation, index) => `
            <div class="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                        <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            <span class="text-white text-xs font-bold">${index + 1}</span>
                        </div>
                        <div>
                                                         <div class="flex items-center space-x-2 text-sm">
                                 <span class="font-semibold text-gray-900">${this.escapeHtml(delegation.fromMode)}</span>
                                 <i class="fas fa-arrow-right text-gray-400"></i>
                                 <span class="font-semibold text-gray-900">${this.escapeHtml(delegation.toMode)}</span>
                             </div>
                            <div class="text-xs text-gray-500 mt-1">
                                ${this.formatDate(delegation.delegationTimestamp)}
                            </div>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-xs text-gray-500">Duration</div>
                        <div class="text-sm font-semibold text-gray-900">
                            ${delegation.duration ? `${Math.round(delegation.duration)} hours` : 'N/A'}
                        </div>
                    </div>
                </div>
             
            </div>
            `,
              )
              .join('')}
        </div>
    </div>`;
  }

  /**
   * Get enhanced CSS classes for subtask status indicators
   */
  private getSubtaskStatusClasses(status: string): string {
    const statusMap: Record<string, string> = {
      completed: 'bg-green-500 text-white',
      'in-progress': 'bg-blue-500 text-white',
      'not-started': 'bg-gray-400 text-white',
      'needs-changes': 'bg-red-500 text-white',
    };
    return statusMap[status] || 'bg-gray-400 text-white';
  }

  /**
   * Get subtask status icons
   */
  private getSubtaskStatusIcon(status: string): string {
    const iconMap: Record<string, string> = {
      completed: 'fas fa-check',
      'in-progress': 'fas fa-play',
      'not-started': 'fas fa-pause',
      'needs-changes': 'fas fa-exclamation',
    };
    return iconMap[status] || 'fas fa-question';
  }

  /**
   * Get enhanced CSS classes for status badges
   */
  private getEnhancedStatusClasses(status: string): string {
    const statusMap: Record<string, string> = {
      completed: 'bg-green-100 text-green-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      'not-started': 'bg-gray-100 text-gray-800',
      'needs-changes': 'bg-red-100 text-red-800',
    };
    return statusMap[status] || 'bg-gray-100 text-gray-800';
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
