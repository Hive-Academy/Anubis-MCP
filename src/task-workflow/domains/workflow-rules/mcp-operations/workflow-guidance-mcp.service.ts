import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { ZodSchema, z } from 'zod';
import { WorkflowGuidanceService } from '../services/workflow-guidance.service';

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
  projectPath: z
    .string()
    .optional()
    .describe('Project path for project-specific context'),
});

type GetWorkflowGuidanceInput = z.infer<typeof GetWorkflowGuidanceInputSchema>;

/**
 * 🎯 STREAMLINED WORKFLOW GUIDANCE MCP SERVICE
 *
 * OPTIMIZED: Returns only essential role identity - NO redundant behavioral context
 * PURPOSE: Get minimal role persona once, then use get_step_guidance for actionable steps
 */
@Injectable()
export class WorkflowGuidanceMcpService {
  private readonly logger = new Logger(WorkflowGuidanceMcpService.name);

  constructor(
    private readonly workflowGuidanceService: WorkflowGuidanceService,
  ) {}

  @Tool({
    name: 'get_workflow_guidance',
    description: `Provides minimal role identity and basic capabilities for workflow execution.`,
    parameters:
      GetWorkflowGuidanceInputSchema as ZodSchema<GetWorkflowGuidanceInput>,
  })
  async getWorkflowGuidance(input: GetWorkflowGuidanceInput): Promise<any> {
    try {
      this.logger.log(
        `Getting role identity for: ${input.roleName}, task: ${input.taskId}`,
      );

      const context = {
        taskId: parseInt(input.taskId),
        projectPath: input.projectPath,
      };

      // Get ONLY essential role identity - NO verbose behavioral context
      const roleGuidance =
        await this.workflowGuidanceService.getWorkflowGuidance(
          input.roleName,
          context,
        );

      // Return minimal essential-only response
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                roleId: input.roleName,
                taskId: parseInt(input.taskId),
                success: true,
                currentRole: roleGuidance.currentRole,
                projectContext: roleGuidance.projectContext,
              },
              null,
              2,
            ),
          },
        ],
      };
    } catch (error: any) {
      this.logger.error(
        `Error getting workflow guidance: ${error.message}`,
        error,
      );

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                taskId: parseInt(input.taskId),
                roleName: input.roleName,
                success: false,
                error: {
                  message: error.message,
                  code: 'WORKFLOW_GUIDANCE_ERROR',
                },
              },
              null,
              2,
            ),
          },
        ],
      };
    }
  }
}
