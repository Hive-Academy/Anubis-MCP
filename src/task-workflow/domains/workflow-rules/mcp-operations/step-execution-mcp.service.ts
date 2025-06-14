import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { ZodSchema, z } from 'zod';
import { StepExecutionService } from '../services/step-execution.service';
import { RequiredInputExtractorService } from '../services/required-input-extractor.service';
import { WorkflowExecutionOperationsService } from '../services/workflow-execution-operations.service';
import { getErrorMessage } from '../utils/type-safety.utils';
import { WorkflowStep } from '../services/step-query.service';

// ===================================================================
// 🔥 STEP EXECUTION MCP SERVICE - FOCUSED STEP MANAGEMENT
// ===================================================================
// Purpose: Step guidance, progress tracking, and completion reporting
// Scope: Step workflow management only (NO MCP operations)
// ZERO MCP_CALL Operations: Pure step execution focus

// 🎯 STRICT TYPE DEFINITIONS - ZERO ANY USAGE

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

const ReportStepCompletionInputSchema = z.object({
  taskId: z.number().describe('Task ID'),
  stepId: z.string().describe('Completed step ID'),
  result: z.enum(['success', 'failure']).describe('Execution result'),
  executionData: z
    .unknown()
    .optional()
    .describe('Results from local execution'),
  executionTime: z.number().optional().describe('Execution time in ms'),
});

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

// Add type definitions at the top
interface StepGuidanceData {
  step?: {
    name: string;
    description: string;
  };
  mcpActions?: Array<{
    serviceName: string;
    operation: string;
    parameters: any;
  }>;
  successCriteria?: string[];
  qualityChecklist?: string[];
}

interface StepGuidanceData {
  step?: {
    name: string;
    description: string;
  };
  mcpActions?: Array<{
    serviceName: string;
    operation: string;
    parameters: any;
  }>;
  successCriteria?: string[];
  qualityChecklist?: string[];
}

/**
 * 🚀 FOCUSED: StepExecutionMcpService
 *
 * DEDICATED STEP EXECUTION MANAGEMENT:
 * - Step guidance and progress tracking only
 * - Clear separation from MCP operation execution
 * - Direct execution service integration
 * - Simplified error handling and responses
 * - Zero MCP_CALL operations (moved to dedicated service)
 * - Pure step workflow focus
 */
@Injectable()
export class StepExecutionMcpService {
  private readonly logger = new Logger(StepExecutionMcpService.name);

  constructor(
    private readonly stepExecutionService: StepExecutionService,
    private readonly requiredInputExtractorService: RequiredInputExtractorService,
    private readonly workflowExecutionOperationsService: WorkflowExecutionOperationsService,
  ) {}

  // ===================================================================
  // ✅ GUIDANCE TOOL - What AI should do locally
  // ===================================================================

  @Tool({
    name: 'get_step_guidance',
    description: `Get FOCUSED guidance for the current step execution only.

🎯 FOCUSED STEP GUIDANCE - No role context, no redundancy

**Returns ONLY:**
- Current step details and description  
- Specific commands to execute locally
- Success/failure criteria
- Quality checklist for validation

**Does NOT return:**
- Role context (get that from get_workflow_guidance once per role)
- Project context (not needed for individual steps)
- Historical data (focus on current action)
- Envelope wrappers (minimal response)

**Parameters:**
- taskId OR executionId: Either task ID (number) or execution ID (string) is required
- roleId: Role ID for context (string)
- stepId: Optional specific step ID (string, if not provided uses current step from execution)

**Pattern:** get_workflow_guidance (once) → get_step_guidance (per step) → execute locally → report_step_completion`,
    parameters: GetStepGuidanceInputSchema as ZodSchema<GetStepGuidanceInput>,
  })
  async getStepGuidance(input: GetStepGuidanceInput) {
    try {
      this.logger.log(
        `Getting focused step guidance for ${input.taskId ? `task: ${input.taskId}` : `execution: ${input.executionId}`}, role: ${input.roleId}`,
      );

      // Get current execution to find current step if not provided
      let currentStepId = input.stepId;
      let currentRoleId = input.roleId;

      if (!currentStepId) {
        // ✅ FIXED: Call execution service with either taskId or executionId
        const executionQuery =
          input.taskId !== undefined
            ? { taskId: input.taskId }
            : { executionId: input.executionId };

        const executionResult =
          await this.workflowExecutionOperationsService.getExecution(
            executionQuery,
          );

        if (!executionResult.execution) {
          return this.buildMinimalResponse({
            error: 'No active execution found',
          });
        }

        const currentExecution = executionResult.execution;
        const executionStepId = currentExecution.currentStepId;
        currentRoleId = currentExecution.currentRoleId;

        if (!executionStepId) {
          return this.buildMinimalResponse({
            error: 'No current step found',
          });
        }

        if (!currentRoleId) {
          return this.buildMinimalResponse({
            error: 'No current role found',
          });
        }

        currentStepId = executionStepId;
      }

      // Get step guidance from business service
      // Use actual taskId from execution if not provided in input
      const actualTaskId = input.taskId || 0; // Use 0 as fallback for bootstrap executions
      const stepGuidanceResult =
        await this.stepExecutionService.getStepGuidance(
          actualTaskId,
          currentRoleId,
          currentStepId!,
        );

      const stepGuidance = stepGuidanceResult as StepGuidanceData;

      // 🎯 NEW: Extract MCP operation parameter requirements
      const mcpParameterRequirements =
        this.extractMcpParameterRequirements(stepGuidance);

      // Return ONLY focused step guidance - NO role context
      const response: any = {
        stepInfo: {
          stepId: currentStepId,
          name: stepGuidance.step?.name || 'Current Step',
          description:
            stepGuidance.step?.description || 'Execute current workflow step',
        },
        localExecution: {
          commands: this.extractLocalCommands(stepGuidance),
          description: 'Commands for you to execute locally using your tools',
        },
        validation: {
          successCriteria: this.extractSuccessCriteria(stepGuidance),
          qualityChecklist: this.extractQualityChecklist(stepGuidance),
        },
      };

      // 🎯 CONDITIONALLY ADD: MCP operation parameters if step has MCP_CALL actions
      if (mcpParameterRequirements.length > 0) {
        response.mcpOperations = mcpParameterRequirements;
      }

      return this.buildMinimalResponse(response);
    } catch (error) {
      return this.buildErrorResponse(
        'Failed to get step guidance',
        getErrorMessage(error),
        'STEP_GUIDANCE_ERROR',
      );
    }
  }

