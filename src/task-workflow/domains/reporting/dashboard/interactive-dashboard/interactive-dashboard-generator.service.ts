import { Injectable, Logger } from '@nestjs/common';
import {
  InteractiveDashboardData,
  TaskSummary,
  DelegationSummary,
  DashboardMetrics,
  ChartConfiguration,
} from '../../shared/types/report-data.types';

// Legacy interfaces for backward compatibility - will be removed in cleanup phase
export interface TaskTableRow {
  taskId: string;
  name: string;
  status: string;
  priority: string;
  owner: string;
  creationDate: string;
  duration: number;
}

export interface DelegationTableRow {
  id: number;
  fromMode: string;
  toMode: string;
  delegationTimestamp: string;
  success: boolean;
  duration: number;
  taskName?: string;
}

// Legacy interface for backward compatibility - will be removed in cleanup phase
export interface DashboardData {
  title: string;
  metrics: DashboardMetrics;
  charts: {
    statusDistribution: ChartConfiguration;
    priorityDistribution: ChartConfiguration;
    completionTrend: ChartConfiguration;
    rolePerformance: ChartConfiguration;
  };
  taskTable: {
    data: TaskTableRow[];
  };
  delegationTable: {
    data: DelegationTableRow[];
  };
  metadata: {
    generatedAt: string;
    version: string;
    generatedBy: string;
  };
}

/**
 * Interactive Dashboard Generator Service
 *
 * This service is focused solely on generating interactive dashboard HTML
 * following the Single Responsibility Principle and domain architecture.
 */
@Injectable()
export class InteractiveDashboardGeneratorService {
  private readonly logger = new Logger(
    InteractiveDashboardGeneratorService.name,
  );

  /**
   * Generate complete interactive dashboard HTML using type-safe data
   */
  generateInteractiveDashboard(data: InteractiveDashboardData): string {
    this.logger.log('Generating type-safe interactive dashboard HTML');
    this.logger.log(
      `Tasks: ${data.tasks.length}, Delegations: ${data.delegations.length}`,
    );

    return `
<!DOCTYPE html>
<html lang="en" class="h-full">
<head>
    ${this.generateHead(data.title)}
</head>
<body class="h-full bg-gray-50 font-sans">
    <div class="min-h-full">
        ${this.generateHeader(data.title, data.subtitle)}
        
        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div class="space-y-8">
                ${this.generateMetricsCards(data.metrics)}
                ${this.generateChartsGrid(data.charts)}
                ${this.generateTasksTable(data.tasks)}
                ${this.generateDelegationsTable(data.delegations)}
                ${this.generateQuickActions()}
            </div>
        </main>
        
        ${this.generateFooter(data.metadata)}
    </div>
    
    ${this.generateScripts(data)}
</body>
</html>`;
  }

  /**
   * Legacy method for backward compatibility - will be removed in cleanup phase
   */
  generateInteractiveDashboardLegacy(data: DashboardData): string {
    this.logger.log('Generating interactive dashboard HTML (legacy format)');
    this.logger.log(`Task table rows: ${data.taskTable.data.length}`);
    this.logger.log(
      `Delegation table rows: ${data.delegationTable.data.length}`,
    );

    // Convert legacy format to new type-safe format
    const typeSafeData: InteractiveDashboardData = {
      title: data.title,
      subtitle: 'Legacy Dashboard Format',
      metrics: data.metrics,
      charts: data.charts,
      tasks: data.taskTable.data.map((task) => ({
        taskId: task.taskId,
        name: task.name,
        status: task.status as any,
        priority: task.priority as any,
        owner: task.owner,
        createdAt: new Date(task.creationDate),
        duration: task.duration,
      })),
      delegations: data.delegationTable.data.map((delegation) => ({
        id: delegation.id,
        taskId: delegation.taskName || 'unknown',
        fromMode: delegation.fromMode as any,
        toMode: delegation.toMode as any,
        delegationTimestamp: delegation.delegationTimestamp,
        success: delegation.success,
        duration: delegation.duration,
        taskName: delegation.taskName,
      })),
      filters: {},
      metadata: {
        generatedAt: data.metadata.generatedAt,
        version: data.metadata.version,
        generatedBy: data.metadata.generatedBy,
        reportType: 'interactive-dashboard',
      },
    };

    return this.generateInteractiveDashboard(typeSafeData);
  }

  /**
   * Generate HTML head section
   */
  private generateHead(title: string): string {
    return `
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(title)} - Workflow Report</title>
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- Chart.js -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
    
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    
    ${this.generateStyles()}`;
  }

