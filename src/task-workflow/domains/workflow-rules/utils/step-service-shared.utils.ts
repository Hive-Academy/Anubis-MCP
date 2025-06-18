/* eslint-disable @typescript-eslint/no-unsafe-return */
// ===================================================================
// 🔧 STEP SERVICE SHARED UTILITIES - CONSOLIDATED PATTERNS
// ===================================================================
// Purpose: Consolidate redundant patterns found across step services
// Services: step-query, step-guidance, step-progress-tracker, step-execution, step-execution-mcp
// Phase: 2 Extended - Additional Step Service Analysis

import { Logger } from '@nestjs/common';
import { WorkflowStepProgress } from 'generated/prisma';
import { getErrorMessage } from './type-safety.utils';

// ===================================================================
// 🚨 CUSTOM ERROR CLASSES - CONSOLIDATED
// ===================================================================

export class StepServiceError extends Error {
  constructor(
    message: string,
    public readonly service: string,
    public readonly operation: string,
    public readonly details?: any,
  ) {
    super(message);
    this.name = 'StepServiceError';
  }
}

export class StepNotFoundError extends StepServiceError {
  constructor(stepId: string, service: string, operation: string) {
    super(`Step not found: ${stepId}`, service, operation, { stepId });
    this.name = 'StepNotFoundError';
  }
}

export class StepProgressError extends StepServiceError {
  constructor(
    message: string,
    service: string,
    operation: string,
    details?: any,
  ) {
    super(message, service, operation, details);
    this.name = 'StepProgressError';
  }
}

export class StepExecutionError extends StepServiceError {
  constructor(
    message: string,
    service: string,
    operation: string,
    details?: any,
  ) {
    super(message, service, operation, details);
    this.name = 'StepExecutionError';
  }
}

// ===================================================================
// 🔧 DATA TRANSFORMATION UTILITIES - UPDATED FOR STREAMLINED SCHEMA
// ===================================================================

/**
 * Transform progress record with null safety
 */
export function transformProgressRecord(
  record: WorkflowStepProgress | null,
): WorkflowStepProgress | null {
  if (!record) return null;

  return {
    ...record,
    executionData: safeJsonCast(record.executionData),
    validationResults: safeJsonCast(record.validationResults),
    errorDetails: safeJsonCast(record.errorDetails),
    result: safeJsonCast(record.result),
  };
}

// ===================================================================
// 🛡️ TYPE SAFETY UTILITIES - CONSOLIDATED
// ===================================================================

/**
 * Safely cast JSON data with error handling
 */
export function safeJsonCast<T = any>(data: any): T | null {
  try {
    if (data === null || data === undefined) return null;
    if (typeof data === 'string') {
      return JSON.parse(data) as T;
    }
    return data as T;
  } catch (error) {
    Logger.warn(`Failed to parse JSON data: ${getErrorMessage(error)}`);
    return null;
  }
}

/**
 * Check if value is defined and not null
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Safe string extraction with fallback
 */
export function safeStringExtract(value: any, fallback: string = ''): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') return JSON.stringify(value);
  return fallback;
}

// ===================================================================
// 🔄 RESPONSE BUILDING UTILITIES - CONSOLIDATED
// ===================================================================

export interface MinimalResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: any;
}

// ===================================================================
// 🚨 ERROR HANDLING UTILITIES - CONSOLIDATED
// ===================================================================

// NOTE: getErrorMessage moved to type-safety.utils.ts
// Import from '../utils/type-safety.utils' instead

/**
 * Log error with consistent format across step services
 */
export function logStepServiceError(
  logger: Logger,
  error: unknown,
  service: string,
  operation: string,
  context?: any,
): void {
  const errorMessage = getErrorMessage(error);
  const logContext = {
    service,
    operation,
    error: errorMessage,
    ...(context && { context }),
  };

  logger.error(`[${service}] ${operation} failed: ${errorMessage}`, logContext);
}

// ===================================================================
// 🔧 STREAMLINED SCHEMA UTILITIES - NEW
// ===================================================================

/**
 * Extract guidance from streamlined schema structure
 */
export function extractStreamlinedGuidance(stepData: {
  stepGuidance?: { stepByStep: any } | null;
  qualityChecks?: Array<{ criterion: string; sequenceOrder: number }>;
}): {
  stepByStep: string[];
  qualityChecklist: string[];
} {
  let stepByStep: string[] = [];

  // Extract step-by-step guidance
  if (stepData.stepGuidance?.stepByStep) {
    try {
      stepByStep = Array.isArray(stepData.stepGuidance.stepByStep)
        ? (stepData.stepGuidance.stepByStep as string[])
        : JSON.parse(stepData.stepGuidance.stepByStep as string);
    } catch {
      stepByStep = ['Execute step according to guidance'];
    }
  }

  // Extract quality checklist
  const qualityChecklist = stepData.qualityChecks
    ? stepData.qualityChecks
        .sort((a, b) => a.sequenceOrder - b.sequenceOrder)
        .map((check) => check.criterion)
    : [];

  return {
    stepByStep,
    qualityChecklist,
  };
}

// ===================================================================
// 🔧 UTILITY FUNCTIONS - STREAMLINED SCHEMA ONLY
// ===================================================================

/**
 * Custom error classes for step operations
 */
export class InvalidStepDataError extends Error {
  constructor(message: string) {
    super(`Invalid step data: ${message}`);
    this.name = 'InvalidStepDataError';
  }
}

/**
 * Validate required step execution data
 */
export function validateStepExecutionData(data: {
  stepId?: string;
  executionId?: string;
  roleId?: string;
}): void {
  const errors: string[] = [];

  if (!data.stepId) errors.push('stepId is required');
  if (!data.executionId) errors.push('executionId is required');
  if (!data.roleId) errors.push('roleId is required');

  if (errors.length > 0) {
    throw new InvalidStepDataError(errors.join(', '));
  }
}

/**
 * Extract step identifier safely
 */
export function extractStepId(stepData: any): string {
  if (!stepData || !stepData.id) {
    throw new StepNotFoundError('undefined', '', '');
  }
  return stepData.id;
}
