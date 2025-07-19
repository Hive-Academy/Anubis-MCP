import { Injectable } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { ZodSchema, z } from 'zod';
import { StepExecutionService } from '../services/step-execution.service';
import { StepGuidanceService } from '../services/step-guidance.service';
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
    executionId: z.string().describe('Execution ID'),
    stepId: z.string().describe('Completed step ID'),
    result: z.enum(['success', 'failure']).describe('Execution result'),
    executionTime: z.number().optional().describe('Execution time in ms'),

    // 🔧 NEW: Structured execution data with explicit fields
    executionData: z
      .object({
        // Core execution information
        outputSummary: z
          .string()
          .optional()
          .describe('Brief summary of what was accomplished'),
        evidenceDetails: z
          .string()
          .optional()
          .describe('Detailed evidence of completion'),
        duration: z
          .string()
          .optional()
          .describe('Time taken to complete the step'),

        // File and code changes
        filesModified: z
          .array(z.string())
          .optional()
          .describe('List of files that were modified'),
        commandsExecuted: z
          .array(z.string())
          .optional()
          .describe('List of commands that were executed'),

        // Implementation details
        implementationSummary: z
          .string()
          .optional()
          .describe('Summary of implementation approach taken'),
        completionEvidence: z
          .record(z.any())
          .optional()
          .describe('Evidence of completion by acceptance criteria'),

        // Delegation and handoff
        delegationSummary: z
          .string()
          .optional()
          .describe('Summary for next role/step'),

        // Quality and validation
        qualityChecksComplete: z
          .boolean()
          .optional()
          .describe('Whether quality checks were completed'),
        qualityValidation: z
          .string()
          .optional()
          .describe('Results of quality validation'),
        acceptanceCriteriaVerification: z
          .record(z.any())
          .optional()
          .describe('Verification of acceptance criteria'),

        // Testing results
        testingResults: z
          .record(z.any())
          .optional()
          .describe('Results from testing activities'),
        qualityAssurance: z
          .record(z.any())
          .optional()
          .describe('Quality assurance metrics and results'),

        // Additional context
        additionalContext: z
          .record(z.any())
          .optional()
          .describe('Any additional context or findings'),
      })
      .optional()
      .describe('Structured execution data with specific fields'),

    // 🔧 NEW: Explicit validation results
    validationResults: z
      .object({
        allChecksPassed: z
          .boolean()
          .describe('Whether all validation checks passed'),
        checklist: z
          .array(
            z.object({
              item: z.string().describe('Validation check item'),
              passed: z.boolean().describe('Whether this check passed'),
              evidence: z
                .string()
                .optional()
                .describe('Evidence for this check'),
              notes: z
                .string()
                .optional()
                .describe('Additional notes about this check'),
            }),
          )
          .optional()
          .describe('Detailed validation checklist results'),
        qualityScore: z
          .number()
          .optional()
          .describe('Overall quality score (0-10)'),
        issues: z.array(z.string()).optional().describe('List of issues found'),
        recommendations: z
          .array(z.string())
          .optional()
          .describe('Recommendations for improvement'),
      })
      .optional()
      .describe('Structured validation results'),

    // 🔧 NEW: Explicit report data
    reportData: z
      .object({
        stepType: z
          .string()
          .optional()
          .describe('Type of step that was completed'),
        roleContext: z
          .string()
          .optional()
          .describe('Context about the role that executed this step'),
        keyAchievements: z
          .array(z.string())
          .optional()
          .describe('Key achievements in this step'),
        challengesFaced: z
          .array(z.string())
          .optional()
          .describe('Challenges encountered and how they were resolved'),
        nextStepRecommendations: z
          .array(z.string())
          .optional()
          .describe('Recommendations for the next step'),
        resourcesUsed: z
          .array(z.string())
          .optional()
          .describe('Resources, tools, or services used'),
        decisionsMade: z
          .array(z.string())
          .optional()
          .describe('Key decisions made during execution'),
        lessonsLearned: z
          .array(z.string())
          .optional()
          .describe('Lessons learned for future reference'),
      })
      .optional()
      .describe('Structured report data for comprehensive tracking'),
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

const GetWorkflowStateInputSchema = z.object({
  executionId: z.string().describe('Execution ID for workflow state query'),
  includeStepDetails: z
    .boolean()
    .optional()
    .default(true)
    .describe('Include detailed step information'),
});

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
    description: `CRITICAL WORKFLOW STATE TRACKER: Returns essential database identifiers for workflow continuity including executionId, taskId, roleId, and stepId. Use this tool whenever you need to verify or recover workflow state, especially when experiencing ID confusion or workflow interruptions.`,
    parameters: GetWorkflowStateInputSchema as ZodSchema<GetWorkflowStateInput>,
  })
  async getWorkflowStateTracker(input: GetWorkflowStateInput) {
    try {
      // ✅ GET EXECUTION STATE
      const executionResult =
        await this.workflowExecutionOperationsService.getExecution({
          executionId: input.executionId,
        });

      if (!executionResult.execution) {
        return this.buildResponse({
          executionId: input.executionId,
          status: 'no_execution',
          error: 'No active execution found for provided executionId',
          stateValid: false,
        });
      }

      const execution = executionResult.execution;
      const task = execution.task;
      const currentRole = execution.currentRole;
      const currentStep = execution.currentStep;

      // ✅ RETURN ONLY CRITICAL DATABASE IDENTIFIERS
      const criticalState = {
        executionId: execution.id,
        taskId: execution.taskId,
        roleId: execution.currentRoleId,
        stepId: execution.currentStepId,
        taskName: task?.name || 'Bootstrap/No Task',
        roleName: currentRole?.name || 'Unknown',
        stepName: currentStep?.name || 'No Step',
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
