import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { WorkflowGuidance } from './workflow-guidance.service';

// 🎯 PHASE 4.1: Enhanced schema imports with comprehensive core-workflow coverage
import { ZodSchema } from 'zod';
import { IndividualSubtaskOperationsSchema } from '../../core-workflow/schemas/individual-subtask-operations.schema';
import { PlanningOperationsSchema } from '../../core-workflow/schemas/planning-operations.schema';
import { ResearchOperationsSchema } from '../../core-workflow/schemas/research-operations.schema';
import { ReviewOperationsSchema } from '../../core-workflow/schemas/review-operations.schema';
import { TaskOperationsSchema } from '../../core-workflow/schemas/task-operations.schema';
import { WorkflowOperationsSchema } from '../../core-workflow/schemas/workflow-operations.schema';

/**
 * 🎯 PHASE 4.1: ENHANCED SCHEMA-BASED REQUIRED INPUT EXTRACTOR
 *
 * IMPROVEMENTS:
 * ✅ Comprehensive core-service parameter mapping
 * ✅ Enhanced schema validation for MCP_CALL operations
 * ✅ Improved error messages for missing parameters
 * ✅ Better parameter mapping between workflow JSON and service schemas
 * ✅ Enhanced debugging information for schema extraction
 */
@Injectable()
export class RequiredInputExtractorService {
  private readonly logger = new Logger(RequiredInputExtractorService.name);

  // 🎯 PHASE 4.1: Enhanced schema mapping with comprehensive service coverage
  private readonly serviceSchemas: Record<string, ZodSchema> = {
    TaskOperations: TaskOperationsSchema,
    PlanningOperations: PlanningOperationsSchema,
    IndividualSubtaskOperations: IndividualSubtaskOperationsSchema,
    SubtaskOperations: IndividualSubtaskOperationsSchema, // Alias for compatibility
    WorkflowOperations: WorkflowOperationsSchema,
    ResearchOperations: ResearchOperationsSchema,
    ReviewOperations: ReviewOperationsSchema,
  };

  // 🎯 PHASE 4.1: Operation-specific parameter requirements mapping
  private readonly operationParameterMap: Record<
    string,
    Record<string, string[]>
  > = {
    TaskOperations: {
      create: ['operation', 'taskData', 'description', 'codebaseAnalysis'],
      update: ['operation', 'id', 'taskData', 'description'],
      get: ['operation', 'id', 'slug', 'includeDescription', 'includeAnalysis'],
      list: ['operation', 'filters'],
    },
    PlanningOperations: {
      create_plan: ['operation', 'taskId', 'planData'],
      update_plan: ['operation', 'taskId', 'planData'],
      get_plan: ['operation', 'taskId', 'includeBatches'],
      create_subtasks: ['operation', 'taskId', 'batchData'],
      update_batch: ['operation', 'taskId', 'batchId', 'batchData'],
      get_batch: ['operation', 'taskId', 'batchId'],
    },
    WorkflowOperations: {
      delegate: ['operation', 'taskId', 'fromRole', 'toRole', 'message'],
      complete: ['operation', 'taskId', 'completionData'],
      escalate: ['operation', 'taskId', 'escalationReason'],
      transition: ['operation', 'taskId', 'transitionData'],
    },
    ResearchOperations: {
      create_research: ['operation', 'taskId', 'researchData'],
      update_research: ['operation', 'researchId', 'researchData'],
      get_research: ['operation', 'researchId', 'taskId'],
      add_comment: ['operation', 'researchId', 'commentData'],
      get_comments: ['operation', 'researchId'],
    },
    ReviewOperations: {
      create_review: ['operation', 'taskId', 'reviewData'],
      update_review: ['operation', 'reviewId', 'reviewData'],
      get_review: ['operation', 'reviewId', 'taskId'],
      create_completion: ['operation', 'taskId', 'completionData'],
      get_completion: ['operation', 'taskId'],
    },
    SubtaskOperations: {
      create_subtask: ['operation', 'taskId', 'subtaskData'],
      update_subtask: ['operation', 'subtaskId', 'subtaskData'],
      get_subtask: ['operation', 'subtaskId'],
      get_next_subtask: ['operation', 'taskId'],
    },
  };

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 🎯 PHASE 4.1: Enhanced public method for complete schema structure extraction
   *
   * Returns the complete schema structure as JSON that AI agents can understand precisely
   */
  extractFromServiceSchema(
    serviceName: string,
    operation?: string,
  ): {
    schemaStructure: Record<string, any>;
    requiredParameters: string[];
    optionalParameters: string[];
    validationSchema: ZodSchema | null;
    extractionMetadata: {
      serviceName: string;
      operation: string | undefined;
      schemaFound: boolean;
      extractionMethod: string;
      parametersFound: number;
    };
  } {
    this.logger.debug(
      `🎯 PHASE 4.1: Extracting complete schema structure for ${serviceName}.${operation}`,
    );

    try {
      const schema = this.serviceSchemas[serviceName];
      if (!schema) {
        this.logger.warn(`❌ No schema found for service: ${serviceName}`);
        return this.createFallbackSchemaExtraction(serviceName, operation);
      }

      // 🎯 Enhanced schema structure extraction
      const extractionResult = this.performCompleteSchemaExtraction(
        schema,
        serviceName,
        operation,
      );

      this.logger.debug(
        `✅ Schema structure extraction completed for ${serviceName}.${operation}: ${extractionResult.requiredParameters.length} required, ${extractionResult.optionalParameters.length} optional`,
      );

      return extractionResult;
    } catch (error) {
      this.logger.error(
        `💥 Schema structure extraction failed for ${serviceName}.${operation}:`,
        error,
      );
      return this.createErrorSchemaExtraction(serviceName, operation, error);
    }
  }

