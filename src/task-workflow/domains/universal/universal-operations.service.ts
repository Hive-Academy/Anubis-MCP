import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  UniversalQuerySchema,
  UniversalQueryInput,
} from './universal-query.schema';
import {
  UniversalMutationSchema,
  UniversalMutationInput,
} from './universal-mutation.schema';
import {
  UNIVERSAL_QUERY_DESCRIPTION,
  UNIVERSAL_MUTATION_DESCRIPTION,
} from './descriptions';

// Type definitions for better type safety

interface BatchOperationResult {
  results: Array<{
    success: boolean;
    data?: any;
    error?: string;
    operation?: any;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
  errors?: Array<{
    success: boolean;
    error: string;
    operation: any;
  }>;
}

/**
 * Universal Operations Service
 *
 * Consolidates 40+ MCP tools into 2 powerful, Prisma-backed tools:
 * 1. query_data - Universal querying with full Prisma filtering
 * 2. mutate_data - Universal mutations with transaction support
 *
 * Benefits:
 * - Reduces tool complexity from 40+ to 2
 * - Leverages full Prisma capabilities
 * - Consistent interface across all entities
 * - Advanced filtering, pagination, aggregation
 * - Transaction and batch operation support
 * - Performance optimizations
 */
@Injectable()
export class UniversalOperationsService {
  private readonly logger = new Logger(UniversalOperationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Tool({
    name: 'query_data',
    description: UNIVERSAL_QUERY_DESCRIPTION,
    parameters: UniversalQuerySchema,
  })
  async queryData(input: UniversalQueryInput): Promise<any> {
    const startTime = performance.now();

    try {
      this.logger.debug(`Universal Query: ${input.entity}`, {
        where: input.where,
        include: input.include,
      });

      // Get the appropriate Prisma model
      const model = this.getPrismaModel(input.entity);

      // Build the query options
      const queryOptions: any = {};

      if (input.where) queryOptions.where = input.where;
      if (input.include) queryOptions.include = input.include;
      if (input.select) queryOptions.select = input.select;
      if (input.orderBy) queryOptions.orderBy = input.orderBy;
      if (input.distinct) queryOptions.distinct = input.distinct;

      // Handle pagination
      if (input.pagination) {
        if (input.pagination.skip) queryOptions.skip = input.pagination.skip;
        if (input.pagination.take) queryOptions.take = input.pagination.take;
        if (input.pagination.cursor)
          queryOptions.cursor = input.pagination.cursor;
      }

      let result: any;

      // Handle aggregation queries
      if (input.aggregation) {
        result = await this.executeAggregation(model, input);
      } else {
        // Execute the query
        result = await model.findMany(queryOptions);
      }

      const responseTime = performance.now() - startTime;

      // Format response based on format preference
      const formattedResult = this.formatResponse(
        result,
        input.format || 'full',
      );

      this.logger.debug(`Query completed in ${responseTime.toFixed(2)}ms`, {
        entity: input.entity,
        resultCount: Array.isArray(result) ? result.length : 1,
        responseTime,
      });

      const responseData = {
        success: true,
        data: formattedResult,
        metadata: {
          entity: input.entity,
          resultCount: Array.isArray(result) ? result.length : 1,
          responseTime: Math.round(responseTime),
          query: input.explain ? queryOptions : undefined,
        },
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(responseData, null, 2),
          },
        ],
      };
    } catch (error: any) {
      this.logger.error(`Universal query failed for ${input.entity}:`, error);

      const errorData = {
        success: false,
        error: {
          message: error.message,
          code: 'QUERY_FAILED',
          entity: input.entity,
          details: input.explain ? { input, error: error.stack } : undefined,
        },
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(errorData, null, 2),
          },
        ],
      };
    }
  }

  @Tool({
    name: 'mutate_data',
    description: UNIVERSAL_MUTATION_DESCRIPTION,
    parameters: UniversalMutationSchema,
  })
  async mutateData(input: UniversalMutationInput): Promise<any> {
    const startTime = performance.now();

    try {
      this.logger.debug(
        `Universal Mutation: ${input.operation} ${input.entity}`,
        {
          where: input.where,
          data: input.data,
        },
      );

      // Validate business rules if enabled
      if (input.validate?.businessRules) {
        this.validateBusinessRules(input);
      }

      let result: any;

      // Handle batch operations
      if (input.batch) {
        result = await this.executeBatchOperations(input);
      } else if (input.transaction) {
        result = await this.executeInTransaction(input);
      } else {
        result = await this.executeSingleOperation(input);
      }

      const responseTime = performance.now() - startTime;

      // Add audit trail if specified
      if (input.audit) {
        this.createAuditTrail(input, result);
      }

      this.logger.debug(`Mutation completed in ${responseTime.toFixed(2)}ms`, {
        operation: input.operation,
        entity: input.entity,
        responseTime,
      });

      const responseData = {
        success: true,
        data: this.formatMutationResponse(
          result,
          input.response?.format || 'full',
        ),
        metadata: {
          operation: input.operation,
          entity: input.entity,
          affectedCount: this.getAffectedCount(result, input.operation),
          responseTime: Math.round(responseTime),
        },
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(responseData, null, 2),
          },
        ],
      };
    } catch (error: any) {
      this.logger.error(
        `Universal mutation failed for ${input.operation} ${input.entity}:`,
        error,
      );

      const errorData = {
        success: false,
        error: {
          message: error.message,
          code: 'MUTATION_FAILED',
          operation: input.operation,
          entity: input.entity,
          validationErrors: input.response?.includeValidationErrors
            ? this.extractValidationErrors(error)
            : undefined,
        },
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(errorData, null, 2),
          },
        ],
      };
    }
  }

  // Helper Methods

  private getPrismaModel(entity: string): any {
    // Type-safe model mapping with proper index signature
    const modelMap: Record<string, any> = {
      task: this.prisma.task,
      taskDescription: this.prisma.taskDescription,
      implementationPlan: this.prisma.implementationPlan,
      subtask: this.prisma.subtask,
      researchReport: this.prisma.researchReport,
      codeReviewReport: this.prisma.codeReview, // Correct model name
      completionReport: this.prisma.completionReport,
      comment: this.prisma.comment,
      delegation: this.prisma.delegationRecord, // Correct model name
      workflowTransition: this.prisma.workflowTransition,
      codebaseAnalysis: this.prisma.codebaseAnalysis,
    };

    const model = modelMap[entity];
    if (!model) {
      throw new Error(`Unknown entity type: ${entity}`);
    }

    return model;
  }

  private async executeAggregation(
    model: any,
    input: UniversalQueryInput,
  ): Promise<any> {
    const aggregation = input.aggregation!;
    const result: any = {};

    if (aggregation._count && !aggregation.by) {
      result.count = await model.count({ where: input.where });
    }

    if (aggregation.by && aggregation.by.length > 0) {
      const groupByOptions: any = {
        by: aggregation.by,
        where: input.where,
      };

      // Only add aggregation functions if they have valid fields
      if (aggregation._count) {
        groupByOptions._count = { _all: true };
      }

      if (aggregation._sum && Object.keys(aggregation._sum).length > 0) {
        groupByOptions._sum = aggregation._sum;
      }

      if (aggregation._avg && Object.keys(aggregation._avg).length > 0) {
        groupByOptions._avg = aggregation._avg;
      }

      if (aggregation._min && Object.keys(aggregation._min).length > 0) {
        groupByOptions._min = aggregation._min;
      }

      if (aggregation._max && Object.keys(aggregation._max).length > 0) {
        groupByOptions._max = aggregation._max;
      }

      result.groupBy = await model.groupBy(groupByOptions);
    }

    return result;
  }

  private async executeSingleOperation(
    input: UniversalMutationInput,
  ): Promise<any> {
    const model = this.getPrismaModel(input.entity);
    const options: any = {};

    if (input.include) options.include = input.include;
    if (input.select) options.select = input.select;

    switch (input.operation) {
      case 'create':
        return await model.create({ data: input.data, ...options });

      case 'update':
        return await model.update({
          where: input.where,
          data: input.data,
          ...options,
        });

      case 'upsert':
        return await model.upsert({
          where: input.where,
          update: input.data,
          create: input.data,
          ...options,
        });

      case 'delete':
        return await model.delete({ where: input.where, ...options });

      case 'createMany':
        return await model.createMany({ data: input.data });

      case 'updateMany':
        return await model.updateMany({
          where: input.where,
          data: input.data,
        });

      case 'deleteMany':
        return await model.deleteMany({ where: input.where });

      default:
        throw new Error(`Unknown operation: ${input.operation as any}`);
    }
  }

  private async executeBatchOperations(
    input: UniversalMutationInput,
  ): Promise<BatchOperationResult> {
    const operations = input.batch!.operations;
    const results: Array<{
      success: boolean;
      data?: any;
      error?: string;
      operation?: any;
    }> = [];
    const errors: Array<{
      success: boolean;
      error: string;
      operation: any;
    }> = [];

    for (const operation of operations) {
      try {
        const result = await this.executeSingleOperation({
          ...operation,
          include: input.include,
          select: input.select,
        });
        results.push({ success: true, data: result });
      } catch (error: any) {
        const errorResult = { success: false, error: error.message, operation };
        errors.push(errorResult);

        if (!input.batch!.continueOnError) {
          throw new Error(`Batch operation failed: ${error.message}`);
        }

        results.push(errorResult);
      }
    }

    return {
      results,
      summary: {
        total: operations.length,
        successful: results.filter((r) => r.success).length,
        failed: errors.length,
      },
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  private async executeInTransaction(
    input: UniversalMutationInput,
  ): Promise<any> {
    // Fix transaction type safety
    return await this.prisma.$transaction(async (tx: any) => {
      // Create a temporary service instance with the transaction
      const tempService = Object.create(this);
      tempService.prisma = tx;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return await tempService.executeSingleOperation(input);
    });
  }

  private validateBusinessRules(input: UniversalMutationInput): void {
    // Implement business rule validation based on entity and operation
    // This is a placeholder for custom validation logic

    if (input.entity === 'task' && input.operation === 'update') {
      const data = input.data as any;
      if (data.status === 'completed' && !data.completedAt) {
        throw new Error('Completed tasks must have a completion date');
      }
    }

    // Add more business rules as needed
  }

  private createAuditTrail(input: UniversalMutationInput, result: any): void {
    // Create audit trail entry
    // This is a placeholder for audit logging
    this.logger.log(
      `Audit: ${input.audit?.userId} performed ${input.operation} on ${input.entity}`,
      {
        reason: input.audit?.reason,
        metadata: input.audit?.metadata,
        result: result?.id || result?.count,
      },
    );
  }

  private formatResponse(data: any, format: string): any {
    switch (format) {
      case 'minimal':
        return Array.isArray(data)
          ? data.map((item: any) => ({
              id: item.id,
              name: item.name || item.title,
            }))
          : { id: data?.id, name: data?.name || data?.title };

      case 'summary':
        return Array.isArray(data)
          ? // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            data.map((item: any) => this.createSummary(item))
          : this.createSummary(data);

      case 'full':
      default:
        return data;
    }
  }

  private formatMutationResponse(data: any, format: string): any {
    switch (format) {
      case 'id-only':
        return Array.isArray(data)
          ? // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            data.map((item: any) => item.id)
          : data?.id;

      case 'minimal':
        return Array.isArray(data)
          ? data.map((item: any) => ({ id: item.id, name: item.name }))
          : { id: data?.id, name: data?.name };

      case 'summary':
        return Array.isArray(data)
          ? // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            data.map((item: any) => this.createSummary(item))
          : this.createSummary(data);

      case 'full':
      default:
        return data;
    }
  }

  private createSummary(item: any): any {
    if (!item) return null;

    const summary: any = {
      id: item.id,
      name: item.name || item.title,
      status: item.status,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };

    // Add entity-specific summary fields
    if (item.priority) summary.priority = item.priority;
    if (item.currentMode) summary.currentMode = item.currentMode;
    if (item.completedAt) summary.completedAt = item.completedAt;

    return summary;
  }

  private getAffectedCount(result: any, operation: string): number {
    if (operation.includes('Many')) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return result?.count || 0;
    }
    return result ? 1 : 0;
  }

  private extractValidationErrors(error: any): any[] {
    // Extract validation errors from Prisma errors
    if (error.code === 'P2002') {
      return [
        { field: error.meta?.target, message: 'Unique constraint violation' },
      ];
    }

    return [{ message: error.message }];
  }
}
