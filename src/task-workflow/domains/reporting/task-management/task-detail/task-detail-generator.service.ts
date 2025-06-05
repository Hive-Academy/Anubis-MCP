import { Injectable, Logger } from '@nestjs/common';
import { TaskDetailData } from '../../shared/types/report-data.types';

/**
 * Task Detail Generator Service
 *
 * This service is focused solely on generating detailed task reports
 * following the Single Responsibility Principle and domain architecture.
 */
@Injectable()
export class TaskDetailGeneratorService {
  private readonly logger = new Logger(TaskDetailGeneratorService.name);

  /**
   * Generate detailed task report HTML using type-safe data
   */
  generateTaskDetail(data: TaskDetailData): string {
    this.logger.log('Generating type-safe task detail HTML');
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
        ${this.generateTaskOverview(data.task)}
        ${data.description ? this.generateDescription(data.description) : ''}
        ${data.codebaseAnalysis ? this.generateCodebaseAnalysis(data.codebaseAnalysis) : ''}
        ${data.implementationPlans ? this.generateImplementationPlans(data.implementationPlans) : ''}
        ${data.subtasks ? this.generateSubtasks(data.subtasks) : ''}
        ${data.delegationHistory ? this.generateDelegationHistory(data.delegationHistory) : ''}
        ${this.generateFooter(data.metadata)}
    </div>
</body>
</html>`;
  }

  private generateHead(taskName: string): string {
    return `
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(taskName)} - Task Detail</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />`;
  }

  private generateHeader(task: TaskDetailData['task']): string {
    return `
    <header class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
                <div class="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    <i class="fas fa-tasks text-white text-xl"></i>
                </div>
                <div>
                    <h1 class="text-2xl font-bold text-gray-900">${this.escapeHtml(task.name)}</h1>
                    <p class="text-sm text-gray-600">${this.escapeHtml(task.taskId)}</p>
                    ${task.taskSlug ? `<p class="text-xs text-blue-600">${this.escapeHtml(task.taskSlug)}</p>` : ''}
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

  private generateTaskOverview(task: TaskDetailData['task']): string {
    return `
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Task Overview</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
                <label class="block text-sm font-medium text-gray-700">Owner</label>
                <p class="mt-1 text-sm text-gray-900">${task.owner}</p>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Created</label>
                <p class="mt-1 text-sm text-gray-900">${this.formatDate(task.createdAt.toISOString())}</p>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Git Branch</label>
                <p class="mt-1 text-sm text-gray-900">${task.gitBranch || 'Not specified'}</p>
            </div>
        </div>
    </div>`;
  }

  private generateDescription(
    description: TaskDetailData['description'],
  ): string {
    if (!description) return '';

    return `
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Description</h2>
        <div class="space-y-4">
            ${
              description.description
                ? `
            <div>
                <h3 class="text-sm font-medium text-gray-700">Description</h3>
                <p class="mt-1 text-sm text-gray-900">${this.escapeHtml(description.description)}</p>
            </div>
            `
                : ''
            }
            ${
              description.businessRequirements
                ? `
            <div>
                <h3 class="text-sm font-medium text-gray-700">Business Requirements</h3>
                <p class="mt-1 text-sm text-gray-900">${this.escapeHtml(description.businessRequirements)}</p>
            </div>
            `
                : ''
            }
            ${
              description.technicalRequirements
                ? `
            <div>
                <h3 class="text-sm font-medium text-gray-700">Technical Requirements</h3>
                <p class="mt-1 text-sm text-gray-900">${this.escapeHtml(description.technicalRequirements)}</p>
            </div>
            `
                : ''
            }
            ${
              description.acceptanceCriteria &&
              description.acceptanceCriteria.length > 0
                ? `
            <div>
                <h3 class="text-sm font-medium text-gray-700">Acceptance Criteria</h3>
                <ul class="mt-1 list-disc list-inside text-sm text-gray-900">
                    ${description.acceptanceCriteria.map((criteria) => `<li>${this.escapeHtml(criteria)}</li>`).join('')}
                </ul>
            </div>
            `
                : ''
            }
        </div>
    </div>`;
  }

