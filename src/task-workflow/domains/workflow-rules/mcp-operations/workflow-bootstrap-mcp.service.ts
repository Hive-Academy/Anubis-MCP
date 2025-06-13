import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { ZodSchema, z } from 'zod';
import { WorkflowBootstrapService } from '../services/workflow-bootstrap.service';
import { EnvelopeBuilderService } from '../../../utils/envelope-builder';
import { shouldIncludeDebugInfo } from '../../../config/mcp-response.config';

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

  constructor(
    private readonly bootstrapService: WorkflowBootstrapService,
    private readonly envelopeBuilder: EnvelopeBuilderService,
  ) {}

  @Tool({
    name: 'bootstrap_workflow',
    description: `Create a new workflow execution with placeholder task.

Creates a minimal placeholder task and workflow execution pointing to the first database-driven step for the specified role. The real task will be created by the boomerang workflow after git setup and codebase analysis.

Returns: Task ID, execution ID, and first step information for use with workflow guidance tools.`,
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
          success: false,
          error: {
            message: 'Bootstrap validation failed',
            errors: validation.errors,
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

      if (!result.success) {
        const errorEnvelope = {
          success: false,
          error: {
            message: result.message,
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

      // Build simple success envelope
      const envelope = {
        success: true,
        message: result.message,
        data: {
          workflow: {
            taskId: result.resources.taskId,
            executionId: result.resources.executionId,
            firstStepId: result.resources.firstStepId,
            task: result.task,
            workflowExecution: result.workflowExecution,
            firstStep: result.firstStep,
          },
        },
        resources: result.resources,
        currentStep: result.currentStep,
        nextAction: result.nextAction,
      };

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

      // Add debug data if requested
      if (shouldIncludeDebugInfo()) {
        response.content.push({
          type: 'text' as const,
          text: JSON.stringify(
            {
              debug: {
                task: result.task,
                firstStep: result.firstStep,
                execution: result.workflowExecution,
              },
            },
            null,
            2,
          ),
        });
      }

      return response;
    } catch (error: any) {
      this.logger.error(`Bootstrap error: ${error.message}`, error);

      const errorEnvelope = {
        success: false,
        error: {
          message: error.message,
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
