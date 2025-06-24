/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable } from '@nestjs/common';
import { ZodSchema } from 'zod';

// Import ALL schemas dynamically
import { IndividualSubtaskOperationsSchema } from '../../core-workflow/schemas/individual-subtask-operations.schema';
import { PlanningOperationsSchema } from '../../core-workflow/schemas/planning-operations.schema';
import { ResearchOperationsSchema } from '../../core-workflow/schemas/research-operations.schema';
import { ReviewOperationsSchema } from '../../core-workflow/schemas/review-operations.schema';
import { TaskOperationsSchema } from '../../core-workflow/schemas/task-operations.schema';
import { WorkflowOperationsSchema } from '../../core-workflow/schemas/workflow-operations.schema';

/**
 * 🎯 SCHEMA DEFINITION GENERATOR SERVICE - FULLY DYNAMIC
 *
 * Dedicated service for converting Zod schemas into readable text definitions
 * and generating examples. This service handles all dynamic schema introspection
 * and formatting with ZERO hardcoded logic.
 *
 * RESPONSIBILITIES:
 * - Parse Zod schemas into structured data
 * - Format schema structures as readable text
 * - Generate example objects from schemas
 * - Handle all schema-to-text conversion logic
 *
 * PRINCIPLES:
 * - NO hardcoded service-specific logic
 * - NO hardcoded examples or notes
 * - FULLY dynamic based on actual schema definitions
 * - Automatically adapts to schema changes
 */
@Injectable()
export class SchemaDefinitionGeneratorService {
  // 🎯 DYNAMIC: Schema registry - automatically includes all imported schemas
  private readonly schemaRegistry: Record<string, ZodSchema> = {
    TaskOperations: TaskOperationsSchema,
    PlanningOperations: PlanningOperationsSchema,
    WorkflowOperations: WorkflowOperationsSchema,
    ResearchOperations: ResearchOperationsSchema,
    ReviewOperations: ReviewOperationsSchema,
    IndividualSubtaskOperations: IndividualSubtaskOperationsSchema,
    SubtaskOperations: IndividualSubtaskOperationsSchema, // Alias
  };

  /**
   * 🎯 MAIN: Generate complete schema definition with examples
   */
  generateSchemaDefinition(
    schema: ZodSchema,
    serviceName: string,
    operation?: string,
  ): {
    schemaDefinition: Record<string, any>;
  } {
    try {
      const schemaDefinition = this.generateSchemaDefinitionFromZod(
        schema,
        serviceName,
        operation,
      );

      return {
        schemaDefinition,
      };
    } catch (_error) {
      return {
        schemaDefinition: {},
      };
    }
  }

  /**
   * 🎯 DYNAMIC: Generate schema definition from actual Zod schema
   */
  private generateSchemaDefinitionFromZod(
    schema: ZodSchema,
    serviceName: string,
    operation?: string,
  ): Record<string, any> {
    try {
      const fullSchema = this.parseZodSchemaToStructure(schema);

      // If operation is specified, try to extract operation-specific schema
      if (operation && fullSchema.type === 'object' && fullSchema.properties) {
        // Look for operation-specific properties or discriminated union
        if (fullSchema.properties.operation) {
          // This is likely a discriminated union based on operation
          return this.extractOperationSpecificSchema(fullSchema, operation);
        }
      }

      // Return full schema if no operation-specific extraction possible
      return fullSchema;
    } catch (error) {
      return {
        type: 'unknown',
        description: `Failed to parse schema for ${serviceName}: ${error.message}`,
      };
    }
  }

  /**
   * 🎯 DYNAMIC: Extract operation-specific schema from discriminated union
   */
  private extractOperationSpecificSchema(
    fullSchema: Record<string, any>,
    operation: string,
  ): Record<string, any> {
    try {
      // If the schema has a union type based on operation field
      if (fullSchema.properties?.operation?.type === 'enum') {
        const operationValues = fullSchema.properties.operation.values || [];

        if (!operationValues.includes(operation)) {
          return {
            type: 'object',
            description: `Operation '${operation}' not supported. Available operations: ${operationValues.join(', ')}`,
            properties: {},
          };
        }
      }

      // Return the schema structure with operation-specific context
      const operationSchema = {
        type: 'object',
        description: `Schema for ${operation} operation`,
        properties: {
          operation: {
            type: 'string',
            value: operation,
            description: `Must be "${operation}"`,
          },
          ...Object.fromEntries(
            Object.entries(fullSchema.properties || {}).filter(
              ([key]) => key !== 'operation',
            ),
          ),
        },
      };

      return operationSchema;
    } catch (_error) {
      return fullSchema;
    }
  }

