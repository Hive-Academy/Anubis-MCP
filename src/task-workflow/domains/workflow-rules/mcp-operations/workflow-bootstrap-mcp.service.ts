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
    description: `Initializes a new workflow execution with boomerang role, starting from git setup through task creation and delegation.`,
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
