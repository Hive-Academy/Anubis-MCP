import { Injectable } from '@nestjs/common';
import { DelegationSummary } from '../../../shared/types/report-data.types';

/**
 * Enhanced Delegations Table Generator
 * Creates visually stunning delegation flow visualization with modern UI/UX design and comprehensive workflow insights
 */
@Injectable()
export class DelegationsTableGenerator {
  /**
   * Generate enhanced delegations table with modern UI, workflow visualization, and comprehensive insights
   */
  generateDelegationsTable(delegations: DelegationSummary[]): string {
    if (!delegations || delegations.length === 0) {
      return this.generateEmptyTable();
    }

    // Sort delegations by timestamp (most recent first)
    const sortedDelegations = this.sortDelegationsByTimestamp(delegations);
    const recentDelegations = sortedDelegations.slice(0, 12);

    return `
    <div class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        ${this.generateTableHeader(delegations.length)}
        ${this.generateWorkflowStats(delegations)}
        ${this.generateTableContent(recentDelegations)}
        ${this.generateTableFooter(delegations, recentDelegations.length)}
    </div>`;
  }

  /**
   * Generate table header with workflow insights
   */
  private generateTableHeader(totalDelegations: number): string {
    return `
    <div class="bg-gradient-to-r from-purple-50 to-indigo-50 px-6 py-5 border-b border-gray-100">
        <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
                <div class="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                    <i class="fas fa-exchange-alt text-white text-lg"></i>
                </div>
                <div>
                    <h3 class="text-xl font-bold text-gray-900">Workflow Transitions</h3>
                    <p class="text-sm text-gray-600">Real-time delegation flow and handoff tracking</p>
                </div>
            </div>
            <div class="flex items-center space-x-4">
                <div class="text-right">
                    <div class="text-2xl font-bold text-purple-600">${totalDelegations}</div>
                    <div class="text-xs text-gray-500">Total Handoffs</div>
                </div>
                <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <i class="fas fa-chart-network text-purple-600"></i>
                </div>
            </div>
        </div>
    </div>`;
  }

  /**
   * Generate workflow statistics summary
   */
  private generateWorkflowStats(delegations: DelegationSummary[]): string {
    const successfulDelegations = delegations.filter(
      (d) => d.success === true,
    ).length;
    const _failedDelegations = delegations.filter(
      (d) => d.success === false,
    ).length;
    const pendingDelegations = delegations.filter(
      (d) => d.success === undefined,
    ).length;
    const successRate =
      delegations.length > 0
        ? ((successfulDelegations / delegations.length) * 100).toFixed(1)
        : '0';

    const avgDuration =
      delegations.length > 0
        ? (
            delegations
              .filter((d) => d.duration)
              .reduce((sum, d) => sum + (d.duration || 0), 0) /
            delegations.filter((d) => d.duration).length
          ).toFixed(1)
        : '0';

    return `
    <div class="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="text-center">
                <div class="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg mx-auto mb-2">
                    <i class="fas fa-check text-green-600 text-sm"></i>
                </div>
                <div class="text-lg font-bold text-green-600">${successfulDelegations}</div>
                <div class="text-xs text-gray-500">Successful</div>
            </div>
            <div class="text-center">
                <div class="flex items-center justify-center w-8 h-8 bg-yellow-100 rounded-lg mx-auto mb-2">
                    <i class="fas fa-clock text-yellow-600 text-sm"></i>
                </div>
                <div class="text-lg font-bold text-yellow-600">${pendingDelegations}</div>
                <div class="text-xs text-gray-500">Pending</div>
            </div>
            <div class="text-center">
                <div class="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg mx-auto mb-2">
                    <i class="fas fa-percentage text-blue-600 text-sm"></i>
                </div>
                <div class="text-lg font-bold text-blue-600">${successRate}%</div>
                <div class="text-xs text-gray-500">Success Rate</div>
            </div>
            <div class="text-center">
                <div class="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-lg mx-auto mb-2">
                    <i class="fas fa-stopwatch text-purple-600 text-sm"></i>
                </div>
                <div class="text-lg font-bold text-purple-600">${avgDuration}h</div>
                <div class="text-xs text-gray-500">Avg Duration</div>
            </div>
        </div>
    </div>`;
  }

