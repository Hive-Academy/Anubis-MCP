import { WorkflowStep } from 'generated/prisma';

/**
 * Shared utilities for step data handling and validation
 *
 * Eliminates duplication between StepExecutionService and StepGuidanceService
 * Provides type-safe step data operations and validation
 */
export class StepDataUtils {
  /**
   * Extract step basic information safely
   */
  static extractStepInfo(step: WorkflowStep): {
    id: string;
    name: string;
    description: string;
    stepType: string;
  } {
    return {
      id: step.id,
      name: step.name,
      description: step.description || 'Execute workflow step',
      stepType: step.stepType,
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
}
