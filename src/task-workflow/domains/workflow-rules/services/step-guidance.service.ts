import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { RequiredInputExtractorService } from './required-input-extractor.service';
import { WorkflowStep, StepAction } from 'generated/prisma';
import { StepDataUtils } from '../utils/step-data.utils';
import {
  StepNotFoundError,
  buildGuidanceFromDatabase,
} from '../utils/step-service-shared.utils';

// ===================================================================
// 🔥 STEP GUIDANCE SERVICE - DATABASE-ONLY MODEL + DYNAMIC PARAMETERS
// ===================================================================
// Purpose: Provide MCP actions and step guidance from database only
// Scope: MCP_CALL action processing, step guidance from database
// ZERO JSON File Dependencies: Complete database-driven approach
// ✅ FIXED: Integrated RequiredInputExtractorService for dynamic parameter extraction

// 🎯 STRICT TYPE DEFINITIONS - ZERO ANY USAGE

export interface StepGuidanceContext {
  taskId: number;
  roleId: string;
  stepId: string;
}

export interface StepGuidanceResult {
  step: StepInfo;
  mcpActions: McpCallAction[];
  behavioralGuidance: BehavioralGuidance;
  approachGuidance: ApproachGuidance;
  qualityChecklist: string[];
  successCriteria: string[];
  failureCriteria: string[];
  troubleshooting: string[];
}

export interface StepInfo {
  id: string;
  name: string;
  description: string;
  stepType: string;
  estimatedTime: string;
}

export interface McpCallAction {
  id: string;
  name: string;
  serviceName: string;
  operation: string;
  parameters: ServiceParameters;
  sequenceOrder: number;
  // ✅ NEW: Dynamic parameter information
  requiredParameters?: string[];
  optionalParameters?: string[];
  schemaStructure?: Record<string, any>;
}

export interface ServiceParameters {
  taskId: number;
  stepId: string;
  roleId: string;
  additionalParams?: Record<string, string | number | boolean>;
}

export interface BehavioralGuidance {
  approach: string;
  principles: string[];
  methodology: string;
  keyFocus: string[];
  qualityStandards: string[];
}

export interface ApproachGuidance {
  stepByStep: string[];
  validationSteps: string[];
  errorHandling: string[];
  bestPractices: string[];
}

export interface EnhancedStepGuidance {
  behavioralContext: BehavioralGuidance;
  approachGuidance: ApproachGuidance;
  qualityChecklist: string[];
  successCriteria: string[];
  failureCriteria: string[];
  troubleshooting: string[];
}

export interface WorkflowStepWithActions extends WorkflowStep {
  actions: StepAction[];
}

export interface McpActionData {
  serviceName: string;
  operation: string;
  // ✅ FIXED: Parameters are now optional since they're generated dynamically
  parameters?: ServiceParameters;
  sequenceOrder?: number;
}

// Custom Error Classes - Using shared utilities
export class StepConfigNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StepConfigNotFoundError';
  }
}

@Injectable()
export class StepGuidanceService {
  private readonly logger = new Logger(StepGuidanceService.name);

  constructor(
    private readonly prisma: PrismaService,
    // ✅ NEW: Inject RequiredInputExtractorService for dynamic parameter extraction
    private readonly requiredInputExtractorService: RequiredInputExtractorService,
  ) {}

  /**
   * 🔥 DATABASE-ONLY: Get MCP actions and step guidance from database
   * ✅ FIXED: Now uses dynamic parameter extraction
   */
  async getStepGuidance(
    context: StepGuidanceContext,
  ): Promise<StepGuidanceResult> {
    const step = await this.getStepWithMcpActions(context.stepId);
    if (!step) {
      throw new StepNotFoundError(
        context.stepId,
        'StepGuidanceService',
        'getStepGuidance',
      );
    }

    // ✅ FIXED: Extract MCP actions with dynamic parameter information
    const mcpActions = this.extractMcpActionsWithDynamicParameters(
      step,
      context,
    );

    // Get guidance from database step data
    const enhancedGuidance = buildGuidanceFromDatabase(step);

    return {
      step: StepDataUtils.extractStepInfo(step),
      mcpActions,
      behavioralGuidance: enhancedGuidance.behavioralContext,
      approachGuidance: enhancedGuidance.approachGuidance,
      qualityChecklist: enhancedGuidance.qualityChecklist,
      successCriteria: enhancedGuidance.successCriteria,
      failureCriteria: enhancedGuidance.failureCriteria,
      troubleshooting: enhancedGuidance.troubleshooting,
    };
  }

  /**
   * Get step validation criteria from database
   */
  async getStepValidationCriteria(stepId: string): Promise<{
    successCriteria: string[];
    failureCriteria: string[];
    qualityChecklist: string[];
  }> {
    const step = await this.prisma.workflowStep.findUnique({
      where: { id: stepId },
    });

    if (!step) {
      throw new StepNotFoundError(
        stepId,
        'StepGuidanceService',
        'getStepValidationCriteria',
      );
    }

    const guidance = buildGuidanceFromDatabase(step);

    return {
      successCriteria: guidance.successCriteria,
      failureCriteria: guidance.failureCriteria,
      qualityChecklist: guidance.qualityChecklist,
    };
  }

  // ===================================================================
  // 🔧 PRIVATE IMPLEMENTATION METHODS
  // ===================================================================

