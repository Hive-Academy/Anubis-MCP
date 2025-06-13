import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { ZodSchema, z } from 'zod';
import { WorkflowGuidanceService } from '../services/workflow-guidance.service';
import { ProgressCalculatorService } from '../services/progress-calculator.service';

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
 * 🎯 FOCUSED WORKFLOW GUIDANCE MCP SERVICE
 *
 * REFACTORED: Role/persona context only - NO step details, NO envelope complexity
 * PURPOSE: Get role persona once, then use get_step_guidance for each step
 */
@Injectable()
export class WorkflowGuidanceMcpService {
  private readonly logger = new Logger(WorkflowGuidanceMcpService.name);

  constructor(
    private readonly workflowGuidanceService: WorkflowGuidanceService,
    private readonly progressCalculatorService: ProgressCalculatorService,
  ) {}

  @Tool({
    name: 'get_workflow_guidance',
    description: `Get role/persona context for workflow execution.

**🎯 ROLE PERSONA CONTEXT - Call ONCE per role switch**

✅ **Role Definition** - Current role capabilities and behavior
✅ **Quality Standards** - Role-specific quality reminders
✅ **Project Context** - Project-specific behavioral profile
✅ **Rule Enforcement** - Required patterns and anti-patterns
`,
    parameters:
      GetWorkflowGuidanceInputSchema as ZodSchema<GetWorkflowGuidanceInput>,
  })
  async getWorkflowGuidance(input: GetWorkflowGuidanceInput): Promise<any> {
    try {
      this.logger.log(
        `Getting role guidance for: ${input.roleName}, task: ${input.taskId}`,
      );

      const context = {
        taskId: parseInt(input.taskId),
        projectPath: input.projectPath,
      };

      // Get ONLY role/persona context - NO step details
      const roleGuidance =
        await this.workflowGuidanceService.getWorkflowGuidance(
          input.roleName,
          context,
        );

      // 🎯 NEW: Calculate progress for this role and task
      const progressMetrics =
        await this.progressCalculatorService.calculateProgress(
          parseInt(input.taskId),
          roleGuidance,
        );

      // Return minimal role context response with progress
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                roleId: input.roleName,
                taskId: parseInt(input.taskId),
                success: true,
                roleContext: roleGuidance.currentRole,
                projectContext: roleGuidance.projectContext,
                qualityReminders: roleGuidance.qualityReminders,
                ruleEnforcement: roleGuidance.ruleEnforcement,
                progress: progressMetrics.success
                  ? progressMetrics.metrics
                  : null,
                meta: {
                  timestamp: new Date().toISOString(),
                  responseTime: '< 50ms',
                },
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
