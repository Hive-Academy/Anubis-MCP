import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { IWorkflowBootstrapRepository } from '../interfaces/workflow-bootstrap.repository.interface';
import {
  BootstrapResult,
  BootstrapWorkflowInput,
  PrismaTransaction,
} from '../types/workflow-bootstrap.types';

/**
 * Repository implementation for Workflow Bootstrap domain operations
 * Handles workflow execution creation, role initialization, and bootstrap state management
 * Used by workflow-bootstrap.service.ts for bootstrap operations
 */
@Injectable()
export class WorkflowBootstrapRepository
  implements IWorkflowBootstrapRepository
{
  private readonly logger = new Logger(WorkflowBootstrapRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Bootstrap a complete workflow execution with role and step setup
   * @param input - Bootstrap workflow input data
   * @param tx - Optional transaction client
   * @returns Promise<BootstrapResult>
   */
  async bootstrapWorkflow(
    input: BootstrapWorkflowInput,
    _tx?: PrismaTransaction,
  ): Promise<BootstrapResult> {
    try {
      const result = await this.prisma.$transaction(async (txClient) => {
        // Step 1: Get role with full context including capabilities
        const role = await txClient.workflowRole.findUnique({
          where: { name: input.initialRole },
          select: {
            id: true,
            name: true,
            description: true,
            priority: true,
            isActive: true,
            capabilities: true,
            coreResponsibilities: true,
            keyCapabilities: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        if (!role) {
          throw new Error(`Role '${input.initialRole}' not found`);
        }

        // Step 2: Get the first workflow step for this role
        const firstStep = await txClient.workflowStep.findFirst({
          where: {
            roleId: role.id,
          },
          orderBy: { sequenceNumber: 'asc' },
          select: {
            id: true,
            name: true,
            description: true,
            sequenceNumber: true,
            stepType: true,
            approach: true,
          },
        });

        if (!firstStep) {
          throw new Error(
            `No workflow steps found for role '${input.initialRole}'`,
          );
        }

        // Step 3: Create workflow execution - simple kickoff
        const workflowExecution = await txClient.workflowExecution.create({
          data: {
            taskId: null, // No task yet - will be created by workflow
            currentRoleId: role.id,
            currentStepId: firstStep.id,
            executionMode: input.executionMode || 'GUIDED',
            autoCreatedTask: false,
            executionContext: {
              bootstrapped: true,
              bootstrapTime: new Date().toISOString(),
              projectPath: input.projectPath,
              initialRoleName: input.initialRole,
              firstStepName: firstStep.name,
              workflowPhase: 'kickoff',
            },
            executionState: {
              phase: 'initialized',
              currentContext: {},
              progressMarkers: [],
              currentStep: {
                id: firstStep.id,
                name: firstStep.name,
                description: firstStep.description,
                sequenceNumber: firstStep.sequenceNumber,
                assignedAt: new Date().toISOString(),
              },
            },
          },
          include: {
            task: true, // Will be null
            currentRole: {
              select: {
                id: true,
                name: true,
                description: true,
                priority: true,
                isActive: true,
                capabilities: true,
                coreResponsibilities: true,
                keyCapabilities: true,
                createdAt: true,
                updatedAt: true,
              },
            },
            currentStep: {
              select: {
                id: true,
                name: true,
                description: true,
                approach: true,
                createdAt: true,
                updatedAt: true,
                roleId: true,
                sequenceNumber: true,
                isRequired: true,
                stepType: true,
              },
            },
          },
        });

        return {
          workflowExecution,
          role,
          firstStep,
        };
      });

      return {
        success: true,
        data: {
          workflowExecution: result.workflowExecution,
          role: result.role,
          firstStep: result.firstStep,
        },
      };
    } catch (error) {
      this.logger.error(
        `Bootstrap workflow failed: ${error.message}`,
        error.stack,
      );
      return {
        success: false,
        error: `Bootstrap failed: ${error.message}`,
      };
    }
  }
}
