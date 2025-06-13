import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { ZodSchema, z } from 'zod';
import { WorkflowBootstrapService } from '../services/workflow-bootstrap.service';

// Schema for bootstrap workflow input
const BootstrapWorkflowInputSchema = z.object({
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
    description: `Create a new workflow execution with minimal task setup.

**🚀 WORKFLOW INITIATION - Creates minimal placeholder task**

Creates placeholder task and workflow execution pointing to first database-driven step. 
The real task will be created by boomerang workflow after git setup and codebase analysis.

**Returns ONLY:**
- Task ID and execution ID for subsequent tool calls
- Current execution state with step and role details
- **NO complex envelopes, NO debug data, NO redundant information**

**Usage Pattern:**
1. bootstrap_workflow() → Get IDs and execution state
2. Follow patterns from 000-workflow-core.md for next actions`,
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
              type: 'text' as const,
              text: JSON.stringify(
                {
                  success: false,
                  error: {
                    message: 'Bootstrap validation failed',
                    errors: validation.errors,
                  },
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

      if (!result.success) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  success: false,
                  error: {
                    message: result.message,
                  },
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      // Return comprehensive execution data - NO hardcoded flow control
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                success: true,
                message: result.message,
                resources: {
                  taskId: result.resources.taskId,
                  executionId: result.resources.executionId,
                  firstStepId: result.resources.firstStepId,
                },
                execution: result.execution,
                currentStep: result.currentStep,
                currentRole: result.currentRole,
              },
              null,
              2,
            ),
          },
        ],
      };
    } catch (error: any) {
      this.logger.error(`Bootstrap error: ${error.message}`, error);

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                success: false,
                error: {
                  message: error.message,
                  code: 'BOOTSTRAP_ERROR',
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
