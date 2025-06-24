import { Injectable } from '@nestjs/common';

// Use the actual data structure from the workflow analytics service
interface WorkflowAnalyticsData {
  summary: {
    totalTasks: number;
    completedTasks: number;
    averageCompletionTime: number;
    totalDelegations: number;
    successfulDelegations: number;
    delegationSuccessRate: number;
  };
  taskAnalytics: {
    statusDistribution: Record<string, number>;
    priorityDistribution: Record<string, number>;
    completionTrends: Array<{
      period: string;
      completed: number;
      started: number;
    }>;
  };
  delegationAnalytics: {
    roleTransitions: Array<{
      fromMode: string;
      toMode: string;
      count: number;
      successRate: number;
    }>;
    averageDelegationDuration: Record<string, number>;
    redelegationHotspots: Array<{
      transition: string;
      count: number;
      reasons: string[];
    }>;
  };
  performanceMetrics: {
    roleEfficiency: Array<{
      role: string;
      tasksCompleted: number;
      averageDuration: number;
      successRate: number;
    }>;
    bottlenecks: Array<{
      stage: string;
      averageWaitTime: number;
      taskCount: number;
    }>;
  };
  metadata: {
    generatedAt: string;
    reportType: 'workflow-analytics';
    version: string;
    generatedBy: string;
    timeframe: {
      startDate?: string;
      endDate?: string;
    };
  };
}

/**
 * Workflow Analytics Generator Service
 *
 * This service is focused solely on generating workflow analytics reports
 * following the Single Responsibility Principle and domain architecture.
 */
