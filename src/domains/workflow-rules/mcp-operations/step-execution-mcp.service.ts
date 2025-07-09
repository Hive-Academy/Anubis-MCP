import { Injectable } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { ZodSchema, z } from 'zod';
import { StepExecutionService } from '../services/step-execution.service';
import { StepGuidanceService } from '../services/step-guidance.service';
import { WorkflowStep } from '../services/step-query.service';
import { WorkflowExecutionOperationsService } from '../services/workflow-execution-operations.service';
import { BaseMcpService } from '../utils/mcp-response.utils';
import { getErrorMessage } from '../utils/type-safety.utils';

// ===================================================================
// 🔥 STEP EXECUTION MCP SERVICE - CLEAN MCP INTERFACE
// ===================================================================
// Purpose: MCP tool interface for step operations only
// Scope: Delegates to dedicated services, no business logic duplication

// 🎯 STRICT TYPE DEFINITIONS

const GetStepGuidanceInputSchema = z
  .object({
    taskId: z
      .number()
      .optional()
      .describe('Task ID for context (optional if executionId provided)'),
    executionId: z
      .string()
      .optional()
      .describe('Execution ID for context (optional if taskId provided)'),
    roleId: z.string().describe('Role ID for step guidance'),
    stepId: z.string().optional().describe('Optional specific step ID'),
  })
  .refine(
    (data) => data.taskId !== undefined || data.executionId !== undefined,
    {
      message: 'Either taskId or executionId must be provided',
      path: ['taskId', 'executionId'],
    },
  );

const ReportStepCompletionInputSchema = z
  .object({
    taskId: z
      .number()
      .optional()
      .describe('Task ID (optional if executionId provided)'),
    executionId: z
      .string()
      .optional()
      .describe('Execution ID (optional if taskId provided)'),
    stepId: z.string().describe('Completed step ID'),
    result: z.enum(['success', 'failure']).describe('Execution result'),
    executionData: z
      .unknown()
      .optional()
      .describe('Results from local execution'),
    executionTime: z.number().optional().describe('Execution time in ms'),
  })
  .refine(
    (data) => data.taskId !== undefined || data.executionId !== undefined,
    {
      message: 'Either taskId or executionId must be provided',
      path: ['taskId', 'executionId'],
    },
  );

const GetStepProgressInputSchema = z.object({
  id: z.number().describe('Task ID for progress query'),
  roleId: z.string().optional().describe('Optional role ID filter'),
});

const GetNextStepInputSchema = z.object({
  roleId: z.string().describe('Role ID for next step query'),
  id: z.number().describe('Task ID for context'),
});

type GetStepGuidanceInput = z.infer<typeof GetStepGuidanceInputSchema>;
type ReportStepCompletionInput = z.infer<
  typeof ReportStepCompletionInputSchema
>;
type GetStepProgressInput = z.infer<typeof GetStepProgressInputSchema>;
type GetNextStepInput = z.infer<typeof GetNextStepInputSchema>;

/**
 * 🚀 CLEAN: StepExecutionMcpService - MCP Interface Only
 *
 * FOCUSED RESPONSIBILITIES:
 * - MCP tool interface for step operations
 * - Delegates to dedicated services (StepGuidanceService, StepExecutionService)
 * - No business logic duplication
 * - Clean error handling and responses
 */
@Injectable()
export class StepExecutionMcpService extends BaseMcpService {
  constructor(
    private readonly stepExecutionService: StepExecutionService,
    private readonly stepGuidanceService: StepGuidanceService,
    private readonly workflowExecutionOperationsService: WorkflowExecutionOperationsService,
  ) {
    super();
  }

  // ===================================================================
  // ✅ GUIDANCE TOOL - Delegates to StepGuidanceService
  // ===================================================================

  @Tool({
    name: 'get_step_guidance',
    description: `Provides focused guidance for executing the current workflow step, including commands and validation checklist.`,
    parameters: GetStepGuidanceInputSchema as ZodSchema<GetStepGuidanceInput>,
  })
  async getStepGuidance(input: GetStepGuidanceInput) {
    try {
      // 🔧 CRITICAL FIX: Enhanced to handle post-transition scenarios
      let currentStepId = input.stepId;
      let currentRoleId = input.roleId;
      let actualTaskId = input.taskId;
      let resolvedExecutionId = input.executionId;

      // Get execution context if needed
      if (!currentStepId || !actualTaskId) {
        const executionQuery =
          input.taskId !== undefined
            ? { taskId: input.taskId }
            : { executionId: input.executionId };

        const executionResult =
          await this.workflowExecutionOperationsService.getExecution(
            executionQuery,
          );

        if (!executionResult.execution) {
          return this.buildResponse({
            error: 'No active execution found',
            guidance: 'Please ensure workflow is properly initialized',
          });
        }

        const currentExecution = executionResult.execution;

        // 🔧 BOOTSTRAP FIX: Update context from execution - HANDLE BOOTSTRAP CASE
        if (currentExecution.taskId) {
          actualTaskId = actualTaskId || currentExecution.taskId;
        } else {
          // Bootstrap case: execution has no task yet
          actualTaskId = 0; // Signal bootstrap mode to resolveStepId
        }
        currentRoleId = currentExecution.currentRoleId;

        // 🔧 CRITICAL FIX: Don't require currentStepId - let guidance service auto-detect
        if (currentExecution.currentStepId) {
          currentStepId = currentExecution.currentStepId;
        }

        if (!currentRoleId) {
          return this.buildResponse({
            error: 'Missing execution context',
            details: {
              hasRoleId: Boolean(currentRoleId),
              hasTaskId: Boolean(actualTaskId),
              isBootstrapMode: actualTaskId === 0,
            },
          });
        }
        resolvedExecutionId = executionResult.execution.id;
      }

      // ✅ ENHANCED: Use transition-aware StepGuidanceService
      const guidance = await this.stepGuidanceService.getStepGuidance({
        taskId: actualTaskId,
        roleId: currentRoleId,
        executionId: resolvedExecutionId,
        stepId: currentStepId, // May be undefined - guidance service handles this
        validateTransitionState: true, // Enable transition state detection
      });

      // Return clean guidance without artificial fields
      return this.buildResponse(guidance);
    } catch (error) {
      return this.buildErrorResponse(
        'Failed to get step guidance',
        getErrorMessage(error),
        'STEP_GUIDANCE_ERROR',
      );
    }
  }

