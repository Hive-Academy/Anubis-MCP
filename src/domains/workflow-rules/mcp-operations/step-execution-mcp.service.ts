import { Injectable } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { ZodSchema, z } from 'zod';
import { StepExecutionService } from '../services/step-execution.service';
import { StepGuidanceService } from '../services/step-guidance.service';
import { WorkflowExecutionOperationsService } from '../services/workflow-execution-operations.service';
import { WorkflowContextCacheService } from '../services/workflow-context-cache.service';
import { AutoWorkflowValidation } from '../utils/dynamic-workflow-validation.util';
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

// ✅ MINIMAL SCHEMA: Only essential fields actually used in practice
const ReportStepCompletionInputSchema = z
  .object({
    taskId: z
      .number()
      .optional()
      .describe('Task ID (optional if executionId provided)'),
    executionId: z.string().describe('Execution ID'),
    stepId: z.string().describe('Completed step ID'),
    result: z.enum(['success', 'failure']).describe('Execution result'),
    executionTime: z.number().optional().describe('Execution time in ms'),

    // ✅ MINIMAL: Only actually used fields based on analysis
    executionData: z
      .object({
        // Core fields - most commonly used
        outputSummary: z
          .string()
          .optional()
          .describe('Brief summary of what was accomplished'),
        filesModified: z
          .array(z.string())
          .optional()
          .describe('List of files that were modified'),
        commandsExecuted: z
          .array(z.string())
          .optional()
          .describe('List of commands that were executed'),

        // Quality validation - simple boolean
        qualityChecksComplete: z
          .boolean()
          .optional()
          .describe('Whether quality checks were completed'),

        // Optional implementation details
        implementationSummary: z
          .string()
          .optional()
          .describe('Summary of implementation approach taken'),
      })
      .optional()
      .describe('Essential execution data'),

    // ✅ MINIMAL: Basic validation results
    validationResults: z
      .object({
        allChecksPassed: z
          .boolean()
          .describe('Whether all validation checks passed'),
        issues: z.array(z.string()).optional().describe('List of issues found'),
      })
      .optional()
      .describe('Basic validation results'),

    // ✅ MINIMAL: Optional report data for advanced tracking
    reportData: z
      .object({
        stepType: z
          .string()
          .optional()
          .describe('Type of step that was completed'),
        keyAchievements: z
          .array(z.string())
          .optional()
          .describe('Key achievements in this step'),
      })
      .optional()
      .describe('Optional report data'),
  })
  .refine(
    (data) => data.taskId !== undefined || data.executionId !== undefined,
    {
      message: 'Either taskId or executionId must be provided',
      path: ['taskId', 'executionId'],
    },
  );

const GetStepProgressInputSchema = z.object({
  executionId: z.string().describe('Execution ID for progress query'),
  roleId: z.string().optional().describe('Optional role ID filter'),
});

const GetWorkflowStateInputSchema = z
  .object({
    // Remove all parameters - this tool should work without any input
  })
  .optional();

type GetStepGuidanceInput = z.infer<typeof GetStepGuidanceInputSchema>;
type ReportStepCompletionInput = z.infer<
  typeof ReportStepCompletionInputSchema
