/**
 * Delegation Analytics Data API Service
 *
 * Focused service providing delegation patterns and role efficiency data for delegation-analytics.hbs template.
 * Uses proper separation of concerns:
 * - ReportDataAccessService: Pure Prisma API interface
 * - This service: Business logic + data transformation for delegation analytics
 *
 * Enhanced with task-specific delegation analytics for meaningful insights
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  DelegationAnalyticsTemplateData,
  DelegationAnalyticsDataService,
  DelegationMetrics,
  DelegationBottleneck,
  TaskSummary,
  TaskDelegationContext,
} from './delegation-analytics-template.interface';

// Foundation services
import { ReportDataAccessService } from '../foundation/report-data-access.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DelegationAnalyticsDataApiService
  implements DelegationAnalyticsDataService
{
  private readonly logger = new Logger(DelegationAnalyticsDataApiService.name);

  constructor(
    private readonly reportDataAccess: ReportDataAccessService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Get comprehensive delegation analytics data
   * Enhanced to support task-specific analysis
   */
  async getDelegationAnalyticsData(
    startDate: Date,
    endDate: Date,
    filters?: Record<string, string>,
  ): Promise<DelegationAnalyticsTemplateData> {
    this.logger.debug(
      `Generating delegation analytics with dates: ${startDate.toISOString()} to ${endDate.toISOString()}`,
    );
    this.logger.debug('Filters:', JSON.stringify(filters));

    // Check if this is a task-specific analysis
    const taskId = filters?.taskId;
    const isTaskSpecific = !!taskId;

    // Build where clause using foundation service
    const whereClause = this.reportDataAccess.buildWhereClause(
      startDate,
      endDate,
      filters as any,
    );

    this.logger.debug('Built whereClause:', JSON.stringify(whereClause));

    // Get base metrics using foundation service
    const baseMetrics = await this.reportDataAccess.getBaseMetrics(whereClause);

    this.logger.debug(
      'Base metrics received:',
      JSON.stringify({
        totalDelegations: baseMetrics.delegations.totalDelegations,
        roleStats: baseMetrics.delegations.roleStats,
        successRate: baseMetrics.delegations.successRate,
      }),
    );

    // Get task context if this is task-specific
    let taskContext = null;
    if (isTaskSpecific) {
      this.logger.debug(`Getting task context for taskId: ${taskId}`);
      taskContext = await this.getTaskContext(taskId);
      this.logger.debug(
        'Task context retrieved:',
        JSON.stringify(taskContext, null, 2),
      );
    }

    // Generate focused delegation metrics
    const delegationMetrics = this.generateDelegationMetrics(
      baseMetrics.delegations,
      startDate,
      endDate,
    );

    // Get available tasks for task selector
    const availableTasks = await this.getAvailableTasksForDelegation(
      startDate,
      endDate,
    );

    return {
      generatedAt: new Date(),
      dateRange: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
      },
      reportType: 'delegation_analytics',
      taskContext,
      availableTasks,
      isTaskSpecific,
      metrics: {
        delegations: delegationMetrics,
      },
    };
  }

  /**
   * Get task context for task-specific delegation analytics
   */
  private async getTaskContext(
    taskId: string,
  ): Promise<TaskDelegationContext | null> {
    try {
      this.logger.debug(`Fetching task details for taskId: ${taskId}`);

      // Get task details from the database using injected Prisma service
      const task = await this.prisma.task.findUnique({
        where: { taskId },
        include: {
          taskDescription: true,
          delegationRecords: {
            orderBy: { delegationTimestamp: 'asc' },
            include: {
              task: {
                select: {
                  taskId: true,
                  name: true,
                  status: true,
                  priority: true,
                  currentMode: true,
                },
              },
            },
          },
          workflowTransitions: {
            orderBy: { transitionTimestamp: 'asc' },
          },
        },
      });

      if (!task) {
        this.logger.warn(`Task ${taskId} not found`);
        return null;
      }

      this.logger.debug(
        `Task found: ${task.name}, delegations: ${task.delegationRecords?.length || 0}`,
      );

      // Calculate task-specific delegation metrics
      const delegationFlow =
        task.delegationRecords?.map((delegation, index) => ({
          step: index + 1,
          fromRole: delegation.fromMode,
          toRole: delegation.toMode,
          timestamp: delegation.delegationTimestamp,
          completed: delegation.completionTimestamp !== null,
          success: delegation.success,
          duration: delegation.completionTimestamp
            ? this.calculateDuration(
                delegation.delegationTimestamp,
                delegation.completionTimestamp,
              )
            : null,
          redelegationCount: delegation.redelegationCount || 0,
        })) || [];

      this.logger.debug(
        `Delegation flow calculated: ${delegationFlow.length} steps`,
      );

      return {
        taskId: task.taskId,
        name: task.name,
        status: task.status,
        priority: task.priority,
        currentMode: task.currentMode,
        creationDate: task.creationDate,
        completionDate: task.completionDate,
        description:
          task.taskDescription?.description || 'No description available',
        totalDelegations: task.delegationRecords?.length || 0,
        delegationFlow,
        currentStep: delegationFlow.length,
        isCompleted: task.status === 'completed',
        totalDuration: this.calculateTotalTaskDuration(
          task.creationDate,
          task.completionDate,
        ),
      } as TaskDelegationContext;
    } catch (error) {
      this.logger.error(`Error getting task context for ${taskId}:`, error);
      return null;
    }
  }

  /**
   * Get available tasks that have delegation records for the task selector
   */
  private async getAvailableTasksForDelegation(
    startDate: Date,
    endDate: Date,
  ): Promise<TaskSummary[]> {
    try {
      // Use injected Prisma service directly
      const tasks = await this.prisma.task.findMany({
        where: {
          delegationRecords: {
            some: {
              delegationTimestamp: {
                gte: startDate,
                lte: endDate,
              },
            },
          },
        },
        include: {
          _count: {
            select: {
              delegationRecords: true,
            },
          },
        },
        orderBy: [{ creationDate: 'desc' }],
        take: 20, // Limit to recent tasks
      });

      return tasks.map(
        (task): TaskSummary => ({
          taskId: task.taskId,
          name: task.name,
          status: task.status,
          priority: task.priority,
          delegationCount: task._count.delegationRecords,
          creationDate: task.creationDate,
        }),
      );
    } catch (error) {
      this.logger.error('Error getting available tasks:', error);
      return [];
    }
  }

  /**
   * Calculate duration between two dates in hours
   */
  private calculateDuration(start: Date, end: Date): number {
    const diffMs = new Date(end).getTime() - new Date(start).getTime();
    return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100; // Hours with 2 decimal places
  }

  /**
   * Calculate total task duration
   */
  private calculateTotalTaskDuration(
    creationDate: Date,
    completionDate: Date | null,
  ): number | null {
    if (!completionDate) return null;
    return this.calculateDuration(creationDate, completionDate);
  }

  /**
   * Calculate role efficiency metrics with focused business logic
   */
  async calculateRoleEfficiency(
    startDate: Date,
    endDate: Date,
  ): Promise<DelegationMetrics['roleEfficiency']> {
    const whereClause = this.reportDataAccess.buildWhereClause(
      startDate,
      endDate,
    );
    const baseMetrics = await this.reportDataAccess.getBaseMetrics(whereClause);

    // Use the existing roleEfficiency from delegation metrics
    return baseMetrics.delegations.roleEfficiency;
  }

  /**
   * Analyze workflow bottlenecks with meaningful insights
   */
  async analyzeWorkflowBottlenecks(
    startDate: Date,
    endDate: Date,
  ): Promise<DelegationBottleneck[]> {
    const whereClause = this.reportDataAccess.buildWhereClause(
      startDate,
      endDate,
    );
    const baseMetrics = await this.reportDataAccess.getBaseMetrics(whereClause);

    const bottlenecks: DelegationBottleneck[] = [];

    // Analyze delegation patterns for bottlenecks
    if (baseMetrics.delegations.avgHandoffTime > 24) {
      bottlenecks.push({
        role: 'system-wide',
        issue: `High average handoff time: ${baseMetrics.delegations.avgHandoffTime.toFixed(1)} hours`,
        impact: 'high',
      });
    }

    if (baseMetrics.delegations.avgRedelegationCount > 1.5) {
      bottlenecks.push({
        role: 'workflow',
        issue: `High redelegation rate: ${baseMetrics.delegations.avgRedelegationCount.toFixed(1)} per task`,
        impact: 'medium',
      });
    }

    // Analyze role-specific bottlenecks using roleEfficiency
    const roleEfficiency = baseMetrics.delegations.roleEfficiency;
    Object.entries(roleEfficiency).forEach(([role, efficiency]) => {
      if (efficiency < 0.5) {
        bottlenecks.push({
          role: role,
          issue: `Low efficiency score: ${(efficiency * 100).toFixed(1)}%`,
          impact: efficiency < 0.3 ? 'high' : 'medium',
        });
      }
    });

    return bottlenecks;
  }

  /**
   * Generate role transition matrix for workflow analysis
   */
  async generateTransitionMatrix(
    startDate: Date,
    endDate: Date,
  ): Promise<DelegationMetrics['transitionMatrix']> {
    const whereClause = this.reportDataAccess.buildWhereClause(
      startDate,
      endDate,
    );
    const baseMetrics = await this.reportDataAccess.getBaseMetrics(whereClause);

    // Use the existing transitionMatrix from delegation metrics
    return baseMetrics.delegations.transitionMatrix;
  }

  // ===== PRIVATE BUSINESS LOGIC METHODS =====

  /**
   * Generate comprehensive delegation metrics
   */
  private generateDelegationMetrics(
    delegationData: any,
    _startDate: Date,
    _endDate: Date,
  ): DelegationMetrics {
    // Use the data directly from the foundation service instead of recalculating
    // The foundation service already provides all the correct metrics
    return {
      roleStats: delegationData.roleStats,
      roleEfficiency: delegationData.roleEfficiency,
      successRate: delegationData.successRate,
      avgHandoffTime: delegationData.avgHandoffTime,
      avgRedelegationCount: delegationData.avgRedelegationCount,
      totalDelegations: delegationData.totalDelegations,
      avgCompletionTime: delegationData.avgCompletionTime,
      mostEfficientRole: delegationData.mostEfficientRole,
      bottlenecks: delegationData.bottlenecks,
      transitionMatrix: delegationData.transitionMatrix,
      weeklyTrends: delegationData.weeklyTrends,
    };
  }

  /**
   * Calculate role statistics from performance data
   */
  private calculateRoleStats(
    rolePerformance: any[],
  ): DelegationMetrics['roleStats'] {
    const defaultStats = {
      boomerang: 0,
      researcher: 0,
      architect: 0,
      'senior-developer': 0,
      'code-review': 0,
    };

    rolePerformance.forEach((role) => {
      if (role.role in defaultStats) {
        defaultStats[role.role as keyof typeof defaultStats] =
          role.taskCount || 0;
      }
    });

    return defaultStats;
  }

  /**
   * Find the most efficient role based on efficiency scores
   */
  private findMostEfficientRole(
    roleEfficiency: DelegationMetrics['roleEfficiency'],
  ): string {
    let maxEfficiency = 0;
    let mostEfficient = 'boomerang';

    Object.entries(roleEfficiency).forEach(([role, efficiency]) => {
      if (efficiency > maxEfficiency) {
        maxEfficiency = efficiency;
        mostEfficient = role;
      }
    });

    return mostEfficient;
  }

  /**
   * Generate weekly trends for delegation success/failure
   */
  private generateWeeklyTrends(
    delegationData: any,
  ): DelegationMetrics['weeklyTrends'] {
    // Default trend data (could be enhanced with actual weekly calculations)
    const successful = delegationData.weeklySuccessful || [75, 80, 85, 82];
    const failed = delegationData.weeklyFailed || [25, 20, 15, 18];

    return {
      successful,
      failed,
    };
  }
}
