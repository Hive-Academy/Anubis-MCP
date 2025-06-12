import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { ZodSchema, z } from 'zod';
import { WorkflowBootstrapService } from '../services/workflow-bootstrap.service';
import { EnvelopeBuilderService } from '../../../utils/envelope-builder';
import { shouldIncludeDebugInfo } from '../../../config/mcp-response.config';

// Simplified schema that aligns with Boomerang workflow steps
const BootstrapWorkflowInputSchema = z.object({
  // Core task data (minimal upfront requirements)
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

  // Simplified execution context for minimal bootstrap
  executionContext: z
    .record(z.any())
    .optional()
    .describe('Additional execution context'),
});

type BootstrapWorkflowInputType = z.infer<typeof BootstrapWorkflowInputSchema>;

@Injectable()
export class WorkflowBootstrapMcpService {
  private readonly logger = new Logger(WorkflowBootstrapMcpService.name);

  constructor(
    private readonly bootstrapService: WorkflowBootstrapService,
    private readonly envelopeBuilder: EnvelopeBuilderService,
  ) {}

  @Tool({
    name: 'bootstrap_workflow',
    description: `Bootstrap a workflow from scratch aligned with Boomerang role workflow steps.

**WORKFLOW BOOTSTRAP - STEP-ALIGNED INITIALIZATION**

✅ **Minimal Task Creation** - Creates task with essential metadata only
✅ **Workflow Execution** - Initializes execution for step-by-step workflow
✅ **Role Setup** - Sets up initial role context (typically boomerang)
✅ **Step-Aligned Process** - Follows defined workflow steps for proper sequencing
✅ **First Step Ready** - Prepares for step 1: internal_service_context_acquisition

**ALIGNED WITH BOOMERANG WORKFLOW STEPS:**
1. **internal_service_context_acquisition** - Context through services
2. **git_integration_verification** - Git state verification  
3. **current_state_verification_protocol** - Functional testing
4. **enhanced_task_setup** - Codebase analysis happens HERE
5. **strategic_decision_making** - Evidence-based decisions
6. **intelligent_role_delegation** - Delegate to appropriate role

**KEY FEATURES:**
• Creates minimal task with essential requirements only
• Sets up workflow execution aligned with defined steps
• Provides guidance for the first workflow step
• Defers codebase analysis to step 4 as designed
• Returns proper next steps according to workflow definition

**USAGE:**
This tool creates the foundation for step-driven workflow execution:
- Minimal task creation (detailed analysis comes later)
- Workflow execution with proper step sequencing
- Initial guidance for step 1
- Project path context for future steps

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
        const errorEnvelope = {
          taskName: input.taskName,
          success: false,
          error: {
            message: 'Bootstrap validation failed',
            code: 'VALIDATION_FAILED',
            errors: validation.errors,
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

      // Bootstrap the workflow
      const result = await this.bootstrapService.bootstrapWorkflow(input);

      // 🎯 BUILD BOOTSTRAP ENVELOPE
      const envelope = this.envelopeBuilder.buildBootstrapEnvelope(
        result,
        input.projectPath || '/project',
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

      // Add verbose data if requested
      if (shouldIncludeDebugInfo()) {
        response.content.push({
          type: 'text' as const,
          text: JSON.stringify(
            {
              debug: {
                rawResult: result,
                input,
                validation,
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
        `Error bootstrapping workflow: ${error.message}`,
        error,
      );

      const errorEnvelope = {
        taskName: input.taskName,
        initialRole: input.initialRole,
        success: false,
        error: {
          message: error.message,
          code: 'BOOTSTRAP_ERROR',
          stack: error.stack,
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