  /**
   * 🎯 PHASE 4.1: Complete schema structure extraction with full JSON representation
   */
  private performCompleteSchemaExtraction(
    schema: ZodSchema,
    serviceName: string,
    operation?: string,
  ): {
    schemaStructure: Record<string, any>;
    requiredParameters: string[];
    optionalParameters: string[];
    validationSchema: ZodSchema;
    extractionMetadata: any;
  } {
    const requiredParameters: string[] = [];
    const optionalParameters: string[] = [];
    const schemaStructure: Record<string, any> = {};

    try {
      // 🎯 Zod schema introspection - FIXED: shape is a function, need to call it
      const schemaShape = (schema as any)._def?.shape?.();
      if (schemaShape) {
        Object.entries(schemaShape).forEach(([key, value]: [string, any]) => {
          const fieldStructure = this.extractCompleteFieldStructure(
            key,
            value,
            serviceName,
            operation,
          );

          if (fieldStructure.required) {
            requiredParameters.push(key);
          } else {
            optionalParameters.push(key);
          }

          schemaStructure[key] = fieldStructure;
        });
      }

      // 🎯 Add operation-specific parameters from mapping
      const operationSpecific = this.getOperationSpecificParameters(
        serviceName,
        operation,
      );
      operationSpecific.forEach((param) => {
        if (
          !requiredParameters.includes(param) &&
          !optionalParameters.includes(param)
        ) {
          requiredParameters.push(param);
          schemaStructure[param] = {
            type: 'operation-specific',
            required: true,
            description: `Required parameter for ${serviceName}.${operation}`,
          };
        }
      });

      return {
        schemaStructure,
        requiredParameters,
        optionalParameters,
        validationSchema: schema,
        extractionMetadata: {
          serviceName,
          operation: operation || 'unknown',
          schemaFound: true,
          extractionMethod: 'complete-schema-structure',
          parametersFound:
            requiredParameters.length + optionalParameters.length,
          requiredCount: requiredParameters.length,
          optionalCount: optionalParameters.length,
        },
      };
    } catch (_error) {
      this.logger.warn(
        `⚠️ Complete schema extraction failed, falling back to operation mapping for ${serviceName}.${operation}`,
      );
      return this.fallbackToCompleteSchemaMapping(
        serviceName,
        operation,
        schema,
      );
    }
  }

