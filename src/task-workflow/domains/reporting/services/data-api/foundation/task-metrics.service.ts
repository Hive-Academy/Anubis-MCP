import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

export interface TaskMetrics {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  notStartedTasks: number;
  completionRate: number;
  avgCompletionTimeHours: number;
  priorityDistribution: PriorityDistribution[];
  tasksByOwner: OwnerDistribution[];
}

export interface PriorityDistribution {
  priority: string | null;
  count: number;
}

export interface OwnerDistribution {
  owner: string | null;
  count: number;
}

type WhereClause = Record<string, any>;

/**
 * Task Metrics Service
 *
 * Follows SRP: Single responsibility for task-related metrics only
 * Handles: Task counts, completion rates, priority distribution, owner distribution
 */
@Injectable()
export class TaskMetricsService {
  private readonly logger = new Logger(TaskMetricsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getTaskMetrics(whereClause: WhereClause): Promise<TaskMetrics> {
    try {
      this.logger.debug('Calculating task metrics');
      this.logger.debug(
        `Where Clause: ${JSON.stringify(whereClause, null, 2)}`,
      );

      const [
        totalTasks,
        completedTasks,
        inProgressTasks,
        notStartedTasks,
        priorityDistribution,
        tasksByOwner,
        completedTasksWithDates,
      ] = await Promise.all([
        this.prisma.task.count({ where: whereClause }),
        this.prisma.task.count({
          where: {
            ...whereClause,
            OR: [{ status: 'completed' }, { status: 'Completed' }],
          },
        }),
        this.prisma.task.count({
          where: { ...whereClause, status: 'in-progress' },
        }),
        this.prisma.task.count({
          where: { ...whereClause, status: 'not-started' },
        }),
        this.prisma.task.groupBy({
          by: ['priority'],
          _count: true,
          where: whereClause,
        }),
        this.prisma.task.groupBy({
          by: ['owner'],
          _count: true,
          where: whereClause,
        }),
        this.prisma.task.findMany({
          where: {
            ...whereClause,
            OR: [{ status: 'completed' }, { status: 'Completed' }],
            completionDate: { not: null },
          },
          select: {
            creationDate: true,
            completionDate: true,
          },
        }),
      ]);

      const avgCompletionTimeHours = this.calculateAverageCompletionTime(
        completedTasksWithDates,
      );

      return {
        totalTasks,
        completedTasks,
        inProgressTasks,
        notStartedTasks,
        completionRate:
          totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
        avgCompletionTimeHours,
        priorityDistribution:
          this.mapPriorityDistribution(priorityDistribution),
        tasksByOwner: this.mapOwnerDistribution(tasksByOwner),
      };
    } catch (error) {
      this.logger.error('Error calculating task metrics', error);
      return this.getDefaultTaskMetrics();
    }
  }

  private calculateAverageCompletionTime(
    completedTasks: Array<{ creationDate: Date; completionDate: Date | null }>,
  ): number {
    if (completedTasks.length === 0) return 0;

    const totalHours = completedTasks.reduce((sum, task) => {
      if (!task.completionDate) return sum;
      const diffMs =
        task.completionDate.getTime() - task.creationDate.getTime();
      return sum + diffMs / (1000 * 60 * 60); // Convert to hours
    }, 0);

    return totalHours / completedTasks.length;
  }

  private mapPriorityDistribution(data: any[]): PriorityDistribution[] {
    return data
      .filter((item) => item.priority !== null)
      .map((item) => ({
        priority: item.priority,
        count: item._count,
      }));
  }

  private mapOwnerDistribution(data: any[]): OwnerDistribution[] {
    return data
      .filter((item) => item.owner !== null)
      .map((item) => ({
        owner: item.owner,
        count: item._count,
      }));
  }

  private getDefaultTaskMetrics(): TaskMetrics {
    return {
      totalTasks: 0,
      completedTasks: 0,
      inProgressTasks: 0,
      notStartedTasks: 0,
      completionRate: 0,
      avgCompletionTimeHours: 0,
      priorityDistribution: [],
      tasksByOwner: [],
    };
  }
}
