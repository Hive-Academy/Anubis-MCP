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

@Injectable()
export class WorkflowGuidanceMcpService {
  private readonly logger = new Logger(WorkflowGuidanceMcpService.name);

  constructor(
    private readonly workflowGuidanceService: WorkflowGuidanceService,
  ) {}

  @Tool({
    name: 'get_workflow_guidance',
    description: `Get intelligent workflow guidance with embedded rule-aware responses.

**CORE INNOVATION: EMBEDDED WORKFLOW INTELLIGENCE**

✅ **Rule-Aware Responses** - Every response includes intelligent workflow guidance
✅ **Role-Specific Behavioral Context** - Tailored guidance for each role
✅ **Project-Aware Adaptation** - Context adapts to specific project patterns
✅ **Step-by-Step Instructions** - Clear, actionable guidance for current workflow step
✅ **Quality Enforcement** - Embedded quality checklists and pattern enforcement
✅ **Progress Tracking** - Automatic progress tracking and analytics

**KEY FEATURES:**
• Eliminates external rule file dependencies
• Provides context-aware behavioral guidance
• Includes quality reminders and pattern enforcement
• Offers next action recommendations
• Integrates project-specific context

**USAGE:**
This tool provides the core workflow intelligence that gets embedded in all MCP responses,
eliminating the need for separate rule files and ensuring consistent workflow execution.`,
    parameters:
      GetWorkflowGuidanceInputSchema as ZodSchema<GetWorkflowGuidanceInput>,
  })
  async getWorkflowGuidance(input: GetWorkflowGuidanceInput): Promise<any> {
    try {
      this.logger.log(
        `Getting workflow guidance for role: ${input.roleName}, task: ${input.taskId}`,
      );

      const context = {
        taskId: parseInt(input.taskId),
        roleId: input.roleName, // Using roleName as roleId for now
        stepId: input.stepId,
        projectPath: input.projectPath,
        executionData: input.executionData,
      };

      const guidance = await this.workflowGuidanceService.getWorkflowGuidance(
        input.roleName,
        context,
      );

      return {
        content: [
          {
            type: 'text',
            text: `🎯 **Intelligent Workflow Guidance for ${guidance.currentRole.displayName}**

**Current Role Context:**
• Role: ${guidance.currentRole.displayName}
• Description: ${guidance.currentRole.description}
• Capabilities: ${JSON.stringify(guidance.currentRole.capabilities, null, 2)}

**Current Step:**
${
  guidance.currentStep
    ? `
• Step: ${guidance.currentStep.displayName}
• Type: ${guidance.currentStep.stepType}
• Description: ${guidance.currentStep.description}
• Estimated Time: ${guidance.currentStep.estimatedTime || 'Not specified'}
`
    : '• No specific step - general role guidance'
}

**Next Actions:**
${
  guidance.nextActions.length > 0
    ? guidance.nextActions
        .map((action) => `• ${action.name} (${action.actionType})`)
        .join('\n')
    : '• No specific actions defined'
}

**Project Context:**
• Project Type: ${guidance.projectContext.projectType || 'Not detected'}
• Detected Patterns: ${guidance.projectContext.detectedPatterns?.length || 0} patterns found

**Quality Reminders:**
${
  guidance.qualityReminders.length > 0
    ? guidance.qualityReminders.map((reminder) => `• ${reminder}`).join('\n')
    : '• No specific reminders'
}

**Rule Enforcement:**
• Required Patterns: ${guidance.ruleEnforcement.requiredPatterns.join(', ') || 'None specified'}
• Anti-Patterns: ${guidance.ruleEnforcement.antiPatterns.join(', ') || 'None specified'}

**Reporting Status:**
• Should Trigger Report: ${guidance.reportingStatus.shouldTriggerReport ? 'Yes' : 'No'}
${guidance.reportingStatus.reportType ? `• Report Type: ${guidance.reportingStatus.reportType}` : ''}

🚀 **This guidance is now embedded in your workflow context!**`,
          },
          {
            type: 'text',
            text: JSON.stringify(
              {
                workflowGuidance: guidance,
                embeddedIntelligence: {
                  ruleAware: true,
                  projectAdapted: true,
                  roleSpecific: true,
                  qualityEnforced: true,
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
            type: 'text',
            text: `❌ **Workflow Guidance Error**

Error: ${error.message}

Role: ${input.roleName}
Task: ${input.taskId}

This indicates an issue with the rule engine or database connectivity.`,
          },
          {
            type: 'text',
            text: JSON.stringify(
              {
                error: error.message,
                roleName: input.roleName,
                taskId: input.taskId,
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
