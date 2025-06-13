import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { WorkflowStep, StepAction } from 'generated/prisma';
import * as fs from 'fs/promises';
import * as path from 'path';

// ===================================================================
// 🔥 STEP GUIDANCE SERVICE - COMPLETE REVAMP FOR MCP-ONLY MODEL
// ===================================================================
// Purpose: Provide MCP actions and enhanced guidance for AI execution
// Scope: MCP_CALL action processing, enhanced guidance from workflow-steps.json
// ZERO Legacy Support: Complete removal of all non-MCP logic

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

export interface WorkflowStepsConfig {
  workflowSteps: Array<{
    name: string;
    behavioralContext: BehavioralGuidance;
    approachGuidance: ApproachGuidance;
    qualityChecklist?: string[];
    successCriteria?: string[];
    failureCriteria?: string[];
    troubleshooting?: string[];
  }>;
}

export interface McpActionData {
  serviceName: string;
  operation: string;
  parameters: ServiceParameters;
  sequenceOrder?: number;
}

// Custom Error Classes
export class StepNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StepNotFoundError';
  }
}

export class StepConfigNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StepConfigNotFoundError';
  }
}

@Injectable()
export class StepGuidanceService {
  private readonly logger = new Logger(StepGuidanceService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 🔥 COMPLETE REVAMP: Get MCP actions and enhanced guidance for AI execution
   * ONLY processes MCP_CALL actions - zero legacy support
   */
  async getStepGuidance(
    context: StepGuidanceContext,
  ): Promise<StepGuidanceResult> {
    const step = await this.getStepWithMcpActions(context.stepId);
    if (!step) {
      throw new StepNotFoundError(`Step not found: ${context.stepId}`);
    }

    // Extract MCP actions for AI execution
    const mcpActions = this.extractMcpActions(step);

    // Load enhanced guidance from workflow-steps.json
    const enhancedGuidance = await this.loadEnhancedGuidance(step);

    return {
      step: {
        id: step.id,
        name: step.name,
        description: enhancedGuidance.behavioralContext.approach,
        stepType: step.stepType,
        estimatedTime: step.estimatedTime || '5-10 minutes',
      },
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
   * Get step validation criteria for AI execution validation
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
      throw new StepNotFoundError(`Step not found: ${stepId}`);
    }

    const enhancedGuidance = await this.loadEnhancedGuidance(step);

    return {
      successCriteria: enhancedGuidance.successCriteria,
      failureCriteria: enhancedGuidance.failureCriteria,
      qualityChecklist: enhancedGuidance.qualityChecklist,
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

  private extractMcpActions(step: WorkflowStepWithActions): McpCallAction[] {
    return step.actions.map((action) => {
      const actionData = this.parseMcpActionData(action.actionData);
      return {
        id: action.id,
        name: action.name,
        serviceName: actionData.serviceName,
        operation: actionData.operation,
        parameters: actionData.parameters,
        sequenceOrder: actionData.sequenceOrder || 1,
      };
    });
  }

  private parseMcpActionData(actionData: unknown): McpActionData {
    if (!actionData || typeof actionData !== 'object') {
      throw new Error('Invalid MCP action data: not an object');
    }

    const data = actionData as Record<string, unknown>;

    if (typeof data.serviceName !== 'string') {
      throw new Error('Invalid MCP action data: serviceName must be string');
    }

    if (typeof data.operation !== 'string') {
      throw new Error('Invalid MCP action data: operation must be string');
    }

    if (!data.parameters || typeof data.parameters !== 'object') {
      throw new Error('Invalid MCP action data: parameters must be object');
    }

    return {
      serviceName: data.serviceName,
      operation: data.operation,
      parameters: data.parameters as ServiceParameters,
      sequenceOrder:
        typeof data.sequenceOrder === 'number' ? data.sequenceOrder : undefined,
    };
  }

  private async loadEnhancedGuidance(
    step: WorkflowStep,
  ): Promise<EnhancedStepGuidance> {
    const workflowStepsPath = path.join(
      process.cwd(),
      'enhanced-workflow-rules/json',
      step.roleId,
      'workflow-steps.json',
    );

    try {
      const workflowStepsData = JSON.parse(
        await fs.readFile(workflowStepsPath, 'utf-8'),
      ) as WorkflowStepsConfig;

      const stepConfig = workflowStepsData.workflowSteps.find(
        (s) => s.name === step.name,
      );
      if (!stepConfig) {
        throw new StepConfigNotFoundError(
          `Step config not found: ${step.name} in role ${step.roleId}`,
        );
      }

      return {
        behavioralContext: stepConfig.behavioralContext,
        approachGuidance: stepConfig.approachGuidance,
        qualityChecklist: stepConfig.qualityChecklist || [],
        successCriteria: stepConfig.successCriteria || [],
        failureCriteria: stepConfig.failureCriteria || [],
        troubleshooting: stepConfig.troubleshooting || [],
      };
    } catch (error) {
      if (error instanceof StepConfigNotFoundError) {
        throw error;
      }

      this.logger.error(
        `Failed to load enhanced guidance for step ${step.name}:`,
        error,
      );
      throw new Error(
        `Failed to load enhanced guidance: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
