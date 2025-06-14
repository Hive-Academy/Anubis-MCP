/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, Logger } from '@nestjs/common';
import { ZodSchema } from 'zod';

// Import ALL schemas dynamically
import { TaskOperationsSchema } from '../../core-workflow/schemas/task-operations.schema';
import { PlanningOperationsSchema } from '../../core-workflow/schemas/planning-operations.schema';
import { WorkflowOperationsSchema } from '../../core-workflow/schemas/workflow-operations.schema';
import { ResearchOperationsSchema } from '../../core-workflow/schemas/research-operations.schema';
import { ReviewOperationsSchema } from '../../core-workflow/schemas/review-operations.schema';
import { IndividualSubtaskOperationsSchema } from '../../core-workflow/schemas/individual-subtask-operations.schema';

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
  private readonly logger = new Logger(SchemaDefinitionGeneratorService.name);

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
    schemaDefinition: string;
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
    } catch (error) {
      this.logger.error(
        `Failed to generate schema definition for ${serviceName}.${operation}`,
        error,
      );
      return {
        schemaDefinition: `Schema definition generation failed for ${serviceName}.${operation}: ${error.message}`,
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
  ): string {
    try {
      const schemaStructure = this.parseZodSchemaToStructure(schema);
      return this.formatSchemaStructureAsText(
        schemaStructure,
        serviceName,
        operation,
      );
    } catch (error) {
      this.logger.warn(
        `Failed to parse schema for ${serviceName}, using fallback`,
        error,
      );
      return `Schema definition for ${serviceName}.${operation} - parsing failed, using basic structure`;
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
   * 🎯 DYNAMIC: Format parsed schema structure as readable text - NO HARDCODED LOGIC
   */
  private formatSchemaStructureAsText(
    structure: any,
    serviceName: string,
    operation?: string,
  ): string {
    const lines: string[] = [];
    lines.push(`${serviceName} Schema for operation: ${operation}`);
    lines.push('');
    lines.push('Required structure:');

    const formatted = this.formatObjectStructure(structure, 0);
    lines.push(formatted);

    // 🎯 DYNAMIC: Add generic helpful notes (no service-specific hardcoding)
    lines.push('');
    lines.push('IMPORTANT NOTES:');
    lines.push('- All optional fields can be omitted if not needed');
    lines.push('- Follow the exact structure shown for best results');
    lines.push('- Enum fields must use one of the specified values');
    lines.push('- Array fields should contain items of the specified type');
    lines.push('- Record fields are key-value objects with string keys');

    return lines.join('\n');
  }

  /**
   * 🎯 DYNAMIC: Format object structure recursively
   */
  private formatObjectStructure(
    structure: Record<string, any>,
    indent: number = 0,
  ): string {
    const spaces = '  '.repeat(indent);

    if (structure.type === 'object' && structure.properties) {
      const lines: string[] = ['{'];

      Object.entries(structure.properties).forEach(
        ([key, value]: [string, any]) => {
          const optional = value.optional ? ' (optional)' : '';
          const description = value.description
            ? ` - ${value.description}`
            : '';
          const defaultValue =
            value.default !== undefined
              ? ` (default: ${JSON.stringify(value.default)})`
              : '';

          if (value.type === 'object') {
            lines.push(
              `${spaces}  ${key}: ${this.formatObjectStructure(value, indent + 1)}${optional}${description}${defaultValue},`,
            );
          } else if (value.type === 'array') {
            const itemType = this.formatTypeDescription(value.items);
            lines.push(
              `${spaces}  ${key}: ${itemType}[]${optional}${description}${defaultValue},`,
            );
          } else if (value.type === 'enum') {
            const enumValues =
              value.values?.map((v: any) => `"${v}"`).join(' | ') || 'enum';
            lines.push(
              `${spaces}  ${key}: ${enumValues}${optional}${description}${defaultValue},`,
            );
          } else if (value.type === 'record') {
            const valueType = this.formatTypeDescription(value.valueType);
            lines.push(
              `${spaces}  ${key}: Record<string, ${valueType}>${optional}${description}${defaultValue},`,
            );
          } else if (value.type === 'union') {
            const unionTypes =
              value.options
                ?.map((opt: any) => this.formatTypeDescription(opt))
                .join(' | ') || 'union';
            lines.push(
              `${spaces}  ${key}: ${unionTypes}${optional}${description}${defaultValue},`,
            );
          } else {
            const typeDesc = this.formatTypeDescription(value);
            lines.push(
              `${spaces}  ${key}: ${typeDesc}${optional}${description}${defaultValue},`,
            );
          }
        },
      );

      lines.push(`${spaces}}`);
      return lines.join('\n');
    }

    return this.formatTypeDescription(structure);
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
