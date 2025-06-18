import { Injectable, Logger } from '@nestjs/common';
import { ZodSchema } from 'zod';
import { SchemaDefinitionGeneratorService } from './schema-definition-generator.service';
import { IndividualSubtaskOperationsSchema } from '../../core-workflow/schemas/individual-subtask-operations.schema';
import { PlanningOperationsSchema } from '../../core-workflow/schemas/planning-operations.schema';
import { ResearchOperationsSchema } from '../../core-workflow/schemas/research-operations.schema';
import { ReviewOperationsSchema } from '../../core-workflow/schemas/review-operations.schema';
import { TaskOperationsSchema } from '../../core-workflow/schemas/task-operations.schema';
import { WorkflowOperationsSchema } from '../../core-workflow/schemas/workflow-operations.schema';

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

      this.logger.debug(
        `✅ Schema definition extraction completed for ${serviceName}.${operation}`,
      );

      return {
        schemaDefinition: JSON.parse(schemaDefinition),
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
    schemaDefinition: Record<string, any>;
  } {
    return {
      schemaDefinition: {
        error: {
          message: `Failed to extract schema for ${serviceName}${operation ? `.${operation}` : ''}`,
          details: error.message || 'Unknown error',
          serviceName,
          operation: operation || 'N/A',
        },
      },
    };
  }
}
