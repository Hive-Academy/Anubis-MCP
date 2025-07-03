import { Injectable, Logger } from '@nestjs/common';
import { IReportTransformService } from './interfaces';
import {
  TransformOptions,
  ChartData,
  TaskWithRelations,
  DelegationRecordWithRelations,
  WorkflowTransitionWithRelations,
  FormattedTaskData,
  FormattedDelegationData,
  FormattedWorkflowData,
  SummaryStats,
  PerformanceMetrics,
  TimeframeAggregation,
  RoleAggregation,
} from './types';

/**
 * Data transformation and formatting service
 * Follows KISS principle with focused transformation logic
 * Max 200 lines following architecture guidelines
 */
@Injectable()
export class ReportTransformService implements IReportTransformService {
  private readonly logger = new Logger(ReportTransformService.name);

  /**
   * Format task data for reporting
   */
  formatTaskData(
    task: TaskWithRelations,
    options: TransformOptions = {},
  ): FormattedTaskData {
    return {
      taskId: task.id,
      name: task.name,
      slug: task.slug,
      status: task.status,
      owner: task.owner,
      priority: task.priority,
      creationDate: this.formatDate(task.createdAt, options.dateFormat),
      completionDate: task.completionDate
        ? this.formatDate(task.completionDate, options.dateFormat)
        : null,
      duration: this.calculateDuration(
        task.createdAt,
        task.completionDate || undefined,
      ),
      ...(options.includeMetadata && {
        delegationCount: task.delegationRecords?.length || 0,
        transitionCount: task.workflowTransitions?.length || 0,
        subtaskCount: task.subtasks?.length || 0,
      }),
    };
  }

  /**
   * Format delegation data for reporting
   */
  formatDelegationData(
    delegations: DelegationRecordWithRelations[],
    options: TransformOptions = {},
  ): FormattedDelegationData[] {
    return delegations.map((delegation) => ({
      id: delegation.id,
      fromMode: delegation.fromMode,
      toMode: delegation.toMode,
      delegationTimestamp: this.formatDate(
        delegation.delegationTimestamp,
        options.dateFormat,
      ),
      completionTimestamp: delegation.completionTimestamp
        ? this.formatDate(delegation.completionTimestamp, options.dateFormat)
        : null,
      success: delegation.success,
      duration: this.calculateDelegationDuration(delegation),
      subtaskName: delegation.subtask?.name,
      taskName: delegation.task?.name,
    }));
  }

  /**
   * Format workflow transition data
   */
  formatWorkflowData(
    transitions: WorkflowTransitionWithRelations[],
    options: TransformOptions = {},
  ): FormattedWorkflowData[] {
    return transitions.map((transition) => ({
      id: transition.id,
      fromMode: transition.fromMode,
      toMode: transition.toMode,
      transitionTimestamp: this.formatDate(
        transition.transitionTimestamp,
        options.dateFormat,
      ),
      reason: transition.reason,
      taskName: transition.task?.name,
    }));
  }

  /**
   * Prepare Chart.js compatible data
   */
  prepareChartData(
    data: FormattedTaskData[] | FormattedDelegationData[],
    chartType: string,
  ): ChartData {
    switch (chartType) {
      case 'status-distribution':
        return this.prepareStatusChart(data as FormattedTaskData[]);
      case 'priority-distribution':
        return this.preparePriorityChart(data as FormattedTaskData[]);
      case 'delegation-flow':
        return this.prepareDelegationChart(data as FormattedDelegationData[]);
      case 'timeline':
        return this.prepareTimelineChart(data as FormattedTaskData[]);
      default:
        throw new Error(`Unsupported chart type: ${chartType}`);
    }
  }

