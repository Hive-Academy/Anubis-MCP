import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

type WhereClause = Record<string, any>;

/**
 * Delegation Data Query Service
 *
 * Single Responsibility: Handle all database queries for delegation data
 * Handles: Data retrieval, filtering, aggregations, database operations
 */
@Injectable()
export class DelegationDataQueryService {
  private readonly logger = new Logger(DelegationDataQueryService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all delegation records with optional filtering
   */
  async getAllDelegations(): Promise<any[]> {
    const delegations = await this.prisma.delegationRecord.findMany({
      include: {
        task: {
          select: {
            taskId: true,
            creationDate: true,
            completionDate: true,
          },
        },
      },
    });

    this.logger.debug(
      `Retrieved ${delegations.length} total delegation records`,
    );
    return delegations;
  }

  /**
   * Get filtered delegation records based on where clause
   */
  async getFilteredDelegations(whereClause: WhereClause): Promise<any[]> {
    // Build proper where clause for delegation records
    const delegationWhere: any = {};

    // Apply date filtering to delegation timestamp if provided
    if (whereClause.creationDate) {
      delegationWhere.delegationTimestamp = {
        gte: whereClause.creationDate.gte,
        lte: whereClause.creationDate.lte,
      };
    }

    // For other filters, apply them to the task relationship
    const taskFilters: any = {};
    if (whereClause.owner) taskFilters.owner = whereClause.owner;
    if (whereClause.currentMode)
      taskFilters.currentMode = whereClause.currentMode;
    if (whereClause.priority) taskFilters.priority = whereClause.priority;
    if (whereClause.taskId) taskFilters.taskId = whereClause.taskId;

    // Add task filters if any exist
    if (Object.keys(taskFilters).length > 0) {
      delegationWhere.task = taskFilters;
    }

    this.logger.debug(
      'Using delegationWhere:',
      JSON.stringify(delegationWhere),
    );

    // Get filtered delegations
    let delegations = await this.prisma.delegationRecord.findMany({
      where: delegationWhere,
      include: {
        task: {
          select: {
            taskId: true,
            creationDate: true,
            completionDate: true,
          },
        },
      },
    });

    this.logger.debug(
      `Initial filtered query returned ${delegations.length} delegations`,
    );

    // If no delegations found with date filter, try without it
    if (delegations.length === 0 && whereClause.creationDate) {
      this.logger.debug(
        'No delegations found with date filter, trying without date filter',
      );

      const delegationWhereNoDate = { ...delegationWhere };
      delete delegationWhereNoDate.delegationTimestamp;

      delegations = await this.prisma.delegationRecord.findMany({
        where: delegationWhereNoDate,
        include: {
          task: {
            select: {
              taskId: true,
              creationDate: true,
              completionDate: true,
            },
          },
        },
      });

      this.logger.debug(
        `Found ${delegations.length} delegations without date filter`,
      );
    }

    return delegations;
  }

  /**
   * Get mode transitions for building transition matrix
   */
  async getModeTransitions(whereClause: WhereClause): Promise<any[]> {
    const taskFilters: any = {};
    if (whereClause.owner) taskFilters.owner = whereClause.owner;
    if (whereClause.currentMode)
      taskFilters.currentMode = whereClause.currentMode;
    if (whereClause.priority) taskFilters.priority = whereClause.priority;
    if (whereClause.taskId) taskFilters.taskId = whereClause.taskId;

    const modeTransitions = await this.prisma.workflowTransition.groupBy({
      by: ['fromMode', 'toMode'],
      _count: true,
      where: Object.keys(taskFilters).length > 0 ? { task: taskFilters } : {},
    });

    this.logger.debug(`Retrieved ${modeTransitions.length} mode transitions`);
    return modeTransitions;
  }

  /**
   * Get redelegation statistics
   */
  async getRedelegationStats(whereClause: WhereClause): Promise<any> {
    const delegationWhere: any = {};

    // Apply date filtering to delegation timestamp if provided
    if (whereClause.creationDate) {
      delegationWhere.delegationTimestamp = {
        gte: whereClause.creationDate.gte,
        lte: whereClause.creationDate.lte,
      };
    }

    const redelegationStats = await this.prisma.delegationRecord.aggregate({
      where: delegationWhere,
      _avg: {
        redelegationCount: true,
      },
    });

    this.logger.debug(
      'Redelegation stats retrieved:',
      JSON.stringify(redelegationStats),
    );
    return redelegationStats;
  }

  /**
   * Get task-level redelegation statistics
   */
  async getTaskRedelegationStats(whereClause: WhereClause): Promise<any> {
    const taskFilters: any = {};
    if (whereClause.owner) taskFilters.owner = whereClause.owner;
    if (whereClause.currentMode)
      taskFilters.currentMode = whereClause.currentMode;
    if (whereClause.priority) taskFilters.priority = whereClause.priority;
    if (whereClause.taskId) taskFilters.taskId = whereClause.taskId;

    const taskRedelegationStats = await this.prisma.task.aggregate({
      _avg: { redelegationCount: true },
      _max: { redelegationCount: true },
      where: taskFilters,
    });

    this.logger.debug(
      'Task redelegation stats retrieved:',
      JSON.stringify(taskRedelegationStats),
    );
    return taskRedelegationStats;
  }

  /**
   * Debug delegation data for troubleshooting
   */
  debugDelegationData(delegations: any[]): void {
    if (delegations.length > 0) {
      this.logger.debug(
        'Sample delegation:',
        JSON.stringify(delegations[0], null, 2),
      );

      // Debug: Check success field values
      const successValues: (boolean | null)[] = delegations.map(
        (d: any) => d.success as boolean | null,
      );
      this.logger.debug(
        `Success field values: ${JSON.stringify(successValues)}`,
      );

      // Debug: Check role distribution
      const fromModes: string[] = delegations.map(
        (d: any) => d.fromMode as string,
      );
      const toModes: string[] = delegations.map((d: any) => d.toMode as string);
      this.logger.debug(`From modes: ${JSON.stringify(fromModes)}`);
      this.logger.debug(`To modes: ${JSON.stringify(toModes)}`);

      // Debug: Check date ranges
      const delegationDates: Date[] = delegations.map(
        (d: any) => d.delegationTimestamp as Date,
      );
      this.logger.debug(`Delegation dates: ${JSON.stringify(delegationDates)}`);
    } else {
      this.logger.debug('No delegation records found in database');
    }
  }
}
