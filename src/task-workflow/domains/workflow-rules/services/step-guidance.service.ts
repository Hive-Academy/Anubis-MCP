import { Injectable, Logger } from '@nestjs/common';
import { StepDataUtils } from '../utils/step-data.utils';
import {
  extractStreamlinedGuidance,
  StepNotFoundError,
} from '../utils/step-service-shared.utils';
import { McpActionData, StepQueryService } from './step-query.service';
import { RequiredInputExtractorService } from './required-input-extractor.service';
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
 * 🚀 ENHANCED: StepGuidanceService with Role Transition Support
 *
 * CRITICAL FIXES:
 * - Added automatic step detection for post-transition scenarios
 * - Enhanced context validation and state synchronization
 * - Added fallback mechanisms for missing stepId after transitions
 * - Integrated with enhanced StepQueryService for transition awareness
 */
@Injectable()
export class StepGuidanceService {
  private readonly logger = new Logger(StepGuidanceService.name);

  constructor(
    private readonly stepQueryService: StepQueryService,
    private readonly requiredInputService: RequiredInputExtractorService,
    private readonly workflowExecutionService: WorkflowExecutionService,
  ) {}

  /**
   * 🔥 ENHANCED: Get MCP actions and step guidance with transition support
   *
   * CRITICAL FIX: Now handles cases where stepId is missing after role transitions
   * by automatically detecting the correct step from execution state or role context
   */
  async getStepGuidance(
    context: StepGuidanceContext,
  ): Promise<StepGuidanceResult> {
    try {
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
        this.logger.warn(
          `Step ${stepId} belongs to role ${step.roleId} but requested for role ${context.roleId}. Attempting to find correct step.`,
        );

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

      // Extract MCP actions with dynamic parameter information
      const mcpActions = step.mcpActions.map((action: McpActionData) => {
        return {
          ...action,
          schema: this.requiredInputService.extractFromServiceSchema(
            action.serviceName,
            action.operation,
          ),
        };
      });

      // Get guidance from database step data
      const enhancedGuidance = extractStreamlinedGuidance(step);

      this.logger.log(
        `Step guidance prepared for step: ${stepId} (${step.name}) for role: ${context.roleId}`,
      );

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
    } catch (error) {
      this.logger.error(`Error getting step guidance for context:`, {
        taskId: context.taskId,
        roleId: context.roleId,
        stepId: context.stepId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 🆕 NEW: Resolve stepId for current context
   *
   * Automatically determines the correct step ID for the current role and task,
   * especially useful after role transitions where stepId might be missing or incorrect
   */
  private async resolveStepId(
    context: StepGuidanceContext,
  ): Promise<string | null> {
    try {
      // 🔧 BOOTSTRAP MODE DETECTION: Handle case where we have no valid taskId (bootstrap sequence)
      if (!context.taskId || context.taskId === 0) {
        this.logger.log(
          'Bootstrap mode detected: resolving stepId without taskId',
        );

        // NEW LOGIC ➜ use executionId to detect progression past first step
        if (context.executionId) {
          const exec = await this.workflowExecutionService.getExecutionById(
            context.executionId,
          );

          if (exec) {
            // If we have already completed at least one step, try to return the next step
            const lastCompleted = (exec.executionState as any)
              ?.lastCompletedStep?.id;

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
                this.logger.log(
                  `Bootstrap progression: resolved NEXT step ${nextStep.id} (${nextStep.name}) after completing ${exec.stepsCompleted} steps`,
                );
                return nextStep.id;
              }

              // Fallback to currentStepId if no next step exists (end of role steps)
              this.logger.log(
                `Bootstrap progression: no further steps, returning currentStepId ${exec.currentStepId}`,
              );
              return exec.currentStepId;
            }

            // If zero steps completed, just return currentStepId (initial first step)
            if (exec.currentStepId) {
              this.logger.log(
                `Bootstrap initial: using execution.currentStepId ${exec.currentStepId}`,
              );
              return exec.currentStepId;
            }
          }
        }

        const firstStep = await this.stepQueryService.getFirstStepForRole(
          context.roleId,
        );

        if (firstStep) {
          this.logger.log(
            `Bootstrap: resolved to first step for role: ${firstStep.id} (${firstStep.name})`,
          );
          return firstStep.id;
        } else {
          this.logger.error(
            `Bootstrap: no first step found for role: ${context.roleId}`,
          );
          return null;
        }
      }

      // Standard flow: validate and sync execution state
      const stateValidation =
        await this.stepQueryService.validateAndSyncExecutionState(
          context.taskId.toString(),
          context.roleId,
        );

      if (stateValidation.isValid && stateValidation.currentStep) {
        this.logger.log(
          `Resolved stepId from execution state: ${stateValidation.currentStep.id}${
            stateValidation.corrected ? ' (state corrected)' : ''
          }`,
        );
        return stateValidation.currentStep.id;
      }

      // Fallback: get next available step using transition-aware logic
      const nextStep = await this.stepQueryService.getNextAvailableStep(
        context.taskId.toString(),
        context.roleId,
        { checkTransitionState: true, validateContext: true },
      );

      if (nextStep) {
        this.logger.log(
          `Resolved stepId from next available step: ${nextStep.id} (${nextStep.name})`,
        );
        return nextStep.id;
      }

      // Last resort: get first step for role
      const firstStep = await this.stepQueryService.getFirstStepForRole(
        context.roleId,
      );

      if (firstStep) {
        this.logger.log(
          `Resolved stepId from first step for role: ${firstStep.id} (${firstStep.name})`,
        );
        return firstStep.id;
      }

      this.logger.error(`Could not resolve stepId for context:`, {
        taskId: context.taskId,
        roleId: context.roleId,
        stateValidation,
      });

      return null;
    } catch (error) {
      this.logger.error(`Error resolving stepId:`, error);
      return null;
    }
  }
}
