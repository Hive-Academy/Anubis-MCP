/**
 * 🔧 DYNAMIC ID VALIDATOR UTILITY
 *
 * Purpose: Dynamically extract required workflow IDs from Zod schemas
 * and create appropriate validation decorators for MCP tools
 *
 * Features:
 * - Analyzes Zod schemas to find workflow-related fields
 * - Creates decorators with proper validation config
 * - Supports automatic ID correction strategies
 */

import { SetMetadata } from '@nestjs/common';
import { ZodSchema } from 'zod';
import {
  IdValidationConfig,
  WORKFLOW_ID_VALIDATION,
} from '../guards/workflow-context-validation.guard';

// Workflow ID field mapping
const WORKFLOW_ID_FIELDS = {
  executionId: { type: 'string', required: true, strategy: 'mostRecent' },
  taskId: { type: 'number', required: true, strategy: 'byTaskId' },
  currentRoleId: { type: 'string', required: false, strategy: 'mostRecent' },
  currentStepId: { type: 'string', required: false, strategy: 'mostRecent' },
  roleId: { type: 'string', required: false, strategy: 'mostRecent' },
  stepId: { type: 'string', required: false, strategy: 'mostRecent' },
} as const;

type WorkflowIdField = keyof typeof WORKFLOW_ID_FIELDS;

export interface SchemaAnalysisResult {
  foundIds: WorkflowIdField[];
  requiredIds: WorkflowIdField[];
  optionalIds: WorkflowIdField[];
  recommendedStrategy: 'mostRecent' | 'byTaskId' | 'byExecutionId';
  allowBootstrap: boolean;
}

/**
 * Analyze a Zod schema to extract workflow ID requirements
 */
export function analyzeSchemaForWorkflowIds(
  schema: ZodSchema,
): SchemaAnalysisResult {
  const foundIds: WorkflowIdField[] = [];
  const requiredIds: WorkflowIdField[] = [];
  const optionalIds: WorkflowIdField[] = [];

  try {
    // Extract schema shape if it's a ZodObject
    let schemaShape: any = null;

    // Try direct shape access (for ZodObject)
    if ('shape' in schema) {
      schemaShape = (schema as any).shape;
    } else if ('_def' in schema) {
      // Try accessing via _def with type safety bypass
      const def = (schema as any)._def;
      if (def && typeof def.shape === 'function') {
        schemaShape = def.shape();
      } else if (def && def.shape && typeof def.shape === 'object') {
        schemaShape = def.shape;
      }
    }

    if (schemaShape) {
      // Iterate through schema properties
      for (const [fieldName, fieldSchema] of Object.entries(schemaShape)) {
        if (fieldName in WORKFLOW_ID_FIELDS) {
          const workflowField = fieldName as WorkflowIdField;
          foundIds.push(workflowField);

          // Check if field is optional/nullable
          const isOptional = isOptionalField(fieldSchema as any);

          if (isOptional) {
            optionalIds.push(workflowField);
          } else {
            requiredIds.push(workflowField);
          }
        }
      }
    }

    // Determine recommended strategy based on found IDs
    let recommendedStrategy: 'mostRecent' | 'byTaskId' | 'byExecutionId' =
      'mostRecent';

    if (foundIds.includes('taskId')) {
      recommendedStrategy = 'byTaskId';
    } else if (foundIds.includes('executionId')) {
      recommendedStrategy = 'byExecutionId';
    }

    // Bootstrap tools typically have minimal required IDs
    const allowBootstrap =
      requiredIds.length === 0 ||
      (requiredIds.length === 1 && requiredIds.includes('taskId'));

    return {
      foundIds,
      requiredIds,
      optionalIds,
      recommendedStrategy,
      allowBootstrap,
    };
  } catch (error) {
    console.warn('Schema analysis failed:', error);
    return {
      foundIds: [],
      requiredIds: [],
      optionalIds: [],
      recommendedStrategy: 'mostRecent',
      allowBootstrap: false,
    };
  }
}