  /**
   * 🎯 PHASE 4.1: Extract complete field structure with full type information
   */
  private extractCompleteFieldStructure(
    fieldName: string,
    fieldSchema: any,
    serviceName: string,
    operation?: string,
  ): {
    type: string;
    required: boolean;
    description: string;
    values?: string[];
    properties?: Record<string, any>;
    items?: any;
    defaultValue?: any;
  } {
    const baseStructure = {
      type: 'unknown',
      required: fieldSchema.isOptional?.() === false,
      description: this.getFieldDescription(fieldName),
    };

    if (!fieldSchema?._def) {
      return { ...baseStructure, type: 'unknown' };
    }

    const typeName = fieldSchema._def.typeName;

    switch (typeName) {
      case 'ZodString': {
        const enumValues = fieldSchema._def.checks?.find(
          (check: any) => check.kind === 'enum',
        )?.values;
        return {
          ...baseStructure,
          type: enumValues ? 'enum' : 'string',
          values: enumValues,
        };
      }

      case 'ZodNumber': {
        return { ...baseStructure, type: 'number' };
      }

      case 'ZodBoolean': {
        return { ...baseStructure, type: 'boolean' };
      }

      case 'ZodEnum': {
        const enumValues = fieldSchema._def.values || [];
        return {
          ...baseStructure,
          type: 'enum',
          values: enumValues,
        };
      }

      case 'ZodArray': {
        const arrayElement = fieldSchema._def.type;
        return {
          ...baseStructure,
          type: 'array',
          items: arrayElement
            ? this.extractCompleteFieldStructure(
                'item',
                arrayElement,
                serviceName,
                operation,
              )
            : { type: 'unknown' },
        };
      }

      case 'ZodObject': {
        const objectShape = fieldSchema._def.shape?.() || {};
        const properties: Record<string, any> = {};

        Object.entries(objectShape).forEach(([key, value]: [string, any]) => {
          properties[key] = this.extractCompleteFieldStructure(
            key,
            value,
            serviceName,
            operation,
          );
        });

        return {
          ...baseStructure,
          type: 'object',
          properties,
        };
      }

      case 'ZodOptional': {
        const innerSchema = fieldSchema._def.innerType;
        return this.extractCompleteFieldStructure(
          fieldName,
          innerSchema,
          serviceName,
          operation,
        );
      }

      case 'ZodDefault': {
        const innerSchema = fieldSchema._def.innerType;
        const defaultValue = fieldSchema._def.defaultValue?.();
        const result = this.extractCompleteFieldStructure(
          fieldName,
          innerSchema,
          serviceName,
          operation,
        );
        return { ...result, defaultValue };
      }

      case 'ZodUnion': {
        const options = fieldSchema._def.options || [];
        if (options.length > 0) {
          // For unions, try to extract the first option's structure
          return this.extractCompleteFieldStructure(
            fieldName,
            options[0],
            serviceName,
            operation,
          );
        }
        return { ...baseStructure, type: 'union' };
      }

      default: {
        return { ...baseStructure, type: typeName || 'unknown' };
      }
    }
  }

