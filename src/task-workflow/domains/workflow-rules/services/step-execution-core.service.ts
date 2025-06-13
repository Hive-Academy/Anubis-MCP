import { Injectable, Logger } from '@nestjs/common';
import {
  StepGuidanceService,
  StepGuidanceResult,
} from './step-guidance.service';
import { StepProgressTrackerService } from './step-progress-tracker.service';
import { getErrorMessage } from '../utils/type-safety.utils';

// ===================================================================
// 🔥 STEP EXECUTION CORE SERVICE - COMPLETE REVAMP FOR MCP-ONLY
// ===================================================================
// Purpose: Core orchestration of MCP step execution
// Scope: MCP guidance preparation, result processing, validation
// ZERO Legacy Support: Complete removal of all non-MCP execution logic

// 🎯 STRICT TYPE DEFINITIONS - ZERO ANY USAGE

export interface StepExecutionContext {
  stepId: string;
  taskId: string;
  roleId: string;
  executionContext?: unknown;
}

export interface StepExecutionResult {
  success: boolean;
  guidance: StepGuidanceResult;
  nextAction: string;
  message: string;
}

export interface McpStepGuidance {
  stepInfo: {
    id: string;
    name: string;
    description: string;
    stepType: string;
    estimatedTime?: string;
  };
  mcpActions: McpCallAction[];
  behavioralGuidance: {
    approach: string;
    methodology: string[];
    qualityGates: string[];
  };
  successCriteria: string[];
  failureCriteria: string[];
  troubleshooting: string[];
}

export interface McpCallAction {
  actionId: string;
  toolName: string;
  operation: string;
  parameters: any;
  sequenceOrder: number;
}

export interface ExecutionResultContext {
  stepId: string;
  results: McpExecutionResult[];
  executionTime: number;
}

export interface McpExecutionResult {
  actionId: string;
  actionName: string;
  success: boolean;
  output?: string;
  error?: string;
  executionTime?: number;
}

export interface ProcessingResult {
  success: boolean;
  stepCompleted: boolean;
  errors?: string[];
  nextStepRecommendation?: unknown;
  retryRecommendation?: unknown;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * 🚀 REVAMPED: StepExecutionCoreService
 *
 * COMPLETE OVERHAUL FOR MCP-ONLY EXECUTION:
 * - MCP guidance preparation only
 * - AI execution result processing
 * - Validation and progress tracking
 * - Zero legacy execution paths
 * - Reduced dependencies: 2 services only
 */
@Injectable()
export class StepExecutionCoreService {
  private readonly logger = new Logger(StepExecutionCoreService.name);

  constructor(
    private readonly guidanceService: StepGuidanceService,
    private readonly progressTracker: StepProgressTrackerService,
  ) {}

  /**
   * Execute step by preparing MCP guidance for AI execution
   * Completely removed legacy execution paths
   */
  async executeStep(
    context: StepExecutionContext,
  ): Promise<StepExecutionResult> {
    try {
      // Start progress tracking
      await this.progressTracker.startStep(
        context.stepId,
        context.taskId,
        context.roleId,
      );

      // Get MCP actions and guidance
      const guidance = await this.guidanceService.getStepGuidance({
        stepId: context.stepId,
        roleId: context.roleId,
        taskId: parseInt(context.taskId), // StepGuidanceService expects number
      });

      this.logger.log(
        `Step guidance prepared for AI execution: ${context.stepId}`,
      );

      return {
        success: true,
        guidance,
        nextAction: 'EXECUTE_MCP_ACTIONS',
        message: 'Step guidance prepared for AI execution',
      };
    } catch (error) {
      await this.progressTracker.failStep(context.stepId, {
        errors: [`Guidance preparation failed: ${getErrorMessage(error)}`],
      });

      throw error;
    }
  }

  /**
   * Process MCP execution results reported by AI
   */
  async processExecutionResults(
    context: ExecutionResultContext,
  ): Promise<ProcessingResult> {
    try {
      const validationResult = this.validateExecutionResults(context.results);

      if (validationResult.isValid) {
        await this.progressTracker.completeStep(context.stepId, {
          result: 'SUCCESS',
          mcpResults: context.results,
          duration: context.executionTime,
        });

        return {
          success: true,
          stepCompleted: true,
          nextStepRecommendation: this.getNextStepRecommendation(context),
        };
      } else {
        await this.progressTracker.failStep(context.stepId, {
          errors: validationResult.errors,
          mcpResults: context.results,
        });

        return {
          success: false,
          stepCompleted: false,
          errors: validationResult.errors,
          retryRecommendation: this.getRetryRecommendation(validationResult),
        };
      }
    } catch (error) {
      this.logger.error(`Failed to process execution results:`, error);
      throw error;
    }
  }

  /**
   * Validate MCP execution results
   */
  private validateExecutionResults(
    results: McpExecutionResult[],
  ): ValidationResult {
    const errors: string[] = [];

    for (const result of results) {
      if (!result.success) {
        errors.push(
          `MCP action failed: ${result.actionName} - ${result.error}`,
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get next step recommendation
   */
  private getNextStepRecommendation(_context: ExecutionResultContext): unknown {
    // Simplified implementation - could be enhanced with actual next step logic
    return {
      message: 'Step completed successfully. Continue with next step.',
    };
  }

  /**
   * Get retry recommendation for failed execution
   */
  private getRetryRecommendation(_validationResult: ValidationResult): unknown {
    return {
      message: 'Step execution failed. Review errors and retry.',
      recommendedActions: [
        'Check error details',
        'Verify MCP action parameters',
        'Retry execution',
      ],
    };
  }
}
