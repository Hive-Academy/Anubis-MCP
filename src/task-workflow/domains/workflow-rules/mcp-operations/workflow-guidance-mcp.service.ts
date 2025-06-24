import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { ZodSchema, z } from 'zod';
import { WorkflowGuidanceService } from '../services/workflow-guidance.service';
import { PrismaService } from '../../../../prisma/prisma.service';
import { WorkflowExecution } from 'generated/prisma';
import { WorkflowExecutionService } from '../services/workflow-execution.service';

const GetWorkflowGuidanceInputSchema = z
  .object({
    roleName: z
      .enum([
        'boomerang',
        'researcher',
        'architect',
        'senior-developer',
        'code-review',
      ])
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
export class WorkflowGuidanceMcpService {
  private readonly logger = new Logger(WorkflowGuidanceMcpService.name);

  constructor(
    private readonly workflowGuidanceService: WorkflowGuidanceService,
    private readonly prisma: PrismaService,
    private readonly workflowExecutionService: WorkflowExecutionService,
  ) {}

  @Tool({
    name: 'get_workflow_guidance',
    description: `Provides minimal role identity and basic capabilities for workflow execution.`,
    parameters:
      GetWorkflowGuidanceInputSchema as ZodSchema<GetWorkflowGuidanceInput>,
  })
  async getWorkflowGuidance(input: GetWorkflowGuidanceInput): Promise<any> {
    try {
      this.logger.log(
        `🔍 Getting workflow guidance for: ${input.roleName}, task: ${input.taskId}, executionId: ${input.executionId}, roleId: ${input.roleId}`,
      );

      // 🔧 BOOTSTRAP FIX: Handle both taskId and executionId
      let currentExecution;
      let contextTaskId: number;

      if (input.executionId) {
        // Query by executionId (bootstrap mode)
        currentExecution = await this.prisma.workflowExecution.findUnique({
          where: { id: input.executionId },
          include: {
            currentRole: true,
            currentStep: true,
          },
        });
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

        currentExecution = await this.prisma.workflowExecution.findFirst({
          where: { taskId: taskId },
          include: {
            currentRole: true,
            currentStep: true,
          },
          orderBy: { createdAt: 'desc' },
        });
        contextTaskId = taskId;
      } else {
        throw new Error('Either taskId or executionId must be provided');
      }

      if (currentExecution) {
        this.logger.log(
          `✅ Found execution: ${currentExecution.id}, currentRoleId: ${currentExecution.currentRoleId}, currentStepId: ${currentExecution.currentStepId}`,
        );

        // Verify role consistency
        if (currentExecution.currentRoleId !== input.roleId) {
          this.logger.warn(
            `⚠️ Role mismatch: execution has roleId ${currentExecution.currentRoleId}, but requested roleId is ${input.roleId}`,
          );
        }

        // Check if execution has proper step assignment
        if (!currentExecution.currentStepId) {
          this.logger.error(
            `🚨 CRITICAL: Execution ${currentExecution.id} has no currentStepId. This indicates a role transition issue.`,
          );

          // Try to find and assign the first step for the current role
          const firstStepForRole = await this.prisma.workflowStep.findFirst({
            where: { roleId: currentExecution.currentRoleId },
            orderBy: { sequenceNumber: 'asc' },
          });

          if (firstStepForRole) {
            this.logger.log(
              `🔄 Auto-fixing: Assigning first step ${firstStepForRole.name} (${firstStepForRole.id}) to execution`,
            );

            await this.fixMissingCurrentStep(
              currentExecution,
              firstStepForRole,
            );
          }
        }
      } else {
        this.logger.warn(
          `⚠️ No workflow execution found for task ${contextTaskId}. This may indicate the workflow hasn't been properly initialized.`,
        );
      }

      const context = {
        taskId: contextTaskId,
        projectPath: input.projectPath,
      };

      // Get ONLY essential role identity - NO verbose behavioral context
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
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                currentRole: roleGuidance.currentRole,
                projectContext: roleGuidance.projectContext,
                executionContext: executionContext,
              },
              null,
              2,
            ),
          },
        ],
      };
    } catch (error: any) {
      this.logger.error(
        `❌ Error getting workflow guidance: ${error.message}`,
        error,
      );

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                success: false,
                error: {
                  message: error.message,
                  code: 'WORKFLOW_GUIDANCE_ERROR',
                  debugInfo: {
                    taskId: input.taskId,
                    roleId: input.roleId,
                    roleName: input.roleName,
                    timestamp: new Date().toISOString(),
                  },
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
    await this.prisma.workflowExecution.update({
      where: { id: currentExecution.id },
      data: {
        currentStepId: firstStepForRole.id,
      },
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