  /**
   * 🎯 PHASE 4.1: Analyze individual schema fields with comprehensive type detection
   */
  private analyzeSchemaField(
    fieldName: string,
    fieldValue: any,
    serviceName: string,
    operation?: string,
  ): {
    type: string;
    description: string;
    isRequired: boolean;
    defaultValue?: any;
    enum?: string[];
  } {
    const typeName = fieldValue._def?.typeName;
    let isRequired = true;
    let defaultValue = undefined;
    let description = `Parameter for ${serviceName}.${operation}`;

    // 🎯 Check for optional/default values
    if (typeName === 'ZodOptional') {
      isRequired = false;
      const innerType = fieldValue._def?.innerType;
      if (innerType) {
        description = this.getFieldDescription(
          fieldName,
          innerType._def?.typeName,
        );
      }
    } else if (typeName === 'ZodDefault') {
      isRequired = false;
      defaultValue = fieldValue._def?.defaultValue;
      description = this.getFieldDescription(
        fieldName,
        fieldValue._def?.innerType?._def?.typeName,
      );
    } else {
      description = this.getFieldDescription(fieldName, typeName);
    }

    // 🎯 Extract enum values if present
    let enumValues = undefined;
    if (typeName === 'ZodEnum') {
      enumValues = fieldValue._def?.values;
    }

    return {
      type: typeName || 'unknown',
      description,
      isRequired,
      defaultValue,
      enum: enumValues,
    };
  }

  /**
   * 🎯 PHASE 4.1: Generate meaningful field descriptions
   */
  private getFieldDescription(fieldName: string, typeName?: string): string {
    const descriptions: Record<string, string> = {
      operation: 'The operation to perform on the service',
      taskId: 'Unique identifier for the task',
      id: 'Unique identifier for the resource',
      taskData: 'Task data object containing task details',
      planData: 'Planning data object with plan specifications',
      researchData: 'Research data object with research parameters',
      reviewData: 'Review data object with review criteria',
      subtaskData: 'Subtask data object with subtask details',
      description: 'Detailed description of the operation or resource',
      codebaseAnalysis: 'Analysis data for codebase understanding',
      includeDescription: 'Whether to include description in response',
      includeAnalysis: 'Whether to include analysis data in response',
      includeBatches: 'Whether to include batch data in response',
      fromRole: 'Source role for delegation',
      toRole: 'Target role for delegation',
      message: 'Message or instructions for the operation',
      filters: 'Filter criteria for list operations',
    };

    const baseDescription = descriptions[fieldName] || `${fieldName} parameter`;
    const typeDescription = typeName ? ` (${typeName})` : '';

    return baseDescription + typeDescription;
  }

  /**
   * 🎯 PHASE 4.1: Get operation-specific parameters from mapping
   */
  private getOperationSpecificParameters(
    serviceName: string,
    operation?: string,
  ): string[] {
    if (!operation || !this.operationParameterMap[serviceName]) {
      return [];
    }

    return this.operationParameterMap[serviceName][operation] || [];
  }

  /**
   * 🎯 ESSENTIAL: Add core workflow inputs that are always needed
   */
  private addEssentialWorkflowInputs(requiredInputs: Set<string>): void {
    requiredInputs.add('taskId');
    requiredInputs.add('roleId');
    requiredInputs.add('projectPath');
  }

  /**
   * 🎯 Fallback to complete schema mapping when schema introspection fails
   */
  private fallbackToCompleteSchemaMapping(
    serviceName: string,
    operation: string | undefined,
    schema: ZodSchema,
  ): {
    schemaStructure: Record<string, any>;
    requiredParameters: string[];
    optionalParameters: string[];
    validationSchema: ZodSchema;
    extractionMetadata: any;
  } {
    const operationParams = this.getOperationSpecificParameters(
      serviceName,
      operation,
    );
    const schemaStructure: Record<string, any> = {};

    operationParams.forEach((param) => {
      schemaStructure[param] = {
        type: 'mapped-parameter',
        required: true,
        description: this.getFieldDescription(param),
      };
    });

    return {
      schemaStructure,
      requiredParameters: operationParams,
      optionalParameters: [],
      validationSchema: schema,
      extractionMetadata: {
        serviceName,
        operation: operation || 'unknown',
        schemaFound: true,
        extractionMethod: 'operation-mapping-fallback',
        parametersFound: operationParams.length,
        requiredCount: operationParams.length,
        optionalCount: 0,
      },
    };
  }

