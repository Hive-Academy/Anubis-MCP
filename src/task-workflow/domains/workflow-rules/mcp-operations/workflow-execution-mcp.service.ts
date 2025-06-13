import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import { WorkflowGuidanceService } from '../services/workflow-guidance.service';
import {
  WorkflowExecutionOperationsService,
  WorkflowExecutionInput,
} from '../services/workflow-execution-operations.service';
import { createErrorResult } from '../utils/type-safety.utils';
import { EnvelopeBuilderService } from '../../../utils/envelope-builder';
import { shouldIncludeDebugInfo } from '../../../config/mcp-response.config';

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
    private readonly workflowGuidance: WorkflowGuidanceService,
    private readonly envelopeBuilder: EnvelopeBuilderService,
  ) {}

  @Tool({
    name: 'workflow_execution_operations',
    description: `
Workflow execution lifecycle management with state tracking and progress monitoring.

**Operations:**
- create_execution: Create new workflow execution for a task
- get_execution: Retrieve execution with relations and progress
- update_execution: Update execution state and progress
- complete_execution: Mark execution as completed
- get_active_executions: List all active executions
- execute_step_with_services: Execute a step with associated services

**Examples:**
- Create: { operation: "create_execution", taskId: 123, roleName: "architect" }
- Get: { operation: "get_execution", executionId: "exec-123" }
- Update: { operation: "update_execution", executionId: "exec-123", updateData: {...} }
`,
    parameters: WorkflowExecutionSchema,
  })
  async executeWorkflowOperation(input: WorkflowExecutionInputSchema): Promise<{
    content: Array<{ type: 'text'; text: string }>;
  }> {
    const startTime = performance.now();

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

      const responseTime = performance.now() - startTime;
      const workflowGuidance = await this.generateWorkflowGuidance(
        input,
        result,
      );

      this.logger.debug(
        `Workflow execution completed in ${responseTime.toFixed(2)}ms`,
        {
          operation: input.operation,
          taskId: input.taskId,
          responseTime,
        },
      );

      // 🎯 BUILD WORKFLOW EXECUTION ENVELOPE
      const envelope = this.envelopeBuilder.buildWorkflowExecutionEnvelope(
        input.operation,
        input.taskId,
        result,
        workflowGuidance,
      );

      // Note: responseTime is tracked in the response wrapper, not the envelope metadata

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

      // Add verbose data if requested (FIXED: Eliminated duplication)
      if (shouldIncludeDebugInfo()) {
        response.content.push({
          type: 'text' as const,
          text: JSON.stringify(
            {
              debug: {
                // ONLY include data NOT in main response
                processingTime: Math.round(responseTime),
                internalMetrics: {
                  operation: input.operation,
                  timestamp: new Date().toISOString(),
                },
                // REMOVED: rawResult, rawGuidance (already in main response)
              },
            },
            null,
            2,
          ),
        });
      }

      return response;
    } catch (error: unknown) {
      this.logger.error(`Workflow execution failed:`, error);
      const errorResult = createErrorResult(error, 'Workflow execution');

      const errorEnvelope = {
        taskId: input.taskId,
        operation: input.operation,
        success: false,
        error: {
          message: errorResult.message,
          code: 'WORKFLOW_EXECUTION_FAILED',
          operation: input.operation,
          taskId: input.taskId,
        },
        meta: {
          timestamp: new Date().toISOString(),
          responseTime: Math.round(performance.now() - startTime),
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

  /**
   * Generate workflow guidance for response
   */
  private async generateWorkflowGuidance(
    input: WorkflowExecutionInputSchema,
    result: any,
  ): Promise<any> {
    try {
      if (!input.roleName) return null;

      return await this.workflowGuidance.getWorkflowGuidance(input.roleName, {
        taskId: input.taskId,
        roleId: input.roleName,
        executionData: { operation: input.operation, result },
      });
    } catch (error) {
      this.logger.warn('Failed to generate workflow guidance:', error);
      return null;
    }
  }
}
