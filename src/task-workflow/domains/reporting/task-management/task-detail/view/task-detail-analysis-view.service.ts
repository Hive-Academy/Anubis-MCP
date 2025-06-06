import { Injectable, Logger } from '@nestjs/common';
import { TaskDetailData } from '../../../shared/types/report-data.types';

/**
 * Task Detail Analysis View Service (Enhanced)
 *
 * Focused service for generating modern, polished analysis and metrics sections of task detail reports.
 * Enhanced to match the visual quality of the interactive dashboard with better visual hierarchy,
 * enhanced card design, and improved data presentation.
 * Handles codebase analysis, quality metrics, and technical insights.
 */
@Injectable()
export class TaskDetailAnalysisViewService {
  private readonly logger = new Logger(TaskDetailAnalysisViewService.name);

  /**
   * Generate enhanced codebase analysis section with improved UX architecture
   */
  generateCodebaseAnalysis(
    analysis: TaskDetailData['codebaseAnalysis'],
  ): string {
    if (!analysis) return '';

    return `
    <div class="bg-white rounded-xl card-shadow card-hover p-6 mb-8">
        <div class="flex items-center justify-between mb-6">
            <div class="flex items-center">
                <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                    <i class="fas fa-code text-purple-600"></i>
                </div>
                <div>
                    <h2 class="text-xl font-semibold text-gray-900">Codebase Analysis</h2>
                    <p class="text-sm text-gray-500">Technical insights and architectural findings</p>
                </div>
            </div>
            <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                <i class="fas fa-user mr-1"></i>
                ${this.escapeHtml(analysis.analyzedBy)}
            </span>
        </div>

        <!-- Key Insights Summary -->
        ${this.generateKeyInsightsSummary(analysis)}

        <!-- Main Analysis Sections -->
        <div class="space-y-6">
            <!-- Architecture & Technology Stack -->
            ${this.generateArchitectureSection(analysis)}
            
            <!-- Problems & Solutions -->
            ${this.generateProblemsSection(analysis)}
            
            <!-- Implementation Context -->
            ${this.generateImplementationSection(analysis)}
            
            <!-- Quality & Integration -->
            ${this.generateQualitySection(analysis)}
        </div>

        <!-- Files Coverage -->
        ${this.generateFilesCoverage(analysis)}

        <!-- Analysis Metadata -->
        <div class="mt-6 pt-4 border-t border-gray-200">
            <div class="flex items-center justify-between text-xs text-gray-500">
                <span class="flex items-center">
                    <i class="fas fa-calendar mr-1"></i>
                    Analyzed on ${this.formatDate(analysis.analyzedAt)}
                </span>
                <span class="flex items-center">
                    <i class="fas fa-code-branch mr-1"></i>
                    Version 1.0
                </span>
            </div>
        </div>
    </div>`;
  }

  /**
   * Generate key insights summary with visual indicators
   */
  private generateKeyInsightsSummary(
    analysis: TaskDetailData['codebaseAnalysis'],
  ): string {
    if (!analysis) return '';

    const insights = [];

    if (analysis.architectureFindings?.techStack) {
      const techStack = Array.isArray(analysis.architectureFindings.techStack)
        ? analysis.architectureFindings.techStack
        : Object.values(analysis.architectureFindings.techStack);
      insights.push({
        icon: 'fas fa-layer-group',
        label: 'Tech Stack',
        value: `${techStack.length} technologies`,
        color: 'blue',
      });
    }

    if (analysis.problemsIdentified?.codeSmells) {
      const codeSmells = Array.isArray(analysis.problemsIdentified.codeSmells)
        ? analysis.problemsIdentified.codeSmells
        : Object.values(analysis.problemsIdentified.codeSmells);
      insights.push({
        icon: 'fas fa-exclamation-triangle',
        label: 'Issues Found',
        value: `${codeSmells.length} code smells`,
        color: 'red',
      });
    }

    if (analysis.filesCovered) {
      insights.push({
        icon: 'fas fa-folder-open',
        label: 'Files Analyzed',
        value: `${analysis.filesCovered.length} files`,
        color: 'green',
      });
    }

    if (insights.length === 0) return '';

    return `
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        ${insights
          .map(
            (insight) => `
        <div class="bg-${insight.color}-50 rounded-lg p-4 border border-${insight.color}-200">
            <div class="flex items-center">
                <div class="w-8 h-8 bg-${insight.color}-100 rounded-lg flex items-center justify-center mr-3">
                    <i class="${insight.icon} text-${insight.color}-600 text-sm"></i>
                </div>
                <div>
                    <div class="text-sm font-medium text-${insight.color}-900">${insight.value}</div>
                    <div class="text-xs text-${insight.color}-700">${insight.label}</div>
                </div>
            </div>
        </div>
        `,
          )
          .join('')}
    </div>`;
  }

