import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { ZodSchema, z } from 'zod';
import { StepExecutionService } from '../services/step-execution.service';
import { EnvelopeBuilderService } from '../../../utils/envelope-builder';
import { shouldIncludeDebugInfo } from '../../../config/mcp-response.config';
import { CoreServiceOrchestrator } from '../services/core-service-orchestrator.service';
import { RequiredInputExtractorService } from '../../../utils/envelope-builder/required-input-extractor.service';

// ✅ FIXED: Guidance-only schemas (removed execution schema)
const GetStepGuidanceInputSchema = z.object({
  taskId: z.number().describe('Task ID for context'),
  roleId: z.string().describe('Role ID for step guidance'),
  stepId: z.string().optional().describe('Optional specific step ID'),
});

const ReportStepCompletionInputSchema = z.object({
  taskId: z.number().describe('Task ID'),
  stepId: z.string().describe('Completed step ID'),
  result: z.enum(['success', 'failure']).describe('Execution result'),
  executionData: z.any().optional().describe('Results from local execution'),
  executionTime: z.number().optional().describe('Execution time in ms'),
});

const GetStepValidationInputSchema = z.object({
  stepId: z.string().describe('Step ID for validation criteria'),
  taskId: z.number().describe('Task ID for context'),
});

const GetStepProgressInputSchema = z.object({
  id: z.number().describe('Task ID for progress query'),
  roleId: z.string().optional().describe('Optional role ID filter'),
});

const GetNextStepInputSchema = z.object({
  roleId: z.string().describe('Role ID for next step query'),
  id: z.number().describe('Task ID for context'),
});

// 🚀 NEW: Schema for MCP operation execution
const ExecuteMcpOperationInputSchema = z.object({
  serviceName: z
    .string()
    .describe('Service name (TaskOperations, ResearchOperations, etc.)'),
  operation: z.string().describe('Operation name (create, update, get, etc.)'),
  parameters: z
    .any()
    .describe(
      'Operation parameters as extracted by RequiredInputExtractorService',
    ),
});

type GetStepGuidanceInput = z.infer<typeof GetStepGuidanceInputSchema>;
type ReportStepCompletionInput = z.infer<
  typeof ReportStepCompletionInputSchema
>;
type GetStepValidationInput = z.infer<typeof GetStepValidationInputSchema>;
type GetStepProgressInput = z.infer<typeof GetStepProgressInputSchema>;
type GetNextStepInput = z.infer<typeof GetNextStepInputSchema>;
type ExecuteMcpOperationInput = z.infer<typeof ExecuteMcpOperationInputSchema>;

/**
 * 🎯 FIXED STEP EXECUTION MCP SERVICE - ROLE SEPARATION
 *
 * BEFORE: Mixed guidance + execution (causing circular dependency)
 * AFTER: Pure guidance + result reporting (clear separation)
 *
 * MCP SERVER ROLE: Tour Guide (provides guidance only)
 * AI AGENT ROLE: Executor (performs actual work locally)
 */
@Injectable()
export class StepExecutionMcpService {
  private readonly logger = new Logger(StepExecutionMcpService.name);

  constructor(
    private readonly stepExecutionService: StepExecutionService,
    private readonly envelopeBuilder: EnvelopeBuilderService,
    private readonly coreServiceOrchestrator: CoreServiceOrchestrator,
    private readonly requiredInputExtractor: RequiredInputExtractorService,
  ) {}

  // ===================================================================
  // ✅ GUIDANCE TOOL - What AI should do locally
  // ===================================================================