  /**
   * Generate custom CSS styles
   */
  private generateStyles(): string {
    return `
    <style>
        body { font-family: 'Inter', system-ui, sans-serif; }
        .card { @apply bg-white rounded-xl shadow-lg border border-gray-100 transition-all duration-200 hover:shadow-xl; }
        .metric-card { @apply card p-6 text-center hover:shadow-2xl transition-all duration-300 hover:-translate-y-1; }
        .metric-value { @apply text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent; }
        .metric-label { @apply text-sm font-medium text-gray-600 uppercase tracking-wide; }
        .status-badge { @apply inline-flex items-center px-3 py-1 rounded-full text-xs font-medium; }
        .status-completed { @apply bg-green-100 text-green-800; }
        .status-in-progress { @apply bg-blue-100 text-blue-800; }
        .status-needs-review { @apply bg-yellow-100 text-yellow-800; }
        .status-not-started { @apply bg-gray-100 text-gray-800; }
        .priority-high { @apply bg-red-100 text-red-800; }
        .priority-medium { @apply bg-yellow-100 text-yellow-800; }
        .priority-low { @apply bg-green-100 text-green-800; }
        .role-badge { @apply inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800; }
        .btn { @apply inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2; }
        .btn-primary { @apply btn text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500; }
        .btn-secondary { @apply btn text-gray-700 bg-white border-gray-300 hover:bg-gray-50 focus:ring-blue-500; }
    </style>`;
  }

  /**
   * Generate header section
   */
  private generateHeader(title: string, subtitle?: string): string {
    return `
    <header class="bg-white shadow-sm border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center py-6">
                <div class="flex items-center space-x-4">
                    <div class="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                        <i class="fas fa-chart-line text-white text-lg"></i>
                    </div>
                    <div>
                        <h1 class="text-2xl font-bold text-gray-900">${this.escapeHtml(title)}</h1>
                        <p class="text-sm text-gray-600">${subtitle ? this.escapeHtml(subtitle) : 'Real-time workflow analytics and insights'}</p>
                    </div>
                </div>
                <div class="flex items-center space-x-4">
                    <button onclick="window.print()" class="btn-secondary">
                        <i class="fas fa-print mr-2"></i>
                        Print Report
                    </button>
                    <button onclick="refreshDashboard()" class="btn-primary">
                        <i class="fas fa-refresh mr-2"></i>
                        Refresh
                    </button>
                </div>
            </div>
        </div>
    </header>`;
  }

  /**
   * Generate metrics cards section
   */
  private generateMetricsCards(metrics: DashboardMetrics): string {
    const cards = [
      {
        label: 'Total Tasks',
        value: metrics.totalTasks,
        icon: 'fas fa-tasks',
        color: 'blue',
      },
      {
        label: 'Completed',
        value: metrics.completedTasks,
        icon: 'fas fa-check-circle',
        color: 'green',
      },
      {
        label: 'In Progress',
        value: metrics.inProgressTasks,
        icon: 'fas fa-clock',
        color: 'yellow',
      },
      {
        label: 'Completion Rate',
        value: `${metrics.completionRate}%`,
        icon: 'fas fa-percentage',
        color: 'purple',
      },
      {
        label: 'Avg. Time',
        value: `${metrics.averageCompletionTime}h`,
        icon: 'fas fa-stopwatch',
        color: 'indigo',
      },
      {
        label: 'Delegations',
        value: metrics.totalDelegations,
        icon: 'fas fa-exchange-alt',
        color: 'pink',
      },
    ];

    return `
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        ${cards
          .map(
            (card) => `
            <div class="metric-card">
                <div class="w-12 h-12 mx-auto mb-4 bg-${card.color}-100 rounded-lg flex items-center justify-center">
                    <i class="${card.icon} text-${card.color}-600 text-xl"></i>
                </div>
                <div class="metric-value">${card.value}</div>
                <div class="metric-label">${card.label}</div>
            </div>
        `,
          )
          .join('')}
    </div>`;
  }

  /**
   * Generate charts grid section
   */
  private generateChartsGrid(
    charts: InteractiveDashboardData['charts'],
  ): string {
    return `
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        ${this.generateChart('statusChart', 'Task Status Distribution', charts.statusDistribution, 'pie')}
        ${this.generateChart('priorityChart', 'Priority Distribution', charts.priorityDistribution, 'doughnut')}
        ${this.generateChart('trendsChart', 'Completion Trends', charts.completionTrend, 'line')}
        ${this.generateChart('roleChart', 'Role Performance', charts.rolePerformance, 'bar')}
    </div>`;
  }

  /**
   * Generate individual chart
   */
  private generateChart(
    id: string,
    title: string,
    _chartConfig: ChartConfiguration,
    _type: string,
  ): string {
    return `
    <div class="card">
        <div class="px-6 py-4 border-b border-gray-100">
            <h3 class="text-lg font-semibold text-gray-900">${title}</h3>
        </div>
        <div class="p-6">
            <div class="relative h-64">
                <canvas id="${id}"></canvas>
            </div>
        </div>
    </div>`;
  }

