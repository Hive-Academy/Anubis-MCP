import { Injectable } from '@nestjs/common';
import {
  WorkflowStep,
  StepProgressStatus,
} from '../../../../../generated/prisma';
import { PrismaService } from '../../../../prisma/prisma.service';
import { IWorkflowStepRepository } from '../interfaces/workflow-step.repository.interface';

@Injectable()
export class WorkflowStepRepository implements IWorkflowStepRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Basic CRUD operations
  async findById(id: string): Promise<WorkflowStep | null> {
    return this.prisma.workflowStep.findUnique({
      where: { id },
    });
  }

  async create(
    data: Omit<WorkflowStep, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<WorkflowStep> {
    return this.prisma.workflowStep.create({ data });
  }

  async update(id: string, data: Partial<WorkflowStep>): Promise<WorkflowStep> {
    return this.prisma.workflowStep.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.workflowStep.delete({
      where: { id },
    });
  }

  // Domain-specific methods
  async findByExecutionId(executionId: string): Promise<WorkflowStep[]> {
    return this.prisma.workflowStep.findMany({
      where: {
        stepProgress: {
          some: {
            executionId,
          },
        },
      },
      include: {
        role: true,
        stepProgress: true,
      },
    });
  }

  async findByRoleId(roleId: string): Promise<WorkflowStep[]> {
    return this.prisma.workflowStep.findMany({
      where: { roleId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findCurrentStep(executionId: string): Promise<WorkflowStep | null> {
    return this.prisma.workflowStep.findFirst({
      where: {
        stepProgress: {
          some: {
            executionId,
            status: 'IN_PROGRESS',
          },
        },
      },
      orderBy: { sequenceNumber: 'asc' },
    });
  }

  async findNextStep(
    currentStepId: string,
    executionId: string,
  ): Promise<WorkflowStep | null> {
    const currentStep = await this.findById(currentStepId);
    if (!currentStep) return null;

    return this.prisma.workflowStep.findFirst({
      where: {
        roleId: currentStep.roleId,
        sequenceNumber: { gt: currentStep.sequenceNumber },
        stepProgress: {
          none: {
            executionId,
            status: { in: ['COMPLETED', 'IN_PROGRESS'] },
          },
        },
      },
      orderBy: { sequenceNumber: 'asc' },
    });
  }

  async findCompletedSteps(executionId: string): Promise<WorkflowStep[]> {
    return this.prisma.workflowStep.findMany({
      where: {
        stepProgress: {
          some: {
            executionId,
            status: 'COMPLETED',
          },
        },
      },
      include: {
        stepProgress: {
          where: {
            executionId,
            status: 'COMPLETED',
          },
        },
      },
      orderBy: { sequenceNumber: 'asc' },
    });
  }

  async updateStepStatus(
    stepId: string,
    executionId: string,
    status: StepProgressStatus,
    executionData?: any,
  ): Promise<WorkflowStep> {
    // Find existing progress record
    const existingProgress = await this.prisma.workflowStepProgress.findFirst({
      where: {
        executionId,
        stepId,
      },
    });

    if (existingProgress) {
      // Update existing progress
      await this.prisma.workflowStepProgress.update({
        where: { id: existingProgress.id },
        data: {
          status,
          ...(executionData && { executionData }),
          ...(status === 'COMPLETED' && { completedAt: new Date() }),
          ...(status === 'IN_PROGRESS' && { startedAt: new Date() }),
          ...(status === 'FAILED' && { failedAt: new Date() }),
        },
      });
    } else {
      // Get the step to find the roleId
      const step = await this.prisma.workflowStep.findUniqueOrThrow({
        where: { id: stepId },
      });

      // Create new progress record
      await this.prisma.workflowStepProgress.create({
        data: {
          executionId,
          stepId,
          roleId: step.roleId,
          status,
          ...(executionData && { executionData }),
          ...(status === 'COMPLETED' && { completedAt: new Date() }),
          ...(status === 'IN_PROGRESS' && { startedAt: new Date() }),
          ...(status === 'FAILED' && { failedAt: new Date() }),
        },
      });
    }

    // Return the updated step with progress
    return this.prisma.workflowStep.findUniqueOrThrow({
      where: { id: stepId },
      include: {
        stepProgress: {
          where: { executionId },
        },
      },
    });
  }

  async createStepWithSequence(
    stepData: Omit<
      WorkflowStep,
      'id' | 'createdAt' | 'updatedAt' | 'sequenceNumber'
    >,
  ): Promise<WorkflowStep> {
    // Get the highest sequence number for this role
    const existingSteps = await this.prisma.workflowStep.findMany({
      where: { roleId: stepData.roleId },
      select: { sequenceNumber: true },
      orderBy: { sequenceNumber: 'desc' },
      take: 1,
    });

    const nextSequence =
      existingSteps.length > 0 ? existingSteps[0].sequenceNumber + 1 : 1;

    return this.prisma.workflowStep.create({
      data: {
        ...stepData,
        sequenceNumber: nextSequence,
      },
    });
  }

  async findStepsByStatus(status: StepProgressStatus): Promise<WorkflowStep[]> {
    // Since status is tracked in WorkflowStepProgress, we need to join
    return this.prisma.workflowStep.findMany({
      where: {
        stepProgress: {
          some: {
            status: status,
          },
        },
      },
      include: {
        stepProgress: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
