import { WorkflowStep } from 'generated/prisma';

/**
 * Shared utilities for step data handling and validation
 *
 * Eliminates duplication between StepExecutionService and StepGuidanceService
 * Provides type-safe step data operations and validation
 */
export class StepDataUtils {
  /**
   * Validate step object has required properties
   */
  static validateStepObject(
    step: any,
    requiredFields: string[] = ['id', 'name'],
  ): boolean {
    if (!step || typeof step !== 'object') {
      return false;
    }

    return requiredFields.every(
      (field) => step[field] !== undefined && step[field] !== null,
    );
  }

  /**
   * Extract step basic information safely
   */
  static extractStepInfo(step: WorkflowStep): {
    id: string;
    name: string;
    description: string;
    stepType: string;
    estimatedTime: string;
  } {
    return {
      id: step.id,
      name: step.name,
      description: step.description || 'Execute workflow step',
      stepType: step.stepType,
      estimatedTime: step.estimatedTime || '5-10 minutes',
    };
  }

  /**
   * Safely extract array from step data field
   */
  static extractArrayFromStepData(
    stepData: unknown,
    fieldName: string,
    fallback: string[] = [],
  ): string[] {
    if (!stepData || typeof stepData !== 'object') {
      return fallback;
    }

    const data = stepData as Record<string, unknown>;
    const field = data[fieldName];

    if (Array.isArray(field)) {
      return field.filter((item) => typeof item === 'string');
    }

    return fallback;
  }

  /**
   * Safely extract object from step data field
   */
  static extractObjectFromStepData(
    stepData: unknown,
    fieldName: string,
    fallback: Record<string, any> = {},
  ): Record<string, any> {
    if (!stepData || typeof stepData !== 'object') {
      return fallback;
    }

    const data = stepData as Record<string, unknown>;
    const field = data[fieldName];

    if (field && typeof field === 'object' && !Array.isArray(field)) {
      return field as Record<string, any>;
    }

    return fallback;
  }

  /**
   * Safely extract string from step data field
   */
  static extractStringFromStepData(
    stepData: unknown,
    fieldName: string,
    fallback: string = '',
  ): string {
    if (!stepData || typeof stepData !== 'object') {
      return fallback;
    }

    const data = stepData as Record<string, unknown>;
    const field = data[fieldName];

    return typeof field === 'string' ? field : fallback;
  }

  /**
   * Extract behavioral context from step data
   */
  static extractBehavioralContext(behavioralContext: unknown): {
    approach: string;
    principles: string[];
    methodology: string;
    keyFocus: string[];
    qualityStandards: string[];
  } {
    if (!behavioralContext || typeof behavioralContext !== 'object') {
      return {
        approach: 'Execute step according to requirements',
        principles: [],
        methodology: 'Standard workflow execution',
        keyFocus: [],
        qualityStandards: [],
      };
    }

    const context = behavioralContext as Record<string, unknown>;
    return {
      approach: this.extractStringFromStepData(
        context,
        'approach',
        'Execute step according to requirements',
      ),
      principles: this.extractArrayFromStepData(context, 'principles', []),
      methodology: this.extractStringFromStepData(
        context,
        'methodology',
        'Standard workflow execution',
      ),
      keyFocus: this.extractArrayFromStepData(context, 'keyFocus', []),
      qualityStandards: this.extractArrayFromStepData(
        context,
        'qualityStandards',
        [],
      ),
    };
  }

  /**
   * Extract approach guidance from step data
   */
  static extractApproachGuidance(approachGuidance: unknown): {
    stepByStep: string[];
    validationSteps: string[];
    errorHandling: string[];
    bestPractices: string[];
  } {
    if (!approachGuidance || typeof approachGuidance !== 'object') {
      return {
        stepByStep: ['Follow standard procedure'],
        validationSteps: ['Verify completion'],
        errorHandling: ['Handle errors appropriately'],
        bestPractices: ['Follow best practices'],
      };
    }

    const guidance = approachGuidance as Record<string, unknown>;
    return {
      stepByStep: this.extractArrayFromStepData(guidance, 'stepByStep', [
        'Follow standard procedure',
      ]),
      validationSteps: this.extractArrayFromStepData(
        guidance,
        'validationSteps',
        ['Verify completion'],
      ),
      errorHandling: this.extractArrayFromStepData(guidance, 'errorHandling', [
        'Handle errors appropriately',
      ]),
      bestPractices: this.extractArrayFromStepData(guidance, 'bestPractices', [
        'Follow best practices',
      ]),
    };
  }

