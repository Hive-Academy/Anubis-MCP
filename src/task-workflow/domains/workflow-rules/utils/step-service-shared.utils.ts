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

// NOTE: buildMinimalResponse and buildErrorResponse moved to mcp-response.utils.ts
// Use BaseMcpService.buildMinimalResponse() instead

/**
 * Build guidance response from database data - Updated for streamlined schema
 */
export function buildGuidanceFromDatabase(stepData: any): any {
  if (!stepData) return null;

  return {
    id: stepData.id,
    name: stepData.name || 'Unnamed Step',
    description: stepData.description || '',
    // Note: In streamlined schema, behavioral context and approach guidance
    // are handled differently through StepGuidance and QualityCheck models
    behavioralContext: {
      approach: stepData.approach || 'Execute step according to guidance',
      principles: ['Follow MCP protocol', 'Validate all operations'],
      methodology: 'Structured step execution',
    },
    approachGuidance: {
      stepByStep: ['Execute step according to guidance'],
      validationSteps: ['Verify completion'],
      errorHandling: ['Handle errors appropriately'],
    },
    qualityChecklist: [], // Will be populated from QualityCheck models
    actionData: {}, // Will be populated from McpAction models
    sequenceNumber: stepData.sequenceNumber || 0,
    roleId: stepData.roleId || null,
  };
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

/**
 * Handle step service operation with consistent error handling
 */
export async function handleStepServiceOperation<T>(
  logger: Logger,
  service: string,
  operation: string,
  operationFn: () => Promise<T>,
  context?: any,
): Promise<T> {
  try {
    return await operationFn();
  } catch (error) {
    logStepServiceError(logger, error, service, operation, context);
    throw error;
  }
}

// ===================================================================
// 🔍 MCP ACTION EXTRACTION UTILITIES - CONSOLIDATED
// ===================================================================

/**
 * Extract MCP actions with dynamic parameters
 */
export function extractMcpActionsWithDynamicParameters(actionData: any): Array<{
  operation: string;
  serviceName: string;
  parameters: Record<string, any>;
  description: string;
}> {
  if (!actionData?.mcpActions) return [];

  const actions = Array.isArray(actionData.mcpActions)
    ? actionData.mcpActions
    : [actionData.mcpActions];

  return actions.map((action: any) => ({
    operation: action.operation || 'unknown',
    serviceName: action.serviceName || 'unknown',
    parameters: safeJsonCast(action.parameters) || {},
    description: action.description || '',
  }));
}

/**
 * Validate MCP action structure
 */
export function validateMcpAction(action: unknown): boolean {
  return !!(
    action &&
    typeof action === 'object' &&
    action !== null &&
    'operation' in action &&
    'serviceName' in action
  );
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
  mcpActions?: Array<{ name: string; serviceName: string; operation: string }>;
}): {
  stepByStep: string[];
  qualityChecklist: string[];
  mcpActions: Array<{ name: string; serviceName: string; operation: string }>;
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

  // Extract MCP actions
  const mcpActions = stepData.mcpActions
    ? stepData.mcpActions.map((action) => ({
        name: action.name,
        serviceName: action.serviceName,
        operation: action.operation,
      }))
    : [];

  return {
    stepByStep,
    qualityChecklist,
    mcpActions,
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