/**
 * Check if a Zod field is optional or nullable
 */
function isOptionalField(fieldSchema: any): boolean {
  if (!fieldSchema || !fieldSchema._def) {
    return false;
  }

  const def = fieldSchema._def;

  // Check for ZodOptional
  if (def.typeName === 'ZodOptional') {
    return true;
  }

  // Check for ZodNullable
  if (def.typeName === 'ZodNullable') {
    return true;
  }

  // Check for ZodDefault (has default value, so effectively optional)
  if (def.typeName === 'ZodDefault') {
    return true;
  }

  // Check for refined schemas that might be optional
  if (def.typeName === 'ZodEffects' && def.schema) {
    return isOptionalField(def.schema);
  }

  return false;
}

/**
 * 🎯 DYNAMIC DECORATOR: Auto-generates RequireWorkflowIds decorator from Zod schema
 *
 * @param schema - Zod schema to analyze
 * @param overrides - Manual overrides for the generated config
 *
 * @example
 * ```typescript
 * const schema = z.object({
 *   executionId: z.string().optional(),
 *   taskId: z.number(),
 *   someOtherField: z.string()
 * });
 *
 * @DynamicWorkflowValidation(schema)
 * @Tool({ name: 'my_tool', parameters: schema })
 * async myTool(input: any) { ... }
 * ```
 */
export function DynamicWorkflowValidation(
  schema: ZodSchema,
  overrides: Partial<IdValidationConfig> = {},
) {
  const analysis = analyzeSchemaForWorkflowIds(schema);

  // Map workflow fields to standard ID names
  const requiredIds = analysis.requiredIds
    .map(mapToStandardId)
    .filter(Boolean) as (
    | 'executionId'
    | 'taskId'
    | 'currentRoleId'
    | 'currentStepId'
  )[];

  const config: IdValidationConfig = {
    requiredIds,
    autoCorrect: true,
    allowBootstrap: analysis.allowBootstrap,
    contextSelectionStrategy: analysis.recommendedStrategy,
    logCorrections: true,
    ...overrides, // Allow manual overrides
  };

  return SetMetadata(WORKFLOW_ID_VALIDATION, config);
}

/**
 * Map field names to standard workflow ID names
 */
function mapToStandardId(field: WorkflowIdField): string | null {
  switch (field) {
    case 'executionId':
      return 'executionId';
    case 'taskId':
      return 'taskId';
    case 'currentRoleId':
      return 'currentRoleId';
    case 'currentStepId':
      return 'currentStepId';
    case 'roleId':
      return 'currentRoleId'; // Map roleId to currentRoleId
    case 'stepId':
      return 'currentStepId'; // Map stepId to currentStepId
    default:
      return null;
  }
}

/**
 * 🔍 DEBUGGING: Analyze schema and log the analysis results
 */
export function analyzeSchemaAndLog(
  toolName: string,
  schema: ZodSchema,
): SchemaAnalysisResult {
  const analysis = analyzeSchemaForWorkflowIds(schema);

  console.log(`🔍 Schema Analysis for ${toolName}:`, {
    foundIds: analysis.foundIds,
    requiredIds: analysis.requiredIds,
    optionalIds: analysis.optionalIds,
    recommendedStrategy: analysis.recommendedStrategy,
    allowBootstrap: analysis.allowBootstrap,
  });

  return analysis;
}

/**
 * 🚀 CONVENIENCE: All-in-one decorator that combines schema analysis with validation
 *
 * @param schema - Zod schema to analyze and validate
 * @param toolName - Tool name for debugging (optional)
 * @param overrides - Manual config overrides
 */
export function AutoWorkflowValidation(
  schema: ZodSchema,
  toolName?: string,
  overrides: Partial<IdValidationConfig> = {},
) {
  if (toolName && process.env.NODE_ENV === 'development') {
    analyzeSchemaAndLog(toolName, schema);
  }

  return DynamicWorkflowValidation(schema, overrides);
}
