import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { WorkflowStep } from 'generated/prisma';

// ===================================================================
// 🗄️ STEP QUERY SERVICE - Database Query Operations
// ===================================================================
// Purpose: Centralized database queries for workflow steps
// Scope: Step retrieval, filtering, relationships
// Optimization: Single responsibility, optimized queries, no duplication

export interface StepQueryOptions {
  includeConditions?: boolean;
  includeActions?: boolean;
  includeProgress?: boolean;
  includeRole?: boolean;
}

export interface StepWithDetails extends WorkflowStep {
  conditions?: any[];
  actions?: any[];
  stepProgress?: any[];
  role?: any;
}

export interface StepFilterCriteria {
  roleId?: string;
  stepType?: string;
  isRequired?: boolean;
  triggerReport?: boolean;
  sequenceNumberRange?: {
    min?: number;
    max?: number;
  };
}

@Injectable()
export class StepQueryService {
  private readonly logger = new Logger(StepQueryService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * ✅ OPTIMIZED: Get step with configurable includes (single query)
   * Eliminates duplicate queries across services
   */
  async getStepById(
    stepId: string,
    options: StepQueryOptions = {},
  ): Promise<StepWithDetails | null> {
    try {
      const includeClause: any = {};

      if (options.includeConditions) {
        includeClause.conditions = true;
      }
      if (options.includeActions) {
        includeClause.actions = {
          orderBy: { sequenceOrder: 'asc' },
        };
      }
      if (options.includeProgress) {
        includeClause.stepProgress = {
          orderBy: { startedAt: 'desc' },
          take: 10, // Limit for performance
        };
      }
      if (options.includeRole) {
        includeClause.role = true;
      }

      return await this.prisma.workflowStep.findUnique({
        where: { id: stepId },
        include: includeClause,
      });
    } catch (error) {
      this.logger.error(`Error getting step ${stepId}:`, error);
      return null;
    }
  }

  /**
   * ✅ OPTIMIZED: Get multiple steps with filtering
   * Single query with optimized filtering
   */
  async getSteps(
    criteria: StepFilterCriteria = {},
    options: StepQueryOptions = {},
  ): Promise<StepWithDetails[]> {
    try {
      const whereClause: any = {};

      if (criteria.roleId) {
        whereClause.roleId = criteria.roleId;
      }
      if (criteria.stepType) {
        whereClause.stepType = criteria.stepType;
      }
      if (criteria.isRequired !== undefined) {
        whereClause.isRequired = criteria.isRequired;
      }
      if (criteria.triggerReport !== undefined) {
        whereClause.triggerReport = criteria.triggerReport;
      }
      if (criteria.sequenceNumberRange) {
        whereClause.sequenceNumber = {};
        if (criteria.sequenceNumberRange.min !== undefined) {
          whereClause.sequenceNumber.gte = criteria.sequenceNumberRange.min;
        }
        if (criteria.sequenceNumberRange.max !== undefined) {
          whereClause.sequenceNumber.lte = criteria.sequenceNumberRange.max;
        }
      }

      // Build include clause (same as getStepById)
      const includeClause: any = {};
      if (options.includeConditions) {
        includeClause.conditions = true;
      }
      if (options.includeActions) {
        includeClause.actions = {
          orderBy: { sequenceOrder: 'asc' },
        };
      }
      if (options.includeProgress) {
        includeClause.stepProgress = {
          orderBy: { startedAt: 'desc' },
          take: 5, // Fewer for multiple steps
        };
      }
      if (options.includeRole) {
        includeClause.role = true;
      }

      return await this.prisma.workflowStep.findMany({
        where: whereClause,
        include: includeClause,
        orderBy: { sequenceNumber: 'asc' },
      });
    } catch (error) {
      this.logger.error('Error getting steps with criteria:', error);
      return [];
    }
  }

  /**
   * ✅ OPTIMIZED: Get steps for role with completion status
   * Single query with progress inclusion
   */
  async getStepsForRole(
    roleId: string,
    taskId?: string,
    options: StepQueryOptions = {},
  ): Promise<StepWithDetails[]> {
    try {
      const whereClause: any = { roleId };

      // Build include clause with optional progress filtering
      const includeClause: any = {};
      if (options.includeConditions) {
        includeClause.conditions = true;
      }
      if (options.includeActions) {
        includeClause.actions = {
          orderBy: { sequenceOrder: 'asc' },
        };
      }
      if (options.includeProgress && taskId) {
        includeClause.stepProgress = {
          where: { taskId },
          orderBy: { startedAt: 'desc' },
          take: 1, // Just the latest progress for each step
        };
      }
      if (options.includeRole) {
        includeClause.role = true;
      }

      return await this.prisma.workflowStep.findMany({
        where: whereClause,
        include: includeClause,
        orderBy: { sequenceNumber: 'asc' },
      });
    } catch (error) {
      this.logger.error(`Error getting steps for role ${roleId}:`, error);
      return [];
    }
  }

  /**
   * ✅ OPTIMIZED: Get next step in sequence
   * Minimal query for next step lookup
   */
  async getNextStepInSequence(
    roleId: string,
    currentSequenceNumber: number,
    options: StepQueryOptions = {},
  ): Promise<StepWithDetails | null> {
    try {
      const includeClause: any = {};

      if (options.includeConditions) {
        includeClause.conditions = true;
      }
      if (options.includeActions) {
        includeClause.actions = {
          orderBy: { sequenceOrder: 'asc' },
        };
      }

      return await this.prisma.workflowStep.findFirst({
        where: {
          roleId,
          sequenceNumber: { gt: currentSequenceNumber },
        },
        include: includeClause,
        orderBy: { sequenceNumber: 'asc' },
      });
    } catch (error) {
      this.logger.error(
        `Error getting next step for role ${roleId} after sequence ${currentSequenceNumber}:`,
        error,
      );
      return null;
    }
  }

  /**
   * ✅ OPTIMIZED: Get completed steps for task/role
   * Optimized query for progress tracking
   */
  async getCompletedSteps(taskId: string, roleId?: string): Promise<string[]> {
    try {
      const whereClause: any = {
        taskId,
        status: 'COMPLETED',
      };

      if (roleId) {
        whereClause.roleId = roleId;
      }

      const completedProgress = await this.prisma.workflowStepProgress.findMany(
        {
          where: whereClause,
          select: { stepId: true },
        },
      );

      return completedProgress.map((p) => p.stepId);
    } catch (error) {
      this.logger.error(
        `Error getting completed steps for task ${taskId}:`,
        error,
      );
      return [];
    }
  }

  /**
   * ✅ OPTIMIZED: Get next available step (not completed)
   * Single optimized query with completion check
   */
  async getNextAvailableStep(
    roleId: string,
    taskId: string,
    options: StepQueryOptions = {},
  ): Promise<StepWithDetails | null> {
    try {
      // Get completed step IDs first
      const completedStepIds = await this.getCompletedSteps(taskId, roleId);

      // Build include clause
      const includeClause: any = {};
      if (options.includeConditions) {
        includeClause.conditions = true;
      }
      if (options.includeActions) {
        includeClause.actions = {
          orderBy: { sequenceOrder: 'asc' },
        };
      }

      // Find first step not in completed list
      return await this.prisma.workflowStep.findFirst({
        where: {
          roleId,
          id: { notIn: completedStepIds },
        },
        include: includeClause,
        orderBy: { sequenceNumber: 'asc' },
      });
    } catch (error) {
      this.logger.error(
        `Error getting next available step for role ${roleId} task ${taskId}:`,
        error,
      );
      return null;
    }
  }

  /**
   * ✅ OPTIMIZED: Get steps by type across roles
   * Useful for reporting and analytics
   */
  async getStepsByType(
    stepType: string,
    options: StepQueryOptions = {},
  ): Promise<StepWithDetails[]> {
    return this.getSteps({ stepType }, options);
  }

  /**
   * ✅ OPTIMIZED: Get steps that trigger reports
   * Specialized query for reporting system
   */
  async getReportTriggerSteps(
    roleId?: string,
    options: StepQueryOptions = {},
  ): Promise<StepWithDetails[]> {
    const criteria: StepFilterCriteria = { triggerReport: true };
    if (roleId) {
      criteria.roleId = roleId;
    }
    return this.getSteps(criteria, options);
  }

  /**
   * ✅ OPTIMIZED: Search steps by name or description
   * Text search across step fields
   */
  async searchSteps(
    searchTerm: string,
    options: StepQueryOptions = {},
  ): Promise<StepWithDetails[]> {
    try {
      const includeClause: any = {};
      if (options.includeConditions) {
        includeClause.conditions = true;
      }
      if (options.includeActions) {
        includeClause.actions = {
          orderBy: { sequenceOrder: 'asc' },
        };
      }
      if (options.includeRole) {
        includeClause.role = true;
      }

      return await this.prisma.workflowStep.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm } },
            { displayName: { contains: searchTerm } },
            { description: { contains: searchTerm } },
          ],
        },
        include: includeClause,
        orderBy: [{ roleId: 'asc' }, { sequenceNumber: 'asc' }],
      });
    } catch (error) {
      this.logger.error(
        `Error searching steps with term "${searchTerm}":`,
        error,
      );
      return [];
    }
  }

  /**
   * ✅ OPTIMIZATION: Get step count by role
   * Useful for progress calculations
   */
  async getStepCountByRole(roleId: string): Promise<number> {
    try {
      return await this.prisma.workflowStep.count({
        where: { roleId },
      });
    } catch (error) {
      this.logger.error(`Error getting step count for role ${roleId}:`, error);
      return 0;
    }
  }

  /**
   * ✅ OPTIMIZATION: Get step statistics
   * Aggregate data for analytics
   */
  async getStepStatistics(): Promise<{
    totalSteps: number;
    stepsByRole: Record<string, number>;
    stepsByType: Record<string, number>;
    reportTriggerCount: number;
  }> {
    try {
      const [totalSteps, stepsByRole, stepsByType, reportTriggerCount] =
        await Promise.all([
          this.prisma.workflowStep.count(),
          this.prisma.workflowStep.groupBy({
            by: ['roleId'],
            _count: { id: true },
          }),
          this.prisma.workflowStep.groupBy({
            by: ['stepType'],
            _count: { id: true },
          }),
          this.prisma.workflowStep.count({
            where: { triggerReport: true },
          }),
        ]);

      return {
        totalSteps,
        stepsByRole: stepsByRole.reduce(
          (acc, item) => {
            acc[item.roleId] = item._count.id;
            return acc;
          },
          {} as Record<string, number>,
        ),
        stepsByType: stepsByType.reduce(
          (acc, item) => {
            acc[item.stepType] = item._count.id;
            return acc;
          },
          {} as Record<string, number>,
        ),
        reportTriggerCount,
      };
    } catch (error) {
      this.logger.error('Error getting step statistics:', error);
      return {
        totalSteps: 0,
        stepsByRole: {},
        stepsByType: {},
        reportTriggerCount: 0,
      };
    }
  }

  /**
   * ✅ OPTIMIZATION: Batch get steps by IDs
   * Efficient batch retrieval
   */
  async getStepsByIds(
    stepIds: string[],
    options: StepQueryOptions = {},
  ): Promise<StepWithDetails[]> {
    try {
      if (stepIds.length === 0) {
        return [];
      }

      const includeClause: any = {};
      if (options.includeConditions) {
        includeClause.conditions = true;
      }
      if (options.includeActions) {
        includeClause.actions = {
          orderBy: { sequenceOrder: 'asc' },
        };
      }
      if (options.includeProgress) {
        includeClause.stepProgress = {
          orderBy: { startedAt: 'desc' },
          take: 5,
        };
      }
      if (options.includeRole) {
        includeClause.role = true;
      }

      return await this.prisma.workflowStep.findMany({
        where: {
          id: { in: stepIds },
        },
        include: includeClause,
        orderBy: [{ roleId: 'asc' }, { sequenceNumber: 'asc' }],
      });
    } catch (error) {
      this.logger.error('Error getting steps by IDs:', error);
      return [];
    }
  }
}
