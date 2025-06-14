// ===================================================================
// 🔧 STEP SERVICE SHARED UTILITIES - CONSOLIDATED PATTERNS
// ===================================================================
// Purpose: Consolidate redundant patterns found across step services
// Services: step-query, step-guidance, step-progress-tracker, step-execution, step-execution-mcp
// Phase: 2 Extended - Additional Step Service Analysis

import { Logger } from '@nestjs/common';

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
// 🔧 DATA TRANSFORMATION UTILITIES - CONSOLIDATED
// ===================================================================

/**
 * Safely extract behavioral context from step data
 */
export function extractBehavioralContext(stepData: any): string | null {
  if (!stepData?.behavioralContext) return null;

  if (typeof stepData.behavioralContext === 'string') {
    return stepData.behavioralContext;
  }

  if (typeof stepData.behavioralContext === 'object') {
    return JSON.stringify(stepData.behavioralContext);
  }

  return null;
}

/**
 * Safely extract approach guidance from step data
 */
export function extractApproachGuidance(stepData: any): string | null {
  if (!stepData?.approachGuidance) return null;

  if (typeof stepData.approachGuidance === 'string') {
    return stepData.approachGuidance;
  }

  if (typeof stepData.approachGuidance === 'object') {
    return JSON.stringify(stepData.approachGuidance);
  }

  return null;
}

/**
 * Transform progress record with null safety
 */
export function transformProgressRecord(record: any): any {
  if (!record) return null;

  return {
    id: record.id || null,
    stepId: record.stepId || null,
    executionId: record.executionId || null,
    progress: safeJsonCast(record.progress),
    metadata: safeJsonCast(record.metadata),
    createdAt: record.createdAt || null,
    updatedAt: record.updatedAt || null,
  };
}

// ===================================================================
// 🛡️ TYPE SAFETY UTILITIES - CONSOLIDATED
// ===================================================================

/**
 * Safely cast JSON data with error handling
 */
export function safeJsonCast<T = any>(data: any): T | null {
  if (data === null || data === undefined) return null;

  if (typeof data === 'string') {
    try {
      return JSON.parse(data) as T;
    } catch {
      return null;
    }
  }

  if (typeof data === 'object') {
    return data as T;
  }

  return null;
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

/**
 * Build minimal success response
 */
export function buildMinimalResponse<T>(
  data: T,
  metadata?: any,
): MinimalResponse<T> {
  return {
    success: true,
    data,
    ...(metadata && { metadata }),
  };
}

/**
 * Build minimal error response
 */
export function buildErrorResponse(
  error: string | Error,
  metadata?: any,
): MinimalResponse {
  const errorMessage = error instanceof Error ? error.message : error;

  return {
    success: false,
    error: errorMessage,
    ...(metadata && { metadata }),
  };
}

/**
 * Build guidance response from database data
 */
export function buildGuidanceFromDatabase(stepData: any): any {
  if (!stepData) return null;

  return {
    id: stepData.id,
    name: stepData.name || 'Unnamed Step',
    description: stepData.description || '',
    behavioralContext: extractBehavioralContext(stepData),
    approachGuidance: extractApproachGuidance(stepData),
    qualityChecklist: safeJsonCast(stepData.qualityChecklist) || [],
    actionData: safeJsonCast(stepData.actionData) || {},
    sequenceNumber: stepData.sequenceNumber || 0,
    roleId: stepData.roleId || null,
  };
}

// ===================================================================
// 🚨 ERROR HANDLING UTILITIES - CONSOLIDATED
// ===================================================================

/**
 * Get error message with type safety
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return 'Unknown error occurred';
}

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
export function extractMcpActionsWithDynamicParameters(actionData: any): any[] {
  if (!actionData?.mcpActions) return [];

  const actions = Array.isArray(actionData.mcpActions)
    ? actionData.mcpActions
    : [actionData.mcpActions];

  return actions.map((action) => ({
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
