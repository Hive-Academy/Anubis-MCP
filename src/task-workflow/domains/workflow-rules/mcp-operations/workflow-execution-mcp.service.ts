import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
// EnvelopeBuilderService removed - using minimal responses
import {
  WorkflowExecutionInput,
  WorkflowExecutionOperationsService,
} from '../services/workflow-execution-operations.service';

// Schema for workflow execution operations
const WorkflowExecutionSchema = z.object({
  operation: z.enum([
    'create_execution',
    'get_execution',
    'update_execution',
    'complete_execution',
    'get_active_executions',
    'execute_step_with_services',
    'get_execution_context',
    'update_execution_context',
  ]),
  taskId: z.number(),
  executionId: z.string().optional(),
  roleName: z
    .enum([
      'boomerang',
      'researcher',
      'architect',
      'senior-developer',
      'code-review',
    ])
    .optional(),
  executionMode: z.enum(['GUIDED', 'AUTOMATED', 'HYBRID']).optional(),
  autoCreatedTask: z.boolean().optional(),
  executionContext: z.record(z.any()).optional(),
  updateData: z.record(z.any()).optional(),
  stepId: z.string().optional(),
  orchestrationConfig: z
    .object({
      serviceCalls: z
        .array(
          z.object({
            serviceName: z.string(),
            operation: z.string(),
            parameters: z.record(z.any()),
          }),
        )
        .optional(),
      executionMode: z.enum(['sequential', 'parallel']).optional(),
      continueOnFailure: z.boolean().optional(),
    })
    .optional(),
  // New fields for context operations
  dataKey: z.string().optional(),
  contextUpdates: z.record(z.any()).optional(),
});

type WorkflowExecutionInputSchema = z.infer<typeof WorkflowExecutionSchema>;

/**
 * Workflow Execution MCP Service
 *
 * Simplified MCP interface that delegates to specialized services.
 * Follows Single Responsibility Principle - only handles MCP communication.
 */
@Injectable()
export class WorkflowExecutionMcpService {
  private readonly logger = new Logger(WorkflowExecutionMcpService.name);

  constructor(
    private readonly executionOps: WorkflowExecutionOperationsService,
  ) {}

  @Tool({
    name: 'workflow_execution_operations',
    description: `
**⚙️ WORKFLOW STATE MANAGEMENT - Query and manage execution state only**

**FOCUSED OPERATIONS:**
- get_active_executions: List all active executions (taskId, executionId, currentRole)
- get_execution: Get current execution state without guidance
- update_execution: Update execution state and progress
- complete_execution: Mark execution as completed

**Does NOT provide:**
❌ Workflow guidance (use get_workflow_guidance)
❌ Step guidance (use get_step_guidance)  
❌ Role recommendations (use role transition tools)
❌ Complex envelopes (minimal state data only)

**Usage:**
- Check active workflows before starting
- Get current execution state for resuming work
- Update execution progress
- Mark workflows complete

**Examples:**
- List active: { operation: "get_active_executions", taskId: 0 }
- Get state: { operation: "get_execution", taskId: 123 }
- Update: { operation: "update_execution", executionId: "exec-123", updateData: {...} }
`,
    parameters: WorkflowExecutionSchema,
  })
  async executeWorkflowOperation(input: WorkflowExecutionInputSchema): Promise<{
    content: Array<{ type: 'text'; text: string }>;
  }> {
    try {
      this.logger.debug(`Workflow Execution: ${input.operation}`, {
        taskId: input.taskId,
        executionId: input.executionId,
        operation: input.operation,
      });

      const workflowInput: WorkflowExecutionInput = {
        taskId: input.taskId,
        executionId: input.executionId,
        roleName: input.roleName,
        executionMode: input.executionMode,
        autoCreatedTask: input.autoCreatedTask,
        executionContext: input.executionContext,
        updateData: input.updateData,
        stepId: input.stepId,
        orchestrationConfig: input.orchestrationConfig,
      };

      let result: any;

      switch (input.operation) {
        case 'create_execution':
          result = await this.executionOps.createExecution(workflowInput);
          break;
        case 'get_execution':
          result = await this.executionOps.getExecution(workflowInput);
          break;
        case 'update_execution':
          result = await this.executionOps.updateExecution(workflowInput);
          break;
        case 'complete_execution':
          result = await this.executionOps.completeExecution(workflowInput);
          break;
        case 'get_active_executions':
          result = await this.executionOps.getActiveExecutions();
          break;
        case 'execute_step_with_services':
          result =
            await this.executionOps.executeStepWithServices(workflowInput);
          break;
        case 'get_execution_context':
          if (!input.executionId) {
            throw new Error(
              'executionId is required for get_execution_context',
            );
          }
          result = await this.executionOps.getExecutionContext({
            executionId: input.executionId,
            dataKey: input.dataKey,
          });
          break;
        case 'update_execution_context':
          if (!input.executionId) {
            throw new Error(
              'executionId is required for update_execution_context',
            );
          }
          if (!input.contextUpdates) {
            throw new Error(
              'contextUpdates is required for update_execution_context',
            );
          }
          result = await this.executionOps.updateExecutionContext({
            executionId: input.executionId,
            contextUpdates: input.contextUpdates,
          });
          break;
        default: {
          const exhaustiveCheck: never = input.operation;
          throw new Error(`Unknown operation: ${String(exhaustiveCheck)}`);
        }
      }

      // Return MINIMAL state data only - NO guidance generation, NO envelopes
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                operation: input.operation,
                taskId: input.taskId,
                success: true,
                data: result,
                timestamp: new Date().toISOString(),
              },
              null,
              2,
            ),
          },
        ],
      };
    } catch (error: unknown) {
      this.logger.error(`Workflow execution failed:`, error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                operation: input.operation,
                taskId: input.taskId,
                success: false,
                error: {
                  message: errorMessage,
                  code: 'WORKFLOW_EXECUTION_FAILED',
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
