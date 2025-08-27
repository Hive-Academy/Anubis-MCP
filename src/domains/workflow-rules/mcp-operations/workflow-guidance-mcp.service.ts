import { Injectable, Inject } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { WorkflowExecution } from 'generated/prisma';
import { ZodSchema, z } from 'zod';
import { WorkflowExecutionService } from '../services/workflow-execution.service';
import { WorkflowGuidanceService } from '../services/workflow-guidance.service';
import { BaseMcpService } from '../utils/mcp-response.utils';
import { IWorkflowExecutionRepository } from '../repositories/interfaces/workflow-execution.repository.interface';
import { IWorkflowStepRepository } from '../repositories/interfaces/workflow-step.repository.interface';

const GetWorkflowGuidanceInputSchema = z
  .object({
    roleName: z
      .enum(['product-manager', 'architect', 'senior-developer', 'code-review'])
      .describe('Current role name for workflow guidance'),
    taskId: z
      .number()
      .optional()
      .describe('Task ID for context (optional during bootstrap)'),
    roleId: z.string().describe('Role ID for transition context'),
    executionId: z
      .string()
      .optional()
      .describe('Execution ID (alternative to taskId)'),
    projectPath: z
      .string()
      .optional()
      .describe('Project path for project-specific context'),
  })
  .refine(
    (data) => data.taskId !== undefined || data.executionId !== undefined,
    {
      message: 'Either taskId or executionId must be provided',
      path: ['taskId', 'executionId'],
    },
  );

type GetWorkflowGuidanceInput = z.infer<typeof GetWorkflowGuidanceInputSchema>;

/**
 * 🎯 STREAMLINED WORKFLOW GUIDANCE MCP SERVICE
 *
 * OPTIMIZED: Returns only essential role identity - NO redundant behavioral context
 * PURPOSE: Get minimal role persona once, then use get_step_guidance for actionable steps
 *
 * 🔧 ENHANCED: Added execution state verification for role transitions
 */
@Injectable()
export class WorkflowGuidanceMcpService extends BaseMcpService {
  constructor(
    private readonly workflowGuidanceService: WorkflowGuidanceService,
    @Inject('IWorkflowExecutionRepository')
    private readonly workflowExecutionRepository: IWorkflowExecutionRepository,
    @Inject('IWorkflowStepRepository')
    private readonly workflowStepRepository: IWorkflowStepRepository,
    private readonly workflowExecutionService: WorkflowExecutionService,
  ) {
    super();
  }

  @Tool({
    name: 'get_workflow_guidance',
    description: `Provides minimal role identity and basic capabilities for workflow execution.`,
    parameters:
      GetWorkflowGuidanceInputSchema as ZodSchema<GetWorkflowGuidanceInput>,
  })
  async getWorkflowGuidance(input: GetWorkflowGuidanceInput): Promise<any> {
    try {
      // 🔧 BOOTSTRAP FIX: Handle both taskId and executionId
      let currentExecution;
      let contextTaskId: number;

      if (input.executionId) {
        // Query by executionId (bootstrap mode)
        currentExecution = await this.workflowExecutionRepository.findById(
          input.executionId,
          {
            currentRole: true,
            currentStep: true,
          },
        );
        contextTaskId = currentExecution?.taskId || 0; // Use 0 for bootstrap mode
      } else if (input.taskId !== undefined) {
        // Query by taskId (normal mode)
        const taskId =
          typeof input.taskId === 'string'
            ? parseInt(input.taskId)
            : input.taskId;

        if (isNaN(taskId)) {
          throw new Error(`Invalid taskId: ${input.taskId}`);
        }

        currentExecution = await this.workflowExecutionRepository.findByTaskId(
          taskId,
          {
            currentRole: true,
            currentStep: true,
          },
        );
        contextTaskId = taskId;
      } else {
        throw new Error('Either taskId or executionId must be provided');
      }

      if (currentExecution) {
        // Check if execution has proper step assignment
        if (!currentExecution.currentStepId) {
          // Try to find and assign the first step for the current role
          const firstStepForRole =
            await this.workflowStepRepository.findFirstStepForRole(
              currentExecution.currentRoleId,
            );

          if (firstStepForRole) {
            await this.fixMissingCurrentStep(
              currentExecution,
              firstStepForRole,
            );
          }
        }
      }

      const context = {
        taskId: contextTaskId,
        projectPath: input.projectPath,
      };

      // Get ONLY essential role identity - NO verbose behavioral context
      // The guidance service now returns minimal role data without relations
      const roleGuidance =
        await this.workflowGuidanceService.getWorkflowGuidance(
          input.roleName,
          context,
        );

      // 🆕 ENHANCEMENT: Include execution context in response
      const executionContext = currentExecution
        ? {
            executionId: currentExecution.id,
            currentStepId: currentExecution.currentStepId,
            executionState: currentExecution.executionState,
            hasCurrentStep: !!currentExecution.currentStepId,
          }
        : null;

      // Return minimal essential-only response with execution context
      return this.buildResponse({
        success: true,
        currentRole: roleGuidance.currentRole,
        executionContext: executionContext,
      });
    } catch (error: any) {
      return this.buildErrorResponse(
        'Failed to get workflow guidance',
        error.message,
        'GUIDANCE_ERROR',
      );
    }
  }

  async fixMissingCurrentStep(
    currentExecution: WorkflowExecution,
    firstStepForRole: {
      roleId: string;
      id: string;
      createdAt: Date;
      updatedAt: Date;
      name: string;
      description: string;
      sequenceNumber: number;
      isRequired: boolean;
      stepType: import('generated/prisma').$Enums.StepType;
      approach: string;
    },
  ) {
    // Persist simple relational update first (without executionState)
    await this.workflowExecutionRepository.update(currentExecution.id, {
      currentStepId: firstStepForRole.id,
    });

    // Use validated helper for state patching
    await this.workflowExecutionService.updateExecutionState(
      currentExecution.id,
      {
        currentStep: {
          id: firstStepForRole.id,
          name: firstStepForRole.name,
          sequenceNumber: firstStepForRole.sequenceNumber,
          assignedAt: new Date().toISOString(),
        },
        autoFixed: {
          timestamp: new Date().toISOString(),
          reason: 'Missing currentStepId after workflow guidance request',
          assignedStep: firstStepForRole.name,
        },
      } as any, // Partial of WorkflowExecutionState
    );
  }
}