  // ===================================================================
  // ✅ RESULT REPORTING TOOL - AI reports what it accomplished
  // ===================================================================

  @Tool({
    name: 'report_step_completion',
    description: `Report step completion results and get next step guidance.

🎯 RESULT REPORTING - Report what you accomplished locally

**Use this AFTER executing step guidance locally:**
- Report success/failure of local execution
- Provide execution results and data
- Get minimal info about next step (no role context)

**Returns:**
- Completion confirmation
- Next step availability status
- Minimal next action guidance (use get_step_guidance for details)

**Example:**
After running 'git status' locally, report:
{
  "result": "success", 
  "executionData": {"gitStatus": "clean", "output": ""}
}`,
    parameters:
      ReportStepCompletionInputSchema as ZodSchema<ReportStepCompletionInput>,
  })
  async reportStepCompletion(input: ReportStepCompletionInput) {
    try {
      this.logger.log(
        `Reporting step completion: ${input.stepId}, result: ${input.result}`,
      );

      const completionResult =
        await this.stepExecutionService.processStepCompletion(
          input.taskId,
          input.stepId,
          input.result,
          input.executionData,
        );

      // Return minimal completion response - NO role context, NO detailed guidance
      return this.buildMinimalResponse({
        completion: {
          stepId: input.stepId,
          result: input.result,
          status: 'reported',
        },
        nextGuidance: {
          hasNextStep: Boolean(completionResult),
          // ❌ REMOVED: suggestion (hardcoded flow control)
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
  // 📊 PROGRESS AND ANALYTICS TOOLS
  // ===================================================================

  @Tool({
    name: 'get_step_progress',
    description: `Get focused step progress summary for a task.

🎯 FOCUSED PROGRESS - Essential progress data only

**Returns ONLY:**
- Current step status
- Basic progress metrics
- Step completion status
- Simple next action guidance

**Does NOT return:**
- Complex progress analytics
- Redundant step details
- Over-detailed metrics
- Debug progress data

**Pattern:** Simple progress overview for monitoring`,
    parameters: GetStepProgressInputSchema as ZodSchema<GetStepProgressInput>,
  })
  async getStepProgress(input: GetStepProgressInput) {
    try {
      this.logger.log(`Getting step progress for task: ${input.id}`);

      // ✅ FIXED: Get current execution first to determine real progress
      const executionResult =
        await this.workflowExecutionOperationsService.getExecution({
          taskId: input.id,
        });

      if (!executionResult.execution) {
        return this.buildMinimalResponse({
          taskId: input.id,
          status: 'no_execution',
          error: 'No active execution found',
        });
      }

      const execution = executionResult.execution;
      const currentStep = execution.currentStep;

      // ✅ MINIMAL RESPONSE: Only essential progress data from real execution
      return this.buildMinimalResponse({
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
    description: `Get focused next step information for role progression.

🎯 FOCUSED NEXT STEP - Essential step progression only

**Returns ONLY:**
- Next step basic details
- Step availability status  
- Simple progression guidance
- Role transition hint if needed

**Does NOT return:**
- Complex step analytics
- Redundant step metadata
- Over-detailed step information
- Debug step data

**Pattern:** Simple next step discovery for workflow progression`,
    parameters: GetNextStepInputSchema as ZodSchema<GetNextStepInput>,
  })
  async getNextAvailableStep(input: GetNextStepInput) {
    try {
      this.logger.log(
        `Getting next step for role: ${input.roleId}, task: ${input.id}`,
      );

      // ✅ FIXED: Get current execution to understand the current state
      const executionResult =
        await this.workflowExecutionOperationsService.getExecution({
          taskId: input.id,
        });

      if (!executionResult.execution) {
        return this.buildMinimalResponse({
          taskId: input.id,
          roleId: input.roleId,
          status: 'no_execution',
          error: 'No active execution found',
        });
      }

      const execution = executionResult.execution;

      // Check if this is the correct role for the current execution
      if (execution.currentRoleId !== input.roleId) {
        return this.buildMinimalResponse({
          taskId: input.id,
          roleId: input.roleId,
          status: 'role_mismatch',
          currentRole: execution.currentRole?.name || 'unknown',
          message: `Execution is currently assigned to ${execution.currentRole?.name || 'unknown'}, not ${input.roleId}`,
        });
      }

      // Use step execution service with proper context
      const nextStep: WorkflowStep | null =
        await this.stepExecutionService.getNextAvailableStep(
          input.id,
          input.roleId,
        );

      // ✅ MINIMAL RESPONSE: Only essential next step data
      return this.buildMinimalResponse({
        taskId: input.id,
        roleId: input.roleId,
        nextStep: nextStep
          ? {
              stepId: nextStep.id,
              name: nextStep.name,
              description: nextStep.description,
              sequenceNumber: nextStep.sequenceNumber,
            }
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

  // ===================================================================
  // 🔧 PRIVATE HELPER METHODS - Consistent with other fixed tools
  // ===================================================================

  private buildErrorResponse(message: string, error: string, code: string) {
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(
            {
              type: 'error',
              success: false,
              error: {
                message,
                details: error,
                code,
              },
              timestamp: new Date().toISOString(),
            },
            null,
            2,
          ),
        },
      ],
    };
  }

  private buildMinimalResponse(data: unknown) {
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }

  private extractLocalCommands(stepGuidance: StepGuidanceData): string[] {
    if (!stepGuidance.mcpActions) {
      return ['No specific commands available'];
    }

    return stepGuidance.mcpActions.map(
      (action) => `Execute ${action.serviceName}.${action.operation}`,
    );
  }

  private extractSuccessCriteria(stepGuidance: StepGuidanceData): string[] {
    return stepGuidance.successCriteria || ['Step completed successfully'];
  }

  private extractQualityChecklist(stepGuidance: StepGuidanceData): string[] {
    return stepGuidance.qualityChecklist || ['Verify step completion'];
  }

  /**
   * 🎯 NEW: Extract MCP operation parameter requirements from step actions
   * This integrates the RequiredInputExtractorService to provide parameter guidance
   */
  private extractMcpParameterRequirements(
    stepGuidance: StepGuidanceData,
  ): Array<{
    serviceName: string;
    operation: string;
    requiredParameters: string[];
    optionalParameters: string[];
    schemaStructure: Record<string, any>;
    usage: string;
  }> {
    if (!stepGuidance.mcpActions || stepGuidance.mcpActions.length === 0) {
      return [];
    }

    const mcpRequirements = [];

    for (const action of stepGuidance.mcpActions) {
      try {
        // Extract parameter requirements using our RequiredInputExtractorService
        const extraction =
          this.requiredInputExtractorService.extractFromServiceSchema(
            action.serviceName,
            action.operation,
          );

        mcpRequirements.push({
          serviceName: action.serviceName,
          operation: action.operation,
          requiredParameters: extraction.requiredParameters,
          optionalParameters: extraction.optionalParameters,
          schemaStructure: extraction.schemaStructure || {},
          usage: `Execute ${action.serviceName}.${action.operation} with these parameters`,
        });
      } catch (error) {
        this.logger.warn(
          `Failed to extract parameters for ${action.serviceName}.${action.operation}: ${error}`,
        );

        // Provide fallback parameter guidance
        mcpRequirements.push({
          serviceName: action.serviceName,
          operation: action.operation,
          requiredParameters: ['operation', 'executionData'],
          optionalParameters: [],
          schemaStructure: {
            operation: {
              type: 'string',
              required: true,
              description: 'Operation name',
            },
            executionData: {
              type: 'any',
              required: true,
              description: 'Operation data',
            },
          },
          usage: `Execute ${action.serviceName}.${action.operation} (schema extraction failed, using fallback)`,
        });
      }
    }

    return mcpRequirements;
  }
}