  /**
   * Generate architecture and technology section
   */
  private generateArchitectureSection(
    analysis: TaskDetailData['codebaseAnalysis'],
  ): string {
    if (
      !analysis ||
      (!analysis.architectureFindings && !analysis.technologyStack)
    )
      return '';

    return `
    <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <h3 class="text-lg font-semibold text-blue-900 mb-4 flex items-center">
            <i class="fas fa-sitemap mr-2 text-blue-600"></i>
            Architecture & Technology
        </h3>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            ${
              analysis.architectureFindings
                ? `
            <div>
                <h4 class="text-sm font-semibold text-blue-800 mb-3">Architecture Findings</h4>
                ${this.formatStructuredData(analysis.architectureFindings, 'text-blue-700')}
            </div>
            `
                : ''
            }
            ${
              analysis.technologyStack
                ? `
            <div>
                <h4 class="text-sm font-semibold text-blue-800 mb-3">Technology Stack</h4>
                ${this.formatStructuredData(analysis.technologyStack, 'text-blue-700')}
            </div>
            `
                : ''
            }
        </div>
    </div>`;
  }

  /**
   * Generate problems and solutions section
   */
  private generateProblemsSection(
    analysis: TaskDetailData['codebaseAnalysis'],
  ): string {
    if (!analysis || !analysis.problemsIdentified) return '';

    return `
    <div class="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-6 border border-red-200">
        <h3 class="text-lg font-semibold text-red-900 mb-4 flex items-center">
            <i class="fas fa-exclamation-triangle mr-2 text-red-600"></i>
            Problems Identified
        </h3>
        <div class="space-y-4">
            ${this.formatProblemsData(analysis.problemsIdentified)}
        </div>
    </div>`;
  }

  /**
   * Generate implementation context section
   */
  private generateImplementationSection(
    analysis: TaskDetailData['codebaseAnalysis'],
  ): string {
    if (
      !analysis ||
      (!analysis.implementationContext && !analysis.integrationPoints)
    )
      return '';

    return `
    <div class="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
        <h3 class="text-lg font-semibold text-green-900 mb-4 flex items-center">
            <i class="fas fa-cogs mr-2 text-green-600"></i>
            Implementation Context
        </h3>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            ${
              analysis.implementationContext
                ? `
            <div>
                <h4 class="text-sm font-semibold text-green-800 mb-3">Implementation Details</h4>
                ${this.formatStructuredData(analysis.implementationContext, 'text-green-700')}
            </div>
            `
                : ''
            }
            ${
              analysis.integrationPoints
                ? `
            <div>
                <h4 class="text-sm font-semibold text-green-800 mb-3">Integration Points</h4>
                ${this.formatStructuredData(analysis.integrationPoints, 'text-green-700')}
            </div>
            `
                : ''
            }
        </div>
    </div>`;
  }

  /**
   * Generate quality and assessment section
   */
  private generateQualitySection(
    analysis: TaskDetailData['codebaseAnalysis'],
  ): string {
    if (!analysis || !analysis.qualityAssessment) return '';

    return `
    <div class="bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg p-6 border border-purple-200">
        <h3 class="text-lg font-semibold text-purple-900 mb-4 flex items-center">
            <i class="fas fa-award mr-2 text-purple-600"></i>
            Quality Assessment
        </h3>
        <div class="space-y-4">
            ${this.formatQualityData(analysis.qualityAssessment)}
        </div>
    </div>`;
  }

  /**
   * Generate files coverage section
   */
  private generateFilesCoverage(
    analysis: TaskDetailData['codebaseAnalysis'],
  ): string {
    if (
      !analysis ||
      !analysis.filesCovered ||
      analysis.filesCovered.length === 0
    )
      return '';

    return `
    <div class="mt-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center">
            <i class="fas fa-folder-open mr-2 text-gray-500"></i>
            Files Analyzed (${analysis.filesCovered.length})
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            ${analysis.filesCovered
              .map(
                (file) => `
            <div class="bg-white rounded-lg p-3 border border-gray-200 hover:border-gray-300 transition-colors">
                <div class="flex items-center">
                    <i class="fas fa-file-code mr-2 text-gray-400"></i>
                    <span class="text-xs font-mono text-gray-700 truncate">${this.escapeHtml(file)}</span>
                </div>
            </div>
            `,
              )
              .join('')}
        </div>
    </div>`;
  }

