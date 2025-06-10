import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { ZodSchema, z } from 'zod';
import { WorkflowBootstrapService } from '../services/workflow-bootstrap.service';

const BootstrapWorkflowInputSchema = z.object({
  // Task creation data
  taskName: z.string().min(1).max(200).describe('Name of the task to create'),
  taskDescription: z
    .string()
    .optional()
    .describe('Detailed description of the task'),
  businessRequirements: z
    .string()
    .optional()
    .describe('Business requirements for the task'),
  technicalRequirements: z
    .string()
    .optional()
    .describe('Technical requirements for the task'),
  acceptanceCriteria: z
    .array(z.string())
    .optional()
    .describe('List of acceptance criteria'),
  priority: z
    .enum(['Low', 'Medium', 'High', 'Critical'])
    .optional()
    .describe('Task priority level'),

  // Codebase analysis data (optional)
  codebaseAnalysis: z
    .object({
      architectureFindings: z.any().optional(),
      problemsIdentified: z.any().optional(),
      implementationContext: z.any().optional(),
      integrationPoints: z.any().optional(),
      qualityAssessment: z.any().optional(),
      filesCovered: z.array(z.string()).optional(),
      technologyStack: z.any().optional(),
      analyzedBy: z.string().optional(),
    })
    .optional()
    .describe('Codebase analysis data'),

  // Workflow execution setup
  initialRole: z
    .enum([
      'boomerang',
      'researcher',
      'architect',
      'senior-developer',
      'code-review',
    ])
    .describe('Initial role to start the workflow with'),
  executionMode: z
    .enum(['GUIDED', 'AUTOMATED', 'HYBRID'])
    .optional()
    .describe('Workflow execution mode'),
  projectPath: z.string().optional().describe('Project path for context'),
  executionContext: z
    .record(z.any())
    .optional()
    .describe('Additional execution context'),
});

type BootstrapWorkflowInputType = z.infer<typeof BootstrapWorkflowInputSchema>;

@Injectable()
export class WorkflowBootstrapMcpService {
  private readonly logger = new Logger(WorkflowBootstrapMcpService.name);

  constructor(private readonly bootstrapService: WorkflowBootstrapService) {}

  @Tool({
    name: 'bootstrap_workflow',
    description: `Bootstrap a complete workflow from scratch with task creation and workflow execution.

**WORKFLOW BOOTSTRAP - COMPLETE INITIALIZATION**

✅ **Task Creation** - Creates new task with full context and metadata
✅ **Workflow Execution** - Initializes workflow execution for the task
✅ **Role Setup** - Sets up initial role context and capabilities
✅ **Initial Guidance** - Provides immediate workflow guidance and next steps
✅ **Context Integration** - Integrates project context and codebase analysis

**KEY FEATURES:**
• Creates task with description, requirements, and acceptance criteria
• Sets up workflow execution with proper role assignment
• Provides immediate workflow guidance for the initial role
• Integrates codebase analysis and project context
• Returns next steps and actionable recommendations

**USAGE:**
This tool solves the "cold start" problem by creating everything needed for a new workflow:
- Task with complete metadata
- Workflow execution with role context
- Initial guidance and next steps
- Project integration

**EXAMPLE:**
\`\`\`json
{
  "taskName": "Implement User Authentication",
  "taskDescription": "Add JWT-based authentication to the application",
  "businessRequirements": "Users need secure login functionality",
  "technicalRequirements": "Use JWT with secure storage and validation",
  "acceptanceCriteria": ["User registration", "User login", "Password reset"],
  "priority": "High",
  "initialRole": "boomerang",
  "executionMode": "GUIDED",
  "projectPath": "/path/to/project"
}
\`\`\``,
    parameters:
      BootstrapWorkflowInputSchema as ZodSchema<BootstrapWorkflowInputType>,
  })
  async bootstrapWorkflow(input: BootstrapWorkflowInputType): Promise<any> {
    try {
      this.logger.log(`Bootstrapping workflow: ${input.taskName}`);

      // Validate input
      const validation = this.bootstrapService.validateBootstrapInput(input);
      if (!validation.valid) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ **Workflow Bootstrap Validation Failed**

**Validation Errors:**
${validation.errors.map((error) => `• ${error}`).join('\n')}

**Please fix these errors and try again.**`,
            },
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: false,
                  errors: validation.errors,
                  input,
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      // Bootstrap the workflow
      const result = await this.bootstrapService.bootstrapWorkflow(input);

      const statusIcon = result.success ? '✅' : '❌';

      return {
        content: [
          {
            type: 'text',
            text: `${statusIcon} **Workflow Bootstrap ${result.success ? 'Completed' : 'Failed'}**

**Bootstrap Results:**
• Task Name: ${input.taskName}
• Initial Role: ${input.initialRole}
• Execution Mode: ${input.executionMode || 'GUIDED'}
• Status: ${result.success ? 'Successfully created' : 'Failed'}

${
  result.success
    ? `
**Created Resources:**
• Task ID: ${result.task?.id}
• Task Slug: ${result.task?.slug}
• Workflow Execution ID: ${result.workflowExecution?.id}
• Current Role: ${result.workflowExecution?.currentRoleId}

**Initial Guidance:**
• Current Step: ${result.initialGuidance?.currentStep?.displayName || 'No specific step'}
• Next Actions: ${result.initialGuidance?.nextActions?.length || 0} actions available
• Quality Reminders: ${result.initialGuidance?.qualityReminders?.length || 0} reminders

**Next Steps (${result.nextSteps?.length || 0}):**
${
  result.nextSteps
    ?.map(
      (step, index) => `${index + 1}. ${step.displayName} (${step.stepType})`,
    )
    .join('\n') || '• No specific next steps defined'
}

🎯 **Ready to begin workflow execution!**
`
    : `
**Error Details:**
${result.message}

⚠️ **Please check the error and try again**
`
}`,
          },
          {
            type: 'text',
            text: JSON.stringify(
              {
                bootstrapResult: result,
                workflowIntelligence: {
                  taskCreated: result.success,
                  executionInitialized: result.success,
                  guidanceProvided: !!result.initialGuidance,
                  nextStepsAvailable: result.nextSteps?.length > 0,
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
        `Error bootstrapping workflow: ${error.message}`,
        error,
      );

      return {
        content: [
          {
            type: 'text',
            text: `❌ **Workflow Bootstrap Error**

Error: ${error.message}

Task Name: ${input.taskName}
Initial Role: ${input.initialRole}

This indicates a system error during bootstrap process.`,
          },
          {
            type: 'text',
            text: JSON.stringify(
              {
                error: error.message,
                taskName: input.taskName,
                initialRole: input.initialRole,
                stack: error.stack,
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