  /**
   * 🎯 Create fallback schema extraction when no schema is found
   */
  private createFallbackSchemaExtraction(
    serviceName: string,
    operation?: string,
  ): {
    schemaStructure: Record<string, any>;
    requiredParameters: string[];
    optionalParameters: string[];
    validationSchema: null;
    extractionMetadata: any;
  } {
    const operationParams = this.getOperationSpecificParameters(
      serviceName,
      operation,
    );
    const fallbackParams =
      operationParams.length > 0
        ? operationParams
        : ['operation', 'executionData'];

    const schemaStructure: Record<string, any> = {};
    fallbackParams.forEach((param) => {
      schemaStructure[param] = {
        type: 'fallback-parameter',
        required: true,
        description: this.getFieldDescription(param),
      };
    });

    return {
      schemaStructure,
      requiredParameters: fallbackParams,
      optionalParameters: [],
      validationSchema: null,
      extractionMetadata: {
        serviceName,
        operation: operation || 'unknown',
        schemaFound: false,
        extractionMethod: 'fallback-parameters',
        parametersFound: fallbackParams.length,
        warning: `No schema found for ${serviceName}, using fallback parameters`,
      },
    };
  }

  /**
   * 🎯 Create error schema extraction when extraction fails
   */
  private createErrorSchemaExtraction(
    serviceName: string,
    operation: string | undefined,
    error: any,
  ): {
    schemaStructure: Record<string, any>;
    requiredParameters: string[];
    optionalParameters: string[];
    validationSchema: null;
    extractionMetadata: any;
  } {
    return {
      schemaStructure: {
        operation: {
          type: 'error-fallback',
          required: true,
          description: 'Operation name (required due to extraction error)',
        },
        executionData: {
          type: 'error-fallback',
          required: true,
          description: 'Execution data (fallback due to extraction error)',
        },
      },
      requiredParameters: ['operation', 'executionData'],
      optionalParameters: [],
      validationSchema: null,
      extractionMetadata: {
        serviceName,
        operation: operation || 'unknown',
        schemaFound: false,
        extractionMethod: 'error-fallback',
        parametersFound: 2,
        error: error.message,
        warning: 'Schema extraction failed, using minimal fallback parameters',
      },
    };
  }

  /**
   * 🎯 NEW: Extract required inputs from step actions
   * Analyzes step actions to determine MCP operation parameter requirements
   */
  extractRequiredInputFromStepActions(
    stepId: string | null,
    stepActions: any[],
  ): string[] {
    const requiredInputs = new Set<string>();

    // 🎯 PRIMARY: Extract from schemas for MCP service parameters
    stepActions?.forEach((action: any) => {
      if (action.actionType === 'MCP_CALL' && action.actionData?.serviceName) {
        const extraction = this.extractFromServiceSchema(
          action.actionData.serviceName,
          action.actionData.operation,
        );
        extraction.requiredParameters.forEach((input: string) =>
          requiredInputs.add(input),
        );
        // Add a few important optional parameters
        extraction.optionalParameters
          .slice(0, 2)
          .forEach((input: string) => requiredInputs.add(input));
      }
    });

    // 🎯 SECONDARY: Add essential workflow inputs
    this.addEssentialWorkflowInputs(requiredInputs);

    // 🎯 OPTIMIZATION: Cap at reasonable limit but don't artificially restrict schema params
    const result = Array.from(requiredInputs);

    this.logger.debug(
      `Extracted ${result.length} schema-based inputs for step ${stepId}: ${result.join(', ')}`,
    );
    return result;
  }

  /**
   * 🎯 LEGACY: Extract required inputs with proper schema introspection
   * @deprecated Use extractRequiredInputFromStepActions instead
   */
  extractRequiredInput(
    _stepId: string | null,
    _guidance: WorkflowGuidance,
  ): string[] {
    // Return basic inputs since WorkflowGuidance doesn't contain step actions
    const requiredInputs = new Set<string>();
    this.addEssentialWorkflowInputs(requiredInputs);
    return Array.from(requiredInputs);
  }
}
