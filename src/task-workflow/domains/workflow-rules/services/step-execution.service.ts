import { Injectable, Logger } from '@nestjs/common';
import { StepGuidanceService } from './step-guidance.service';
import { StepProgressTrackerService } from './step-progress-tracker.service';
import { StepQueryService, WorkflowStep } from './step-query.service';
import { getErrorMessage } from '../utils/type-safety.utils';
import { PrismaService } from '../../../../prisma/prisma.service';

// ===================================================================
// 🔥 STEP EXECUTION SERVICE - CONSOLIDATED SERVICE (PHASE 2)
// ===================================================================
// Purpose: Unified step execution with core logic and orchestration
// Role: Single service handling both delegation and core execution
// Architecture: Consolidated service eliminating redundant boundaries
// Consolidation: Merged StepExecutionCoreService into this service
// ===================================================================

// 🎯 STRICT TYPE DEFINITIONS - ZERO ANY USAGE

export interface StepExecutionContext {
  stepId: string;
  taskId: string;
  roleId: string;
  executionContext?: unknown;
  projectPath?: string;
}

export interface StepExecutionResult {
  success: boolean;
  guidance: unknown;
  message: string;
}

export interface McpStepExecutionResult {
  success: boolean;
  stepId: string;
  guidance?: unknown;
  nextStep?: unknown;
  duration?: number;
  errors?: string[];
}

export interface McpStepCompletionResult {
  success: boolean;
  stepCompleted: boolean;
  nextGuidance?: unknown;
  errors?: string[];
}

export interface McpStepValidationCriteria {
  successCriteria: string[];
  failureCriteria: string[];
  qualityChecklist: string[];
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
 * 🚀 CONSOLIDATED: StepExecutionService (Phase 2)
 *
 * SERVICE CONSOLIDATION COMPLETE:
 * - Merged StepExecutionCoreService functionality directly into this service
 * - Eliminated redundant service boundary and overhead
 * - Maintains all existing public API contracts
 * - Combines orchestration and core execution logic in single service
 * - Reduced from 2 services to 1 service (50% reduction)
 * - Reduced inter-service dependencies and call overhead
 * - Clear internal organization with core and orchestration sections
 */
@Injectable()
export class StepExecutionService {
  private readonly logger = new Logger(StepExecutionService.name);

  constructor(
    private readonly guidanceService: StepGuidanceService,
    private readonly progressService: StepProgressTrackerService,
    private readonly queryService: StepQueryService,
    private readonly prisma: PrismaService,
  ) {
    this.logger.log(
      '✅ StepExecutionService initialized - Consolidated service with core execution',
    );
  }

  // ===================================================================
  // 🎯 CORE EXECUTION METHODS (Merged from StepExecutionCoreService)
  // ===================================================================