  /**
   * Generate enhanced table content with workflow visualization
   */
  private generateTableContent(delegations: DelegationSummary[]): string {
    return `
    <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-100">
                <tr>
                    <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        <div class="flex items-center space-x-2">
                            <span>Task & Context</span>
                            <i class="fas fa-tasks text-gray-400"></i>
                        </div>
                    </th>
                    <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        <div class="flex items-center space-x-2">
                            <span>Workflow Transition</span>
                            <i class="fas fa-arrow-right text-gray-400"></i>
                        </div>
                    </th>
                    <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        <div class="flex items-center space-x-2">
                            <span>Status & Outcome</span>
                            <i class="fas fa-chart-line text-gray-400"></i>
                        </div>
                    </th>
                    <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        <div class="flex items-center space-x-2">
                            <span>Timing & Performance</span>
                            <i class="fas fa-clock text-gray-400"></i>
                        </div>
                    </th>
                    <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-100">
                ${delegations.map((delegation, index) => this.generateDelegationRow(delegation, index)).join('')}
            </tbody>
        </table>
    </div>`;
  }

  /**
   * Generate individual delegation row with comprehensive workflow visualization
   */
  private generateDelegationRow(
    delegation: DelegationSummary,
    _index: number,
  ): string {
    const fromRoleColor = this.getRoleColor(delegation.fromMode);
    const toRoleColor = this.getRoleColor(delegation.toMode);
    const statusInfo = this.getStatusInfo(delegation.success);
    const timeAgo = this.getTimeAgo(delegation.delegationTimestamp);
    const isRecent = this.isRecentDelegation(delegation.delegationTimestamp);

    return `
    <tr class="hover:bg-gradient-to-r hover:from-gray-50 hover:to-purple-50 transition-all duration-200 group" data-delegation-id="${delegation.taskId}">
        <!-- Task & Context -->
        <td class="px-6 py-5">
            <div class="flex items-start space-x-3">
                <div class="flex-shrink-0 w-10 h-10 ${statusInfo.iconBg} rounded-xl flex items-center justify-center">
                    <i class="fas ${statusInfo.icon} ${statusInfo.iconText} text-sm"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center space-x-2">
                        <h4 class="text-sm font-semibold text-gray-900 truncate group-hover:text-purple-600 transition-colors">
                            ${delegation.taskName ? this.escapeHtml(delegation.taskName) : 'Unknown Task'}
                        </h4>
                        ${isRecent ? '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><i class="fas fa-bolt mr-1"></i>Recent</span>' : ''}
                    </div>
                    <div class="mt-1 flex items-center space-x-3 text-xs text-gray-500">
                        <span class="font-mono bg-gray-100 px-2 py-1 rounded">${this.escapeHtml(delegation.taskId)}</span>
                        <span class="text-gray-400">•</span>
                        <span>${timeAgo}</span>
                    </div>

                </div>
            </div>
        </td>

        <!-- Workflow Transition -->
        <td class="px-6 py-5">
            <div class="flex items-center space-x-3">
                <!-- From Role -->
                <div class="flex items-center space-x-2">
                    <div class="w-8 h-8 ${fromRoleColor.bg} rounded-lg flex items-center justify-center shadow-sm">
                        <span class="text-xs font-bold ${fromRoleColor.text}">
                            ${delegation.fromMode.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div class="text-xs">
                        <div class="font-medium text-gray-700 capitalize">${delegation.fromMode.replace('-', ' ')}</div>
                        <div class="text-gray-500">${this.getRoleDescription(delegation.fromMode)}</div>
                    </div>
                </div>

                <!-- Transition Arrow -->
                <div class="flex-shrink-0 px-2">
                    <div class="flex items-center space-x-1">
                        <div class="w-3 h-0.5 bg-gradient-to-r ${statusInfo.arrowGradient} rounded-full"></div>
                        <i class="fas fa-chevron-right ${statusInfo.arrowColor} text-xs"></i>
                        <div class="w-3 h-0.5 bg-gradient-to-r ${statusInfo.arrowGradient} rounded-full"></div>
                    </div>
                </div>

                <!-- To Role -->
                <div class="flex items-center space-x-2">
                    <div class="w-8 h-8 ${toRoleColor.bg} rounded-lg flex items-center justify-center shadow-sm">
                        <span class="text-xs font-bold ${toRoleColor.text}">
                            ${delegation.toMode.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div class="text-xs">
                        <div class="font-medium text-gray-700 capitalize">${delegation.toMode.replace('-', ' ')}</div>
                        <div class="text-gray-500">${this.getRoleDescription(delegation.toMode)}</div>
                    </div>
                </div>
            </div>
        </td>

        <!-- Status & Outcome -->
        <td class="px-6 py-5">
            <div class="space-y-2">
                <div class="flex items-center space-x-2">
                    <div class="w-3 h-3 ${statusInfo.statusDot} rounded-full ${statusInfo.pulse ? 'animate-pulse' : ''}"></div>
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusInfo.badge}">
                        ${statusInfo.label}
                    </span>
                </div>
                ${
                  delegation.success !== undefined
                    ? `
                <div class="flex items-center space-x-1 text-xs">
                    ${this.generateSuccessIndicator(delegation.success)}
                </div>
                `
                    : `
                <div class="text-xs text-yellow-600 italic">
                    <i class="fas fa-hourglass-half mr-1"></i>
                    Awaiting completion
                </div>
                `
                }
            </div>
        </td>

        <!-- Timing & Performance -->
        <td class="px-6 py-5">
            <div class="space-y-2">
                <div class="flex items-center space-x-2 text-sm">
                    <i class="fas fa-calendar-alt text-gray-400 text-xs"></i>
                    <span class="text-gray-600">${this.formatDate(delegation.delegationTimestamp)}</span>
                </div>
                ${
                  delegation.duration
                    ? `
                <div class="flex items-center space-x-2">
                    <div class="flex-1">
                        <div class="flex items-center justify-between text-xs mb-1">
                            <span class="text-gray-600">Duration</span>
                            <span class="font-semibold text-gray-900">${delegation.duration}h</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2">
                            <div class="h-2 ${this.getDurationColor(delegation.duration)} rounded-full transition-all duration-500" 
                                 style="width: ${Math.min(100, (delegation.duration / 48) * 100)}%"></div>
                        </div>
                    </div>
                </div>
                `
                    : `
                <div class="text-xs text-gray-500 italic">
                    <i class="fas fa-stopwatch text-gray-400 mr-1"></i>
                    In progress
                </div>
                `
                }
                <div class="flex items-center space-x-1">
                    ${this.generatePerformanceRating(delegation)}
                </div>
            </div>
        </td>

        <!-- Actions -->
        <td class="px-6 py-5">
            <div class="flex items-center space-x-2">
                <button class="p-2 hover:bg-purple-100 rounded-lg transition-colors group/btn" title="View Delegation Details">
                    <i class="fas fa-eye text-gray-400 group-hover/btn:text-purple-600 text-sm"></i>
                </button>
                <button class="p-2 hover:bg-blue-100 rounded-lg transition-colors group/btn" title="View Task">
                    <i class="fas fa-external-link-alt text-gray-400 group-hover/btn:text-blue-600 text-sm"></i>
                </button>
                ${
                  delegation.success === false
                    ? `
                <button class="p-2 hover:bg-red-100 rounded-lg transition-colors group/btn" title="Retry Delegation">
                    <i class="fas fa-redo text-gray-400 group-hover/btn:text-red-600 text-sm"></i>
                </button>
                `
                    : ''
                }
            </div>
        </td>
    </tr>`;
  }