  // ===================================================================
  // ✅ RESULT REPORTING TOOL - Delegates to StepExecutionService
  // ===================================================================

  @Tool({
    name: 'report_step_completion',
    description: `Report step completion results and get next step guidance.`,
    parameters:
      ReportStepCompletionInputSchema as ZodSchema<ReportStepCompletionInput>,
  })
  async reportStepCompletion(input: ReportStepCompletionInput) {
    try {
      let executionId = input.executionId;

      if (!executionId && input.taskId) {
        const execution =
          await this.workflowExecutionOperationsService.getExecution({
            taskId: input.taskId,
          });
        if (!execution.execution) {
          return this.buildErrorResponse(
            'No execution found for task',
            `Task ${input.taskId} has no active execution`,
            'EXECUTION_NOT_FOUND',
          );
        }
        executionId = execution.execution.id;
      }

      if (!executionId) {
        return this.buildErrorResponse(
          'No execution identifier provided',
          'Either taskId or executionId must be provided',
          'MISSING_EXECUTION_ID',
        );
      }

      // ✅ DELEGATE to StepExecutionService
      const completionResult =
        await this.stepExecutionService.processStepCompletion(
          executionId,
          input.stepId,
          input.result,
          input.executionData,
        );

      return this.buildResponse({
        completion: {
          stepId: input.stepId,
          result: input.result,
          status: 'reported',
        },
        nextGuidance: {
          hasNextStep: Boolean(completionResult),
          nextStep: completionResult.nextStep,
        },
      });
    } catch (error) {
      return this.buildErrorResponse(
        'Failed to report step completion',
        getErrorMessage(error),
        'STEP_COMPLETION_ERROR',
      );
    }
  }

  // ===================================================================
  // 📊 PROGRESS AND ANALYTICS TOOLS - Delegates to WorkflowExecutionOperationsService
  // ===================================================================

  @Tool({
    name: 'get_step_progress',
    description: `Get focused step progress summary for a task.`,
    parameters: GetStepProgressInputSchema as ZodSchema<GetStepProgressInput>,
  })
  async getStepProgress(input: GetStepProgressInput) {
    try {
      // ✅ DELEGATE to WorkflowExecutionOperationsService
      const executionResult =
        await this.workflowExecutionOperationsService.getExecution({
          taskId: input.id,
        });

      if (!executionResult.execution) {
        return this.buildResponse({
          taskId: input.id,
          status: 'no_execution',
          error: 'No active execution found',
        });
      }

      const execution = executionResult.execution;
      const currentStep = execution.currentStep;

      return this.buildResponse({
        taskId: input.id,
        status: execution.completedAt ? 'completed' : 'in_progress',
        currentStep: {
          name: currentStep?.name || 'No current step',
          status: execution.completedAt ? 'completed' : 'active',
          stepId: currentStep?.id,
        },
        progress: {
          stepsCompleted: execution.stepsCompleted || 0,
          progressPercentage: execution.progressPercentage || 0,
        },
      });
    } catch (error) {
      return this.buildErrorResponse(
        'Failed to get step progress',
        getErrorMessage(error),
        'STEP_PROGRESS_ERROR',
      );
    }
  }

  @Tool({
    name: 'get_next_available_step',
    description: `Get focused next step information for role progression.`,
    parameters: GetNextStepInputSchema as ZodSchema<GetNextStepInput>,
  })
  async getNextAvailableStep(input: GetNextStepInput) {
    try {
      // ✅ DELEGATE to WorkflowExecutionOperationsService
      const executionResult =
        await this.workflowExecutionOperationsService.getExecution({
          taskId: input.id,
        });

      if (!executionResult.execution) {
        return this.buildResponse({
          taskId: input.id,
          roleId: input.roleId,
          status: 'no_execution',
          error: 'No active execution found',
        });
      }

      const execution = executionResult.execution;

      if (execution.currentRoleId !== input.roleId) {
        return this.buildResponse({
          taskId: input.id,
          roleId: input.roleId,
          status: 'role_mismatch',
          currentRole: execution.currentRole?.name || 'unknown',
          message: `Execution is currently assigned to ${execution.currentRole?.name || 'unknown'}, not ${input.roleId}`,
        });
      }

      // ✅ DELEGATE to StepExecutionService
      const nextStep: WorkflowStep | null =
        await this.stepExecutionService.getNextAvailableStep(
          input.id,
          input.roleId,
        );

      return this.buildResponse({
        taskId: input.id,
        roleId: input.roleId,
        nextStep: nextStep
          ? this.stepGuidanceService.getStepGuidance({
              taskId: input.id,
              roleId: nextStep.roleId,
              stepId: nextStep.id,
              executionId: execution.id,
            })
          : null,
        status: nextStep ? 'step_available' : 'no_steps_available',
      });
    } catch (error) {
      return this.buildErrorResponse(
        'Failed to get next available step',
        getErrorMessage(error),
        'NEXT_STEP_ERROR',
      );
    }
  }
}
