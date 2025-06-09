import { Injectable, Logger } from '@nestjs/common';
import { DelegationFlowData } from '../../shared/types/report-data.types';

/**
 * Delegation Flow Generator Service
 *
 * This service is focused solely on generating delegation flow reports
 * following the Single Responsibility Principle and domain architecture.
 */
@Injectable()
export class DelegationFlowGeneratorService {
  private readonly logger = new Logger(DelegationFlowGeneratorService.name);

  /**
   * Generate delegation flow HTML using type-safe data
   */
  generateDelegationFlow(data: DelegationFlowData): string {
    this.logger.log('Generating type-safe delegation flow HTML');
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
        ${this.generateFlowOverview(data.summary)}
        ${this.generateDelegationTimeline(data.delegationChain)}
        ${this.generateRoleAnalysis(this.deriveRoleAnalysis(data))}
        ${this.generateInsights(data)}
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
    <title>${this.escapeHtml(taskName)} - Delegation Flow</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />`;
  }

  private generateHeader(task: DelegationFlowData['task']): string {
    return `
    <header class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
                <div class="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    <i class="fas fa-route text-white text-xl"></i>
                </div>
                <div>
                    <h1 class="text-2xl font-bold text-gray-900">Delegation Flow</h1>
                    <p class="text-lg text-gray-700">${this.escapeHtml(task.name)}</p>
                    <p class="text-sm text-gray-600">${this.escapeHtml(String(task.id))}</p>
                    ${task.slug ? `<p class="text-xs text-blue-600">${this.escapeHtml(task.slug)}</p>` : ''}
                </div>
            </div>
            <div class="flex items-center space-x-4">
                <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${this.getStatusClasses(task.status)}">
                    ${task.status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                </span>
                <div class="text-right text-sm text-gray-600">
                    <div>Current Owner: <span class="font-medium text-gray-900">${task.currentOwner}</span></div>
                    <div>Total Delegations: <span class="font-medium text-gray-900">${task.totalDelegations}</span></div>
                </div>
            </div>
        </div>
    </header>`;
  }

  private generateFlowOverview(summary: DelegationFlowData['summary']): string {
    return `
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-6">Flow Overview</h2>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div class="text-center">
                <div class="text-3xl font-bold text-blue-600">${summary.totalDelegations}</div>
                <div class="text-sm text-gray-600">Total Delegations</div>
            </div>
            <div class="text-center">
                <div class="text-3xl font-bold text-green-600">${summary.successfulDelegations}</div>
                <div class="text-sm text-gray-600">Successful</div>
            </div>
            <div class="text-center">
                <div class="text-3xl font-bold text-red-600">${summary.failedDelegations}</div>
                <div class="text-sm text-gray-600">Failed</div>
            </div>
            <div class="text-center">
                <div class="text-3xl font-bold text-purple-600">${summary.averageDelegationDuration}h</div>
                <div class="text-sm text-gray-600">Avg Duration</div>
            </div>
        </div>
        <div class="mt-6">
            <h3 class="text-md font-medium text-gray-900 mb-3">Most Common Path</h3>
            <div class="flex items-center justify-center space-x-2 p-4 bg-gray-50 rounded-lg">
                ${summary.mostCommonPath
                  .map(
                    (step, index) => `
                    <span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">${step}</span>
                    ${index < summary.mostCommonPath.length - 1 ? '<i class="fas fa-arrow-right text-gray-400"></i>' : ''}
                `,
                  )
                  .join('')}
            </div>
        </div>
    </div>`;
  }

  private deriveRoleAnalysis(data: DelegationFlowData): Array<{
    role: string;
    involvement: number;
    delegationsReceived: number;
    delegationsMade: number;
    averageHoldTime: number;
    efficiency: number;
  }> {
    const roleMap = new Map();

    // Initialize with role involvement data
    Object.entries(data.summary.roleInvolvement).forEach(
      ([role, involvement]) => {
        roleMap.set(role, {
          role,
          involvement,
          delegationsReceived: 0,
          delegationsMade: 0,
          totalHoldTime: 0,
          delegationCount: 0,
          averageHoldTime: 0,
          efficiency: 85, // Default efficiency percentage
        });
      },
    );

    // Calculate delegations from delegation chain
    data.delegationChain.forEach((delegation) => {
      const fromRole = roleMap.get(delegation.fromMode);
      const toRole = roleMap.get(delegation.toMode);

      if (fromRole) {
        fromRole.delegationsMade++;
      }
      if (toRole) {
        toRole.delegationsReceived++;
        toRole.totalHoldTime += delegation.duration || 0;
        toRole.delegationCount++;
      }
    });

    // Calculate averages
    roleMap.forEach((role) => {
      if (role.delegationCount > 0) {
        role.averageHoldTime = Math.round(
          role.totalHoldTime / role.delegationCount,
        );
      }
    });

    return Array.from(roleMap.values()) as Array<{
      role: string;
      involvement: number;
      delegationsReceived: number;
      delegationsMade: number;
      averageHoldTime: number;
      efficiency: number;
    }>;
  }

  private calculateFlowEfficiency(data: DelegationFlowData): number {
    const successRate =
      data.summary.totalDelegations > 0
        ? Math.round(
            (data.summary.successfulDelegations /
              data.summary.totalDelegations) *
              100,
          )
        : 100;
    return successRate;
  }

  private generateDelegationTimeline(
    delegations: DelegationFlowData['delegationChain'],
  ): string {
    if (!delegations || delegations.length === 0) {
      return `
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center mb-6">
          <i class="fas fa-exchange-alt text-gray-400 text-4xl mb-4"></i>
          <p class="text-gray-500">No delegation history available</p>
      </div>`;
    }

    return `
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-6">Delegation Timeline</h2>
        <div class="space-y-4">
            ${delegations
              .map(
                (delegation: any, index: number) => `
                <div class="flex items-center space-x-4 p-4 ${delegation.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border rounded-lg">
                    <div class="flex-shrink-0">
                        <div class="w-8 h-8 ${delegation.success ? 'bg-green-600' : 'bg-red-600'} rounded-full flex items-center justify-center text-white text-sm font-bold">
                            ${index + 1}
                        </div>
                    </div>
                    <div class="flex-grow">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center space-x-2">
                                <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">${delegation.fromMode}</span>
                                <i class="fas fa-arrow-right text-gray-400"></i>
                                <span class="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">${delegation.toMode}</span>
                            </div>
                            <div class="text-right">
                                <div class="text-sm text-gray-600">${this.formatDate(delegation.delegationTimestamp)}</div>
                                ${delegation.duration > 0 ? `<div class="text-xs text-gray-500">${delegation.duration}h duration</div>` : ''}
                            </div>
                        </div>
                        ${delegation.message ? `<p class="text-sm text-gray-700 mt-2">${this.escapeHtml(delegation.message)}</p>` : ''}
                    </div>
                    <div class="flex-shrink-0">
                        <i class="fas fa-${delegation.success ? 'check-circle text-green-600' : 'times-circle text-red-600'}"></i>
                    </div>
                </div>
            `,
              )
              .join('')}
        </div>
    </div>`;
  }

  private generateRoleAnalysis(
    roleAnalysis: Array<{
      role: string;
      involvement: number;
      delegationsReceived: number;
      delegationsMade: number;
      averageHoldTime: number;
      efficiency: number;
    }>,
  ): string {
    if (!roleAnalysis || roleAnalysis.length === 0) {
      return `
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center mb-6">
          <i class="fas fa-users text-gray-400 text-4xl mb-4"></i>
          <p class="text-gray-500">No role analysis data available</p>
      </div>`;
    }

    return `
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-6">Role Analysis</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${roleAnalysis
              .map(
                (role: any) => `
                <div class="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4">
                    <div class="flex items-center justify-between mb-3">
                        <h3 class="text-md font-medium text-gray-900">${role.role}</h3>
                        <span class="text-xs px-2 py-1 rounded-full ${this.getRoleClasses(role.role)}">${role.involvement}%</span>
                    </div>
                    <div class="space-y-2">
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-600">Received:</span>
                            <span class="font-medium text-gray-900">${role.delegationsReceived}</span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-600">Made:</span>
                            <span class="font-medium text-gray-900">${role.delegationsMade}</span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-600">Hold Time:</span>
                            <span class="font-medium text-gray-900">${role.averageHoldTime}h</span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-600">Efficiency:</span>
                            <span class="font-medium text-gray-900">${role.efficiency}%</span>
                        </div>
                    </div>
                    <div class="mt-3 w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-blue-600 h-2 rounded-full" style="width: ${role.efficiency}%"></div>
                    </div>
                </div>
            `,
              )
              .join('')}
        </div>
        <div class="mt-6">
            <canvas id="roleAnalysisChart" width="400" height="300"></canvas>
        </div>
    </div>`;
  }

  private generateInsights(data: DelegationFlowData): string {
    const insights = this.generateInsightsList(data);

    return `
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-6">Insights & Recommendations</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <h3 class="text-md font-medium text-gray-900 mb-3">Key Insights</h3>
                <div class="space-y-3">
                    ${insights
                      .map(
                        (insight) => `
                        <div class="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                            <i class="fas fa-lightbulb text-blue-600 mt-1"></i>
                            <div>
                                <h4 class="text-sm font-medium text-blue-900">${insight.title}</h4>
                                <p class="text-sm text-blue-800">${insight.description}</p>
                            </div>
                        </div>
                    `,
                      )
                      .join('')}
                </div>
            </div>
            <div>
                <h3 class="text-md font-medium text-gray-900 mb-3">Flow Efficiency</h3>
                <div class="text-center">
                    <div class="text-4xl font-bold text-green-600">${this.calculateFlowEfficiency(data)}%</div>
                    <div class="text-sm text-gray-600">Overall Efficiency</div>
                    <div class="mt-3 w-full bg-gray-200 rounded-full h-3">
                        <div class="bg-green-600 h-3 rounded-full" style="width: ${this.calculateFlowEfficiency(data)}%"></div>
                    </div>
                </div>
                <div class="mt-4 text-center">
                    <div class="text-2xl font-bold text-blue-600">${data.summary.averageDelegationDuration}h</div>
                    <div class="text-sm text-gray-600">Average Delegation Time</div>
                </div>
            </div>
        </div>
    </div>`;
  }

  private generateInsightsList(
    data: DelegationFlowData,
  ): Array<{ title: string; description: string }> {
    const insights = [];
    const flowEfficiency = this.calculateFlowEfficiency(data);
    const uniqueRoles = Object.keys(data.summary.roleInvolvement);

    if (flowEfficiency > 80) {
      insights.push({
        title: 'High Flow Efficiency',
        description:
          'This task shows excellent delegation patterns with minimal redelegations.',
      });
    } else if (flowEfficiency < 50) {
      insights.push({
        title: 'Flow Optimization Needed',
        description:
          'Consider reviewing delegation patterns to reduce redelegations and improve efficiency.',
      });
    }

    if (data.summary.averageDelegationDuration < 2) {
      insights.push({
        title: 'Fast Delegation Cycles',
        description:
          'Quick delegation turnaround indicates efficient role transitions.',
      });
    }

    if (uniqueRoles.length > 4) {
      insights.push({
        title: 'Complex Workflow',
        description:
          'Multiple roles involved suggest a comprehensive review process.',
      });
    }

    return insights;
  }

  private generateFooter(metadata: DelegationFlowData['metadata']): string {
    return `
    <footer class="mt-8 text-center text-sm text-gray-500">
        Generated by ${this.escapeHtml(metadata.generatedBy)} • ${this.formatDate(metadata.generatedAt)}
    </footer>`;
  }

  private generateChartScripts(data: DelegationFlowData): string {
    const roleAnalysis = this.deriveRoleAnalysis(data);
    return `
    <script>
        // Role Analysis Chart
        const ctx = document.getElementById('roleAnalysisChart').getContext('2d');
        new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ${JSON.stringify(roleAnalysis.map((r: any) => r.role as string))},
                datasets: [{
                    label: 'Efficiency %',
                    data: ${JSON.stringify(roleAnalysis.map((r: any) => r.efficiency as number))},
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    pointBackgroundColor: '#3b82f6',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: 'Role Efficiency Analysis' },
                    legend: { display: false }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100
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

  private getRoleClasses(role: string): string {
    const roleMap: Record<string, string> = {
      boomerang: 'bg-blue-100 text-blue-800',
      researcher: 'bg-green-100 text-green-800',
      architect: 'bg-purple-100 text-purple-800',
      'senior-developer': 'bg-orange-100 text-orange-800',
      'code-review': 'bg-red-100 text-red-800',
    };
    return roleMap[role] || 'bg-gray-100 text-gray-800';
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
