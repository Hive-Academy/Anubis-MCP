import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { ZodSchema, z } from 'zod';
import { WorkflowGuidanceService } from '../services/workflow-guidance.service';
import { PrismaService } from '../../../../prisma/prisma.service';
import { WorkflowExecution } from 'generated/prisma';

const GetWorkflowGuidanceInputSchema = z.object({
  roleName: z
    .enum([
      'boomerang',
      'researcher',
      'architect',
      'senior-developer',
      'code-review',
    ])
    .describe('Current role name for workflow guidance'),
  taskId: z.number().describe('Task ID for context-specific guidance'),
  roleId: z.string().describe('Role ID for transition context'),
  projectPath: z
    .string()
    .optional()
    .describe('Project path for project-specific context'),
});

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
        `🔍 Getting workflow guidance for: ${input.roleName}, task: ${input.taskId}, roleId: ${input.roleId}`,
      );

      // 🔧 FIX: Normalize taskId to number for consistent handling
      const taskId =
        typeof input.taskId === 'string'
          ? parseInt(input.taskId)
          : input.taskId;

      if (isNaN(taskId)) {
        throw new Error(`Invalid taskId: ${input.taskId}`);
      }

      // 🆕 ENHANCEMENT: Verify execution state before providing guidance
      const currentExecution = await this.prisma.workflowExecution.findFirst({
        where: { taskId: taskId },
        include: {
          currentRole: true,
          currentStep: true,
        },
        orderBy: { createdAt: 'desc' },
      });

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
          `⚠️ No workflow execution found for task ${taskId}. This may indicate the workflow hasn't been properly initialized.`,
        );
      }

      const context = {
        taskId: taskId,
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
    await this.prisma.workflowExecution.update({
      where: { id: currentExecution.id },
      data: {
        currentStepId: firstStepForRole.id,
        executionState: {
          ...((currentExecution.executionState as Record<string, any>) || {}),
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
        },
      },
    });
  }
}
