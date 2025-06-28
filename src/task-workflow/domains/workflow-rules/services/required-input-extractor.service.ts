import { Injectable } from '@nestjs/common';
import { ZodSchema } from 'zod';
import { IndividualSubtaskOperationsSchema } from '../../core-workflow/schemas/individual-subtask-operations.schema';
import { PlanningOperationsSchema } from '../../core-workflow/schemas/planning-operations.schema';
import { ResearchOperationsSchema } from '../../core-workflow/schemas/research-operations.schema';
import { ReviewOperationsSchema } from '../../core-workflow/schemas/review-operations.schema';
import { TaskOperationsSchema } from '../../core-workflow/schemas/task-operations.schema';
import { WorkflowOperationsSchema } from '../../core-workflow/schemas/workflow-operations.schema';
import { SchemaDefinitionGeneratorService } from './schema-definition-generator.service';

@Injectable()
export class RequiredInputExtractorService {
  // Schema registry - maps service names to their Zod schemas
  private readonly serviceSchemas: Record<string, ZodSchema> = {
    TaskOperations: TaskOperationsSchema,
    PlanningOperations: PlanningOperationsSchema,
    WorkflowOperations: WorkflowOperationsSchema,
    ResearchOperations: ResearchOperationsSchema,
    ReviewOperations: ReviewOperationsSchema,
    IndividualSubtaskOperations: IndividualSubtaskOperationsSchema,
    SubtaskOperations: IndividualSubtaskOperationsSchema, // Alias
  };

  // 🎯 NEW: Schema cache to avoid redundant definitions
  private readonly schemaCache = new Map<string, Record<string, any>>();

  // 🎯 NEW: Common parameter patterns that appear frequently
  private readonly commonParameterPatterns = {
    'taskId-only': {
      taskId: {
        type: 'number',
        required: true,
        description: 'Task identifier',
      },
    },
    'taskId-executionId': {
      taskId: {
        type: 'number',
        required: true,
        description: 'Task identifier',
      },
      executionId: {
        type: 'string',
        required: true,
        description: 'Workflow execution identifier',
      },
    },
    'basic-update': {
      taskId: {
        type: 'number',
        required: true,
        description: 'Task identifier',
      },
      updateData: {
        type: 'object',
        required: true,
        description: 'Data to update',
      },
    },
  };

  constructor(
    private readonly schemaDefinitionGenerator: SchemaDefinitionGeneratorService,
  ) {}

  /**
   * 🎯 ENHANCED: Extract schema definition with intelligent caching and pattern recognition
   */
  extractFromServiceSchema(
    serviceName: string,
    operation?: string,
  ): {
    schemaDefinition: Record<string, any>;
  } {
    try {
      // 🎯 Create cache key for this specific service/operation combination
      const cacheKey = `${serviceName}${operation ? '.' + operation : ''}`;

      // 🎯 Check cache first
      if (this.schemaCache.has(cacheKey)) {
        return {
          schemaDefinition: this.schemaCache.get(cacheKey)!,
        };
      }

      const schema = this.serviceSchemas[serviceName];

      // 🎯 Check if this matches a common pattern
      const commonPattern = this.detectCommonPattern(serviceName, operation);
      if (commonPattern) {
        const simplifiedSchema = {
          serviceName,
          operation,
          parameters: commonPattern,
          note: 'Simplified schema - common pattern detected',
        };

        // Cache the simplified schema
        this.schemaCache.set(cacheKey, simplifiedSchema);
        return { schemaDefinition: simplifiedSchema };
      }

      // 🎯 Generate full schema definition for complex cases
      const { schemaDefinition } =
        this.schemaDefinitionGenerator.generateSchemaDefinition(
          schema,
          serviceName,
          operation,
        );

      // 🎯 Cache the full schema definition
      this.schemaCache.set(cacheKey, schemaDefinition);

      return {
        schemaDefinition,
      };
    } catch (error) {
      return this.createErrorSchemaDefinition(serviceName, operation, error);
    }
  }

  /**
   * 🆕 NEW: Detect common parameter patterns to avoid verbose schema definitions
   */
  private detectCommonPattern(
    serviceName: string,
    operation?: string,
  ): Record<string, any> | null {
    // 🎯 TaskOperations common patterns
    if (serviceName === 'TaskOperations') {
      switch (operation) {
        case 'get':
          return this.commonParameterPatterns['taskId-only'];
        case 'update':
          return this.commonParameterPatterns['basic-update'];
        case 'create':
        case 'create_with_subtasks':
          return this.commonParameterPatterns['taskId-executionId'];
      }
    }

    // 🎯 SubtaskOperations common patterns
    if (
      serviceName === 'SubtaskOperations' ||
      serviceName === 'IndividualSubtaskOperations'
    ) {
      switch (operation) {
        case 'get_next_subtask':
          return this.commonParameterPatterns['taskId-only'];
        case 'update_subtask':
          return {
            taskId: {
              type: 'number',
              required: true,
              description: 'Task identifier',
            },
            subtaskId: {
              type: 'number',
              required: true,
              description: 'Subtask identifier',
            },
            updateData: {
              type: 'object',
              required: true,
              description: 'Subtask update data',
            },
          };
      }
    }

    // 🎯 ResearchOperations common patterns
    if (serviceName === 'ResearchOperations') {
      switch (operation) {
        case 'create_research':
          return {
            title: {
              type: 'string',
              required: true,
              description: 'Research title',
            },
            findings: {
              type: 'string',
              required: true,
              description: 'Research findings',
            },
            recommendations: {
              type: 'string',
              required: false,
              description: 'Implementation recommendations',
            },
          };
      }
    }

    // 🎯 ReviewOperations common patterns
    if (serviceName === 'ReviewOperations') {
      switch (operation) {
        case 'create_review':
          return {
            taskId: {
              type: 'number',
              required: true,
              description: 'Task identifier',
            },
            findings: {
              type: 'string',
              required: true,
              description: 'Review findings',
            },
            decision: {
              type: 'string',
              required: true,
              description: 'Review decision',
            },
            evidence: {
              type: 'object',
              required: false,
              description: 'Supporting evidence',
            },
          };
      }
    }

    // 🎯 WorkflowOperations common patterns
    if (serviceName === 'WorkflowOperations') {
      switch (operation) {
        case 'complete_execution':
          return {
            executionId: {
              type: 'string',
              required: true,
              description: 'Workflow execution identifier',
            },
            completionData: {
              type: 'object',
              required: true,
              description: 'Completion summary and evidence',
            },
          };
      }
    }

    return null; // No common pattern found, use full schema
  }

  /**
   * 🆕 NEW: Clear cache when schemas might have changed
   */
  clearCache(): void {
    this.schemaCache.clear();
  }

  /**
   * 🆕 NEW: Get cache statistics for monitoring
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.schemaCache.size,
      keys: Array.from(this.schemaCache.keys()),
    };
  }

  /**
   * 🎯 ERROR: Create error schema definition when extraction fails
   */
  private createErrorSchemaDefinition(
    serviceName: string,
    operation: string | undefined,
    _error: any,
  ): {
    schemaDefinition: Record<string, any>;
  } {
    return {
      schemaDefinition: {
        error: `Failed to extract schema for ${serviceName}${operation ? '.' + operation : ''}`,
        serviceName,
        operation,
      },
    };
  }
}