  /**
   * Generate tasks table using type-safe TaskSummary data
   */
  private generateTasksTable(tasks: TaskSummary[]): string {
    if (!tasks || tasks.length === 0) {
      return this.generateEmptyTable('Recent Tasks', 'No tasks found');
    }

    return `
    <div class="card">
        <div class="px-6 py-4 border-b border-gray-100">
            <h3 class="text-lg font-semibold text-gray-900">Recent Tasks</h3>
            <p class="text-sm text-gray-600 mt-1">Latest workflow tasks and their current status</p>
        </div>
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    ${tasks
                      .slice(0, 10)
                      .map(
                        (task) => `
                        <tr class="hover:bg-gray-50">
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="text-sm font-medium text-gray-900">${this.escapeHtml(task.name)}</div>
                                <div class="text-sm text-gray-500">${this.escapeHtml(task.taskId)}</div>
                                ${task.taskSlug ? `<div class="text-xs text-blue-600">${this.escapeHtml(task.taskSlug)}</div>` : ''}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <span class="status-badge status-${task.status.replace('_', '-')}">${task.status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <span class="status-badge priority-${task.priority.toLowerCase()}">${task.priority}</span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <span class="role-badge">${task.owner}</span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                ${this.formatDate(task.createdAt.toISOString())}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                ${task.duration ? `${task.duration}h` : '-'}
                            </td>
                        </tr>
                    `,
                      )
                      .join('')}
                </tbody>
            </table>
        </div>
    </div>`;
  }

  /**
   * Generate delegations table using type-safe DelegationSummary data
   */
  private generateDelegationsTable(delegations: DelegationSummary[]): string {
    if (!delegations || delegations.length === 0) {
      return this.generateEmptyTable(
        'Recent Delegations',
        'No delegations found',
      );
    }

    return `
    <div class="card">
        <div class="px-6 py-4 border-b border-gray-100">
            <h3 class="text-lg font-semibold text-gray-900">Recent Delegations</h3>
            <p class="text-sm text-gray-600 mt-1">Latest workflow transitions and handoffs</p>
        </div>
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    ${delegations
                      .slice(0, 10)
                      .map(
                        (delegation) => `
                        <tr class="hover:bg-gray-50">
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="text-sm font-medium text-gray-900">${delegation.taskName ? this.escapeHtml(delegation.taskName) : 'Unknown Task'}</div>
                                <div class="text-sm text-gray-500">${this.escapeHtml(delegation.taskId)}</div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <span class="role-badge">${delegation.fromMode}</span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <span class="role-badge">${delegation.toMode}</span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                ${
                                  delegation.success !== undefined
                                    ? `<span class="status-badge ${delegation.success ? 'status-completed' : 'status-needs-review'}">${delegation.success ? 'Success' : 'Failed'}</span>`
                                    : '<span class="status-badge status-in-progress">In Progress</span>'
                                }
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                ${this.formatDate(delegation.delegationTimestamp)}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                ${delegation.duration ? `${delegation.duration}h` : '-'}
                            </td>
                        </tr>
                    `,
                      )
                      .join('')}
                </tbody>
            </table>
        </div>
    </div>`;
  }

  /**
   * Generate empty table placeholder
   */
  private generateEmptyTable(title: string, message: string): string {
    return `
    <div class="card">
        <div class="px-6 py-4 border-b border-gray-100">
            <h3 class="text-lg font-semibold text-gray-900">${title}</h3>
        </div>
        <div class="p-12 text-center">
            <div class="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <i class="fas fa-inbox text-gray-400 text-2xl"></i>
            </div>
            <p class="text-gray-500">${message}</p>
        </div>
    </div>`;
  }

  /**
   * Generate quick actions section
   */
  private generateQuickActions(): string {
    return `
    <div class="card">
        <div class="px-6 py-4 border-b border-gray-100">
            <h3 class="text-lg font-semibold text-gray-900">Quick Actions</h3>
            <p class="text-sm text-gray-600 mt-1">Common MCP commands and operations</p>
        </div>
        <div class="p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <button onclick="copyMcpCommand('create-task')" class="btn-secondary text-left p-4 h-auto">
                    <div class="flex items-start space-x-3">
                        <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <i class="fas fa-plus text-blue-600"></i>
                        </div>
                        <div>
                            <div class="font-medium text-gray-900">Create Task</div>
                            <div class="text-sm text-gray-500">Start new workflow task</div>
                        </div>
                    </div>
                </button>
                <button onclick="copyMcpCommand('query-tasks')" class="btn-secondary text-left p-4 h-auto">
                    <div class="flex items-start space-x-3">
                        <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <i class="fas fa-search text-green-600"></i>
                        </div>
                        <div>
                            <div class="font-medium text-gray-900">Query Tasks</div>
                            <div class="text-sm text-gray-500">List and filter tasks</div>
                        </div>
                    </div>
                </button>
                <button onclick="copyMcpCommand('generate-report')" class="btn-secondary text-left p-4 h-auto">
                    <div class="flex items-start space-x-3">
                        <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <i class="fas fa-chart-bar text-purple-600"></i>
                        </div>
                        <div>
                            <div class="font-medium text-gray-900">Generate Report</div>
                            <div class="text-sm text-gray-500">Create workflow report</div>
                        </div>
                    </div>
                </button>
            </div>
        </div>
    </div>`;
  }

  /**
   * Generate footer section
   */
  private generateFooter(
    metadata: InteractiveDashboardData['metadata'],
  ): string {
    return `
    <footer class="bg-white border-t border-gray-200 mt-12">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div class="flex items-center justify-between">
                <div class="text-sm text-gray-500">
                    Generated by ${this.escapeHtml(metadata.generatedBy)} • Version ${this.escapeHtml(metadata.version)}
                </div>
                <div class="text-sm text-gray-500">
                    Last updated: ${this.formatDate(metadata.generatedAt)}
                </div>
            </div>
        </div>
    </footer>`;
  }

  /**
   * Generate JavaScript section
   */
  private generateScripts(data: InteractiveDashboardData): string {
    return `
    <script>
        // Dashboard data
        window.dashboardData = ${JSON.stringify(data, null, 2)};
        
        // Initialize charts
        document.addEventListener('DOMContentLoaded', function() {
            initializeCharts();
        });
        
        function initializeCharts() {
            // Status Chart
            if (document.getElementById('statusChart')) {
                new Chart(document.getElementById('statusChart'), {
                    type: '${data.charts.statusDistribution.type}',
                    data: {
                        labels: ${JSON.stringify(data.charts.statusDistribution.labels)},
                        datasets: [{
                            data: ${JSON.stringify(data.charts.statusDistribution.data)},
                            backgroundColor: ${JSON.stringify(data.charts.statusDistribution.colors)}
                        }]
                    },
                    options: { responsive: true, maintainAspectRatio: false }
                });
            }
            
            // Priority Chart
            if (document.getElementById('priorityChart')) {
                new Chart(document.getElementById('priorityChart'), {
                    type: '${data.charts.priorityDistribution.type}',
                    data: {
                        labels: ${JSON.stringify(data.charts.priorityDistribution.labels)},
                        datasets: [{
                            data: ${JSON.stringify(data.charts.priorityDistribution.data)},
                            backgroundColor: ${JSON.stringify(data.charts.priorityDistribution.colors)}
                        }]
                    },
                    options: { responsive: true, maintainAspectRatio: false }
                });
            }
            
            // Trends Chart
            if (document.getElementById('trendsChart')) {
                new Chart(document.getElementById('trendsChart'), {
                    type: '${data.charts.completionTrend.type}',
                    data: {
                        labels: ${JSON.stringify(data.charts.completionTrend.labels)},
                        datasets: [{
                            label: 'Completion Trend',
                            data: ${JSON.stringify(data.charts.completionTrend.data)},
                            borderColor: '#3B82F6',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            fill: true
                        }]
                    },
                    options: { responsive: true, maintainAspectRatio: false }
                });
            }
            
            // Role Chart
            if (document.getElementById('roleChart')) {
                new Chart(document.getElementById('roleChart'), {
                    type: '${data.charts.rolePerformance.type}',
                    data: {
                        labels: ${JSON.stringify(data.charts.rolePerformance.labels)},
                        datasets: [{
                            label: 'Performance Score',
                            data: ${JSON.stringify(data.charts.rolePerformance.data)},
                            backgroundColor: '#8B5CF6'
                        }]
                    },
                    options: { responsive: true, maintainAspectRatio: false }
                });
            }
        }
        
        // Utility functions
        function refreshDashboard() {
            window.location.reload();
        }
        
        function copyMcpCommand(type) {
            const commands = {
                'create-task': 'task_operations({ operation: "create", taskData: { name: "New Task", priority: "Medium" } })',
                'query-tasks': 'task_operations({ operation: "list", includeDescription: true })',
                'generate-report': 'generate_workflow_report({ reportType: "interactive-dashboard", outputFormat: "html" })'
            };
            
            const command = commands[type];
            if (command) {
                navigator.clipboard.writeText(command).then(() => {
                    alert('MCP command copied to clipboard!');
                });
            }
        }
    </script>`;
  }

  /**
   * Utility functions
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