  /**
   * Generate table footer with delegation analytics
   */
  private generateTableFooter(
    allDelegations: DelegationSummary[],
    displayedCount: number,
  ): string {
    const successfulDelegations = allDelegations.filter(
      (d) => d.success === true,
    ).length;
    const failedDelegations = allDelegations.filter(
      (d) => d.success === false,
    ).length;
    const pendingDelegations = allDelegations.filter(
      (d) => d.success === undefined,
    ).length;

    return `
    <div class="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <div class="flex items-center justify-between">
            <div class="flex items-center space-x-6 text-sm">
                <div class="flex items-center space-x-2">
                    <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span class="text-gray-600">Successful: <span class="font-semibold">${successfulDelegations}</span></span>
                </div>
                <div class="flex items-center space-x-2">
                    <div class="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span class="text-gray-600">Pending: <span class="font-semibold">${pendingDelegations}</span></span>
                </div>
                <div class="flex items-center space-x-2">
                    <div class="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span class="text-gray-600">Failed: <span class="font-semibold">${failedDelegations}</span></span>
                </div>
            </div>
            <div class="text-sm text-gray-500">
                Showing ${displayedCount} of ${allDelegations.length} delegations
                ${allDelegations.length > displayedCount ? `• <button class="text-purple-600 hover:text-purple-800 font-medium">View All</button>` : ''}
            </div>
        </div>
    </div>`;
  }

  /**
   * Generate empty table with engaging design
   */
  private generateEmptyTable(): string {
    return `
    <div class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div class="bg-gradient-to-r from-purple-50 to-indigo-50 px-6 py-5 border-b border-gray-100">
            <div class="flex items-center space-x-4">
                <div class="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                    <i class="fas fa-exchange-alt text-white text-lg"></i>
                </div>
                <div>
                    <h3 class="text-xl font-bold text-gray-900">Workflow Transitions</h3>
                    <p class="text-sm text-gray-600">Your delegation flow will appear here</p>
                </div>
            </div>
        </div>
        <div class="p-16 text-center">
            <div class="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
                <i class="fas fa-route text-gray-400 text-3xl"></i>
            </div>
            <h4 class="text-lg font-semibold text-gray-900 mb-2">No Delegations Found</h4>
            <p class="text-gray-500 mb-6 max-w-md mx-auto">
                Start delegating tasks between roles to see workflow transitions and handoff analytics here.
            </p>
            <button class="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl hover:from-purple-600 hover:to-indigo-600 transition-all duration-200 shadow-lg hover:shadow-xl">
                <i class="fas fa-play mr-2"></i>
                Start Workflow
            </button>
        </div>
    </div>`;
  }

