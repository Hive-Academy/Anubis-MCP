import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { ZodSchema, z } from 'zod';
import { WorkflowBootstrapService } from '../services/workflow-bootstrap.service';

// Simplified schema - just basic execution setup
const BootstrapWorkflowInputSchema = z.object({
  initialRole: z
    .enum([
      'boomerang',
      'researcher',
      'architect',
      'senior-developer',
      'code-review',
    ])
    .default('boomerang')
    .describe('Initial role to start the workflow with'),
  executionMode: z
    .enum(['GUIDED', 'AUTOMATED', 'HYBRID'])
    .default('GUIDED')
    .describe('Workflow execution mode'),
  projectPath: z.string().optional().describe('Project path for context'),
});

type BootstrapWorkflowInputType = z.infer<typeof BootstrapWorkflowInputSchema>;

@Injectable()
export class WorkflowBootstrapMcpService {
  private readonly logger = new Logger(WorkflowBootstrapMcpService.name);

  constructor(private readonly bootstrapService: WorkflowBootstrapService) {}

  @Tool({
    name: 'bootstrap_workflow',
    description: `Start a new workflow execution - Simple kickoff without task details.

**🚀 WORKFLOW KICKOFF - Pure execution starter**

Starts a workflow execution pointing to the first boomerang step. 
The boomerang workflow steps will guide the agent to:
1. Perform git setup and verification
2. Analyze the codebase with functional testing
3. Gather task requirements and create comprehensive task
4. Make research decisions
5. Delegate to appropriate next role

**Returns:**
- Execution ID and first step ID for workflow execution
- Current step guidance for immediate execution
- Complete execution context to start boomerang workflow

**Usage:**
Just call bootstrap_workflow() and start executing the returned step guidance.`,
    parameters:
      BootstrapWorkflowInputSchema as ZodSchema<BootstrapWorkflowInputType>,
  })
  async bootstrapWorkflow(input: BootstrapWorkflowInputType): Promise<any> {
    try {
      this.logger.log(
        `Starting workflow execution with role: ${input.initialRole}`,
      );

      // Bootstrap the workflow execution
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
                  timestamp: new Date().toISOString(),
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      // Return execution data for immediate workflow start
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                currentRole: result.currentRole,
                currentStep: result.currentStep,
                execution: result.execution,
                success: true,
                message: result.message,
                resources: result.resources,
                timestamp: new Date().toISOString(),
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
}