>;
type GetStepProgressInput = z.infer<typeof GetStepProgressInputSchema>;
type GetWorkflowStateInput = z.infer<typeof GetWorkflowStateInputSchema>;

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
    private readonly workflowContextCache: WorkflowContextCacheService,
  ) {
    super();
  }

  // ===================================================================
  // ✅ GUIDANCE TOOL - Delegates to StepGuidanceService
  // ===================================================================

  @AutoWorkflowValidation(GetStepGuidanceInputSchema, 'get_step_guidance')
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

      // 🧠 UPDATE WORKFLOW CONTEXT CACHE
      // Store latest workflow state after successful guidance generation
      if (resolvedExecutionId) {
        try {
          const cacheKey = WorkflowContextCacheService.generateKey(
            resolvedExecutionId,
            'step_guidance',
          );

          // Get current execution to extract latest state
          const currentExecution =
            await this.workflowExecutionOperationsService.getExecution({
              executionId: resolvedExecutionId,
            });

          if (currentExecution.execution) {
            const execution = currentExecution.execution;
            this.workflowContextCache.storeContext(cacheKey, {
              executionId: resolvedExecutionId,
              taskId: execution.taskId || actualTaskId,
              currentRoleId: execution.currentRoleId || currentRoleId,
              currentStepId: execution.currentStepId || undefined,
              roleName: execution.currentRole?.name || 'Unknown',
              stepName: execution.currentStep?.name,
              taskName: execution.task?.name,
              projectPath: process.cwd(),
              source: 'step_completion',
            });
          }
        } catch (_cacheError) {
          // Don't fail the main operation if cache update fails
          // Silent fail to avoid disrupting workflow
        }
      }

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
    description: `Report step completion results with structured data and get next step guidance.`,
    parameters:
      ReportStepCompletionInputSchema as ZodSchema<ReportStepCompletionInput>,
  })
  async reportStepCompletion(input: ReportStepCompletionInput) {
    try {
      // Final validation - we must have an executionId at this point
      if (!input.executionId) {
        return this.buildErrorResponse(
          'No execution identifier provided',
          'Either taskId or executionId must be provided',
          'MISSING_EXECUTION_ID',
        );
      }

      // ✅ DELEGATE to StepExecutionService with structured data
      const completionResult =
        await this.stepExecutionService.processStepCompletion(
          input.executionId,
          input.stepId,
          input.result,
          input.executionData,
          input.validationResults,
          input.reportData,
        );

      return this.buildResponse({
        success: true,
        message: `Step '${input.stepId}' completion reported successfully`,
        result: input.result,
        hasNextStep: Boolean(completionResult?.nextStep),
        nextStepAvailable: completionResult?.nextStep ? true : false,
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
    description: `Get concise step progress focused on essential status information for workflow continuation.`,
    parameters: GetStepProgressInputSchema as ZodSchema<GetStepProgressInput>,
  })
  @AutoWorkflowValidation(GetStepProgressInputSchema, 'get_step_progress', {
    requiredIds: ['executionId'],
    allowBootstrap: false,
    contextSelectionStrategy: 'byExecutionId',
  })
  async getStepProgress(input: GetStepProgressInput) {
    try {
      // ✅ CRITICAL FIX: Use executionId for progress tracking instead of taskId
      const executionResult =
        await this.workflowExecutionOperationsService.getExecution({
          executionId: input.executionId,
        });

      if (!executionResult.execution) {
        return this.buildResponse({
          executionId: input.executionId,
          status: 'no_execution',
          error: 'No execution found for provided executionId',
        });
      }

      const execution = executionResult.execution;

      // Get only essential step progress data
      const stepProgressRepository =
        this.stepExecutionService['stepProgressRepository'];
      const stepProgressRecords =
        await stepProgressRepository.findByExecutionId(input.executionId);

      // Count completed steps and get most recent
      const completedSteps = stepProgressRecords.filter(
        (record) => record.status === 'COMPLETED',
      );
      const mostRecentStep = completedSteps[0] || null;

      const currentStep = execution.currentStep;
      const currentRole = execution.currentRole;

      return this.buildResponse({
        executionId: input.executionId,
        taskId: execution.taskId,
        status: execution.completedAt ? 'completed' : 'in_progress',

        // Current execution state
        currentStep: {
          id: currentStep?.id,
          name: currentStep?.name || 'No current step',
          status: execution.completedAt ? 'completed' : 'active',
          roleId: execution.currentRoleId,
          roleName: currentRole?.name || 'Unknown',
        },

        // Essential progress metrics
        progress: {
          stepsCompleted:
            completedSteps.length || execution.stepsCompleted || 0,
          progressPercentage: execution.progressPercentage || 0,
          totalSteps: execution.totalSteps || 0,
        },

        // Minimal execution context
        executionContext: {
          phase: (execution.executionState as any)?.phase || 'unknown',
          executionMode: execution.executionMode,
          startedAt: execution.startedAt,
          completedAt: execution.completedAt,
        },

        // Essential summary only
        summary: {
          totalStepsCompleted: completedSteps.length,
          lastCompletedStep: mostRecentStep
            ? {
                stepName: mostRecentStep.step?.name || 'Unknown',
                roleName: mostRecentStep.role?.name || 'Unknown',
                completedAt: mostRecentStep.completedAt,
                summary:
                  (mostRecentStep.executionData as any)?.outputSummary ||
                  'No summary available',
              }
            : null,
          isReady: Boolean(currentStep && !execution.completedAt),
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
    name: 'get_workflow_state_tracker',
    description: `CRITICAL WORKFLOW STATE TRACKER: Returns essential database identifiers for workflow continuity including executionId, taskId, roleId, and stepId from the active execution. Use this tool whenever you need to verify or recover workflow state, especially when experiencing ID confusion or workflow interruptions. Requires no parameters - automatically finds the active execution.`,
    parameters: GetWorkflowStateInputSchema as ZodSchema<GetWorkflowStateInput>,
  })
  @AutoWorkflowValidation(
    GetWorkflowStateInputSchema,
    'get_workflow_state_tracker',
    {
      requiredIds: [],
      allowBootstrap: true,
      contextSelectionStrategy: 'mostRecent',
    },
  )
  async getWorkflowStateTracker(_input?: GetWorkflowStateInput) {
    try {
      // ✅ GET ACTIVE EXECUTIONS INSTEAD OF REQUIRING EXECUTION ID
      const activeExecutionsResult =
        await this.workflowExecutionOperationsService.getActiveExecutions();

      if (
        !activeExecutionsResult.executions ||
        activeExecutionsResult.executions.length === 0
      ) {
        return this.buildResponse({
          status: 'no_active_executions',
          error: 'No active executions found',
          stateValid: false,
          executions: [],
        });
      }

      // Get the most recent active execution (first one)
      const execution = activeExecutionsResult.executions[0];
      const task = execution.task;
      const currentRole = execution.currentRole;
      const currentStep = execution.currentStep;

      // ✅ RETURN ONLY CRITICAL DATABASE IDENTIFIERS - SAME FORMAT AS BEFORE
      const criticalState = {
        executionId: execution.id,
        taskId: execution.taskId,
        roleId: execution.currentRoleId,
        stepId: execution.currentStepId,
        taskName: task?.name || 'Bootstrap/No Task',
        roleName: currentRole?.name || 'Unknown',
        stepName: currentStep?.name || 'No Step',
        stateValid: true,

        // Include summary info from active executions for context
        summary: activeExecutionsResult.summary,

        // If multiple executions, include count for awareness
        totalActiveExecutions: activeExecutionsResult.executions.length,
      };

      return this.buildResponse(criticalState);
    } catch (error) {
      return this.buildErrorResponse(
        'Failed to get workflow state tracker',
        getErrorMessage(error),
        'WORKFLOW_STATE_ERROR',
      );
    }
  }
}
