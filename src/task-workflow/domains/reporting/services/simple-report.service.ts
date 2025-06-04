import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';

export interface SimpleReportData {
  tasks: SimpleTask[];
  summary: ReportSummary;
  chartData: SimpleChartData;
  metadata: ReportMetadata;
}

export interface SimpleTask {
  taskId: string;
  name: string;
  status: string;
  priority: string;
  owner: string;
  createdAt: string;
  completedAt?: string;

  // Computed fields
  duration: number; // hours
  delegationCount: number;
  hasCodeReview: boolean;
  hasResearch: boolean;
  subtaskCount: number;
  completedSubtasks: number;
  progress: number; // percentage
}

export interface ReportSummary {
  totalTasks: number;
  completed: number;
  inProgress: number;
  avgDuration: number;
  topPriorities: { priority: string; count: number }[];
  statusBreakdown: { status: string; count: number }[];
}

export interface SimpleChartData {
  statusChart: { labels: string[]; data: number[]; colors: string[] };
  priorityChart: { labels: string[]; data: number[]; colors: string[] };
  completionTrend: { labels: string[]; data: number[] };
}

export interface ReportMetadata {
  generatedAt: string;
  totalRecords: number;
  filters: any;
}

@Injectable()
export class SimpleReportService {
  private readonly logger = new Logger(SimpleReportService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get comprehensive report data with simple, reliable queries
   */
  async generateReportData(filters: any = {}): Promise<SimpleReportData> {
    try {
      // Simple, reliable queries
      const tasks = await this.getTasks(filters);
      const enrichedTasks = this.enrichTasks(tasks);
      const summary = this.calculateSummary(enrichedTasks);
      const chartData = this.generateChartData(enrichedTasks);

      return {
        tasks: enrichedTasks,
        summary,
        chartData,
        metadata: {
          generatedAt: new Date().toISOString(),
          totalRecords: enrichedTasks.length,
          filters,
        },
      };
    } catch (error) {
      this.logger.error('Failed to generate report data', error);
      throw new Error(`Report generation failed: ${error.message}`);
    }
  }

  /**
   * Simple task retrieval with basic relationships
   */
  private async getTasks(filters: any) {
    const where: any = {};

    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;
    if (filters.owner) where.owner = filters.owner;

    return await this.prisma.task.findMany({
      where,
      include: {
        delegationRecords: true,
        codeReviews: true,
        researchReports: true,
        subtasks: true,
      },
      orderBy: { creationDate: 'desc' },
    });
  }

  /**
   * Enrich tasks with computed fields
   */
  private enrichTasks(tasks: any[]): SimpleTask[] {
    return tasks.map((task) => {
      const createdAt = new Date(task.creationDate);
      const completedAt = task.completionDate
        ? new Date(task.completionDate)
        : null;
      const duration = completedAt
        ? (completedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
        : (new Date().getTime() - createdAt.getTime()) / (1000 * 60 * 60);

      const subtaskCount = task.subtasks?.length || 0;
      const completedSubtasks =
        task.subtasks?.filter((s: any) => s.status === 'completed').length || 0;
      const progress =
        subtaskCount > 0
          ? Math.round((completedSubtasks / subtaskCount) * 100)
          : 0;

      return {
        taskId: task.taskId,
        name: task.name,
        status: task.status,
        priority: task.priority || 'Medium',
        owner: task.owner || 'Unassigned',
        createdAt: task.creationDate.toISOString(),
        completedAt: task.completionDate?.toISOString(),

        // Computed fields
        duration: Math.round(duration * 10) / 10,
        delegationCount: task.delegationRecords?.length || 0,
        hasCodeReview: (task.codeReviews?.length || 0) > 0,
        hasResearch: (task.researchReports?.length || 0) > 0,
        subtaskCount,
        completedSubtasks,
        progress,
      };
    });
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(tasks: SimpleTask[]): ReportSummary {
    const totalTasks = tasks.length;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const inProgress = tasks.filter((t) => t.status === 'in-progress').length;

    const completedTasks = tasks.filter((t) => t.status === 'completed');
    const avgDuration =
      completedTasks.length > 0
        ? completedTasks.reduce((sum, t) => sum + t.duration, 0) /
          completedTasks.length
        : 0;

    // Priority breakdown
    const priorityCounts = tasks.reduce(
      (acc, task) => {
        acc[task.priority] = (acc[task.priority] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const topPriorities = Object.entries(priorityCounts)
      .map(([priority, count]) => ({ priority, count }))
      .sort((a, b) => b.count - a.count);

    // Status breakdown
    const statusCounts = tasks.reduce(
      (acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const statusBreakdown = Object.entries(statusCounts).map(
      ([status, count]) => ({ status, count }),
    );

    return {
      totalTasks,
      completed,
      inProgress,
      avgDuration: Math.round(avgDuration * 10) / 10,
      topPriorities,
      statusBreakdown,
    };
  }

  /**
   * Generate chart data for Alpine.js visualizations
   */
  private generateChartData(tasks: SimpleTask[]): SimpleChartData {
    // Status chart
    const statusCounts = tasks.reduce(
      (acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const statusLabels = Object.keys(statusCounts);
    const statusData = Object.values(statusCounts);
    const statusColors = statusLabels.map((status) =>
      this.getStatusColor(status),
    );

    // Priority chart
    const priorityCounts = tasks.reduce(
      (acc, task) => {
        acc[task.priority] = (acc[task.priority] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const priorityLabels = Object.keys(priorityCounts);
    const priorityData = Object.values(priorityCounts);
    const priorityColors = priorityLabels.map((priority) =>
      this.getPriorityColor(priority),
    );

    // Simple completion trend (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    const completionData = last7Days.map((date) => {
      return tasks.filter(
        (task) => task.completedAt && task.completedAt.split('T')[0] === date,
      ).length;
    });

    return {
      statusChart: {
        labels: statusLabels,
        data: statusData,
        colors: statusColors,
      },
      priorityChart: {
        labels: priorityLabels,
        data: priorityData,
        colors: priorityColors,
      },
      completionTrend: {
        labels: last7Days.map((date) =>
          new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        ),
        data: completionData,
      },
    };
  }

  private getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      completed: '#28a745',
      'in-progress': '#007bff',
      'not-started': '#6c757d',
      'needs-review': '#ffc107',
      'needs-changes': '#dc3545',
    };
    return colors[status] || '#6c757d';
  }

  private getPriorityColor(priority: string): string {
    const colors: Record<string, string> = {
      Critical: '#dc3545',
      High: '#fd7e14',
      Medium: '#ffc107',
      Low: '#28a745',
    };
    return colors[priority] || '#6c757d';
  }
}
