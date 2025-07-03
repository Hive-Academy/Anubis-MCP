import { Injectable } from '@nestjs/common';
import { RolePerformanceData } from '../../shared/types/report-data.types';

/**
 * Role Performance Generator Service
 *
 * This service is focused solely on generating role performance reports
 * following the Single Responsibility Principle and domain architecture.
 */
@Injectable()
export class RolePerformanceGeneratorService {
  /**
   * Generate role performance HTML using type-safe data
   */
  generateRolePerformance(data: RolePerformanceData): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    ${this.generateHead()}
</head>
<body class="bg-gray-50 font-sans">
    <div class="max-w-7xl mx-auto py-8 px-4">
        ${this.generateHeader(data)}
        ${this.generatePerformanceOverview(data.roleMetrics)}
        ${this.generateComparativeAnalysis(data.comparativeAnalysis)}
        ${this.generateWorkloadAnalysis(data.workloadAnalysis)}
        ${this.generateTimeSeriesAnalysis(data.timeSeriesAnalysis)}
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
    <title>Role Performance Analysis</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />`;
  }

  private generateHeader(data: RolePerformanceData): string {
    const totalTasks = data.roleMetrics.reduce(
      (sum, role) => sum + role.tasksReceived,
      0,
    );
    const completedTasks = data.roleMetrics.reduce(
      (sum, role) => sum + role.tasksCompleted,
      0,
    );
    const avgEfficiency =
      data.roleMetrics.reduce((sum, role) => sum + role.successRate, 0) /
      data.roleMetrics.length;

    return `
    <header class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
                <div class="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                    <i class="fas fa-users text-white text-xl"></i>
                </div>
                <div>
                    <h1 class="text-2xl font-bold text-gray-900">Role Performance Analysis</h1>
                    <p class="text-lg text-gray-700">Comprehensive role efficiency and workload analysis</p>
                    <p class="text-sm text-gray-600">Analysis Period: ${this.formatDateRange(data.metadata.analysisTimeframe)}</p>
                </div>
            </div>
            <div class="grid grid-cols-3 gap-4 text-center">
                <div>
                    <div class="text-2xl font-bold text-blue-600">${totalTasks}</div>
                    <div class="text-xs text-gray-600">Total Tasks</div>
                </div>
                <div>
                    <div class="text-2xl font-bold text-green-600">${completedTasks}</div>
                    <div class="text-xs text-gray-600">Completed</div>
                </div>
                <div>
                    <div class="text-2xl font-bold text-purple-600">${Math.round(avgEfficiency)}%</div>
                    <div class="text-xs text-gray-600">Avg Efficiency</div>
                </div>
            </div>
        </div>
    </header>`;
  }

  private generatePerformanceOverview(
    roleMetrics: RolePerformanceData['roleMetrics'],
  ): string {
    return `
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-6">Role Performance Overview</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${roleMetrics
              .map(
                (role) => `
                <div class="bg-gradient-to-r ${this.getRoleGradient(role.role)} rounded-lg p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-semibold text-white">${this.formatRoleName(role.role)}</h3>
                        <i class="fas fa-${this.getRoleIcon(role.role)} text-white text-xl"></i>
                    </div>
                    <div class="grid grid-cols-2 gap-4 text-white">
                        <div class="text-center">
                            <div class="text-2xl font-bold">${role.tasksReceived}</div>
                            <div class="text-xs opacity-80">Tasks Received</div>
                        </div>
                        <div class="text-center">
                            <div class="text-2xl font-bold">${role.tasksCompleted}</div>
                            <div class="text-xs opacity-80">Completed</div>
                        </div>
                        <div class="text-center">
                            <div class="text-2xl font-bold">${Math.round(role.successRate)}%</div>
                            <div class="text-xs opacity-80">Success Rate</div>
                        </div>
                        <div class="text-center">
                            <div class="text-2xl font-bold">${role.averageCompletionTime}h</div>
                            <div class="text-xs opacity-80">Avg Time</div>
                        </div>
                    </div>
                    <div class="mt-4">
                        <div class="flex justify-between text-sm text-white opacity-80 mb-1">
                            <span>Delegation Efficiency</span>
                            <span>${Math.round(role.delegationEfficiency)}%</span>
                        </div>
                        <div class="w-full bg-white bg-opacity-30 rounded-full h-2">
                            <div class="bg-white h-2 rounded-full" style="width: ${role.delegationEfficiency}%"></div>
                        </div>
                    </div>
                    <div class="mt-3">
                        <div class="flex justify-between text-sm text-white opacity-80 mb-1">
                            <span>Quality Score</span>
                            <span>${role.qualityScore}/10</span>
                        </div>
                        <div class="w-full bg-white bg-opacity-30 rounded-full h-2">
                            <div class="bg-white h-2 rounded-full" style="width: ${(role.qualityScore / 10) * 100}%"></div>
                        </div>
                    </div>
                </div>
            `,
              )
              .join('')}
        </div>
        <div class="mt-6">
            <canvas id="roleComparisonChart" width="400" height="300"></canvas>
        </div>
    </div>`;
  }

  private generateComparativeAnalysis(
    analysis: RolePerformanceData['comparativeAnalysis'],
  ): string {
    return `
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-6">Comparative Analysis</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <h3 class="text-md font-medium text-gray-900 mb-4">Top Performers</h3>
                <div class="space-y-3">
                    ${analysis.topPerformers
                      .map(
                        (performer, index) => `
                        <div class="flex items-center justify-between p-3 ${index === 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50'} border rounded-lg">
                            <div class="flex items-center space-x-3">
                                <div class="w-8 h-8 ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-400'} rounded-full flex items-center justify-center text-white text-sm font-bold">
                                    ${performer.rank}
                                </div>
                                <div>
                                    <div class="font-medium text-gray-900">${this.formatRoleName(performer.role)}</div>
                                    <div class="text-sm text-gray-600">${performer.metric}</div>
                                </div>
                            </div>
                            <div class="text-lg font-bold ${index === 0 ? 'text-yellow-600' : 'text-gray-600'}">${performer.value}${performer.metric.includes('Rate') || performer.metric.includes('Efficiency') ? '%' : ''}</div>
                        </div>
                    `,
                      )
                      .join('')}
                </div>
            </div>
            <div>
                <h3 class="text-md font-medium text-gray-900 mb-4">Improvement Areas</h3>
                <div class="space-y-3">
                    ${analysis.improvementAreas
                      .map(
                        (area) => `
                        <div class="p-3 border rounded-lg ${this.getImpactClasses(area.impact)}">
                            <div class="flex items-center justify-between mb-2">
                                <div class="font-medium text-gray-900">${this.formatRoleName(area.role)}</div>
                                <span class="text-xs px-2 py-1 rounded-full ${this.getImpactBadgeClasses(area.impact)}">${area.impact.toUpperCase()}</span>
                            </div>
                            <div class="text-sm text-gray-700 mb-2">${this.escapeHtml(area.issue)}</div>
                            <div class="text-xs text-gray-600">💡 ${this.escapeHtml(area.recommendation)}</div>
                        </div>
                    `,
                      )
                      .join('')}
                </div>
            </div>
        </div>
    </div>`;
  }

  private generateWorkloadAnalysis(
    workload: RolePerformanceData['workloadAnalysis'],
  ): string {
    return `
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-6">Workload Analysis</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <h3 class="text-md font-medium text-gray-900 mb-4">Current Workload</h3>
                <div class="space-y-3">
                    ${workload.currentWorkload
                      .map(
                        (role) => `
                        <div class="flex items-center justify-between p-3 border rounded-lg ${this.getCapacityClasses(role.capacity)}">
                            <div>
                                <div class="font-medium text-gray-900">${this.formatRoleName(role.role)}</div>
                                <div class="text-sm text-gray-600">${role.activeTasks} active, ${role.pendingTasks} pending</div>
                            </div>
                            <div class="text-right">
                                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${this.getCapacityBadgeClasses(role.capacity)}">
                                    ${role.capacity.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                                </span>
                            </div>
                        </div>
                    `,
                      )
                      .join('')}
                </div>
            </div>
            <div>
                <h3 class="text-md font-medium text-gray-900 mb-4">Balance Recommendations</h3>
                <div class="space-y-3">
                    ${workload.balanceRecommendations
                      .map(
                        (recommendation) => `
                        <div class="flex items-start space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <i class="fas fa-lightbulb text-blue-600 mt-1"></i>
                            <div class="text-sm text-blue-800">${this.escapeHtml(recommendation)}</div>
                        </div>
                    `,
                      )
                      .join('')}
                </div>
                <div class="mt-4">
                    <canvas id="workloadChart" width="400" height="300"></canvas>
                </div>
            </div>
        </div>
    </div>`;
  }

  private generateTimeSeriesAnalysis(
    timeSeries: RolePerformanceData['timeSeriesAnalysis'],
  ): string {
    return `
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-6">Performance Trends</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <h3 class="text-md font-medium text-gray-900 mb-3">Completion Rate Trends</h3>
                <canvas id="completionTrendsChart" width="400" height="300"></canvas>
            </div>
            <div>
                <h3 class="text-md font-medium text-gray-900 mb-3">Average Duration Trends</h3>
                <canvas id="durationTrendsChart" width="400" height="300"></canvas>
            </div>
        </div>
        <div class="mt-6">
            <h3 class="text-md font-medium text-gray-900 mb-3">Period Analysis</h3>
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                            ${Object.keys(
                              timeSeries.performanceTrends[0]?.roleMetrics ||
                                {},
                            )
                              .map(
                                (role) =>
                                  `<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">${this.formatRoleName(role)}</th>`,
                              )
                              .join('')}
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${timeSeries.performanceTrends
                          .map(
                            (trend) => `
                            <tr>
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${trend.period}</td>
                                ${Object.entries(trend.roleMetrics)
                                  .map(
                                    ([_role, metrics]) => `
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div>${metrics.completionRate}% completion</div>
                                        <div class="text-xs text-gray-400">${metrics.taskCount} tasks, ${metrics.averageDuration}h avg</div>
                                    </td>
                                `,
                                  )
                                  .join('')}
                            </tr>
                        `,
                          )
                          .join('')}
                    </tbody>
                </table>
            </div>
        </div>
    </div>`;
  }

  private generateFooter(metadata: RolePerformanceData['metadata']): string {
    return `
    <footer class="mt-8 text-center text-sm text-gray-500">
        Generated by ${this.escapeHtml(metadata.generatedBy)} • ${this.formatDate(metadata.generatedAt)}
    </footer>`;
  }

  private generateChartScripts(data: RolePerformanceData): string {
    return `
    <script>
        // Role Comparison Chart
        const roleCtx = document.getElementById('roleComparisonChart').getContext('2d');
        new Chart(roleCtx, {
            type: 'radar',
            data: {
                labels: ['Success Rate', 'Delegation Efficiency', 'Quality Score', 'Workload Distribution'],
                datasets: [
                    ${data.roleMetrics
                      .map(
                        (role, index) => `{
                        label: '${role.role}',
                        data: [${role.successRate}, ${role.delegationEfficiency}, ${role.qualityScore * 10}, ${role.workloadDistribution}],
                        borderColor: '${this.getChartColor(index)}',
                        backgroundColor: '${this.getChartColor(index, 0.2)}',
                        pointBackgroundColor: '${this.getChartColor(index)}',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2
                    }`,
                      )
                      .join(',')}
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: 'Role Performance Comparison' },
                    legend: { position: 'bottom' }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });

        // Workload Chart
        const workloadCtx = document.getElementById('workloadChart').getContext('2d');
        new Chart(workloadCtx, {
            type: 'doughnut',
            data: {
                labels: ${JSON.stringify(data.workloadAnalysis.currentWorkload.map((w) => w.role))},
                datasets: [{
                    data: ${JSON.stringify(data.workloadAnalysis.currentWorkload.map((w) => w.activeTasks + w.pendingTasks))},
                    backgroundColor: [
                        '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#6b7280'
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: 'Current Workload Distribution' },
                    legend: { position: 'bottom' }
                }
            }
        });

        // Completion Trends Chart
        const completionCtx = document.getElementById('completionTrendsChart').getContext('2d');
        new Chart(completionCtx, {
            type: 'line',
            data: {
                labels: ${JSON.stringify(data.timeSeriesAnalysis.performanceTrends.map((t) => t.period))},
                datasets: [
                    ${Object.keys(
                      data.timeSeriesAnalysis.performanceTrends[0]
                        ?.roleMetrics || {},
                    )
                      .map(
                        (role, index) => `{
                        label: '${role}',
                        data: ${JSON.stringify(data.timeSeriesAnalysis.performanceTrends.map((t) => t.roleMetrics[role]?.completionRate || 0))},
                        borderColor: '${this.getChartColor(index)}',
                        backgroundColor: '${this.getChartColor(index, 0.1)}',
                        tension: 0.4,
                        fill: false
                    }`,
                      )
                      .join(',')}
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                },
                scales: {
                    y: { beginAtZero: true, max: 100 }
                }
            }
        });

        // Duration Trends Chart
        const durationCtx = document.getElementById('durationTrendsChart').getContext('2d');
        new Chart(durationCtx, {
            type: 'bar',
            data: {
                labels: ${JSON.stringify(data.timeSeriesAnalysis.performanceTrends.map((t) => t.period))},
                datasets: [
                    ${Object.keys(
                      data.timeSeriesAnalysis.performanceTrends[0]
                        ?.roleMetrics || {},
                    )
                      .map(
                        (role, index) => `{
                        label: '${role}',
                        data: ${JSON.stringify(data.timeSeriesAnalysis.performanceTrends.map((t) => t.roleMetrics[role]?.averageDuration || 0))},
                        backgroundColor: '${this.getChartColor(index, 0.8)}',
                        borderColor: '${this.getChartColor(index)}',
                        borderWidth: 1
                    }`,
                      )
                      .join(',')}
                ]
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
    </script>`;
  }

  private getRoleGradient(role: string): string {
    const gradients: Record<string, string> = {
      boomerang: 'from-blue-500 to-blue-600',
      architect: 'from-purple-500 to-purple-600',
      'senior-developer': 'from-orange-500 to-orange-600',
      'code-review': 'from-red-500 to-red-600',
    };
    return gradients[role] || 'from-gray-500 to-gray-600';
  }

  private getRoleIcon(role: string): string {
    const icons: Record<string, string> = {
      boomerang: 'sync-alt',
      architect: 'drafting-compass',
      'senior-developer': 'code',
      'code-review': 'check-circle',
    };
    return icons[role] || 'user';
  }

  private formatRoleName(role: string): string {
    return role
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private getImpactClasses(impact: string): string {
    const classes: Record<string, string> = {
      low: 'bg-green-50 border-green-200',
      medium: 'bg-yellow-50 border-yellow-200',
      high: 'bg-red-50 border-red-200',
    };
    return classes[impact] || 'bg-gray-50 border-gray-200';
  }

  private getImpactBadgeClasses(impact: string): string {
    const classes: Record<string, string> = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800',
    };
    return classes[impact] || 'bg-gray-100 text-gray-800';
  }

  private getCapacityClasses(capacity: string): string {
    const classes: Record<string, string> = {
      underutilized: 'bg-blue-50 border-blue-200',
      optimal: 'bg-green-50 border-green-200',
      overloaded: 'bg-red-50 border-red-200',
    };
    return classes[capacity] || 'bg-gray-50 border-gray-200';
  }

  private getCapacityBadgeClasses(capacity: string): string {
    const classes: Record<string, string> = {
      underutilized: 'bg-blue-100 text-blue-800',
      optimal: 'bg-green-100 text-green-800',
      overloaded: 'bg-red-100 text-red-800',
    };
    return classes[capacity] || 'bg-gray-100 text-gray-800';
  }

  private getChartColor(index: number, alpha: number = 1): string {
    const colors = [
      '#3b82f6',
      '#10b981',
      '#8b5cf6',
      '#f59e0b',
      '#ef4444',
      '#6b7280',
    ];
    const color = colors[index % colors.length];
    if (alpha < 1) {
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return color;
  }

  private formatDateRange(timeframe: {
    startDate?: string;
    endDate?: string;
  }): string {
    if (timeframe.startDate && timeframe.endDate) {
      return `${this.formatDate(timeframe.startDate)} - ${this.formatDate(timeframe.endDate)}`;
    }
    return 'All time';
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