  @Tool({
    name: 'get_step_guidance',
    description: `Get guidance for what the AI agent should execute locally.

🎯 TOUR GUIDE ROLE - Provides step-by-step guidance for local execution

**AI Agent should:**
1. Call this to get guidance
2. Execute the guidance locally using available tools
3. Report results back using report_step_completion

**Returns:**
- Step name and description
- Local commands to execute
- Success criteria to validate
- What data to report back

**AI Agent should NOT call MCP tools to execute - do it locally!**`,
    parameters: GetStepGuidanceInputSchema as ZodSchema<GetStepGuidanceInput>,
  })
  async getStepGuidance(input: GetStepGuidanceInput): Promise<any> {
    try {
      this.logger.log(
        `Getting step guidance for task: ${input.taskId}, role: ${input.roleId}`,
      );

      // Get the current or next step to execute
      const stepGuidance = await this.stepExecutionService.getStepGuidance(
        input.taskId,
        input.roleId,
        input.stepId,
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(stepGuidance, null, 2),
          },
        ],
      };
    } catch (error: any) {
      this.logger.error(`Error getting step guidance: ${error.message}`, error);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                type: 'error',
                message: `Failed to get step guidance: ${error.message}`,
                suggestedAction: 'Check task ID and role ID, then retry',
                timestamp: new Date().toISOString(),
              },
              null,
              2,
            ),
          },
        ],
      };
    }
  }

  // ===================================================================
  // ✅ RESULT REPORTING TOOL - AI reports what it accomplished
  // ===================================================================

  @Tool({
    name: 'report_step_completion',
    description: `Report step completion results and get next guidance.

🎯 RESULT REPORTING - AI reports what it accomplished locally

**Use this AFTER executing step guidance locally:**
- Report success/failure of local execution
- Provide execution results and data
- Get guidance for next step

**Example:**
After running 'git status' locally, report:
{
  "result": "success", 
  "executionData": {"gitStatus": "clean", "output": ""}
}`,
    parameters:
      ReportStepCompletionInputSchema as ZodSchema<ReportStepCompletionInput>,
  })
  async reportStepCompletion(input: ReportStepCompletionInput): Promise<any> {
    try {
      this.logger.log(
        `Reporting step completion: ${input.stepId}, result: ${input.result}`,
      );

      // Process the completion and get next guidance
      const completionResult =
        await this.stepExecutionService.processStepCompletion(
          input.taskId,
          input.stepId,
          input.result,
          input.executionData,
          input.executionTime,
        );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(completionResult, null, 2),
          },
        ],
      };
    } catch (error: any) {
      this.logger.error(
        `Error reporting step completion: ${error.message}`,
        error,
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                type: 'error',
                message: `Failed to report step completion: ${error.message}`,
                suggestedAction:
                  'Retry with correct step ID and execution data',
                timestamp: new Date().toISOString(),
              },
              null,
              2,
            ),
          },
        ],
      };
    }
  }

  // ===================================================================
  // ✅ VALIDATION CRITERIA TOOL - Success criteria for AI to check
  // ===================================================================

  @Tool({
    name: 'get_step_validation_criteria',
    description: `Get validation criteria for AI to check locally.

🎯 VALIDATION GUIDANCE - What success/failure looks like

**Returns specific criteria for AI to validate locally:**
- Success conditions to check
- Failure conditions to watch for  
- Validation commands to run
- Expected outputs and values`,
    parameters:
      GetStepValidationInputSchema as ZodSchema<GetStepValidationInput>,
  })
  async getStepValidationCriteria(input: GetStepValidationInput): Promise<any> {
    try {
      this.logger.log(`Getting validation criteria for step: ${input.stepId}`);

      const criteria =
        await this.stepExecutionService.getStepValidationCriteria(
          input.stepId,
          input.taskId,
        );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(criteria, null, 2),
          },
        ],
      };
    } catch (error: any) {
      this.logger.error(
        `Error getting validation criteria: ${error.message}`,
        error,
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                type: 'error',
                message: `Failed to get validation criteria: ${error.message}`,
                suggestedAction: 'Check step ID and task ID, then retry',
                timestamp: new Date().toISOString(),
              },
              null,
              2,
            ),
          },
        ],
      };
    }
  }

  // ===================================================================
  // 🚀 NEW: MCP OPERATION EXECUTION TOOL - The Missing Link for Phase 4.1
  // ===================================================================

  @Tool({
    name: 'execute_mcp_operation',
    description: `Execute MCP service operations (TaskOperations, ResearchOperations, etc.)

🎯 PHASE 4.1 IMPLEMENTATION - The Missing Link

**This is the critical tool that enables proper MCP workflow:**

1. **AI gets guidance** with MCP_CALL instructions 
2. **AI collects required data** using intelligence + local tools
3. **AI calls this tool** with complete parameters
4. **MCP server executes** database operation through core services
5. **MCP server returns** results to AI

**IMPORTANT NOTES:**
- Parameters are dynamically extracted by RequiredInputExtractorService
- Ignore hardcoded 'parameters' in workflow JSON files
- Service calls route through CoreServiceOrchestrator to actual database services

**Supported Services:**
- TaskOperations: create, update, get, list
- ResearchOperations: create_research, update_research, add_comment
- WorkflowOperations: delegate, complete, escalate
- PlanningOperations: create_plan, create_subtasks
- ReviewOperations: create_review, create_completion

**Example:**
AI collects task data, then calls:
{
  "serviceName": "TaskOperations",
  "operation": "create", 
  "parameters": { /* schema-extracted data */ }
}`,
    parameters:
      ExecuteMcpOperationInputSchema as ZodSchema<ExecuteMcpOperationInput>,
  })
  async executeMcpOperation(input: ExecuteMcpOperationInput): Promise<any> {
    try {
      this.logger.log(
        `Executing MCP operation: ${input.serviceName}.${input.operation}`,
      );

      // 🎯 PHASE 4.1 CORE: Route to CoreServiceOrchestrator
      const operationResult =
        await this.coreServiceOrchestrator.executeServiceCall(
          input.serviceName,
          input.operation,
          input.parameters,
        );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(operationResult, null, 2),
          },
        ],
      };
    } catch (error: any) {
      this.logger.error(
        `Error executing MCP operation ${input.serviceName}.${input.operation}: ${error.message}`,
        error,
      );

      const errorResponse = {
        type: 'mcp-operation-error',
        timestamp: new Date().toISOString(),

        operation: {
          serviceName: input.serviceName,
          operation: input.operation,
          success: false,
        },

        error: {
          message: error.message,
          code: 'MCP_OPERATION_ERROR',
          details: `Failed to execute ${input.serviceName}.${input.operation}`,
        },

        metadata: {
          serviceName: input.serviceName,
          operation: input.operation,
          generatedBy: 'StepExecutionMcpService',
          operationType: 'mcp-service-call-error',
        },
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(errorResponse, null, 2),
          },
        ],
      };
    }
  }

  @Tool({
    name: 'get_step_progress',
    description: `Get workflow step progress for a task with detailed analytics.

**🎯 COMPREHENSIVE STEP PROGRESS TRACKING**

✅ **Progress History** - Complete step execution history
✅ **Performance Metrics** - Timing and success rate analytics
✅ **Role-Specific Filtering** - Filter progress by role
✅ **Status Tracking** - Current status of all steps
✅ **Analytics Integration** - Progress data for reporting

**FEATURES:**
• Complete step execution history
• Performance and timing metrics
• Role-based progress filtering
• Status and completion tracking`,
    parameters: GetStepProgressInputSchema as ZodSchema<GetStepProgressInput>,
  })
  async getStepProgress(input: GetStepProgressInput): Promise<any> {
    try {
      this.logger.log(`Getting step progress for task: ${input.id}`);

      const progress = await this.stepExecutionService.getStepProgress(
        String(input.id),
        input.roleId,
      );

      // ✅ RESTORED: Build comprehensive progress envelope
      const progressResult = {
        progressSummary: {
          totalSteps: progress.traditionalProgress.length,
          completed: progress.traditionalProgress.filter(
            (p: any) => p.status === 'COMPLETED',
          ).length,
          inProgress: progress.traditionalProgress.filter(
            (p: any) => p.status === 'IN_PROGRESS',
          ).length,
          failed: progress.traditionalProgress.filter(
            (p: any) => p.status === 'FAILED',
          ).length,
        },
        recentSteps: progress.traditionalProgress.slice(0, 5).map((p: any) => ({
          name: p.step.name,
          stepType: p.step.stepType,
          status: p.status,
          role: p.role.displayName,
        })),
        // ✅ RESTORED: Include comprehensive progress data
        traditionalProgress: progress.traditionalProgress,
        enhancedProgress: progress.enhancedProgressData,
      };

      const envelopeContext = {
        taskId: input.id,
        roleId: input.roleId || 'system',
      };

      const envelope = this.envelopeBuilder.buildExecutionEnvelope(
        progressResult,
        envelopeContext,
      );

      const response: {
        content: Array<{ type: 'text'; text: string }>;
      } = {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(envelope, null, 2),
          },
        ],
      };

      // ✅ RESTORED: Add comprehensive debug data if requested
      if (shouldIncludeDebugInfo()) {
        response.content.push({
          type: 'text' as const,
          text: JSON.stringify(
            {
              debug: {
                rawProgress: progress,
                analysisSource: 'StepExecutionService with enhanced progress',
                progressMetrics: progressResult.progressSummary,
              },
            },
            null,
            2,
          ),
        });
      }

      return response;
    } catch (error: any) {
      this.logger.error(`Error getting step progress: ${error.message}`, error);

      const errorEnvelope = {
        taskId: input.id,
        roleId: input.roleId || 'system',
        success: false,
        error: {
          message: error.message,
          code: 'STEP_PROGRESS_ERROR',
        },
        aiAgentGuidance: {
          errorMessage: `Failed to get step progress for task ${input.id}: ${error.message}`,
          suggestedAction:
            'Check task ID and try again, or get workflow guidance',
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      };

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(errorEnvelope, null, 2),
          },
        ],
      };
    }
  }

  @Tool({
    name: 'get_next_available_step',
    description: `Get the next available step for a role with intelligent recommendations.

**🎯 COMPREHENSIVE NEXT STEP INTELLIGENCE**

✅ **Smart Recommendations** - AI-powered next step suggestions
✅ **Dependency Validation** - Automatic dependency checking
✅ **Role-Specific Steps** - Steps tailored to current role
✅ **Progress Awareness** - Considers completed steps
✅ **Workflow Optimization** - Optimized step sequencing

**FEATURES:**
• Intelligent next step recommendations
• Automatic dependency validation
• Role-specific step filtering
• Progress-aware suggestions`,
    parameters: GetNextStepInputSchema as ZodSchema<GetNextStepInput>,
  })
  async getNextAvailableStep(input: GetNextStepInput): Promise<any> {
    try {
      this.logger.log(
        `Getting next available step for role: ${input.roleId}, task: ${input.id}`,
      );

      const nextStep = await this.stepExecutionService.getNextAvailableStep(
        input.roleId,
        String(input.id),
      );

      // ✅ RESTORED: Build comprehensive next step envelope
      const nextStepResult = {
        nextStep: nextStep
          ? {
              stepId: nextStep.id,
              name: nextStep.name,
              stepType: nextStep.stepType,
              description: nextStep.description,
              estimatedTime: nextStep.estimatedTime,
              sequenceNumber: nextStep.sequenceNumber,
              // ✅ RESTORED: Include comprehensive step data
              behavioralContext: nextStep.behavioralContext,
              approachGuidance: nextStep.approachGuidance,
              qualityChecklist: nextStep.qualityChecklist,
            }
          : null,
        status: nextStep ? 'step_available' : 'no_steps_available',
      };

      const envelopeContext = {
        taskId: input.id,
        roleId: input.roleId,
      };

      const envelope = this.envelopeBuilder.buildExecutionEnvelope(
        nextStepResult,
        envelopeContext,
      );

      const response: {
        content: Array<{ type: 'text'; text: string }>;
      } = {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(envelope, null, 2),
          },
        ],
      };

      // ✅ RESTORED: Add comprehensive debug data if requested
      if (shouldIncludeDebugInfo()) {
        response.content.push({
          type: 'text' as const,
          text: JSON.stringify(
            {
              debug: {
                rawNextStep: nextStep,
                extractionSource: 'StepExecutionService',
                stepAnalysis: nextStepResult,
              },
            },
            null,
            2,
          ),
        });
      }

      return response;
    } catch (error: any) {
      this.logger.error(
        `Error getting next available step: ${error.message}`,
        error,
      );

      const errorEnvelope = {
        taskId: input.id,
        roleId: input.roleId,
        success: false,
        error: {
          message: error.message,
          code: 'NEXT_STEP_QUERY_ERROR',
        },
        aiAgentGuidance: {
          errorMessage: `Failed to get next step for role ${input.roleId}: ${error.message}`,
          suggestedAction:
            'Check role ID and task ID, then retry or get workflow guidance',
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      };

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(errorEnvelope, null, 2),
          },
        ],
      };
    }
  }
}
