import { Injectable } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { ZodSchema, z } from 'zod';
import { WorkflowBootstrapService } from '../services/workflow-bootstrap.service';
import { WorkflowContextCacheService } from '../services/workflow-context-cache.service';
import { AutoWorkflowValidation } from '../utils/dynamic-workflow-validation.util';
import { BaseMcpService } from '../utils/mcp-response.utils';

// Simplified schema - just basic execution setup
const BootstrapWorkflowInputSchema = z.object({
  initialRole: z
    .enum(['product-manager', 'architect', 'senior-developer', 'code-review'])
    .default('product-manager')
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
  constructor(
    private readonly bootstrapService: WorkflowBootstrapService,
    private readonly workflowContextCache: WorkflowContextCacheService,
  ) {
    super();
  }

  @AutoWorkflowValidation(BootstrapWorkflowInputSchema, 'bootstrap_workflow', {
    // Bootstrap doesn't need existing workflow IDs - it creates them
    allowBootstrap: true,
    requiredIds: [],
    autoCorrect: false,
    logCorrections: false,
  })
  @Tool({
    name: 'bootstrap_workflow',
    description: `Initializes a new workflow execution with product-manager role, starting from git setup through task creation and delegation.`,
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

      // 🧠 UPDATE WORKFLOW CONTEXT CACHE
      // Store initial workflow state after successful bootstrap
      try {
        const cacheKey = WorkflowContextCacheService.generateKey(
          result.resources.executionId,
          'bootstrap',
        );

        this.workflowContextCache.storeContext(cacheKey, {
          executionId: result.resources.executionId,
          taskId: result.resources.taskId || 0, // Bootstrap may not have taskId yet
          currentRoleId: result.currentRole.id,
          currentStepId: result.currentStep.id,
          roleName: result.currentRole.name,
          stepName: result.currentStep.name,
          taskName: 'Bootstrap Workflow',
          projectPath: input.projectPath || process.cwd(),
          source: 'bootstrap',
        });
      } catch (_cacheError) {
        // Don't fail bootstrap if cache update fails
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