  private async getStepWithMcpActions(
    stepId: string,
  ): Promise<WorkflowStepWithActions | null> {
    return this.prisma.workflowStep.findUnique({
      where: { id: stepId },
      include: {
        actions: {
          where: { actionType: 'MCP_CALL' },
          orderBy: { sequenceOrder: 'asc' },
        },
      },
    });
  }

  // ✅ NEW: Extract MCP actions with dynamic parameter information
  private extractMcpActionsWithDynamicParameters(
    step: WorkflowStepWithActions,
    context: StepGuidanceContext,
  ): McpCallAction[] {
    return step.actions.map((action) => {
      const actionData = this.parseMcpActionData(action.actionData);

      // ✅ NEW: Generate dynamic parameters using RequiredInputExtractorService
      const dynamicParameterInfo = this.generateDynamicParameterInfo(
        actionData.serviceName,
        actionData.operation,
        context,
      );

      return {
        id: action.id,
        name: action.name,
        serviceName: actionData.serviceName,
        operation: actionData.operation,
        parameters: dynamicParameterInfo.parameters,
        sequenceOrder: actionData.sequenceOrder || 1,
        // ✅ NEW: Include dynamic parameter schema information
        requiredParameters: dynamicParameterInfo.requiredParameters,
        optionalParameters: dynamicParameterInfo.optionalParameters,
        schemaStructure: dynamicParameterInfo.schemaStructure,
      };
    });
  }

  // ✅ FIXED: Remove hardcoded parameter validation - using shared utilities
  private parseMcpActionData(actionData: unknown): McpActionData {
    const validation = StepDataUtils.validateMcpActionData(actionData);

    if (!validation.isValid) {
      throw new Error(
        `Invalid MCP action data: ${validation.errors.join(', ')}`,
      );
    }

    const data = actionData as Record<string, unknown>;

    // ✅ FIXED: Parameters are no longer required - they're generated dynamically
    return {
      serviceName: validation.serviceName!,
      operation: validation.operation!,
      parameters: data.parameters as ServiceParameters, // Optional now
      sequenceOrder:
        typeof data.sequenceOrder === 'number' ? data.sequenceOrder : undefined,
    };
  }

  // ✅ NEW: Generate dynamic parameter information using RequiredInputExtractorService
  private generateDynamicParameterInfo(
    serviceName: string,
    operation: string,
    context: StepGuidanceContext,
  ): {
    parameters: ServiceParameters;
    requiredParameters: string[];
    optionalParameters: string[];
    schemaStructure: Record<string, any>;
  } {
    try {
      // Use RequiredInputExtractorService for dynamic parameter extraction
      const extraction =
        this.requiredInputExtractorService.extractFromServiceSchema(
          serviceName,
          operation,
        );

      // Generate basic parameters with context
      const parameters: ServiceParameters = {
        taskId: context.taskId,
        stepId: context.stepId,
        roleId: context.roleId,
      };

      this.logger.debug(
        `Generated dynamic parameters for ${serviceName}.${operation}: ${extraction.requiredParameters.length} required, ${extraction.optionalParameters.length} optional`,
      );

      return {
        parameters,
        requiredParameters: extraction.requiredParameters,
        optionalParameters: extraction.optionalParameters,
        schemaStructure: extraction.schemaStructure || {},
      };
    } catch (error) {
      this.logger.warn(
        `Failed to extract dynamic parameters for ${serviceName}.${operation}: ${error}`,
      );

      // Fallback to basic parameters
      return {
        parameters: {
          taskId: context.taskId,
          stepId: context.stepId,
          roleId: context.roleId,
        },
        requiredParameters: ['operation', 'executionData'],
        optionalParameters: [],
        schemaStructure: {
          operation: {
            type: 'string',
            required: true,
            description: 'Operation name',
          },
          executionData: {
            type: 'any',
            required: true,
            description: 'Operation data',
          },
        },
      };
    }
  }

  /**
   * 🆕 DATABASE-ONLY: Build guidance from database step data
   * Replaces JSON file reading with database-driven approach
   * Uses shared utilities for data extraction
   */
  private buildGuidanceFromDatabase(step: WorkflowStep): EnhancedStepGuidance {
    return {
      behavioralContext: this.extractBehavioralContext(step.behavioralContext),
      approachGuidance: this.extractApproachGuidance(step.approachGuidance),
      qualityChecklist: this.extractQualityChecklist(step.qualityChecklist),
      successCriteria: this.extractSuccessCriteria(step.actionData),
      failureCriteria: this.extractFailureCriteria(step.actionData),
      troubleshooting: this.extractTroubleshooting(step.actionData),
    };
  }

  private extractBehavioralContext(
    behavioralContext: unknown,
  ): BehavioralGuidance {
    return StepDataUtils.extractBehavioralContext(behavioralContext);
  }

  private extractApproachGuidance(approachGuidance: unknown): ApproachGuidance {
    return StepDataUtils.extractApproachGuidance(approachGuidance);
  }

  private extractQualityChecklist(qualityChecklist: unknown): string[] {
    return StepDataUtils.extractQualityChecklist(qualityChecklist);
  }

  private extractSuccessCriteria(actionData: unknown): string[] {
    return StepDataUtils.extractSuccessCriteria(actionData);
  }

  private extractFailureCriteria(actionData: unknown): string[] {
    return StepDataUtils.extractFailureCriteria(actionData);
  }

  private extractTroubleshooting(actionData: unknown): string[] {
    return StepDataUtils.extractTroubleshooting(actionData);
  }
}
