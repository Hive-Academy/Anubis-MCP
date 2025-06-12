import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { WorkflowGuidance } from '../../domains/workflow-rules/services/workflow-guidance.service';

// 🎯 RESTORED: Import actual core-workflow schemas for proper parameter extraction
import { ZodSchema } from 'zod';
import { IndividualSubtaskOperationsSchema } from '../../domains/core-workflow/schemas/individual-subtask-operations.schema';
import { PlanningOperationsSchema } from '../../domains/core-workflow/schemas/planning-operations.schema';
import { ResearchOperationsSchema } from '../../domains/core-workflow/schemas/research-operations.schema';
import { ReviewOperationsSchema } from '../../domains/core-workflow/schemas/review-operations.schema';
import { TaskOperationsSchema } from '../../domains/core-workflow/schemas/task-operations.schema';
import { WorkflowOperationsSchema } from '../../domains/core-workflow/schemas/workflow-operations.schema';

/**
 * 🎯 RESTORED: SCHEMA-BASED REQUIRED INPUT EXTRACTOR
 *
 * Dynamically extracts exact schema parameters from core-workflow methods
 * When workflow says "call TaskOperations.create", this extracts the actual
 * TaskOperationsSchema parameters for the create operation
 */
@Injectable()
export class RequiredInputExtractorService {
  private readonly logger = new Logger(RequiredInputExtractorService.name);

  // 🎯 RESTORED: Schema mapping for service-based parameter extraction
  private readonly serviceSchemas: Record<string, ZodSchema> = {
    TaskOperations: TaskOperationsSchema,
    PlanningOperations: PlanningOperationsSchema,
    IndividualSubtaskOperations: IndividualSubtaskOperationsSchema,
    WorkflowOperations: WorkflowOperationsSchema,
    ResearchOperations: ResearchOperationsSchema,
    ReviewOperations: ReviewOperationsSchema,
  };

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 🎯 RESTORED: Extract required inputs with proper schema introspection
   * Combines schema-based extraction with context-aware filtering
   */
  async extractRequiredInput(
    stepId: string | null,
    guidance: WorkflowGuidance,
  ): Promise<string[]> {
    const requiredInputs = new Set<string>();

    // 🎯 PRIMARY: Extract from schemas for MCP service parameters
    guidance.nextActions?.forEach((action) => {
      if (action.actionType === 'MCP_CALL' && action.actionData?.serviceName) {
        const schemaInputs = this.extractFromServiceSchema(
          action.actionData.serviceName,
          action.actionData.operation,
        );
        schemaInputs.forEach((input) => requiredInputs.add(input));
      } else {
        // For non-MCP actions, add action-specific inputs
        this.addActionTypeSpecificInputs(action.actionType, requiredInputs);
      }
    });

    // 🎯 SECONDARY: Add essential workflow inputs
    this.addEssentialWorkflowInputs(requiredInputs);

    // 🎯 OPTIONAL: Add step-specific inputs if available
    if (stepId) {
      await this.addStepSpecificInputs(stepId, requiredInputs);
    }

    // 🎯 OPTIMIZATION: Cap at reasonable limit but don't artificially restrict schema params
    const result = Array.from(requiredInputs);

    this.logger.debug(
      `Extracted ${result.length} schema-based inputs for step ${stepId}: ${result.join(', ')}`,
    );
    return result;
  }

  /**
   * 🎯 RESTORED: Extract exact parameter structures from Zod schemas
   * This provides AI agents with precise executionData requirements
   */
  private extractFromServiceSchema(
    serviceName: string,
    operation?: string,
  ): string[] {
    const schema = this.serviceSchemas[serviceName];
    if (!schema) {
      this.logger.warn(`No schema found for service: ${serviceName}`);
      return ['executionData']; // Fallback
    }

    const requiredFields: string[] = [];
    const optionalFields: string[] = [];

    try {
      // 🎯 SCHEMA INTROSPECTION: Extract from Zod schema shape
      const shape = (schema as any)._def?.shape;
      if (shape) {
        Object.entries(shape).forEach(([key, value]: [string, any]) => {
          // Check if field is optional
          const isOptional =
            value._def?.typeName === 'ZodOptional' ||
            value._def?.defaultValue !== undefined;

          // 🎯 OPERATION-SPECIFIC: Include operation-relevant fields
          if (this.isFieldRelevantForOperation(key, operation, serviceName)) {
            if (isOptional) {
              optionalFields.push(key);
            } else {
              requiredFields.push(key);
            }
          }
        });
      }

      // 🎯 SERVICE-SPECIFIC: Add operation-specific requirements
      const operationSpecific = this.getOperationSpecificInputs(
        serviceName,
        operation,
      );
      requiredFields.push(...operationSpecific);

      this.logger.debug(
        `Schema extraction for ${serviceName}.${operation}: ${requiredFields.length} required, ${optionalFields.length} optional`,
      );

      // Return required fields first, then important optional fields
      return [...requiredFields, ...optionalFields.slice(0, 3)]; // Limit optional to 3 most important
    } catch (error) {
      this.logger.warn(`Failed to extract from schema ${serviceName}:`, error);
      return ['executionData']; // Fallback
    }
  }