  /**
   * Extract quality checklist from step data
   */
  static extractQualityChecklist(qualityChecklist: unknown): string[] {
    if (Array.isArray(qualityChecklist)) {
      return qualityChecklist.filter((item) => typeof item === 'string');
    }
    return ['Verify step completion'];
  }

  /**
   * Extract success criteria from action data
   */
  static extractSuccessCriteria(actionData: unknown): string[] {
    return this.extractArrayFromStepData(actionData, 'successCriteria', [
      'Step completed successfully',
    ]);
  }

  /**
   * Extract failure criteria from action data
   */
  static extractFailureCriteria(actionData: unknown): string[] {
    return this.extractArrayFromStepData(actionData, 'failureCriteria', [
      'Step failed to complete',
    ]);
  }

  /**
   * Extract troubleshooting steps from action data
   */
  static extractTroubleshooting(actionData: unknown): string[] {
    return this.extractArrayFromStepData(actionData, 'troubleshooting', [
      'Check logs for errors',
    ]);
  }

  /**
   * Validate MCP action data structure
   */
  static validateMcpActionData(actionData: unknown): {
    isValid: boolean;
    errors: string[];
    serviceName?: string;
    operation?: string;
  } {
    const errors: string[] = [];

    if (!actionData || typeof actionData !== 'object') {
      errors.push('Invalid MCP action data: not an object');
      return { isValid: false, errors };
    }

    const data = actionData as Record<string, unknown>;

    if (typeof data.serviceName !== 'string') {
      errors.push('Invalid MCP action data: serviceName must be string');
    }

    if (typeof data.operation !== 'string') {
      errors.push('Invalid MCP action data: operation must be string');
    }

    return {
      isValid: errors.length === 0,
      errors,
      serviceName: data.serviceName as string,
      operation: data.operation as string,
    };
  }

  /**
   * Generate step execution context
   */
  static generateStepExecutionContext(
    stepId: string,
    taskId: string | number,
    roleId: string,
    additionalContext?: Record<string, unknown>,
  ): {
    stepId: string;
    taskId: string;
    roleId: string;
    executionContext?: unknown;
    projectPath?: string;
  } {
    return {
      stepId,
      taskId: taskId.toString(),
      roleId,
      executionContext: additionalContext,
      projectPath: additionalContext?.projectPath as string,
    };
  }

  /**
   * Generate service parameters for MCP calls
   */
  static generateServiceParameters(
    taskId: number,
    stepId: string,
    roleId: string,
    additionalParams?: Record<string, string | number | boolean>,
  ): {
    taskId: number;
    stepId: string;
    roleId: string;
    additionalParams?: Record<string, string | number | boolean>;
  } {
    return {
      taskId,
      stepId,
      roleId,
      ...(additionalParams && { additionalParams }),
    };
  }

  /**
   * Validate step execution results
   */
  static validateExecutionResults(
    results: Array<{
      actionId: string;
      actionName: string;
      success: boolean;
      output?: string;
      error?: string;
      executionTime?: number;
    }>,
  ): {
    isValid: boolean;
    errors: string[];
    successCount: number;
    failureCount: number;
  } {
    const errors: string[] = [];
    let successCount = 0;
    let failureCount = 0;

    for (const result of results) {
      if (!result.success) {
        errors.push(
          `MCP action failed: ${result.actionName} - ${result.error || 'Unknown error'}`,
        );
        failureCount++;
      } else {
        successCount++;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      successCount,
      failureCount,
    };
  }

  /**
   * Format step duration for display
   */
  static formatStepDuration(
    startTime: Date,
    endTime: Date,
    showSeconds: boolean = false,
  ): string {
    try {
      const diff = endTime.getTime() - startTime.getTime();
      const minutes = Math.floor(diff / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (showSeconds) {
        return `${minutes}m ${seconds}s`;
      }
      return `${minutes}m`;
    } catch (_error) {
      return '0m';
    }
  }

  /**
   * Generate step progress summary
   */
  static generateStepProgressSummary(
    completedSteps: number,
    totalSteps: number,
    currentStepName?: string,
  ): {
    percentage: number;
    completedSteps: number;
    totalSteps: number;
    remainingSteps: number;
    currentStep?: string;
    status: 'not-started' | 'in-progress' | 'completed';
  } {
    const remainingSteps = Math.max(0, totalSteps - completedSteps);
    const percentage =
      totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

    let status: 'not-started' | 'in-progress' | 'completed' = 'not-started';
    if (completedSteps === 0) {
      status = 'not-started';
    } else if (completedSteps < totalSteps) {
      status = 'in-progress';
    } else {
      status = 'completed';
    }

    return {
      percentage,
      completedSteps,
      totalSteps,
      remainingSteps,
      ...(currentStepName && { currentStep: currentStepName }),
      status,
    };
  }
}
