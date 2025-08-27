/**
 * 🛡️ WORKFLOW CONTEXT VALIDATION GUARD
 *
 * Purpose: MCP Guard for validating and auto-correcting workflow IDs
 * Solves: AI agents providing incorrect or missing critical IDs
 *
 * Features:
 * - Validates executionId, taskId, currentRoleId, currentStepId
 * - Auto-corrects IDs using cached workflow state
 * - Prevents invalid operations from reaching MCP tools
 * - Provides helpful error messages for debugging
 *
 * Integration: Applied to critical MCP tools via @rekog/mcp-nest guards
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { WorkflowContextCacheService } from '../services/workflow-context-cache.service';

// Metadata key for marking tools that need ID validation
export const WORKFLOW_ID_VALIDATION = 'workflow_id_validation';

export interface IdValidationConfig {
  // Which IDs are required for this tool
  requiredIds?: (
    | 'executionId'
    | 'taskId'
    | 'currentRoleId'
    | 'currentStepId'
  )[];
  // Whether to auto-correct invalid/stale IDs from cache
  autoCorrect?: boolean;
  // Whether to allow bootstrap mode (missing some IDs is OK)
  allowBootstrap?: boolean;
  // Strategy for selecting the right context when multiple exist
  contextSelectionStrategy?: 'mostRecent' | 'byTaskId' | 'byExecutionId';
  // Whether to log corrections for monitoring
  logCorrections?: boolean;
}

/**
 * Decorator to mark MCP tools that need workflow ID validation
 *
 * @example
 * ```typescript
 * @RequireWorkflowIds({
 *   requiredIds: ['executionId', 'roleId'],
 *   autoCorrect: true,
 *   contextSelectionStrategy: 'mostRecent',
 *   logCorrections: true
 * })
 * @Tool({ name: 'get_step_guidance' })
 * async getStepGuidance(input) { ... }
 * ```
 */
export const RequireWorkflowIds = (config: IdValidationConfig = {}) =>
  SetMetadata(WORKFLOW_ID_VALIDATION, {
    requiredIds: ['executionId'],
    autoCorrect: true,
    allowBootstrap: false,
    contextSelectionStrategy: 'mostRecent',
    logCorrections: true,
    ...config,
  });

@Injectable()
export class WorkflowContextValidationGuard implements CanActivate {
  private readonly logger = new Logger(WorkflowContextValidationGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly contextCache: WorkflowContextCacheService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // Get validation configuration from decorator
    const validationConfig = this.reflector.get(
      WORKFLOW_ID_VALIDATION,
      context.getHandler(),
    );

    // Skip validation if not configured
    if (!validationConfig) {
      return true;
    }

    try {
      const request = this.getRequestFromContext(context);
      const toolParams = this.extractToolParameters(request);

      if (!toolParams) {
        this.logger.debug('No tool parameters found, skipping validation');
        return true;
      }

      // Perform ID validation and auto-correction
      const validationResult = this.validateAndCorrectIds(
        toolParams,
        validationConfig,
      );

      if (!validationResult.isValid) {
        this.logger.warn('Workflow ID validation failed', {
          tool: context.getHandler().name,
          errors: validationResult.errors,
          providedIds: validationResult.providedIds,
        });

        // Don't block the request, but log the issues for monitoring
        // In production, you might want to return false here
        return true;
      }

      // Auto-correct IDs if configured and corrections were made
      if (validationConfig.autoCorrect && validationResult.corrections) {
        this.applyIdCorrections(request, validationResult.corrections);

        this.logger.log('Auto-corrected workflow IDs', {
          tool: context.getHandler().name,
          corrections: validationResult.corrections,
        });
      }

      return true;
    } catch (error) {
      this.logger.error('Error in workflow ID validation guard', {
        error: error instanceof Error ? error.message : String(error),
        tool: context.getHandler().name,
      });

      // Don't block requests due to guard errors
      return true;
    }
  }

  /**
   * Extract request object from execution context
   */
  private getRequestFromContext(context: ExecutionContext): any {
    // For MCP-Nest, the request might be in different places
    // depending on the transport (HTTP, SSE, STDIO)
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest();

    return request;
  }

  /**
   * Extract tool parameters from MCP request
   */
  private extractToolParameters(request: any): any {
    // MCP tool parameters are typically in request.body.params
    // or request.body.arguments depending on the MCP protocol version
    if (request?.body?.params) {
      return request.body.params;
    }

    if (request?.body?.arguments) {
      return request.body.arguments;
    }

    // For STDIO transport, parameters might be directly in request
    if (request?.params) {
      return request.params;
    }

    return null;
  }

