import { Injectable, Inject } from '@nestjs/common';
import {
  StepProgressStatus,
  StepExecutionResult as PrismaStepExecutionResult,
} from '../../../../generated/prisma';
import { StepDataUtils } from '../utils/step-data.utils';
import { getErrorMessage } from '../utils/type-safety.utils';
import { StepGuidanceService } from './step-guidance.service';
import { StepProgressTrackerService } from './step-progress-tracker.service';
import { StepQueryService, WorkflowStep } from './step-query.service';
import { WorkflowExecutionService } from './workflow-execution.service';
import { IWorkflowExecutionRepository } from '../repositories/interfaces/workflow-execution.repository.interface';
import { IStepProgressRepository } from '../repositories/interfaces/step-progress.repository.interface';

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

@Injectable()
export class StepExecutionService {
  constructor(
    private readonly guidanceService: StepGuidanceService,
    private readonly progressService: StepProgressTrackerService,
    private readonly queryService: StepQueryService,
    @Inject('IWorkflowExecutionRepository')
    private readonly workflowExecutionRepository: IWorkflowExecutionRepository,
    @Inject('IStepProgressRepository')
    private readonly stepProgressRepository: IStepProgressRepository,
    private readonly workflowExecutionService: WorkflowExecutionService,
  ) {}

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

      return {
        success: true,
        guidance,
        message: 'Step guidance prepared for AI execution',
      };
    } catch (error) {
      await this.progressService.failStep(context.stepId, {
        errors: [`Guidance preparation failed: ${getErrorMessage(error)}`],
      });
      throw error;
    }
  }

  /**
   * Process MCP execution results reported by AI (from core service)
   */
  async processExecutionResults(
    context: ExecutionResultContext,
  ): Promise<ProcessingResult> {
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
  }

  /**
   * Process step completion - using structured data instead of extraction
   */
  async processStepCompletion(
    executionId: string,
    stepId: string,
    result: 'success' | 'failure',
    executionData?: any,
    validationResults?: any,
    reportData?: any,
  ) {
    // Get current execution to get taskId and roleId
    const execution = await this.workflowExecutionRepository.findById(
      executionId,
      {
        task: true,
        currentRole: true,
      },
    );

    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }

    // 🔧 CRITICAL FIX: Use structured data directly instead of extraction
    const completionData = {
      executionId: executionId,
      taskId: execution.taskId?.toString(),
      stepId,
      roleId: execution.currentRoleId,
      status:
        result === 'success' ? 'COMPLETED' : ('FAILED' as StepProgressStatus),
      startedAt: new Date(),
      completedAt: result === 'success' ? new Date() : undefined,
      failedAt: result === 'failure' ? new Date() : undefined,
      result: (result === 'success'
        ? 'SUCCESS'
        : 'FAILURE') as PrismaStepExecutionResult,

      // 🔧 NEW: Store structured data directly
      executionData: executionData || null,
      validationResults: validationResults || null,
      reportData: reportData || null,
    };

    // Update step progress tied to execution
    await this.stepProgressRepository.create(completionData);

    // If step completed successfully, advance to next step
    if (result === 'success') {
      const nextStep =
        await this.queryService.getNextStepAfterCompletion(stepId);

      // Update workflow execution to point to next step
      const currentExecution =
        await this.workflowExecutionRepository.findById(executionId);

      if (currentExecution) {
        // Update execution core fields (currentStepId, stepsCompleted)
        await this.workflowExecutionRepository.update(executionId, {
          currentStepId: nextStep?.id || undefined,
          stepsCompleted: (currentExecution.stepsCompleted || 0) + 1,
        });

        // Update executionState via validated helper
        await this.workflowExecutionService.updateExecutionState(executionId, {
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
  }

  /**
   * Get step progress - basic implementation
   */
  getStepProgress(taskId: number): unknown {
    return { taskId, status: 'in_progress' };
  }

  /**
   * Get next available step - stub for compatibility
   */
  async getNextAvailableStep(
    taskId: number,
    roleId: string,
  ): Promise<WorkflowStep | null> {
    try {
      return await this.queryService.getNextAvailableStep(
        taskId.toString(),
        roleId,
      );
    } catch (_error) {
      return null;
    }
  }

  // ===================================================================
  // 🎯 PRIVATE UTILITY METHODS (From merged core service)
  // ===================================================================

  /**
   * Validate MCP execution results - using shared utilities
   */
  private validateExecutionResults(
    results: McpExecutionResult[],
  ): ValidationResult {
    const validation = StepDataUtils.validateExecutionResults(results);

    return {
      isValid: validation.isValid,
      errors: validation.errors,
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