@Injectable()
export class WorkflowAnalyticsGeneratorService {
  /**
   * Generate workflow analytics HTML using real database data
   */
  generateWorkflowAnalytics(data: WorkflowAnalyticsData): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    ${this.generateHead()}
</head>
<body class="bg-gray-50 font-sans">
    <div class="max-w-7xl mx-auto py-8 px-4">
        ${this.generateHeader(data)}
        ${this.generateSummaryOverview(data.summary)}
        ${this.generateTaskAnalytics(data.taskAnalytics)}
        ${this.generateDelegationAnalytics(data.delegationAnalytics)}
        ${this.generatePerformanceMetrics(data.performanceMetrics)}
        ${this.generateFooter(data.metadata)}
    </div>
    ${this.generateChartScripts(data)}
</body>
</html>`;
  }

  private generateHead(): string {
    return `
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Workflow Analytics Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />`;
  }

  private generateHeader(data: WorkflowAnalyticsData): string {
    const startDate = data.metadata.timeframe.startDate
      ? this.formatDate(data.metadata.timeframe.startDate)
      : 'N/A';
    const endDate = data.metadata.timeframe.endDate
      ? this.formatDate(data.metadata.timeframe.endDate)
      : 'N/A';

    return `
    <header class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
                <div class="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center">
                    <i class="fas fa-chart-line text-white text-xl"></i>
                </div>
                <div>
                    <h1 class="text-2xl font-bold text-gray-900">Workflow Analytics</h1>
                    <p class="text-lg text-gray-700">Database-Driven Analytics Report</p>
                    <p class="text-sm text-gray-600">Cross-task analytics and insights</p>
                </div>
            </div>
            <div class="flex items-center space-x-4">
                <div class="text-right">
                    <div class="text-sm text-gray-600">Analysis Period</div>
                    <div class="text-lg font-semibold text-gray-900">
                        ${startDate} - ${endDate}
                    </div>
                </div>
            </div>
        </div>
    </header>`;
  }

  private generateSummaryOverview(
    summary: WorkflowAnalyticsData['summary'],
  ): string {
    const completionRate =
      summary.totalTasks > 0
        ? Math.round((summary.completedTasks / summary.totalTasks) * 100)
        : 0;

    return `
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-6">Summary Overview</h2>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div class="text-center">
                <div class="text-3xl font-bold text-blue-600">${summary.totalTasks}</div>
                <div class="text-sm text-gray-600">Total Tasks</div>
            </div>
            <div class="text-center">
                <div class="text-3xl font-bold text-green-600">${summary.completedTasks}</div>
                <div class="text-sm text-gray-600">Completed</div>
            </div>
            <div class="text-center">
                <div class="text-3xl font-bold text-yellow-600">${summary.averageCompletionTime.toFixed(1)}h</div>
                <div class="text-sm text-gray-600">Avg Completion Time</div>
            </div>
            <div class="text-center">
                <div class="text-3xl font-bold text-purple-600">${summary.totalDelegations}</div>
                <div class="text-sm text-gray-600">Total Delegations</div>
            </div>
        </div>
        <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="bg-gray-50 rounded-lg p-4">
                <h3 class="text-md font-medium text-gray-900 mb-3">Completion Rate</h3>
                <div class="text-center">
                    <div class="text-2xl font-bold text-green-600">${completionRate}%</div>
                    <div class="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div class="bg-green-600 h-2 rounded-full" style="width: ${completionRate}%"></div>
                    </div>
                </div>
            </div>
            <div class="bg-gray-50 rounded-lg p-4">
                <h3 class="text-md font-medium text-gray-900 mb-3">Delegation Success</h3>
                <div class="text-center">
                    <div class="text-2xl font-bold text-blue-600">${summary.delegationSuccessRate.toFixed(1)}%</div>
                    <div class="text-sm text-gray-600">${summary.successfulDelegations} of ${summary.totalDelegations}</div>
                </div>
            </div>
        </div>
    </div>`;
  }

  private generateTaskAnalytics(
    taskAnalytics: WorkflowAnalyticsData['taskAnalytics'],
  ): string {
    return `
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-6">Task Analytics</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="bg-gray-50 rounded-lg p-4">
                <h3 class="text-md font-medium text-gray-900 mb-3">Status Distribution</h3>
                <div class="space-y-2">
                    ${Object.entries(taskAnalytics.statusDistribution)
                      .map(
                        ([status, count]) => `
                        <div class="flex justify-between items-center">
                            <span class="text-sm text-gray-700 capitalize">${status.replace('-', ' ')}</span>
                            <span class="text-sm font-bold text-gray-900">${count}</span>
                        </div>
                    `,
                      )
                      .join('')}
                </div>
            </div>
            <div class="bg-gray-50 rounded-lg p-4">
                <h3 class="text-md font-medium text-gray-900 mb-3">Priority Distribution</h3>
                <div class="space-y-2">
                    ${Object.entries(taskAnalytics.priorityDistribution)
                      .map(
                        ([priority, count]) => `
                        <div class="flex justify-between items-center">
                            <span class="text-sm text-gray-700">${priority}</span>
                            <span class="text-sm font-bold text-gray-900">${count}</span>
                        </div>
                    `,
                      )
                      .join('')}
                </div>
            </div>
        </div>
        ${
          taskAnalytics.completionTrends.length > 0
            ? `
        <div class="mt-6">
            <h3 class="text-md font-medium text-gray-900 mb-3">Completion Trends</h3>
            <div class="bg-gray-50 rounded-lg p-4">
                <div class="space-y-2">
                    ${taskAnalytics.completionTrends
                      .map(
                        (trend) => `
                        <div class="flex justify-between items-center">
                            <span class="text-sm text-gray-700">${trend.period}</span>
                            <div class="text-sm">
                                <span class="text-green-600 font-medium">${trend.completed} completed</span>
                                <span class="text-gray-500 mx-2">|</span>
                                <span class="text-blue-600 font-medium">${trend.started} started</span>
                            </div>
                        </div>
                    `,
                      )
                      .join('')}
                </div>
            </div>
        </div>
        `
            : ''
        }
    </div>`;
  }

  private generateDelegationAnalytics(
    delegationAnalytics: WorkflowAnalyticsData['delegationAnalytics'],
  ): string {
    return `
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-6">Delegation Analytics</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="bg-gray-50 rounded-lg p-4">
                <h3 class="text-md font-medium text-gray-900 mb-3">Role Transitions</h3>
                <div class="space-y-2">
                    ${delegationAnalytics.roleTransitions
                      .map(
                        (transition) => `
                        <div class="flex justify-between items-center">
                            <span class="text-sm text-gray-700">${transition.fromMode} → ${transition.toMode}</span>
                            <div class="text-sm">
                                <span class="text-blue-600 font-medium">${transition.count}</span>
                                <span class="text-gray-500 mx-1">|</span>
                                <span class="text-green-600 font-medium">${transition.successRate.toFixed(1)}%</span>
                            </div>
                        </div>
                    `,
                      )
                      .join('')}
                </div>
            </div>
            <div class="bg-gray-50 rounded-lg p-4">
                <h3 class="text-md font-medium text-gray-900 mb-3">Average Duration by Role</h3>
                <div class="space-y-2">
                    ${Object.entries(
                      delegationAnalytics.averageDelegationDuration,
                    )
                      .map(
                        ([role, duration]) => `
                        <div class="flex justify-between items-center">
                            <span class="text-sm text-gray-700">${role}</span>
                            <span class="text-sm font-bold text-gray-900">${duration.toFixed(1)}h</span>
                        </div>
                    `,
                      )
                      .join('')}
                </div>
            </div>
        </div>
        ${
          delegationAnalytics.redelegationHotspots.length > 0
            ? `
        <div class="mt-6">
            <h3 class="text-md font-medium text-gray-900 mb-3">Redelegation Hotspots</h3>
            <div class="space-y-3">
                ${delegationAnalytics.redelegationHotspots
                  .map(
                    (hotspot) => `
                    <div class="bg-red-50 rounded-lg p-3">
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-sm font-medium text-red-900">${hotspot.transition}</span>
                            <span class="text-sm text-red-700">${hotspot.count} occurrences</span>
                        </div>
                        <div class="text-xs text-red-600">
                            Common reasons: ${hotspot.reasons.join(', ')}
                        </div>
                    </div>
                `,
                  )
                  .join('')}
            </div>
        </div>
        `
            : ''
        }
    </div>`;
  }

  private generatePerformanceMetrics(
    performanceMetrics: WorkflowAnalyticsData['performanceMetrics'],
  ): string {
    return `
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-6">Performance Metrics</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
                <h3 class="text-md font-medium text-blue-900 mb-3">Role Efficiency</h3>
                <div class="space-y-2">
                    ${performanceMetrics.roleEfficiency
                      .map(
                        (role) => `
                        <div class="flex justify-between items-center">
                            <span class="text-sm text-blue-800">${role.role}</span>
                            <div class="text-sm">
                                <span class="text-blue-900 font-bold">${role.successRate.toFixed(1)}%</span>
                                <span class="text-blue-700 ml-2">(${role.tasksCompleted} tasks)</span>
                            </div>
                        </div>
                        <div class="text-xs text-blue-600">Avg: ${role.averageDuration.toFixed(1)}h</div>
                    `,
                      )
                      .join('')}
                </div>
            </div>
            <div class="bg-gradient-to-r from-red-50 to-red-100 rounded-lg p-4">
                <h3 class="text-md font-medium text-red-900 mb-3">Bottlenecks</h3>
                <div class="space-y-2">
                    ${
                      performanceMetrics.bottlenecks.length > 0
                        ? performanceMetrics.bottlenecks
                            .map(
                              (bottleneck) => `
                            <div class="flex justify-between items-center">
                                <span class="text-sm text-red-800">${bottleneck.stage}</span>
                                <div class="text-sm">
                                    <span class="text-red-900 font-bold">${bottleneck.averageWaitTime.toFixed(1)}h</span>
                                    <span class="text-red-700 ml-2">(${bottleneck.taskCount} tasks)</span>
                                </div>
                            </div>
                        `,
                            )
                            .join('')
                        : '<div class="text-sm text-red-600">No significant bottlenecks detected</div>'
                    }
                </div>
            </div>
        </div>
    </div>`;
  }

  private generateFooter(metadata: WorkflowAnalyticsData['metadata']): string {
    return `
    <footer class="mt-8 text-center text-sm text-gray-500">
        Generated by ${this.escapeHtml(metadata.generatedBy)} • ${this.formatDate(metadata.generatedAt)}
    </footer>`;
  }

  private generateChartScripts(data: WorkflowAnalyticsData): string {
    return `
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script>
    document.addEventListener('DOMContentLoaded', function() {
        // Only create charts if elements exist and we have data
        
        // Status Distribution Chart (if we have status data)
        const statusCtx = document.getElementById('statusDistributionChart');
        if (statusCtx && Object.keys(${JSON.stringify(data.taskAnalytics.statusDistribution)}).length > 0) {
            new Chart(statusCtx, {
                type: 'doughnut',
                data: {
                    labels: ${JSON.stringify(Object.keys(data.taskAnalytics.statusDistribution))},
                    datasets: [{
                        data: ${JSON.stringify(Object.values(data.taskAnalytics.statusDistribution))},
                        backgroundColor: ['#10b981', '#3b82f6', '#6b7280', '#f59e0b', '#ef4444'],
                        borderWidth: 2,
                        borderColor: '#ffffff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: { display: true, text: 'Task Status Distribution' },
                        legend: { position: 'bottom' }
                    }
                }
            });
        }

        // Priority Distribution Chart (if we have priority data)
        const priorityCtx = document.getElementById('priorityDistributionChart');
        if (priorityCtx && Object.keys(${JSON.stringify(data.taskAnalytics.priorityDistribution)}).length > 0) {
            new Chart(priorityCtx, {
                type: 'bar',
                data: {
                    labels: ${JSON.stringify(Object.keys(data.taskAnalytics.priorityDistribution))},
                    datasets: [{
                        label: 'Tasks',
                        data: ${JSON.stringify(Object.values(data.taskAnalytics.priorityDistribution))},
                        backgroundColor: ['#ef4444', '#f97316', '#eab308', '#22c55e'],
                        borderWidth: 1,
                        borderColor: '#ffffff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: { display: true, text: 'Priority Distribution' },
                        legend: { display: false }
                    },
                    scales: {
                        y: { beginAtZero: true }
                    }
                }
            });
        }

        // Completion Trends Chart (if we have trends data)
        const trendsCtx = document.getElementById('completionTrendsChart');
        if (trendsCtx && ${JSON.stringify(data.taskAnalytics.completionTrends)}.length > 0) {
            new Chart(trendsCtx, {
                type: 'line',
                data: {
                    labels: ${JSON.stringify(data.taskAnalytics.completionTrends.map((t) => t.period))},
                    datasets: [{
                        label: 'Completed Tasks',
                        data: ${JSON.stringify(data.taskAnalytics.completionTrends.map((t) => t.completed))},
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4,
                        fill: true
                    }, {
                        label: 'Started Tasks',
                        data: ${JSON.stringify(data.taskAnalytics.completionTrends.map((t) => t.started))},
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4,
                        fill: false
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom' }
                    },
                    scales: {
                        y: { beginAtZero: true }
                    }
                }
            });
        }
    });
    </script>`;
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
      });
    } catch {
      return dateString;
    }
  }
}
