import { Injectable } from '@nestjs/common';
import { StepDataUtils } from '../utils/step-data.utils';
import {
  extractStreamlinedGuidance,
  StepNotFoundError,
} from '../utils/step-service-shared.utils';
import { RequiredInputExtractorService } from './required-input-extractor.service';
import { type McpActionData, StepQueryService } from './step-query.service';
import { WorkflowExecutionService } from './workflow-execution.service';

export interface StepGuidanceContext {
  taskId: number;
  roleId: string;
  stepId?: string; // Made optional to support auto-detection
  executionId?: string; // NEW: required for bootstrap progress tracking
  validateTransitionState?: boolean;
}

export interface StepGuidanceResult {
  step: any;
  mcpActions: any[];
  qualityChecklist: any;
  stepByStep: any;
  approach: any;
  guidance: any;
  transitionContext?: {
    stepResolved: boolean;
    originalStepId?: string;
    resolvedStepId: string;
  };
}

// Custom Error Classes - Using shared utilities
export class StepConfigNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StepConfigNotFoundError';
  }
}

/**
 * 🚀 ENHANCED: StepGuidanceService with Role Transition Support and Smart Schema Generation
 *
 * CRITICAL FIXES:
 * - Added automatic step detection for post-transition scenarios
 * - Enhanced context validation and state synchronization
 * - Added fallback mechanisms for missing stepId after transitions
 * - Integrated with enhanced StepQueryService for transition awareness
 * - Smart MCP action schema generation to reduce redundancy
 */
@Injectable()
export class StepGuidanceService {
  // 🎯 NEW: Cache for MCP action schemas to avoid redundant generation
  private readonly mcpActionCache = new Map<string, any>();

  constructor(
    private readonly stepQueryService: StepQueryService,
    private readonly requiredInputService: RequiredInputExtractorService,
    private readonly workflowExecutionService: WorkflowExecutionService,
  ) {}

  /**
   * 🔥 ENHANCED: Get MCP actions and step guidance with transition support and smart caching
   *
   * CRITICAL FIX: Now handles cases where stepId is missing after role transitions
   * by automatically detecting the correct step from execution state or role context
   * PERFORMANCE FIX: Intelligent MCP action schema generation with caching
   */
  async getStepGuidance(
    context: StepGuidanceContext,
  ): Promise<StepGuidanceResult> {
    // 🔧 CRITICAL FIX: Auto-detect step if not provided (common after transitions)
    let stepId = context.stepId;

    if (!stepId || context.validateTransitionState !== false) {
      const resolvedStepId = await this.resolveStepId(context);

      if (!resolvedStepId) {
        throw new StepNotFoundError(
          'unknown',
          'StepGuidanceService',
          'getStepGuidance - could not resolve stepId for current context',
        );
      }

      stepId = resolvedStepId;
    }

    // Get step with MCP actions
    const step = await this.stepQueryService.getStepWithMcpActions(stepId);

    if (!step) {
      throw new StepNotFoundError(
        stepId,
        'StepGuidanceService',
        'getStepGuidance',
      );
    }

    // Validate step belongs to current role
    if (step.roleId !== context.roleId) {
      // Try to find correct step for current role
      const correctStep = await this.stepQueryService.getNextAvailableStep(
        context.taskId.toString(),
        context.roleId,
        { checkTransitionState: true },
      );

      if (correctStep) {
        return await this.getStepGuidance({
          ...context,
          stepId: correctStep.id,
          validateTransitionState: false, // Avoid infinite recursion
        });
      } else {
        throw new StepNotFoundError(
          stepId,
          'StepGuidanceService',
          `Step role mismatch: step belongs to ${step.roleId}, requested for ${context.roleId}`,
        );
      }
    }

    // 🎯 ENHANCED: Extract MCP actions with smart schema generation
    const mcpActions = this.generateMcpActionsWithSmartSchemas(step.mcpActions);

    // Get guidance from database step data
    const enhancedGuidance = extractStreamlinedGuidance(step);

    return {
      step: StepDataUtils.extractStepInfo(step),
      mcpActions,
      qualityChecklist: enhancedGuidance.qualityChecklist,
      stepByStep: enhancedGuidance.stepByStep,
      approach: step.approach,
      guidance: step.stepGuidance,
      transitionContext: {
        stepResolved: stepId !== context.stepId,
        originalStepId: context.stepId,
        resolvedStepId: stepId,
      },
    };
  }