  /**
   * Execute step with context - consolidated core execution
   */
  async executeStep(
    context: StepExecutionContext,
  ): Promise<StepExecutionResult> {
    try {
      this.logger.debug(`Executing step: ${context.stepId}`);

      // Start progress tracking (from core service)
      await this.progressService.startStep(
        context.stepId,
        context.taskId,
        context.roleId,
      );

      // Get MCP actions and guidance (from core service)
      const guidance = await this.guidanceService.getStepGuidance({
        stepId: context.stepId,
        roleId: context.roleId,
        taskId: parseInt(context.taskId),
      });

      this.logger.log(
        `Step guidance prepared for AI execution: ${context.stepId}`,
      );

      return {
        success: true,
        guidance,
        message: 'Step guidance prepared for AI execution',
      };
    } catch (error) {
      await this.progressService.failStep(context.stepId, {
        errors: [`Guidance preparation failed: ${getErrorMessage(error)}`],
      });

      this.logger.error(`Failed to execute step: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  /**
   * Process MCP execution results reported by AI (from core service)
   */
  async processExecutionResults(
    context: ExecutionResultContext,
  ): Promise<ProcessingResult> {
    try {
      const validationResult = this.validateExecutionResults(context.results);

      if (validationResult.isValid) {
        await this.progressService.completeStep(context.stepId, {
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
        await this.progressService.failStep(context.stepId, {
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

  // ===================================================================
  // 🎯 ORCHESTRATION METHODS (Original service methods)
  // ===================================================================

  /**
   * Get step guidance - simple delegation
   */
  async getStepGuidance(
    taskId: number,
    roleId: string,
    stepId: string,
  ): Promise<unknown> {
    try {
      return await this.guidanceService.getStepGuidance({
        taskId,
        roleId,
        stepId,
      });
    } catch (error) {
      this.logger.error(
        `Failed to get step guidance: ${getErrorMessage(error)}`,
      );
      throw error;
    }
  }

  /**
   * Process step completion - using executionId
   */
  async processStepCompletion(
    executionId: string,
    stepId: string,
    result: 'success' | 'failure',
    executionData?: unknown,
  ): Promise<unknown> {
    try {
      this.logger.debug(`Processing step completion: ${stepId} -> ${result}`);

      // Get current execution to get taskId and roleId
      const execution = await this.prisma.workflowExecution.findUnique({
        where: { id: executionId },
        select: { taskId: true, currentRoleId: true },
      });

      if (!execution) {
        throw new Error(`Execution not found: ${executionId}`);
      }

      // Update step progress tied to execution
      await this.prisma.workflowStepProgress.create({
        data: {
          executionId: executionId,
          taskId: execution.taskId?.toString(),
          stepId,
          roleId: execution.currentRoleId,
          status: result === 'success' ? 'COMPLETED' : 'FAILED',
          startedAt: new Date(),
          completedAt: result === 'success' ? new Date() : null,
          failedAt: result === 'failure' ? new Date() : null,
          result: result === 'success' ? 'SUCCESS' : 'FAILURE',
          executionData: executionData
            ? JSON.parse(JSON.stringify(executionData))
            : null,
        },
      });

      // If step completed successfully, advance to next step
      if (result === 'success') {
        const nextStep =
          await this.queryService.getNextStepAfterCompletion(stepId);

        // Update workflow execution to point to next step
        const currentExecution = await this.prisma.workflowExecution.findUnique(
          {
            where: { id: executionId },
          },
        );

        if (currentExecution) {
          await this.prisma.workflowExecution.update({
            where: { id: executionId },
            data: {
              currentStepId: nextStep?.id || null,
              stepsCompleted: (currentExecution.stepsCompleted || 0) + 1,
              executionState: {
                ...((currentExecution.executionState as Record<string, any>) ||
                  {}),
                lastCompletedStep: {
                  id: stepId,
                  completedAt: new Date().toISOString(),
                  result,
                },
                ...(nextStep && {
                  currentStep: {
                    id: nextStep.id,
                    name: nextStep.name,
                    sequenceNumber: nextStep.sequenceNumber,
                    assignedAt: new Date().toISOString(),
                  },
                }),
              },
            },
          });
        }

        return {
          success: true,
          stepId,
          executionData,
          nextStep: nextStep
            ? {
                id: nextStep.id,
                name: nextStep.name,
                sequenceNumber: nextStep.sequenceNumber,
              }
            : null,
        };
      }

      return { success: false, stepId, executionData };
    } catch (error) {
      this.logger.error(
        `Failed to process step completion: ${getErrorMessage(error)}`,
      );
      throw error;
    }
  }

  /**
   * Get step progress - basic implementation
   */
  getStepProgress(taskId: number): unknown {
    try {
      this.logger.debug(`Getting step progress for task: ${taskId}`);
      return { taskId, status: 'in_progress' };
    } catch (error) {
      this.logger.error(
        `Failed to get step progress: ${getErrorMessage(error)}`,
      );
      throw error;
    }
  }

  /**
   * Get step with execution data
   */
  async getStepWithExecutionData(stepId: string): Promise<unknown> {
    try {
      this.logger.debug(`Getting step with execution data: ${stepId}`);
      return await this.queryService.getStepWithExecutionData(stepId);
    } catch (error) {
      this.logger.error(
        `Failed to get step with execution data: ${getErrorMessage(error)}`,
      );
      throw error;
    }
  }

  /**
   * Get next available step - stub for compatibility
   */
  async getNextAvailableStep(
    taskId: number,
    roleId: string,
  ): Promise<WorkflowStep | null> {
    try {
      this.logger.debug(
        `Getting next available step - Task: ${taskId}, Role: ${roleId}`,
      );
      return await this.queryService.getNextAvailableStep(
        taskId.toString(),
        roleId,
      );
    } catch (error) {
      this.logger.error(
        `Failed to get next available step: ${getErrorMessage(error)}`,
      );
      return null;
    }
  }

  // ===================================================================
  // 🎯 PRIVATE UTILITY METHODS (From merged core service)
  // ===================================================================

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