  private generateCodebaseAnalysis(
    analysis: TaskDetailData['codebaseAnalysis'],
  ): string {
    if (!analysis) return '';

    return `
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Codebase Analysis</h2>
        <div class="space-y-6">
            ${
              analysis.architectureFindings
                ? `
            <div>
                <h3 class="text-sm font-medium text-gray-700 mb-2">Architecture Findings</h3>
                <div class="bg-gray-50 rounded-lg p-4">
                    <pre class="text-sm text-gray-900 whitespace-pre-wrap">${JSON.stringify(analysis.architectureFindings, null, 2)}</pre>
                </div>
            </div>
            `
                : ''
            }
            ${
              analysis.problemsIdentified
                ? `
            <div>
                <h3 class="text-sm font-medium text-gray-700 mb-2">Problems Identified</h3>
                <div class="bg-red-50 rounded-lg p-4">
                    <pre class="text-sm text-red-900 whitespace-pre-wrap">${JSON.stringify(analysis.problemsIdentified, null, 2)}</pre>
                </div>
            </div>
            `
                : ''
            }
            ${
              analysis.implementationContext
                ? `
            <div>
                <h3 class="text-sm font-medium text-gray-700 mb-2">Implementation Context</h3>
                <div class="bg-blue-50 rounded-lg p-4">
                    <pre class="text-sm text-blue-900 whitespace-pre-wrap">${JSON.stringify(analysis.implementationContext, null, 2)}</pre>
                </div>
            </div>
            `
                : ''
            }
        </div>
    </div>`;
  }

  private generateImplementationPlans(
    plans: TaskDetailData['implementationPlans'],
  ): string {
    if (!plans || plans.length === 0) return '';

    return `
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Implementation Plans</h2>
        <div class="space-y-6">
            ${plans
              .map(
                (plan) => `
            <div class="border border-gray-200 rounded-lg p-4">
                <h3 class="text-md font-medium text-gray-900 mb-2">Plan #${plan.id}</h3>
                ${plan.overview ? `<p class="text-sm text-gray-700 mb-2"><strong>Overview:</strong> ${this.escapeHtml(plan.overview)}</p>` : ''}
                ${plan.approach ? `<p class="text-sm text-gray-700 mb-2"><strong>Approach:</strong> ${this.escapeHtml(plan.approach)}</p>` : ''}
                ${plan.createdBy ? `<p class="text-sm text-gray-500">Created by: ${this.escapeHtml(plan.createdBy)}</p>` : ''}
            </div>
            `,
              )
              .join('')}
        </div>
    </div>`;
  }

  private generateSubtasks(subtasks: TaskDetailData['subtasks']): string {
    if (!subtasks || subtasks.length === 0) return '';

    return `
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Subtasks</h2>
        <div class="space-y-4">
            ${subtasks
              .map(
                (subtask) => `
            <div class="border border-gray-200 rounded-lg p-4">
                <div class="flex items-center justify-between mb-2">
                    <h3 class="text-sm font-medium text-gray-900">${this.escapeHtml(subtask.name)}</h3>
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${this.getStatusClasses(subtask.status)}">
                        ${subtask.status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                    </span>
                </div>
                <p class="text-sm text-gray-700">${this.escapeHtml(subtask.description)}</p>
                <div class="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                    <span>Sequence: ${subtask.sequenceNumber}</span>
                    ${subtask.batchId ? `<span>Batch: ${this.escapeHtml(subtask.batchId)}</span>` : ''}
                </div>
            </div>
            `,
              )
              .join('')}
        </div>
    </div>`;
  }

  private generateDelegationHistory(
    delegations: TaskDetailData['delegationHistory'],
  ): string {
    if (!delegations || delegations.length === 0) return '';

    return `
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Delegation History</h2>
        <div class="space-y-4">
            ${delegations
              .map(
                (delegation) => `
            <div class="border border-gray-200 rounded-lg p-4">
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center space-x-2">
                        <span class="text-sm font-medium text-gray-900">${delegation.fromMode}</span>
                        <i class="fas fa-arrow-right text-gray-400"></i>
                        <span class="text-sm font-medium text-gray-900">${delegation.toMode}</span>
                    </div>
                    ${
                      delegation.success !== undefined
                        ? `
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${delegation.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                        ${delegation.success ? 'Success' : 'Failed'}
                    </span>
                    `
                        : ''
                    }
                </div>
                <p class="text-sm text-gray-500">${this.formatDate(delegation.delegationTimestamp)}</p>
                ${delegation.duration ? `<p class="text-sm text-gray-500">Duration: ${delegation.duration}h</p>` : ''}
            </div>
            `,
              )
              .join('')}
        </div>
    </div>`;
  }

  private generateFooter(metadata: TaskDetailData['metadata']): string {
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
