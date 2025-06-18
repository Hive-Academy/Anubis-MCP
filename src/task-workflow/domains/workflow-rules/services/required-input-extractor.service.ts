import { Injectable, Logger } from '@nestjs/common';
import { ZodSchema } from 'zod';
import { SchemaDefinitionGeneratorService } from './schema-definition-generator.service';

// 🎯 PHASE 4.1: Enhanced schema imports with comprehensive core-workflow coverage
import { IndividualSubtaskOperationsSchema } from '../../core-workflow/schemas/individual-subtask-operations.schema';
import { PlanningOperationsSchema } from '../../core-workflow/schemas/planning-operations.schema';
import { ResearchOperationsSchema } from '../../core-workflow/schemas/research-operations.schema';
import { ReviewOperationsSchema } from '../../core-workflow/schemas/review-operations.schema';
import { TaskOperationsSchema } from '../../core-workflow/schemas/task-operations.schema';
import { WorkflowOperationsSchema } from '../../core-workflow/schemas/workflow-operations.schema';

/**
 * 🎯 REQUIRED INPUT EXTRACTOR SERVICE - FOCUSED ON EXTRACTION LOGIC
 *
 * Dedicated service for extracting required inputs from workflow steps and MCP operations.
 * Now focused solely on extraction logic, delegating schema definition generation
 * to the SchemaDefinitionGeneratorService.
 *
 * RESPONSIBILITIES:
 * - Extract required inputs from step actions
 * - Map operation-specific parameters
 * - Coordinate with SchemaDefinitionGeneratorService for schema definitions
 * - Handle workflow-specific input requirements
 */
@Injectable()
export class RequiredInputExtractorService {
  private readonly logger = new Logger(RequiredInputExtractorService.name);

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

  // Operation-specific parameter mapping for fallback scenarios
  private readonly operationParameterMap: Record<
    string,
    Record<string, string[]>
  > = {
    TaskOperations: {
      create: ['operation', 'taskData', 'description', 'codebaseAnalysis'],
      update: [
        'operation',
        'id',
        'taskData',
        'description',
        'codebaseAnalysis',
      ],
      get: ['operation', 'id', 'slug', 'includeDescription', 'includeAnalysis'],
      list: [
        'operation',
        'status',
        'priority',
        'includeDescription',
        'includeAnalysis',
      ],
    },
    PlanningOperations: {
      create_plan: ['operation', 'taskId', 'planData'],
      update_plan: ['operation', 'taskId', 'planId', 'planData'],
      get_plan: ['operation', 'taskId', 'planId', 'includeBatches'],
      create_subtasks: ['operation', 'taskId', 'batchData'],
      update_batch: ['operation', 'taskId', 'batchId', 'newStatus'],
      get_batch: ['operation', 'taskId', 'batchId'],
    },
    WorkflowOperations: {
      delegate: ['operation', 'taskId', 'fromRole', 'toRole', 'message'],
      complete: ['operation', 'taskId', 'fromRole', 'completionData'],
      escalate: ['operation', 'taskId', 'fromRole', 'escalationData'],
      transition: ['operation', 'taskId', 'fromRole', 'toRole', 'newStatus'],
    },
    ResearchOperations: {
      create_research: ['operation', 'taskId', 'researchData'],
      update_research: ['operation', 'taskId', 'researchData'],
      get_research: ['operation', 'taskId', 'includeComments'],
      add_comment: ['operation', 'taskId', 'commentData'],
      get_comments: ['operation', 'taskId', 'commentType'],
    },
    ReviewOperations: {
      create_review: ['operation', 'taskId', 'reviewData'],
      update_review: ['operation', 'taskId', 'reviewData'],
      get_review: ['operation', 'taskId', 'includeDetails'],
      create_completion: ['operation', 'taskId', 'completionData'],
      get_completion: ['operation', 'taskId', 'includeDetails'],
    },
    IndividualSubtaskOperations: {
      create_subtask: ['operation', 'taskId', 'subtaskData'],
      update_subtask: ['operation', 'taskId', 'subtaskId', 'updateData'],
      get_subtask: ['operation', 'taskId', 'subtaskId', 'includeEvidence'],
      get_next_subtask: ['operation', 'taskId', 'currentSubtaskId', 'status'],
    },
  };

  constructor(
    private readonly schemaDefinitionGenerator: SchemaDefinitionGeneratorService,
  ) {}

  /**
   * 🎯 MAIN: Extract schema definition and examples using the dedicated generator service
   */
  extractFromServiceSchema(
    serviceName: string,
    operation?: string,
  ): {
    schemaDefinition: string;
    validationSchema: ZodSchema | null;
    schemaStructure?: Record<string, any>;
  } {
    this.logger.debug(
      `🎯 Extracting schema definition for ${serviceName}.${operation}`,
    );

    try {
      const schema = this.serviceSchemas[serviceName];

      // 🎯 Use the dedicated schema definition generator
      const { schemaDefinition } =
        this.schemaDefinitionGenerator.generateSchemaDefinition(
          schema,
          serviceName,
          operation,
        );

      // 🎯 Get the schema structure from the generator service
      const schemaStructure =
        this.schemaDefinitionGenerator.parseZodSchemaToStructure(schema);

      this.logger.debug(
        `✅ Schema definition extraction completed for ${serviceName}.${operation}`,
      );

      return {
        schemaDefinition,
        validationSchema: schema,
        schemaStructure,
      };
    } catch (error) {
      this.logger.error(
        `💥 Schema definition extraction failed for ${serviceName}.${operation}:`,
        error,
      );
      return this.createErrorSchemaDefinition(serviceName, operation, error);
    }
  }

  /**
   * 🎯 ERROR: Create error schema definition when extraction fails
   */
  private createErrorSchemaDefinition(
    serviceName: string,
    operation: string | undefined,
    error: any,
  ): {
    schemaDefinition: string;
    validationSchema: null;
    schemaStructure?: Record<string, any>;
  } {
    return {
      schemaDefinition: `Error extracting schema for ${serviceName}.${operation}: ${error.message}`,

      validationSchema: null,
      schemaStructure: undefined,
    };
  }
}