  // Helper methods for styling and data processing
  private sortDelegationsByTimestamp(
    delegations: DelegationSummary[],
  ): DelegationSummary[] {
    return [...delegations].sort(
      (a, b) =>
        new Date(b.delegationTimestamp).getTime() -
        new Date(a.delegationTimestamp).getTime(),
    );
  }

  private getRoleColor(role: string) {
    const colors: Record<string, { bg: string; text: string }> = {
      boomerang: { bg: 'bg-purple-100', text: 'text-purple-600' },
      architect: { bg: 'bg-green-100', text: 'text-green-600' },
      'senior-developer': { bg: 'bg-indigo-100', text: 'text-indigo-600' },
      'code-review': { bg: 'bg-orange-100', text: 'text-orange-600' },
    };
    return (
      colors[role] || {
        bg: 'bg-gray-100',
        text: 'text-gray-600',
      }
    );
  }

  private getRoleDescription(role: string): string {
    const descriptions: Record<string, string> = {
      boomerang: 'Task Coordinator',
      architect: 'Solution Designer',
      'senior-developer': 'Lead Developer',
      'code-review': 'Code Reviewer',
    };
    return descriptions[role] || 'Team Member';
  }

  private getStatusInfo(success: boolean | undefined) {
    if (success === true) {
      return {
        label: 'Completed',
        badge: 'bg-green-100 text-green-800',
        statusDot: 'bg-green-500',
        pulse: false,
        icon: 'fa-check-circle',
        iconBg: 'bg-green-100',
        iconText: 'text-green-600',
        arrowGradient: 'from-green-400 to-green-500',
        arrowColor: 'text-green-600',
      };
    } else if (success === false) {
      return {
        label: 'Failed',
        badge: 'bg-red-100 text-red-800',
        statusDot: 'bg-red-500',
        pulse: false,
        icon: 'fa-times-circle',
        iconBg: 'bg-red-100',
        iconText: 'text-red-600',
        arrowGradient: 'from-red-400 to-red-500',
        arrowColor: 'text-red-600',
      };
    } else {
      return {
        label: 'In Progress',
        badge: 'bg-yellow-100 text-yellow-800',
        statusDot: 'bg-yellow-500',
        pulse: true,
        icon: 'fa-clock',
        iconBg: 'bg-yellow-100',
        iconText: 'text-yellow-600',
        arrowGradient: 'from-yellow-400 to-yellow-500',
        arrowColor: 'text-yellow-600',
      };
    }
  }

  private getTimeAgo(timestamp: string): string {
    const now = new Date();
    const delegationTime = new Date(timestamp);
    const diffInMs = now.getTime() - delegationTime.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 0) {
      return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
    } else if (diffInHours > 0) {
      return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    } else {
      return 'Less than 1 hour ago';
    }
  }

  private isRecentDelegation(timestamp: string): boolean {
    const now = new Date();
    const delegationTime = new Date(timestamp);
    const diffInHours =
      (now.getTime() - delegationTime.getTime()) / (1000 * 60 * 60);
    return diffInHours <= 24; // Within 24 hours
  }

  private getDurationColor(duration: number): string {
    if (duration <= 8) return 'bg-green-500';
    if (duration <= 24) return 'bg-yellow-500';
    if (duration <= 48) return 'bg-orange-500';
    return 'bg-red-500';
  }

  private generateSuccessIndicator(success: boolean): string {
    if (success) {
      return Array.from(
        { length: 5 },
        (_, i) =>
          `<i class="fas fa-star text-xs ${i < 4 ? 'text-green-400' : 'text-gray-300'}"></i>`,
      ).join('');
    } else {
      return Array.from(
        { length: 5 },
        (_, i) =>
          `<i class="fas fa-star text-xs ${i < 2 ? 'text-red-400' : 'text-gray-300'}"></i>`,
      ).join('');
    }
  }

  private generatePerformanceRating(delegation: DelegationSummary): string {
    let rating = 3; // Default

    if (delegation.success === true) {
      rating = delegation.duration && delegation.duration <= 24 ? 5 : 4;
    } else if (delegation.success === false) {
      rating = 1;
    } else {
      rating = this.isRecentDelegation(delegation.delegationTimestamp) ? 3 : 2;
    }

    return Array.from(
      { length: 5 },
      (_, i) =>
        `<i class="fas fa-circle text-xs ${i < rating ? 'text-purple-400' : 'text-gray-300'}"></i>`,
    ).join('');
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
