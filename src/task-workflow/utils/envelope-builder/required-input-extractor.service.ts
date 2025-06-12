import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { WorkflowGuidance } from '../../domains/workflow-rules/services/workflow-guidance.service';

// 🎯 PHASE 4.1: Enhanced schema imports with comprehensive core-workflow coverage
import { ZodSchema } from 'zod';
import { IndividualSubtaskOperationsSchema } from '../../domains/core-workflow/schemas/individual-subtask-operations.schema';
import { PlanningOperationsSchema } from '../../domains/core-workflow/schemas/planning-operations.schema';
import { ResearchOperationsSchema } from '../../domains/core-workflow/schemas/research-operations.schema';
import { ReviewOperationsSchema } from '../../domains/core-workflow/schemas/review-operations.schema';
import { TaskOperationsSchema } from '../../domains/core-workflow/schemas/task-operations.schema';
import { WorkflowOperationsSchema } from '../../domains/core-workflow/schemas/workflow-operations.schema';

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
   * 🎯 PHASE 4.1: Enhanced public method for direct schema extraction
   *
   * This is the key method that enables schema-based parameter extraction
   * for MCP_CALL operations in workflow JSON files
   */
  extractFromServiceSchema(
    serviceName: string,
    operation?: string,
  ): {
    requiredParameters: string[];
    optionalParameters: string[];
    parameterDetails: Record<string, any>;
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
      `🎯 PHASE 4.1: Extracting schema parameters for ${serviceName}.${operation}`,
    );

    try {
      const schema = this.serviceSchemas[serviceName];
      if (!schema) {
        this.logger.warn(`❌ No schema found for service: ${serviceName}`);
        return this.createFallbackExtraction(serviceName, operation);
      }

      // 🎯 Enhanced schema introspection
      const extractionResult = this.performEnhancedSchemaExtraction(
        schema,
        serviceName,
        operation,
      );

      this.logger.debug(
        `✅ Schema extraction completed for ${serviceName}.${operation}: ${extractionResult.requiredParameters.length} required, ${extractionResult.optionalParameters.length} optional`,
      );

      return extractionResult;
    } catch (error) {
      this.logger.error(
        `💥 Schema extraction failed for ${serviceName}.${operation}:`,
        error,
      );
      return this.createErrorExtraction(serviceName, operation, error);
    }
  }

  /**
   * 🎯 PHASE 4.1: Enhanced schema introspection with comprehensive parameter detection
   */
  private performEnhancedSchemaExtraction(
    schema: ZodSchema,
    serviceName: string,
    operation?: string,
  ): {
    requiredParameters: string[];
    optionalParameters: string[];
    parameterDetails: Record<string, any>;
    validationSchema: ZodSchema;
    extractionMetadata: any;
  } {
    const requiredParameters: string[] = [];
    const optionalParameters: string[] = [];
    const parameterDetails: Record<string, any> = {};

    try {
      // 🎯 Zod schema introspection
      const schemaShape = (schema as any)._def?.shape;
      if (schemaShape) {
        Object.entries(schemaShape).forEach(([key, value]: [string, any]) => {
          const fieldInfo = this.analyzeSchemaField(
            key,
            value,
            serviceName,
            operation,
          );

          if (fieldInfo.isRequired) {
            requiredParameters.push(key);
          } else {
            optionalParameters.push(key);
          }

          parameterDetails[key] = fieldInfo;
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
          parameterDetails[param] = {
            type: 'operation-specific',
            description: `Required parameter for ${serviceName}.${operation}`,
            isRequired: true,
          };
        }
      });

      return {
        requiredParameters,
        optionalParameters,
        parameterDetails,
        validationSchema: schema,
        extractionMetadata: {
          serviceName,
          operation: operation || 'unknown',
          schemaFound: true,
          extractionMethod: 'enhanced-zod-introspection',
          parametersFound:
            requiredParameters.length + optionalParameters.length,
          requiredCount: requiredParameters.length,
          optionalCount: optionalParameters.length,
        },
      };
    } catch (_error) {
      this.logger.warn(
        `⚠️ Enhanced extraction failed, falling back to operation mapping for ${serviceName}.${operation}`,
      );
      return this.fallbackToOperationMapping(serviceName, operation, schema);
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
   * 🎯 PHASE 4.1: Fallback to operation mapping when schema introspection fails
   */
  private fallbackToOperationMapping(
    serviceName: string,
    operation: string | undefined,
    schema: ZodSchema,
  ): {
    requiredParameters: string[];
    optionalParameters: string[];
    parameterDetails: Record<string, any>;
    validationSchema: ZodSchema;
    extractionMetadata: any;
  } {
    const operationParams = this.getOperationSpecificParameters(
      serviceName,
      operation,
    );
    const parameterDetails: Record<string, any> = {};

    operationParams.forEach((param) => {
      parameterDetails[param] = {
        type: 'mapped-parameter',
        description: this.getFieldDescription(param),
        isRequired: true,
      };
    });

    return {
      requiredParameters: operationParams,
      optionalParameters: [],
      parameterDetails,
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
   * 🎯 PHASE 4.1: Create fallback extraction when no schema is found
   */
  private createFallbackExtraction(
    serviceName: string,
    operation?: string,
  ): {
    requiredParameters: string[];
    optionalParameters: string[];
    parameterDetails: Record<string, any>;
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

    const parameterDetails: Record<string, any> = {};
    fallbackParams.forEach((param) => {
      parameterDetails[param] = {
        type: 'fallback-parameter',
        description: this.getFieldDescription(param),
        isRequired: true,
      };
    });

    return {
      requiredParameters: fallbackParams,
      optionalParameters: [],
      parameterDetails,
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
   * 🎯 PHASE 4.1: Create error extraction when extraction fails
   */
  private createErrorExtraction(
    serviceName: string,
    operation: string | undefined,
    error: any,
  ): {
    requiredParameters: string[];
    optionalParameters: string[];
    parameterDetails: Record<string, any>;
    validationSchema: null;
    extractionMetadata: any;
  } {
    return {
      requiredParameters: ['operation', 'executionData'],
      optionalParameters: [],
      parameterDetails: {
        operation: {
          type: 'error-fallback',
          description: 'Operation name (required due to extraction error)',
          isRequired: true,
        },
        executionData: {
          type: 'error-fallback',
          description: 'Execution data (fallback due to extraction error)',
          isRequired: true,
        },
      },
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
   * 🎯 RESTORED: Extract required inputs with proper schema introspection
   * Combines schema-based extraction with context-aware filtering
   */
  extractRequiredInput(
    stepId: string | null,
    guidance: WorkflowGuidance,
  ): string[] {
    const requiredInputs = new Set<string>();

    // 🎯 PRIMARY: Extract from schemas for MCP service parameters
    guidance.nextActions?.forEach((action) => {
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
   * 🎯 ESSENTIAL: Add core workflow inputs that are always needed
   */
  private addEssentialWorkflowInputs(requiredInputs: Set<string>): void {
    requiredInputs.add('taskId');
    requiredInputs.add('roleId');
    requiredInputs.add('projectPath');
  }
}