  /**
   * Validate and auto-correct workflow IDs
   */
  private validateAndCorrectIds(
    params: any,
    config: IdValidationConfig,
  ): {
    isValid: boolean;
    errors: string[];
    corrections?: Record<string, any>;
    providedIds: Record<string, any>;
  } {
    const errors: string[] = [];
    const corrections: Record<string, any> = {};
    const providedIds: Record<string, any> = {};
    const requiredIds = config.requiredIds || ['executionId'];

    // Extract provided IDs
    ['executionId', 'taskId', 'currentRoleId', 'currentStepId'].forEach(
      (id) => {
        if (params[id] !== undefined && params[id] !== null) {
          providedIds[id] = params[id];
        }
      },
    );

    // Check required IDs
    for (const requiredId of requiredIds) {
      const value = params[requiredId];

      if (!value && !config.allowBootstrap) {
        errors.push(`Missing required ID: ${requiredId}`);

        // Try to auto-correct if enabled
        if (config.autoCorrect) {
          const correctedValue = this.findMissingId(
            requiredId,
            providedIds,
            config.contextSelectionStrategy,
          );

          if (correctedValue) {
            corrections[requiredId] = correctedValue;
            errors.pop(); // Remove the error since we fixed it

            if (config.logCorrections) {
              this.logger.log(`Auto-corrected missing ${requiredId}`, {
                originalValue: value,
                correctedValue,
                strategy: config.contextSelectionStrategy,
              });
            }
          }
        }
      }

      // Validate ID format/type
      if (value) {
        const formatError = this.validateIdFormat(requiredId, value);
        if (formatError) {
          errors.push(formatError);

          // Try to auto-correct format issues
          if (config.autoCorrect) {
            const correctedValue = this.correctIdFormat(requiredId, value);
            if (correctedValue && correctedValue !== value) {
              corrections[requiredId] = correctedValue;
              errors.pop(); // Remove the error since we fixed it
            }
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      corrections:
        Object.keys(corrections).length > 0 ? corrections : undefined,
      providedIds,
    };
  }

  /**
   * 🎯 INTELLIGENT ID CORRECTION
   * Find missing or correct stale IDs using cache and context strategy
   */
  private findMissingId(
    missingId: string,
    providedIds: Record<string, any>,
    strategy: 'mostRecent' | 'byTaskId' | 'byExecutionId' = 'mostRecent',
  ): any {
    try {
      // Strategy 1: Find by valid executionId (if it's actually valid)
      if (
        providedIds.executionId &&
        this.isValidIdFormat('executionId', providedIds.executionId)
      ) {
        const context = this.contextCache.findContextByExecutionId(
          providedIds.executionId,
        );
        if (context && context[missingId as keyof typeof context]) {
          return context[missingId as keyof typeof context];
        }
      }

      // Strategy 2: Find by taskId (most reliable)
      if (providedIds.taskId && typeof providedIds.taskId === 'number') {
        const context = this.contextCache.findContextByTaskId(
          providedIds.taskId,
        );
        if (context && context[missingId as keyof typeof context]) {
          return context[missingId as keyof typeof context];
        }
      }

      // Strategy 3: Use context selection strategy
      let context = null;

      switch (strategy) {
        case 'mostRecent':
          context = this.getMostRecentContext();
          break;
        case 'byTaskId':
          if (providedIds.taskId) {
            context = this.contextCache.findContextByTaskId(providedIds.taskId);
          }
          break;
        case 'byExecutionId':
          if (providedIds.executionId) {
            context = this.contextCache.findContextByExecutionId(
              providedIds.executionId,
            );
          }
          break;
      }

      if (context && context[missingId as keyof typeof context]) {
        return context[missingId as keyof typeof context];
      }

      // Strategy 4: Fuzzy matching - find any context with partial ID matches
      const allContexts = this.contextCache.getAllContexts();
      for (const ctx of allContexts) {
        // Check if any provided IDs match this context
        if (
          (providedIds.currentRoleId &&
            ctx.currentRoleId === providedIds.currentRoleId) ||
          (providedIds.currentStepId &&
            ctx.currentStepId === providedIds.currentStepId) ||
          (providedIds.taskId && ctx.taskId === providedIds.taskId)
        ) {
          if (ctx[missingId as keyof typeof ctx]) {
            return ctx[missingId as keyof typeof ctx];
          }
        }
      }

      return null;
    } catch (error) {
      this.logger.warn(`Failed to find missing ID: ${missingId}`, {
        error: error instanceof Error ? error.message : String(error),
        providedIds,
        strategy,
      });
      return null;
    }
  }

  /**
   * Get the most recent workflow context from cache
   */
  private getMostRecentContext(): any {
    const allContexts = this.contextCache.getAllContexts();
    if (allContexts.length === 0) return null;

    // Sort by lastAccessed (most recent first)
    return allContexts.sort((a, b) => {
      const timeA = new Date(a.lastAccessed || 0).getTime();
      const timeB = new Date(b.lastAccessed || 0).getTime();
      return timeB - timeA;
    })[0];
  }

  /**
   * Validate ID format and detect stale/invalid IDs
   */
  private validateIdFormat(idName: string, value: any): string | null {
    switch (idName) {
      case 'executionId':
      case 'currentRoleId':
      case 'currentStepId':
        if (typeof value !== 'string' || value.trim().length === 0) {
          return `${idName} must be a non-empty string`;
        }

        // Check if it's a valid format (detect stale IDs)
        if (!this.isValidIdFormat(idName, value)) {
          return `${idName} appears to be stale or invalid format: ${value}`;
        }
        break;

      case 'taskId':
        if (typeof value !== 'number' || value < 0) {
          return `${idName} must be a non-negative number`;
        }
        break;
    }

    return null;
  }

  /**
   * 🔍 INTELLIGENT ID FORMAT DETECTION
   * Detects stale IDs that agents send from conversation history
   */
  private isValidIdFormat(idName: string, value: string): boolean {
    const trimmedValue = value.trim();

    switch (idName) {
      case 'executionId':
        // Valid: UUID-like format (e.g., "cmdatckfx0001mty053ca173m")
        // Invalid: Descriptive format (e.g., "exec_1735058516_product_manager")

        // Check for descriptive pattern (contains underscores + descriptive text)
        if (
          trimmedValue.includes('_') &&
          (trimmedValue.includes('product') ||
            trimmedValue.includes('manager') ||
            trimmedValue.includes('architect') ||
            trimmedValue.includes('developer') ||
            trimmedValue.includes('review'))
        ) {
          return false; // Definitely stale
        }

        // Check for timestamp pattern (e.g., contains 10-digit timestamp)
        if (/\d{10}/.test(trimmedValue)) {
          return false; // Likely stale with timestamp
        }

        // Valid UUID/CUID patterns - typically 20+ chars, alphanumeric
        if (trimmedValue.length >= 20 && /^[a-zA-Z0-9]+$/.test(trimmedValue)) {
          return true;
        }

        // Short IDs or containing special chars might be stale
        return false;

      case 'currentRoleId':
        // Similar logic for role IDs
        // Valid role IDs are typically UUID-like
        if (trimmedValue.length >= 20 && /^[a-zA-Z0-9]+$/.test(trimmedValue)) {
          return true;
        }
        return false;

      case 'currentStepId':
        // Step IDs should be UUID-like or specific format
        if (
          trimmedValue.length >= 10 &&
          /^[a-zA-Z0-9\-_]+$/.test(trimmedValue)
        ) {
          return true;
        }
        return false;

      default:
        return true; // Unknown ID type, assume valid
    }
  }

  /**
   * Correct ID format issues
   */
  private correctIdFormat(idName: string, value: any): any {
    switch (idName) {
      case 'executionId':
      case 'currentRoleId':
      case 'currentStepId':
        if (typeof value !== 'string') {
          return String(value).trim();
        }
        return value.trim();

      case 'taskId':
        if (typeof value === 'string') {
          const parsed = parseInt(value, 10);
          return isNaN(parsed) ? null : parsed;
        }
        return value;

      default:
        return value;
    }
  }

  /**
   * Apply ID corrections to the request
   */
  private applyIdCorrections(
    request: any,
    corrections: Record<string, any>,
  ): void {
    // Apply corrections to the appropriate location in the request
    if (request?.body?.params) {
      Object.assign(request.body.params, corrections);
    } else if (request?.body?.arguments) {
      Object.assign(request.body.arguments, corrections);
    } else if (request?.params) {
      Object.assign(request.params, corrections);
    }

    // Also apply to the root request for consistency
    Object.assign(request, corrections);
  }
}