  /**
   * 🆕 NEW: Generate MCP actions with smart schema caching and pattern detection
   */
  private generateMcpActionsWithSmartSchemas(
    mcpActions: McpActionData[],
  ): any[] {
    const processedActions: any[] = [];
    const uniqueSchemas = new Map<string, any>();

    for (const action of mcpActions) {
      const cacheKey = `${action.serviceName}.${action.operation}`;

      // Check if we already processed this schema combination
      if (uniqueSchemas.has(cacheKey)) {
        // Reuse the existing schema
        processedActions.push({
          ...action,
          schema: uniqueSchemas.get(cacheKey),
          note: 'Schema reused - identical to previous action',
        });
      } else {
        // Generate new schema and cache it
        const schema = this.requiredInputService.extractFromServiceSchema(
          action.serviceName,
          action.operation,
        );

        uniqueSchemas.set(cacheKey, schema);
        processedActions.push({
          ...action,
          schema,
        });
      }
    }

    // 🎯 Add summary of unique schemas to reduce response size
    const schemasSummary = {
      totalActions: mcpActions.length,
      uniqueSchemas: uniqueSchemas.size,
      reusedSchemas: mcpActions.length - uniqueSchemas.size,
      patterns: Array.from(uniqueSchemas.keys()),
    };

    // Only include full schemas for unique patterns
    return processedActions.map((action, index) => {
      if (index === 0) {
        // Include summary in first action
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return {
          ...action,
          schemasSummary,
        };
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return action;
    });
  }

  /**
   * 🆕 NEW: Resolve stepId for current context
   *
   * Automatically determines the correct step ID for the current role and task,
   * especially useful after role transitions where stepId might be missing or incorrect
   */
  private async handleBootstrap(
    context: StepGuidanceContext,
  ): Promise<string | null> {
    // Use executionId to detect progression past first step
    if (context.executionId) {
      const exec = await this.workflowExecutionService.getExecutionById(
        context.executionId,
      );

      if (exec) {
        const lastCompleted = (exec.executionState as any)?.lastCompletedStep
          ?.id;

        if (
          exec.stepsCompleted > 0 &&
          exec.currentStepId &&
          lastCompleted === exec.currentStepId
        ) {
          const nextStep =
            await this.stepQueryService.getNextStepAfterCompletion(
              exec.currentStepId,
            );

          if (nextStep) {
            return nextStep.id;
          }

          return exec.currentStepId;
        }

        if (exec.currentStepId) {
          return exec.currentStepId;
        }
      }
    }

    const firstStep = await this.stepQueryService.getFirstStepForRole(
      context.roleId,
    );
    if (firstStep) {
      return firstStep.id;
    }

    return null;
  }

  private async resolveFromExecution(
    context: StepGuidanceContext,
  ): Promise<string | null> {
    const stateValidation =
      await this.stepQueryService.validateAndSyncExecutionState(
        context.taskId.toString(),
        context.roleId,
      );

    if (stateValidation.isValid && stateValidation.currentStep) {
      return stateValidation.currentStep.id;
    }

    const nextStep = await this.stepQueryService.getNextAvailableStep(
      context.taskId.toString(),
      context.roleId,
      { checkTransitionState: true, validateContext: true },
    );

    if (nextStep) {
      return nextStep.id;
    }

    return null;
  }

  private async findFallbackStep(
    context: StepGuidanceContext,
  ): Promise<string | null> {
    const firstStep = await this.stepQueryService.getFirstStepForRole(
      context.roleId,
    );
    if (firstStep) {
      return firstStep.id;
    }
    return null;
  }

  private async resolveStepId(
    context: StepGuidanceContext,
  ): Promise<string | null> {
    try {
      // Bootstrap scenario
      if (!context.taskId || context.taskId === 0) {
        return await this.handleBootstrap(context);
      }

      // Standard execution path
      const resolved = await this.resolveFromExecution(context);
      if (resolved) return resolved;

      // Fallback
      return await this.findFallbackStep(context);
    } catch (_error) {
      return null;
    }
  }

  /**
   * 🆕 NEW: Clear MCP action cache when needed
   */
  clearMcpActionCache(): void {
    this.mcpActionCache.clear();
  }

  /**
   * 🆕 NEW: Get cache statistics for monitoring
   */
  getCacheStats(): { mcpActionCache: number; inputExtractorCache: any } {
    return {
      mcpActionCache: this.mcpActionCache.size,
      inputExtractorCache: this.requiredInputService.getCacheStats(),
    };
  }
}