  /**
   * Format problems data with better visual hierarchy
   */
  private formatProblemsData(problems: Record<string, any>): string {
    const entries = Object.entries(problems);

    return entries
      .map(([key, value]) => {
        const formattedKey = key
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, (str) => str.toUpperCase());

        return `
      <div class="bg-white rounded-lg p-4 border border-red-200">
          <h4 class="text-sm font-semibold text-red-800 mb-2 flex items-center">
              <i class="fas fa-bug mr-2 text-red-500"></i>
              ${formattedKey}
          </h4>
          <div class="text-sm text-red-700">
              ${this.formatStructuredData(value, 'text-red-600')}
          </div>
      </div>`;
      })
      .join('');
  }

  /**
   * Format quality data with visual indicators
   */
  private formatQualityData(quality: Record<string, any>): string {
    const entries = Object.entries(quality);

    return entries
      .map(([key, value]) => {
        const formattedKey = key
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, (str) => str.toUpperCase());

        return `
      <div class="bg-white rounded-lg p-4 border border-purple-200">
          <h4 class="text-sm font-semibold text-purple-800 mb-2 flex items-center">
              <i class="fas fa-check-circle mr-2 text-purple-500"></i>
              ${formattedKey}
          </h4>
          <div class="text-sm text-purple-700">
              ${this.formatStructuredData(value, 'text-purple-600')}
          </div>
      </div>`;
      })
      .join('');
  }

  /**
   * Format structured data with improved presentation
   */
  private formatStructuredData(data: any, textColor: string): string {
    if (typeof data === 'string') {
      return `<p class="leading-relaxed">${this.escapeHtml(data)}</p>`;
    }

    if (Array.isArray(data)) {
      return `
        <div class="space-y-2">
            ${data
              .map(
                (item, index) => `
            <div class="flex items-start space-x-2">
                <div class="w-5 h-5 bg-white rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border border-gray-300">
                    <span class="text-xs font-semibold text-gray-600">${index + 1}</span>
                </div>
                <p class="text-sm leading-relaxed">${this.escapeHtml(String(item))}</p>
            </div>
            `,
              )
              .join('')}
        </div>`;
    }

    if (typeof data === 'object' && data !== null) {
      const entries = Object.entries(data);

      if (
        entries.length <= 5 &&
        entries.every(
          ([_, value]) =>
            typeof value === 'string' || typeof value === 'number',
        )
      ) {
        return `
          <div class="space-y-2">
              ${entries
                .map(
                  ([key, value]) => `
              <div class="flex justify-between items-center py-1 border-b border-gray-200 last:border-b-0">
                  <span class="text-sm font-medium">${this.escapeHtml(key)}</span>
                  <span class="text-sm font-semibold ${textColor}">${this.escapeHtml(String(value))}</span>
              </div>
              `,
                )
                .join('')}
          </div>`;
      } else {
        return `
        <div class="bg-gray-100 rounded-lg p-3 border">
            <pre class="text-xs whitespace-pre-wrap overflow-x-auto">${JSON.stringify(data, null, 2)}</pre>
        </div>`;
      }
    }

    return `<p class="leading-relaxed">${this.escapeHtml(String(data))}</p>`;
  }

  /**
   * Generate enhanced quality metrics with modern visualizations
   */
  generateQualityMetrics(
    subtasks: TaskDetailData['subtasks'],
    delegations: TaskDetailData['delegationHistory'],
  ): string {
    const totalSubtasks = subtasks.length;
    const completedSubtasks = subtasks.filter(
      (s) => s.status === 'completed',
    ).length;
    const inProgressSubtasks = subtasks.filter(
      (s) => s.status === 'in-progress',
    ).length;
    const completionRate =
      totalSubtasks > 0
        ? Math.round((completedSubtasks / totalSubtasks) * 100)
        : 0;

    const totalDelegations = delegations.length;
    const successfulDelegations = delegations.filter(
      (d) => d.success === true,
    ).length;
    const delegationSuccessRate =
      totalDelegations > 0
        ? Math.round((successfulDelegations / totalDelegations) * 100)
        : 0;

    return `
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <!-- Progress & Quality Metrics -->
        <div class="bg-white rounded-xl card-shadow card-hover p-6">
            <div class="flex items-center mb-6">
                <div class="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mr-3">
                    <i class="fas fa-chart-line text-emerald-600"></i>
                </div>
                <h2 class="text-xl font-semibold text-gray-900">Progress & Quality Metrics</h2>
            </div>
            <div class="space-y-6">
                <!-- Completion Rate -->
                <div>
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm font-medium text-gray-700">Task Completion</span>
                        <span class="text-sm font-semibold text-emerald-600">${completionRate}%</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-3">
                        <div class="progress-bar h-3 rounded-full transition-all duration-300" style="width: ${completionRate}%"></div>
                    </div>
                    <div class="flex justify-between text-xs text-gray-500 mt-1">
                        <span>${completedSubtasks} completed</span>
                        <span>${totalSubtasks} total</span>
                    </div>
                </div>
                
                <!-- Delegation Success Rate -->
                ${
                  totalDelegations > 0
                    ? `
                <div>
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm font-medium text-gray-700">Delegation Success</span>
                        <span class="text-sm font-semibold text-blue-600">${delegationSuccessRate}%</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-3">
                        <div class="bg-blue-500 h-3 rounded-full transition-all duration-300" style="width: ${delegationSuccessRate}%"></div>
                    </div>
                    <div class="flex justify-between text-xs text-gray-500 mt-1">
                        <span>${successfulDelegations} successful</span>
                        <span>${totalDelegations} total</span>
                    </div>
                </div>
                `
                    : ''
                }
                
                <!-- Status Breakdown -->
                <div class="grid grid-cols-2 gap-4">
                    <div class="bg-green-50 rounded-lg p-3 text-center">
                        <div class="text-lg font-bold text-green-600">${completedSubtasks}</div>
                        <div class="text-xs text-green-700">Completed</div>
                    </div>
                    <div class="bg-blue-50 rounded-lg p-3 text-center">
                        <div class="text-lg font-bold text-blue-600">${inProgressSubtasks}</div>
                        <div class="text-xs text-blue-700">In Progress</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Batch Progress Overview -->
        ${this.generateEnhancedBatchProgress(subtasks)}
    </div>`;
  }

  /**
   * Generate enhanced batch progress with visual indicators
   */
  private generateEnhancedBatchProgress(
    subtasks: TaskDetailData['subtasks'],
  ): string {
    if (!subtasks || subtasks.length === 0) {
      return `
      <div class="bg-white rounded-xl card-shadow card-hover p-6">
          <div class="flex items-center mb-6">
              <div class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                  <i class="fas fa-layer-group text-gray-400"></i>
              </div>
              <h2 class="text-xl font-semibold text-gray-900">Batch Progress</h2>
          </div>
          <div class="text-center py-8">
              <i class="fas fa-inbox text-gray-300 text-4xl mb-4"></i>
              <p class="text-gray-500">No subtasks available for batch analysis.</p>
          </div>
      </div>`;
    }

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
    <div class="bg-white rounded-xl card-shadow card-hover p-6">
        <div class="flex items-center mb-6">
            <div class="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                <i class="fas fa-layer-group text-indigo-600"></i>
            </div>
            <h2 class="text-xl font-semibold text-gray-900">Batch Progress</h2>
            <span class="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                ${Object.keys(batchGroups).length} batch${Object.keys(batchGroups).length !== 1 ? 'es' : ''}
            </span>
        </div>
        <div class="space-y-4">
            ${Object.values(batchGroups)
              .map((batch) => {
                const completedCount = batch.subtasks.filter(
                  (s) => s.status === 'completed',
                ).length;
                const progressPercentage = Math.round(
                  (completedCount / batch.subtasks.length) * 100,
                );

                return `
            <div class="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors">
                <div class="flex items-center justify-between mb-3">
                    <h3 class="text-sm font-semibold text-gray-900">${this.escapeHtml(batch.batchTitle)}</h3>
                    <span class="text-xs font-medium text-gray-600">${completedCount}/${batch.subtasks.length}</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="progress-bar h-2 rounded-full transition-all duration-300" style="width: ${progressPercentage}%"></div>
                </div>
                <div class="flex justify-between text-xs text-gray-500 mt-1">
                    <span>${progressPercentage}% complete</span>
                    <span>${batch.subtasks.length} subtasks</span>
                </div>
            </div>
            `;
              })
              .join('')}
        </div>
    </div>`;
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
