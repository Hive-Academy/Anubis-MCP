import { Injectable } from '@nestjs/common';
import { ZodSchema } from 'zod';
import { IndividualSubtaskOperationsSchema } from '../../core-workflow/schemas/individual-subtask-operations.schema';
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
    WorkflowOperations: WorkflowOperationsSchema,
    ResearchOperations: ResearchOperationsSchema,
    ReviewOperations: ReviewOperationsSchema,
    IndividualSubtaskOperations: IndividualSubtaskOperationsSchema,
    SubtaskOperations: IndividualSubtaskOperationsSchema, // Alias
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
    schemaDefinition: Record<string, any>;
  } {
    try {
      const schema = this.serviceSchemas[serviceName];

      // 🎯 Use the dedicated schema definition generator
      const { schemaDefinition } =
        this.schemaDefinitionGenerator.generateSchemaDefinition(
          schema,
          serviceName,
          operation,
        );

      return {
        schemaDefinition,
      };
    } catch (error) {
      return this.createErrorSchemaDefinition(serviceName, operation, error);
    }
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
