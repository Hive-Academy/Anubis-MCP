/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, Logger } from '@nestjs/common';
import { FormattedDelegationData, FormattedTaskData } from '../../shared/types';
import {
  ChartValidationError,
  getPriorityColor,
  getRoleColor,
  getStatusColor,
  isValidChartConfiguration,
} from '../../shared/types/chart-types';

@Injectable()
export class DashboardChartBuilderService {
  private readonly logger = new Logger(DashboardChartBuilderService.name);
  /**
   * Build all chart data for the dashboard
   */
  buildAllCharts(
    tasks: FormattedTaskData[],
    _delegations: FormattedDelegationData[],
    taskDistribution: any,
    workflowMetrics: any,
  ) {
    return {
      statusDistribution: this.buildStatusChart(taskDistribution.byStatus),
      priorityDistribution: this.buildPriorityChart(
        taskDistribution.byPriority,
      ),
      completionTrend: this.buildCompletionTrendsChart(tasks),
      rolePerformance: this.buildRolePerformanceChart(
        workflowMetrics.roleEfficiency || [],
      ),
      delegationFlow: this.buildDelegationFlowChart(
        workflowMetrics.delegationFlow || [],
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

    // Return simple structure that validation expects
    return {
      id: 'statusChart',
      title: 'Task Status Distribution',
      type: 'doughnut',
      labels,
      data,
      colors,
      // Also include Chart.js config for JavaScript initialization
      chartConfig: {
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

    // Return simple structure that validation expects
    return {
      id: 'priorityChart',
      title: 'Task Priority Distribution',
      type: 'bar',
      labels,
      data,
      colors,
      // Also include Chart.js config for JavaScript initialization
      chartConfig: {
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
      },
    };
  }

  /**
   * Build completion trends chart data
   */
  private buildCompletionTrendsChart(tasks: FormattedTaskData[]) {
    const monthlyData = this.aggregateTasksByMonth(tasks);
    const labels = Object.keys(monthlyData).sort();
    const data = labels.map((month) => monthlyData[month].completed);

    // Return simple structure that validation expects
    return {
      id: 'completionTrendChart',
      title: 'Task Completion Trends',
      type: 'line',
      labels,
      data,
      colors: ['#10b981', '#3b82f6'],
      // Also include Chart.js config for JavaScript initialization
      chartConfig: {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Completed',
              data,
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              tension: 0.4,
            },
            {
              label: 'Started',
              data: labels.map((month) => monthlyData[month].started),
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
      },
    };
  }

  /**
   * Build role performance chart data with type validation
   */
  private buildRolePerformanceChart(roleEfficiency: any[]) {
    // Handle empty array case
    if (!roleEfficiency || roleEfficiency.length === 0) {
      const chart = {
        id: 'rolePerformanceChart',
        title: 'Role Performance',
        type: 'radar',
        labels: ['No Data'],
        data: [0],
        colors: ['#6b7280'], // Gray for no data
        chartConfig: {
          type: 'radar',
          data: {
            labels: ['No Data'],
            datasets: [
              {
                label: 'Success Rate (%)',
                data: [0],
                borderColor: '#8b5cf6',
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                borderWidth: 2,
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
        },
      };

      // Validate chart configuration
      if (!isValidChartConfiguration(chart)) {
        this.logger.warn('Invalid chart configuration for role performance');
        throw new ChartValidationError(
          'Role performance chart configuration is invalid',
          'rolePerformanceChart',
          ['Chart configuration validation failed'],
        );
      }

      return chart;
    }

    const labels = roleEfficiency.map((role) => role.role);
    const data = roleEfficiency.map((role) => role.successRate);
    const colors = this.getRoleColors(labels);

    // Return simple structure that validation expects
    const chart = {
      id: 'rolePerformanceChart',
      title: 'Role Performance',
      type: 'radar',
      labels,
      data,
      colors,
      // Also include Chart.js config for JavaScript initialization
      chartConfig: {
        type: 'radar',
        data: {
          labels,
          datasets: [
            {
              label: 'Success Rate (%)',
              data,
              borderColor: '#8b5cf6',
              backgroundColor: 'rgba(139, 92, 246, 0.1)',
              borderWidth: 2,
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
      },
    };

    // Validate chart configuration
    if (!isValidChartConfiguration(chart)) {
      this.logger.warn('Invalid chart configuration for role performance');
      throw new ChartValidationError(
        'Role performance chart configuration is invalid',
        'rolePerformanceChart',
        ['Chart configuration validation failed'],
      );
    }

    return chart;
  }

  /**
   * Build delegation flow chart data
   */
  private buildDelegationFlowChart(delegationFlow: any[]) {
    // Handle empty array case
    if (!delegationFlow || delegationFlow.length === 0) {
      return {
        type: 'horizontalBar',
        data: {
          labels: ['No Data'],
          datasets: [
            {
              label: 'Delegations',
              data: [0],
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
              text: 'Top Delegation Flows (No Data Available)',
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
    return statuses.map((status) => getStatusColor(status));
  }

  private getPriorityColors(priorities: string[]): string[] {
    return priorities.map((priority) => getPriorityColor(priority));
  }

  private getRoleColors(roles: string[]): string[] {
    return roles.map((role) => getRoleColor(role));
  }

  private aggregateTasksByMonth(tasks: FormattedTaskData[]) {
    const monthlyData: Record<string, { completed: number; started: number }> =
      {};

    tasks.forEach((task) => {
      // Handle undefined/null creationDate
      if (task.creationDate) {
        const creationMonth = task.creationDate.slice(0, 7); // YYYY-MM
        if (!monthlyData[creationMonth]) {
          monthlyData[creationMonth] = { completed: 0, started: 0 };
        }
        monthlyData[creationMonth].started++;
      }

      // Handle completed tasks - use completionDate if available, otherwise use creationDate for completed status
      if (task.status === 'completed') {
        let completionMonth: string;

        if (task.completionDate) {
          // Use actual completion date if available
          completionMonth = task.completionDate.slice(0, 7);
        } else if (task.creationDate) {
          // Fallback to creation date for completed tasks without completion date
          completionMonth = task.creationDate.slice(0, 7);
          this.logger.warn(
            `Task ${task.taskId} marked as completed but has no completionDate, using creationDate`,
          );
        } else {
          // Skip if no date information available
          this.logger.warn(
            `Task ${task.taskId} marked as completed but has no date information`,
          );
          return;
        }

        if (!monthlyData[completionMonth]) {
          monthlyData[completionMonth] = { completed: 0, started: 0 };
        }
        monthlyData[completionMonth].completed++;
      }
    });

    return monthlyData;
  }
}
