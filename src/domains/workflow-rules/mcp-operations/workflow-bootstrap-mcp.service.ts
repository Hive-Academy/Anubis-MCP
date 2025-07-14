import { Injectable } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { ZodSchema, z } from 'zod';
import { WorkflowBootstrapService } from '../services/workflow-bootstrap.service';
import { BaseMcpService } from '../utils/mcp-response.utils';

// Simplified schema - just basic execution setup
const BootstrapWorkflowInputSchema = z.object({
  initialRole: z
    .enum(['boomerang', 'architect', 'senior-developer', 'code-review'])
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
export class WorkflowBootstrapMcpService extends BaseMcpService {
  constructor(private readonly bootstrapService: WorkflowBootstrapService) {
    super();
  }

  @Tool({
    name: 'bootstrap_workflow',
    description: `Initializes a new workflow execution with boomerang role, starting from git setup through task creation and delegation.`,
    parameters:
      BootstrapWorkflowInputSchema as ZodSchema<BootstrapWorkflowInputType>,
  })
  async bootstrapWorkflow(input: BootstrapWorkflowInputType): Promise<any> {
    try {
      // Bootstrap the workflow execution
      const result = await this.bootstrapService.bootstrapWorkflow(input);

      if (!result.success) {
        return this.buildErrorResponse(result.message, '', 'ERROR');
      }

      // Return streamlined response with essential data only
      // Remove duplication of currentRole and currentStep (they're in resources)
      return this.buildResponse({
        success: true,
        message: result.message,
        executionId: result.resources.executionId,
        taskId: result.resources.taskId,
        currentRole: {
          id: result.currentRole.id,
          name: result.currentRole.name,
          description: result.currentRole.description,
          capabilities: result.currentRole.capabilities,
          coreResponsibilities: result.currentRole.coreResponsibilities,
          keyCapabilities: result.currentRole.keyCapabilities,
        },
        currentStep: {
          id: result.currentStep.id,
          name: result.currentStep.name,
          description: result.currentStep.description,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      return this.buildErrorResponse(
        error.message,
        'Bootstrap workflow failed',
        'BOOTSTRAP_ERROR',
      );
    }
  }
}