  /**
   * 🎯 DYNAMIC: Parse Zod schema into readable structure
   */
  parseZodSchemaToStructure(schema: ZodSchema): Record<string, any> {
    const def = (schema as any)._def;

    if (!def) {
      return { type: 'unknown' };
    }

    switch (def.typeName) {
      case 'ZodObject': {
        const shape = def.shape?.() || {};
        const properties: Record<string, any> = {};

        Object.entries(shape).forEach(([key, value]: [string, any]) => {
          properties[key] = this.parseZodSchemaToStructure(value);
        });

        return {
          type: 'object',
          properties,
        };
      }

      case 'ZodString': {
        return {
          type: 'string',
          description: def.description,
        };
      }

      case 'ZodNumber': {
        return {
          type: 'number',
          description: def.description,
          min: def.checks?.find((c: any) => c.kind === 'min')?.value,
          max: def.checks?.find((c: any) => c.kind === 'max')?.value,
        };
      }

      case 'ZodBoolean': {
        return {
          type: 'boolean',
          description: def.description,
        };
      }

      case 'ZodArray': {
        return {
          type: 'array',
          items: this.parseZodSchemaToStructure(def.type),
          description: def.description,
        };
      }

      case 'ZodEnum': {
        return {
          type: 'enum',
          values: def.values || [],
          description: def.description,
        };
      }

      case 'ZodOptional': {
        const innerStructure = this.parseZodSchemaToStructure(def.innerType);
        return {
          ...innerStructure,
          optional: true,
        };
      }

      case 'ZodDefault': {
        const defaultStructure = this.parseZodSchemaToStructure(def.innerType);
        return {
          ...defaultStructure,
          default: def.defaultValue?.(),
          optional: true,
        };
      }

      case 'ZodRecord': {
        return {
          type: 'record',
          valueType: this.parseZodSchemaToStructure(def.valueType),
          description: def.description,
        };
      }

      case 'ZodUnion': {
        return {
          type: 'union',
          options:
            def.options?.map((opt: any) =>
              this.parseZodSchemaToStructure(opt),
            ) || [],
          description: def.description,
        };
      }

      case 'ZodRefine': {
        // Handle refined schemas by extracting the inner type
        return this.parseZodSchemaToStructure(def.schema);
      }

      case 'ZodEffects': {
        // Handle effects (from .refine(), .transform(), etc.) by extracting the inner type
        return this.parseZodSchemaToStructure(def.schema);
      }

      default: {
        return {
          type: def.typeName || 'unknown',
          description: def.description,
        };
      }
    }
  }

  /**
   * 🎯 DYNAMIC: Format type description
   */
  private formatTypeDescription(structure: Record<string, any>): string {
    if (!structure) return 'any';

    switch (structure.type) {
      case 'string': {
        return 'string';
      }
      case 'number': {
        let numType = 'number';
        if (structure.min !== undefined || structure.max !== undefined) {
          const constraints = [];
          if (structure.min !== undefined)
            constraints.push(`min: ${structure.min}`);
          if (structure.max !== undefined)
            constraints.push(`max: ${structure.max}`);
          numType += ` (${constraints.join(', ')})`;
        }
        return numType;
      }
      case 'boolean': {
        return 'boolean';
      }
      case 'array': {
        return `${this.formatTypeDescription(structure.items)}[]`;
      }
      case 'enum': {
        return (
          structure.values?.map((v: any) => `"${v}"`).join(' | ') || 'enum'
        );
      }
      case 'record': {
        return `Record<string, ${this.formatTypeDescription(structure.valueType)}>`;
      }
      case 'union': {
        return (
          structure.options
            ?.map((opt: any) => this.formatTypeDescription(opt))
            .join(' | ') || 'union'
        );
      }
      case 'object': {
        return 'object';
      }
      default: {
        return structure.type || 'any';
      }
    }
  }

  /**
   * 🎯 UTILITY: Get schema by service name (for external use)
   */
  getSchemaByServiceName(serviceName: string): ZodSchema | null {
    return this.schemaRegistry[serviceName] || null;
  }

  /**
   * 🎯 UTILITY: Get all available service names
   */
  getAvailableServiceNames(): string[] {
    return Object.keys(this.schemaRegistry);
  }
}
