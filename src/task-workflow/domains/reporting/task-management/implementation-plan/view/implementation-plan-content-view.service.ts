import { Injectable, Logger } from '@nestjs/common';
import { ImplementationPlanReportData } from '../../../shared/types/report-data.types';

/**
 * Implementation Plan Content View Service
 *
 * Focused service for generating modern, polished main content sections of implementation plan reports.
 * Handles implementation plan details, subtask batches, strategic guidance, and technical decisions
 * with enhanced visual hierarchy and card-based design.
 *
 * Architecture:
 * - Pure presentation logic - NO data access services
 * - All data received from parent services via method parameters
 * - Follows clean architecture principles with clear separation of concerns
 */
@Injectable()
export class ImplementationPlanContentViewService {
  private readonly logger = new Logger(
    ImplementationPlanContentViewService.name,
  );

  /**
   * Generate implementation plan overview section with enhanced design
   */
  generatePlanOverview(
    plan: ImplementationPlanReportData['implementationPlan'],
  ): string {
    if (!plan) return '';

    return `
    <div class="bg-white rounded-xl card-shadow card-hover p-6 mb-8">
        <div class="flex items-center mb-6">
            <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                <i class="fas fa-clipboard-list text-purple-600"></i>
            </div>
            <h2 class="text-xl font-semibold text-gray-900">Implementation Plan Overview</h2>
        </div>
        <div class="space-y-6">
            ${
              plan.overview
                ? `
            <div class="bg-purple-50 rounded-lg p-4">
                <h3 class="text-sm font-semibold text-purple-700 mb-2 flex items-center">
                    <i class="fas fa-eye mr-2 text-purple-500"></i>
                    Overview
                </h3>
                <p class="text-sm text-gray-900 leading-relaxed">${this.escapeHtml(plan.overview)}</p>
            </div>
            `
                : ''
            }
            ${
              plan.approach
                ? `
            <div class="bg-blue-50 rounded-lg p-4">
                <h3 class="text-sm font-semibold text-blue-700 mb-2 flex items-center">
                    <i class="fas fa-route mr-2 text-blue-500"></i>
                    Approach
                </h3>
                <p class="text-sm text-gray-900 leading-relaxed">${this.escapeHtml(plan.approach)}</p>
            </div>
            `
                : ''
            }
            ${
              plan.architecturalRationale
                ? `
            <div class="bg-green-50 rounded-lg p-4">
                <h3 class="text-sm font-semibold text-green-700 mb-2 flex items-center">
                    <i class="fas fa-building mr-2 text-green-500"></i>
                    Architectural Rationale
                </h3>
                <p class="text-sm text-gray-900 leading-relaxed">${this.escapeHtml(plan.architecturalRationale)}</p>
            </div>
            `
                : ''
            }
            ${
              plan.filesToModify && plan.filesToModify.length > 0
                ? `
            <div class="bg-orange-50 rounded-lg p-4">
                <h3 class="text-sm font-semibold text-orange-700 mb-3 flex items-center">
                    <i class="fas fa-file-code mr-2 text-orange-500"></i>
                    Files to Modify (${plan.filesToModify.length})
                </h3>
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
    </div>`;
  }

  /**
   * Generate technical decisions section with enhanced visualization
   */
  generateTechnicalDecisions(
    plan: ImplementationPlanReportData['implementationPlan'],
  ): string {
    if (!plan?.technicalDecisions) return '';

    return `
    <div class="bg-white rounded-xl card-shadow card-hover p-6 mb-8">
        <div class="flex items-center mb-6">
            <div class="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                <i class="fas fa-code text-indigo-600"></i>
            </div>
            <h2 class="text-xl font-semibold text-gray-900">Technical Decisions</h2>
        </div>
        <div class="bg-gray-50 rounded-lg p-4">
            <div class="bg-white rounded-lg p-4 border border-gray-200">
                <pre class="text-sm text-gray-900 whitespace-pre-wrap overflow-x-auto">${this.formatTechnicalDecisions(plan.technicalDecisions)}</pre>
            </div>
        </div>
    </div>`;
  }

  /**
   * Generate strategic guidance section
   */
  generateStrategicGuidance(
    plan: ImplementationPlanReportData['implementationPlan'],
  ): string {
    if (!plan?.strategicGuidance) return '';

    return `
    <div class="bg-white rounded-xl card-shadow card-hover p-6 mb-8">
        <div class="flex items-center mb-6">
            <div class="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mr-3">
                <i class="fas fa-compass text-emerald-600"></i>
            </div>
            <h2 class="text-xl font-semibold text-gray-900">Strategic Guidance</h2>
        </div>
        <div class="bg-emerald-50 rounded-lg p-4">
            <div class="bg-white rounded-lg p-4 border border-emerald-200">
                <pre class="text-sm text-gray-900 whitespace-pre-wrap overflow-x-auto">${this.formatStrategicContent(plan.strategicGuidance)}</pre>
            </div>
        </div>
    </div>`;
  }

  /**
   * Generate subtask batches section with enhanced batch visualization
   */
  generateSubtaskBatches(
    batches: ImplementationPlanReportData['subtaskBatches'],
  ): string {
    if (!batches || batches.length === 0) return '';

    return `
    <div class="bg-white rounded-xl card-shadow card-hover p-6 mb-8">
        <div class="flex items-center mb-6">
            <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <i class="fas fa-layer-group text-blue-600"></i>
            </div>
            <h2 class="text-xl font-semibold text-gray-900">Implementation Batches</h2>
            <span class="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                ${batches.length} batch${batches.length !== 1 ? 'es' : ''}
            </span>
        </div>
        <div class="space-y-6">
            ${batches
              .map(
                (batch, batchIndex) => `
            <div class="border border-gray-200 rounded-xl p-6 hover:border-blue-300 transition-colors">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-semibold text-gray-900 flex items-center">
                        <div class="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                            <span class="text-white text-sm font-bold">${batchIndex + 1}</span>
                        </div>
                        ${this.escapeHtml(batch.batchTitle || `Batch ${batch.batchId}`)}
                    </h3>
                    <div class="flex items-center space-x-4">
                        <span class="text-xs text-gray-500 flex items-center">
                            <i class="fas fa-hashtag mr-1"></i>
                            ${this.escapeHtml(batch.batchId)}
                        </span>
                        <span class="text-xs text-gray-500 flex items-center">
                            <i class="fas fa-tasks mr-1"></i>
                            ${batch.subtasks.length} task${batch.subtasks.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                </div>
                
                ${this.generateBatchProgress(batch.subtasks)}
                
                <div class="space-y-3 mt-4">
                    ${batch.subtasks
                      .map(
                        (subtask, _subtaskIndex) => `
                    <div class="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                        <div class="flex items-center justify-between mb-2">
                            <div class="flex items-center space-x-3">
                                <div class="w-6 h-6 rounded-full flex items-center justify-center ${this.getSubtaskStatusClasses(subtask.status)}">
                                    <i class="${this.getSubtaskStatusIcon(subtask.status)} text-xs"></i>
                                </div>
                                <span class="text-sm font-medium text-gray-900">${subtask.sequenceNumber}. ${this.escapeHtml(subtask.name)}</span>
                            </div>
                            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${this.getSubtaskStatusClasses(subtask.status)}">
                                ${subtask.status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                            </span>
                        </div>
                        <p class="text-sm text-gray-600 ml-9">${this.escapeHtml(subtask.description)}</p>
                        ${
                          subtask.strategicGuidance
                            ? `
                        <div class="mt-3 ml-9 bg-blue-50 rounded p-2">
                            <h5 class="text-xs font-semibold text-blue-700 mb-1">Strategic Guidance</h5>
                            <p class="text-xs text-gray-700">${this.formatStrategicContent(subtask.strategicGuidance)}</p>
                        </div>
                        `
                            : ''
                        }
                        ${
                          subtask.successCriteria &&
                          subtask.successCriteria.length > 0
                            ? `
                        <div class="mt-3 ml-9">
                            <h5 class="text-xs font-semibold text-gray-700 mb-2">Success Criteria</h5>
                            <div class="space-y-1">
                                ${subtask.successCriteria
                                  .map(
                                    (criteria, criteriaIndex) => `
                                <div class="flex items-start space-x-2">
                                    <div class="w-4 h-4 bg-green-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span class="text-xs font-semibold text-green-800">${criteriaIndex + 1}</span>
                                    </div>
                                    <p class="text-xs text-gray-700">${this.escapeHtml(criteria)}</p>
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
            </div>
            `,
              )
              .join('')}
        </div>
    </div>`;
  }

  /**
   * Generate batch progress visualization
   */
  private generateBatchProgress(subtasks: any[]): string {
    const completed = subtasks.filter((s) => s.status === 'completed').length;
    const inProgress = subtasks.filter(
      (s) => s.status === 'in-progress',
    ).length;
    const notStarted = subtasks.filter(
      (s) => s.status === 'not-started',
    ).length;
    const total = subtasks.length;
    const completionPercentage =
      total > 0 ? Math.round((completed / total) * 100) : 0;

    return `
    <div class="bg-white rounded-lg p-4 border border-gray-200">
        <div class="flex items-center justify-between mb-3">
            <h4 class="text-sm font-semibold text-gray-700">Batch Progress</h4>
            <span class="text-sm font-semibold text-gray-900">${completionPercentage}%</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2 mb-3">
            <div class="progress-bar h-2 rounded-full" style="width: ${completionPercentage}%"></div>
        </div>
        <div class="grid grid-cols-3 gap-4 text-xs">
            <div class="text-center">
                <div class="font-semibold text-green-600">${completed}</div>
                <div class="text-gray-500">Completed</div>
            </div>
            <div class="text-center">
                <div class="font-semibold text-blue-600">${inProgress}</div>
                <div class="text-gray-500">In Progress</div>
            </div>
            <div class="text-center">
                <div class="font-semibold text-gray-600">${notStarted}</div>
                <div class="text-gray-500">Not Started</div>
            </div>
        </div>
    </div>`;
  }

  /**
   * Format technical decisions for display
   */
  private formatTechnicalDecisions(decisions: any): string {
    if (typeof decisions === 'string') {
      return decisions;
    }
    return JSON.stringify(decisions, null, 2);
  }

  /**
   * Format strategic content for display
   */
  private formatStrategicContent(content: any): string {
    if (typeof content === 'string') {
      return content;
    }
    return JSON.stringify(content, null, 2);
  }

  /**
   * Get subtask status classes for styling
   */
  private getSubtaskStatusClasses(status: string): string {
    const statusClasses = {
      'not-started': 'bg-gray-100 text-gray-600',
      'in-progress': 'bg-blue-100 text-blue-600',
      completed: 'bg-green-100 text-green-600',
      'needs-changes': 'bg-red-100 text-red-600',
    };
    return (
      statusClasses[status as keyof typeof statusClasses] ||
      statusClasses['not-started']
    );
  }

  /**
   * Get subtask status icon
   */
  private getSubtaskStatusIcon(status: string): string {
    const statusIcons = {
      'not-started': 'fas fa-circle',
      'in-progress': 'fas fa-spinner',
      completed: 'fas fa-check',
      'needs-changes': 'fas fa-exclamation-triangle',
    };
    return (
      statusIcons[status as keyof typeof statusIcons] ||
      statusIcons['not-started']
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
}
