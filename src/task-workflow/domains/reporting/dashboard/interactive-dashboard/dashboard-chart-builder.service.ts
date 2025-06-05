import { Injectable } from '@nestjs/common';
import { FormattedTaskData, FormattedDelegationData } from '../../shared/types';

@Injectable()
export class DashboardChartBuilderService {
  /**
   * Build all chart data for the dashboard
   */
  buildAllCharts(
    tasks: FormattedTaskData[],
    delegations: FormattedDelegationData[],
    taskDistribution: any,
    workflowMetrics: any,
  ) {
    return {
      statusDistribution: this.buildStatusChart(taskDistribution.byStatus),
      priorityDistribution: this.buildPriorityChart(
        taskDistribution.byPriority,
      ),
      completionTrends: this.buildCompletionTrendsChart(tasks),
      rolePerformance: this.buildRolePerformanceChart(
        workflowMetrics.roleEfficiency,
      ),
      delegationFlow: this.buildDelegationFlowChart(
        workflowMetrics.delegationFlow,
      ),
    };
  }

  /**
   * Build status distribution chart data
   */
  private buildStatusChart(statusData: Record<string, number>) {
    const labels = Object.keys(statusData);
    const data = Object.values(statusData);
    const colors = this.getStatusColors(labels);

    return {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: colors,
            borderWidth: 2,
            borderColor: '#ffffff',
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
          },
          title: {
            display: true,
            text: 'Task Status Distribution',
          },
        },
      },
    };
  }

  /**
   * Build priority distribution chart data
   */
  private buildPriorityChart(priorityData: Record<string, number>) {
    const labels = Object.keys(priorityData);
    const data = Object.values(priorityData);
    const colors = this.getPriorityColors(labels);

    return {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Tasks',
            data,
            backgroundColor: colors,
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false,
          },
          title: {
            display: true,
            text: 'Task Priority Distribution',
          },
        },
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    };
  }

  /**
   * Build completion trends chart data
   */
  private buildCompletionTrendsChart(tasks: FormattedTaskData[]) {
    const monthlyData = this.aggregateTasksByMonth(tasks);
    const labels = Object.keys(monthlyData).sort();
    const completedData = labels.map((month) => monthlyData[month].completed);
    const startedData = labels.map((month) => monthlyData[month].started);

    return {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Completed',
            data: completedData,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4,
          },
          {
            label: 'Started',
            data: startedData,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Task Completion Trends',
          },
        },
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    };
  }

  /**
   * Build role performance chart data
   */
  private buildRolePerformanceChart(roleEfficiency: any[]) {
    const labels = roleEfficiency.map((r) => r.role);
    const successRates = roleEfficiency.map((r) => r.successRate);

    return {
      type: 'radar',
      data: {
        labels,
        datasets: [
          {
            label: 'Success Rate (%)',
            data: successRates,
            borderColor: '#8b5cf6',
            backgroundColor: 'rgba(139, 92, 246, 0.2)',
            pointBackgroundColor: '#8b5cf6',
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Role Performance',
          },
        },
        scales: {
          r: {
            beginAtZero: true,
            max: 100,
          },
        },
      },
    };
  }

  /**
   * Build delegation flow chart data
   */
  private buildDelegationFlowChart(delegationFlow: any[]) {
    const labels = delegationFlow.map((d) => `${d.fromRole} → ${d.toRole}`);
    const counts = delegationFlow.map((d) => d.count);

    return {
      type: 'horizontalBar',
      data: {
        labels,
        datasets: [
          {
            label: 'Delegations',
            data: counts,
            backgroundColor: '#f59e0b',
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false,
          },
          title: {
            display: true,
            text: 'Top Delegation Flows',
          },
        },
        scales: {
          x: {
            beginAtZero: true,
          },
        },
      },
    };
  }

  private getStatusColors(statuses: string[]): string[] {
    const colorMap: Record<string, string> = {
      completed: '#10b981',
      'in-progress': '#3b82f6',
      'not-started': '#6b7280',
      'needs-review': '#f59e0b',
      'needs-changes': '#ef4444',
      paused: '#8b5cf6',
      cancelled: '#374151',
    };

    return statuses.map((status) => colorMap[status] || '#6b7280');
  }

  private getPriorityColors(priorities: string[]): string[] {
    const colorMap: Record<string, string> = {
      Critical: '#ef4444',
      High: '#f59e0b',
      Medium: '#3b82f6',
      Low: '#10b981',
      Unknown: '#6b7280',
    };

    return priorities.map((priority) => colorMap[priority] || '#6b7280');
  }

  private aggregateTasksByMonth(tasks: FormattedTaskData[]) {
    const monthlyData: Record<string, { completed: number; started: number }> =
      {};

    tasks.forEach((task) => {
      const creationMonth = task.creationDate.slice(0, 7); // YYYY-MM
      if (!monthlyData[creationMonth]) {
        monthlyData[creationMonth] = { completed: 0, started: 0 };
      }
      monthlyData[creationMonth].started++;

      if (task.status === 'completed' && task.completionDate) {
        const completionMonth = task.completionDate.slice(0, 7);
        if (!monthlyData[completionMonth]) {
          monthlyData[completionMonth] = { completed: 0, started: 0 };
        }
        monthlyData[completionMonth].completed++;
      }
    });

    return monthlyData;
  }
}
