import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { ZodSchema, z } from 'zod';
import { WorkflowGuidanceService } from '../services/workflow-guidance.service';
import { shouldIncludeDebugInfo } from '../../../config/mcp-response.config';
import { EnvelopeBuilderService } from '../../../utils/envelope-builder';

const GetWorkflowGuidanceInputSchema = z.object({
  roleName: z
    .enum([
      'boomerang',
      'researcher',
      'architect',
      'senior-developer',
      'code-review',
    ])
    .describe('Current role name for workflow guidance'),
  taskId: z.string().describe('Task ID for context-specific guidance'),
  stepId: z
    .string()
    .optional()
    .describe('Specific step ID if targeting a particular step'),
  projectPath: z
    .string()
    .optional()
    .describe('Project path for project-specific context'),
  executionData: z
    .any()
    .optional()
    .describe('Additional execution context data'),
});

type GetWorkflowGuidanceInput = z.infer<typeof GetWorkflowGuidanceInputSchema>;

/**
 * 🎯 COMPREHENSIVE WORKFLOW GUIDANCE MCP SERVICE
 *
 * RESTORED: Full intelligent workflow guidance with embedded rule-aware responses
 * FIXED: Only eliminated parameter duplication, keeping all comprehensive guidance data
 */
@Injectable()
export class WorkflowGuidanceMcpService {
  private readonly logger = new Logger(WorkflowGuidanceMcpService.name);

  constructor(
    private readonly workflowGuidanceService: WorkflowGuidanceService,
    private readonly envelopeBuilder: EnvelopeBuilderService,
  ) {}

  @Tool({
    name: 'get_workflow_guidance',
    description: `Get workflow guidance with clear role separation instructions.

**🎯 TOUR GUIDE ROLE - MCP provides guidance, AI executes locally**

✅ **Role-Aware Guidance** - Clear instructions on AI vs MCP responsibilities
✅ **Step-by-Step Instructions** - What AI should execute locally
✅ **Execution Protocol** - Proper workflow pattern for AI agents
✅ **Tool Recommendations** - Which MCP tools to use vs avoid
✅ **Quality Standards** - Success criteria and validation guidance
✅ **Progress Context** - Current workflow state and next actions

**ROLE SEPARATION:**
• **MCP Server (This)**: Provides guidance only, does NOT execute
• **AI Agent**: Executes locally using available tools, reports back
• **Correct Pattern**: get_step_guidance → local execution → report_step_completion
• **Avoid**: execute_workflow_step (removed - causes circular dependency)

**AI AGENT SHOULD:**
1. Call this tool to understand current workflow state
2. Use get_step_guidance to get specific execution instructions
3. Execute guidance locally using file system, git, and shell tools
4. Use report_step_completion to report results and get next guidance

**USAGE:**
This tool provides overall workflow context and directs AI to proper execution tools.
It does NOT execute steps - that's the AI agent's responsibility.`,
    parameters:
      GetWorkflowGuidanceInputSchema as ZodSchema<GetWorkflowGuidanceInput>,
  })
  async getWorkflowGuidance(input: GetWorkflowGuidanceInput): Promise<any> {
    const startTime = performance.now();

    try {
      this.logger.log(
        `Getting comprehensive workflow guidance for role: ${input.roleName}, task: ${input.taskId}`,
      );

      const context = {
        taskId: parseInt(input.taskId),
        roleId: input.roleName, // Using roleName as roleId for now
        stepId: input.stepId,
        projectPath: input.projectPath,
        executionData: input.executionData,
        startTime,
      };

      // ✅ RESTORED: Get comprehensive workflow guidance from business service
      const guidance = await this.workflowGuidanceService.getWorkflowGuidance(
        input.roleName,
        context,
      );

      // ✅ RESTORED: Use comprehensive envelope building with all helper services
      // Note: guidance.currentStep structure doesn't match WorkflowStep interface,
      // so we pass null and let the envelope builder handle it gracefully
      const envelope = await this.envelopeBuilder.buildGuidanceEnvelope(
        null, // Pass null since guidance.currentStep structure doesn't match WorkflowStep
        context,
        guidance,
      );

      const response = {
        content: [
          {
            type: 'text',
            text: JSON.stringify(guidance, null, 2),
          },
        ],
      };

      // Add debug data if requested (FIXED: Eliminated duplication)
      if (shouldIncludeDebugInfo()) {
        response.content.push({
          type: 'text',
          text: JSON.stringify(
            {
              debug: {
                // ONLY include data NOT in main response
                processingTime: performance.now() - startTime,
                extractionSource:
                  'Schema-based RequiredInputExtractorService (deduplication)',
                envelopeType: envelope.type,
                // REMOVED: rawGuidance, extractedInputs (already in main response)
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
        `Error getting workflow guidance: ${error.message}`,
        error,
      );

      const errorEnvelope = {
        taskId: parseInt(input.taskId),
        roleName: input.roleName,
        success: false,
        error: {
          message: error.message,
          code: 'WORKFLOW_GUIDANCE_ERROR',
        },
        aiAgentGuidance: {
          errorMessage: `Failed to get workflow guidance: ${error.message}`,
          suggestedAction: 'Check task ID and role name, then retry',
          executionReminder: {
            roleseparation:
              'Remember: AI executes locally, MCP provides guidance only',
            correctTools: ['get_step_guidance', 'report_step_completion'],
            avoidTools: ['execute_workflow_step (removed)'],
          },
          troubleshooting: {
            commonIssues: [
              'Invalid task ID format',
              'Role name not recognized',
              'Database connection issues',
              'Workflow rules not properly configured',
            ],
            nextSteps: [
              'Verify task ID format (numeric or TSK-xxx)',
              'Check role name is valid',
              'Ensure MCP server is connected',
              'Use get_step_guidance for next actions',
            ],
          },
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