  /**
   * 🎯 OPERATION RELEVANCE: Determine if field is relevant for specific operation
   */
  private isFieldRelevantForOperation(
    field: string,
    operation: string | undefined,
    serviceName: string,
  ): boolean {
    // Always include operation field
    if (field === 'operation') return true;

    // Service-specific field relevance
    if (serviceName === 'TaskOperations') {
      if (operation === 'create') {
        return ['taskData', 'description', 'codebaseAnalysis'].includes(field);
      } else if (operation === 'update') {
        return ['id', 'taskData', 'description'].includes(field);
      } else if (operation === 'get') {
        return ['id', 'slug', 'includeDescription', 'includeAnalysis'].includes(
          field,
        );
      }
    } else if (serviceName === 'PlanningOperations') {
      if (operation === 'create_plan') {
        return ['taskId', 'planData'].includes(field);
      } else if (operation === 'create_subtasks') {
        return ['taskId', 'batchData'].includes(field);
      } else if (operation === 'get_plan') {
        return ['taskId', 'includeBatches'].includes(field);
      }
    } else if (serviceName === 'WorkflowOperations') {
      if (operation === 'delegate') {
        return ['taskId', 'fromRole', 'toRole', 'message'].includes(field);
      }
    }

    // Include common fields
    return ['taskId', 'id', 'operation'].includes(field);
  }

  /**
   * 🎯 OPERATION-SPECIFIC: Get additional inputs based on operation type
   */
  private getOperationSpecificInputs(
    serviceName: string,
    operation: string | undefined,
  ): string[] {
    const key = `${serviceName}.${operation}`;

    const operationMap: Record<string, string[]> = {
      'TaskOperations.create': [
        'businessRequirements',
        'technicalRequirements',
        'acceptanceCriteria',
      ],
      'TaskOperations.update': ['updateReason'],
      'PlanningOperations.create_plan': [
        'strategicGuidance',
        'architecturalRationale',
      ],
      'PlanningOperations.create_subtasks': ['batchTitle', 'strategicGuidance'],
      'WorkflowOperations.delegate': [
        'delegationReason',
        'contextPreservation',
      ],
      'ReviewOperations.create_review': ['reviewCriteria', 'qualityStandards'],
      'ResearchOperations.create_research': [
        'researchScope',
        'evidenceRequirements',
      ],
    };

    return operationMap[key] || [];
  }

  /**
   * 🎯 ACTION-SPECIFIC: Add inputs based on action type
   */
  private addActionTypeSpecificInputs(
    actionType: string,
    requiredInputs: Set<string>,
  ): void {
    switch (actionType) {
      case 'VALIDATION':
        requiredInputs.add('validationCriteria');
        requiredInputs.add('expectedOutcome');
        break;
      case 'COMMAND':
        requiredInputs.add('commandParameters');
        requiredInputs.add('executionContext');
        break;
      case 'ANALYSIS':
        requiredInputs.add('analysisScope');
        requiredInputs.add('analysisContext');
        break;
      case 'DECISION':
        requiredInputs.add('decisionContext');
        requiredInputs.add('decisionCriteria');
        break;
      case 'FILE_OPERATION':
        requiredInputs.add('filePath');
        requiredInputs.add('fileOperation');
        break;
      default:
        requiredInputs.add('executionData');
    }
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
   * 🎯 STEP-SPECIFIC: Add step-specific inputs from database
   */
  private async addStepSpecificInputs(
    stepId: string,
    requiredInputs: Set<string>,
  ): Promise<void> {
    try {
      const step = await this.prisma.workflowStep.findUnique({
        where: { id: stepId },
        include: { actions: true },
      });

      if (step) {
        // Add step-specific inputs based on step type
        if (step.stepType === 'VALIDATION') {
          requiredInputs.add('validationCriteria');
        } else if (step.stepType === 'ACTION') {
          requiredInputs.add('executionData');
        }

        // Extract from step actions if they contain template variables
        step.actions.forEach((action) => {
          if (action.actionData) {
            this.extractTemplateVariables(action.actionData, requiredInputs);
          }
        });
      }
    } catch (error) {
      this.logger.warn(
        `Failed to get step-specific inputs for ${stepId}:`,
        error,
      );
    }
  }

  /**
   * 🎯 TEMPLATE EXTRACTION: Extract template variables from action data
   */
  private extractTemplateVariables(
    actionData: any,
    requiredInputs: Set<string>,
  ): void {
    const jsonStr = JSON.stringify(actionData);
    const matches = jsonStr.match(/\{\{([^}]+)\}\}/g);

    if (matches) {
      matches.forEach((match) => {
        const varName = match.replace(/[{}]/g, '');
        requiredInputs.add(varName);
      });
    }
  }
}