  /**
   * Calculate summary statistics
   */
  calculateSummaryStats(data: FormattedTaskData[]): SummaryStats {
    const total = data.length;
    const completed = data.filter((item) => item.status === 'completed').length;
    const inProgress = data.filter(
      (item) => item.status === 'in-progress',
    ).length;
    const notStarted = data.filter(
      (item) => item.status === 'not-started',
    ).length;

    return {
      total,
      completed,
      inProgress,
      notStarted,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }

  /**
   * Calculate performance metrics
   */
  calculatePerformanceMetrics(data: FormattedTaskData[]): PerformanceMetrics {
    const completedTasks = data.filter((item) => item.completionDate);
    const durations = completedTasks
      .map((task) => task.duration)
      .filter((d) => d > 0);

    return {
      averageDuration:
        durations.length > 0
          ? Math.round(
              durations.reduce((sum, d) => sum + d, 0) / durations.length,
            )
          : 0,
      fastestCompletion: durations.length > 0 ? Math.min(...durations) : 0,
      slowestCompletion: durations.length > 0 ? Math.max(...durations) : 0,
      totalCompleted: completedTasks.length,
    };
  }

  /**
   * Aggregate data by timeframe
   */
  aggregateByTimeframe(
    data:
      | FormattedTaskData[]
      | FormattedDelegationData[]
      | FormattedWorkflowData[],
    timeframe: 'day' | 'week' | 'month',
  ): TimeframeAggregation[] {
    const grouped = new Map<string, TimeframeAggregation>();

    data.forEach((item) => {
      let dateString: string;

      if ('creationDate' in item) {
        dateString = item.creationDate;
      } else if ('delegationTimestamp' in item) {
        dateString = item.delegationTimestamp;
      } else {
        dateString = item.transitionTimestamp;
      }

      const date = new Date(dateString);
      const key = this.getTimeframeKey(date, timeframe);

      if (!grouped.has(key)) {
        grouped.set(key, { period: key, count: 0, items: [] });
      }

      const group = grouped.get(key)!;
      group.count++;
      group.items.push(item);
    });

    return Array.from(grouped.values()).sort((a, b) =>
      a.period.localeCompare(b.period),
    );
  }

  /**
   * Aggregate data by role
   */
  aggregateByRole(
    data: FormattedDelegationData[] | FormattedTaskData[],
  ): RoleAggregation[] {
    const roleStats = new Map<string, RoleAggregation>();

    data.forEach((item) => {
      let role: string;

      if ('toMode' in item) {
        role = item.toMode;
      } else {
        role = item.owner || 'Unknown';
      }

      if (!roleStats.has(role)) {
        roleStats.set(role, { role, count: 0, items: [] });
      }

      const stats = roleStats.get(role)!;
      stats.count++;
      stats.items.push(item);
    });

    return Array.from(roleStats.values()).sort((a, b) => b.count - a.count);
  }

  // Private helper methods
  private formatDate(date: Date, format?: string): string {
    if (!date) return '';

    switch (format) {
      case 'short':
        return date.toLocaleDateString();
      case 'long':
        return date.toLocaleString();
      default:
        return date.toISOString();
    }
  }

  private calculateDuration(start: Date, end?: Date): number {
    if (!end) return 0;
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60)); // hours
  }

  private calculateDelegationDuration(
    delegation: DelegationRecordWithRelations,
  ): number {
    if (!delegation.completionTimestamp) return 0;
    const start = new Date(delegation.delegationTimestamp);
    const end = new Date(delegation.completionTimestamp);
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60)); // hours
  }

  // Chart preparation methods
  private prepareStatusChart(data: FormattedTaskData[]): ChartData {
    const statusCounts = new Map<string, number>();

    data.forEach((task) => {
      const status = task.status;
      statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
    });

    return {
      labels: Array.from(statusCounts.keys()),
      datasets: [
        {
          label: 'Task Status Distribution',
          data: Array.from(statusCounts.values()),
          backgroundColor: [
            '#10B981', // green for completed
            '#3B82F6', // blue for in-progress
            '#6B7280', // gray for not-started
            '#F59E0B', // yellow for needs-review
            '#EF4444', // red for needs-changes
          ],
        },
      ],
    };
  }

  private preparePriorityChart(data: FormattedTaskData[]): ChartData {
    const priorityCounts = new Map<string, number>();

    data.forEach((task) => {
      const priority = task.priority || 'Unknown';
      priorityCounts.set(priority, (priorityCounts.get(priority) || 0) + 1);
    });

    return {
      labels: Array.from(priorityCounts.keys()),
      datasets: [
        {
          label: 'Task Priority Distribution',
          data: Array.from(priorityCounts.values()),
          backgroundColor: [
            '#EF4444', // red for Critical
            '#F59E0B', // orange for High
            '#10B981', // green for Medium
            '#6B7280', // gray for Low
          ],
        },
      ],
    };
  }

  private prepareDelegationChart(data: FormattedDelegationData[]): ChartData {
    const flowCounts = new Map<string, number>();

    data.forEach((delegation) => {
      const flow = `${delegation.fromMode} → ${delegation.toMode}`;
      flowCounts.set(flow, (flowCounts.get(flow) || 0) + 1);
    });

    return {
      labels: Array.from(flowCounts.keys()),
      datasets: [
        {
          label: 'Delegation Flow',
          data: Array.from(flowCounts.values()),
          backgroundColor: '#3B82F6',
          borderColor: '#1D4ED8',
          borderWidth: 1,
        },
      ],
    };
  }

  private prepareTimelineChart(data: FormattedTaskData[]): ChartData {
    const timelineData = this.aggregateByTimeframe(data, 'week');

    return {
      labels: timelineData.map((item) => item.period),
      datasets: [
        {
          label: 'Tasks Created',
          data: timelineData.map((item) => item.count),
          backgroundColor: '#10B981',
          borderColor: '#059669',
          borderWidth: 2,
        },
      ],
    };
  }

  private getTimeframeKey(
    date: Date,
    timeframe: 'day' | 'week' | 'month',
  ): string {
    switch (timeframe) {
      case 'day':
        return date.toISOString().split('T')[0];
      case 'week':
        return `${date.getFullYear()}-W${this.getWeekNumber(date).toString().padStart(2, '0')}`;
      case 'month':
        return `${date.getFullYear()}-${(date.getMonth() + 1)
          .toString()
          .padStart(2, '0')}`;
      default:
        return date.toISOString().split('T')[0];
    }
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
    );
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }
}
