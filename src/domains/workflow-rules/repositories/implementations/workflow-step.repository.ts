import { Injectable, Logger } from '@nestjs/common';
import {
  StepProgressStatus,
  StepType,
  WorkflowStep,
  WorkflowStepProgress,
} from '../../../../../generated/prisma';
import { PrismaService } from '../../../../prisma/prisma.service';
import { IWorkflowStepRepository } from '../interfaces/workflow-step.repository.interface';
import {
  CreateWorkflowStepData,
  UpdateWorkflowStepData,
  WorkflowStepFindManyOptions,
  WorkflowStepIncludeOptions,
  WorkflowStepWithRelations,
} from '../types/workflow-step.types';

@Injectable()
export class WorkflowStepRepository implements IWorkflowStepRepository {
  private readonly logger = new Logger(WorkflowStepRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  // ===================================================================
  // BASIC CRUD OPERATIONS
  // ===================================================================

  async findById(
    id: string,
    include?: WorkflowStepIncludeOptions,
  ): Promise<WorkflowStepWithRelations | null> {
    try {
      return await this.prisma.workflowStep.findUnique({
        where: { id },
        include: this.buildInclude(include),
      });
    } catch (error) {
      this.logger.error(`Failed to find step by ID ${id}:`, error);
      throw error;
    }
  }

  async findMany(
    options?: WorkflowStepFindManyOptions,
  ): Promise<WorkflowStepWithRelations[]> {
    try {
      return await this.prisma.workflowStep.findMany({
        where: options?.where,
        orderBy: options?.orderBy || { sequenceNumber: 'asc' },
        take: options?.take,
        skip: options?.skip,
        include: this.buildInclude(options?.include),
      });
    } catch (error) {
      this.logger.error('Failed to find many steps:', error);
      throw error;
    }
  }

  async create(data: CreateWorkflowStepData): Promise<WorkflowStep> {
    try {
      return await this.prisma.workflowStep.create({
        data: {
          roleId: data.roleId,
          name: data.name,
          description: data.description!,
          sequenceNumber: data.sequenceNumber!,
          isRequired: data.isRequired ?? true,
          stepType: data.stepType as StepType,
          approach: data.approach,
        },
      });
    } catch (error) {
      this.logger.error('Failed to create step:', error);
      throw error;
    }
  }

  async update(
    id: string,
    data: UpdateWorkflowStepData,
  ): Promise<WorkflowStep> {
    try {
      return await this.prisma.workflowStep.update({
        where: { id },
        data: data as any,
      });
    } catch (error) {
      this.logger.error(`Failed to update step ${id}:`, error);
      throw error;
    }
  }

  // ===================================================================
  // STEP QUERY OPERATIONS
  // ===================================================================

  async findByExecutionId(executionId: string): Promise<WorkflowStep[]> {
    try {
      return await this.prisma.workflowStep.findMany({
        where: {
          stepProgress: {
            some: { executionId },
          },
        },
        include: {
          role: true,
          stepProgress: {
            where: { executionId },
          },
        },
        orderBy: { sequenceNumber: 'asc' },
      });
    } catch (error) {
      this.logger.error(
        `Failed to find steps by execution ID ${executionId}:`,
        error,
      );
      throw error;
    }
  }

  async findByRoleId(
    roleId: string,
    include?: WorkflowStepIncludeOptions,
  ): Promise<WorkflowStepWithRelations[]> {
    try {
      return await this.prisma.workflowStep.findMany({
        where: { roleId },
        include: this.buildInclude(include),
        orderBy: { sequenceNumber: 'asc' },
      });
    } catch (error) {
      this.logger.error(`Failed to find steps by role ID ${roleId}:`, error);
      throw error;
    }
  }

  async findByName(
    roleId: string,
    stepName: string,
    include?: WorkflowStepIncludeOptions,
  ): Promise<WorkflowStepWithRelations | null> {
    try {
      return await this.prisma.workflowStep.findFirst({
        where: {
          roleId,
          name: stepName,
        },
        include: this.buildInclude(include),
      });
    } catch (error) {
      this.logger.error(
        `Failed to find step by name ${stepName} for role ${roleId}:`,
        error,
      );
      throw error;
    }
  }

  async findBySequenceNumber(
    roleId: string,
    sequenceNumber: number,
    include?: WorkflowStepIncludeOptions,
  ): Promise<WorkflowStepWithRelations | null> {
    try {
      return await this.prisma.workflowStep.findFirst({
        where: {
          roleId,
          sequenceNumber,
        },
        include: this.buildInclude(include),
      });
    } catch (error) {
      this.logger.error(
        `Failed to find step by sequence ${sequenceNumber} for role ${roleId}:`,
        error,
      );
      throw error;
    }
  }

  async findByStepType(
    stepType: string,
    include?: WorkflowStepIncludeOptions,
  ): Promise<WorkflowStepWithRelations[]> {
    try {
      return await this.prisma.workflowStep.findMany({
        where: { stepType: stepType as StepType },
        include: this.buildInclude(include),
        orderBy: [{ roleId: 'asc' }, { sequenceNumber: 'asc' }],
      });
    } catch (error) {
      this.logger.error(`Failed to find steps by type ${stepType}:`, error);
      throw error;
    }
  }

  // ===================================================================
  // STEP PROGRESSION & NAVIGATION
  // ===================================================================

  async findCurrentStep(
    executionId: string,
    include?: WorkflowStepIncludeOptions,
  ): Promise<WorkflowStepWithRelations | null> {
    try {
      return await this.prisma.workflowStep.findFirst({
        where: {
          stepProgress: {
            some: {
              executionId,
              status: 'IN_PROGRESS',
            },
          },
        },
        include: this.buildInclude(include),
        orderBy: { sequenceNumber: 'asc' },
      });
    } catch (error) {
      this.logger.error(
        `Failed to find current step for execution ${executionId}:`,
        error,
      );
      throw error;
    }
  }

  async findNextStep(
    currentStepId: string,
    executionId: string,
    include?: WorkflowStepIncludeOptions,
  ): Promise<WorkflowStepWithRelations | null> {
    try {
      const currentStep = await this.findById(currentStepId);
      if (!currentStep) return null;

      return await this.prisma.workflowStep.findFirst({
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
        include: this.buildInclude(include),
        orderBy: { sequenceNumber: 'asc' },
      });
    } catch (error) {
      this.logger.error(
        `Failed to find next step after ${currentStepId}:`,
        error,
      );
      throw error;
    }
  }

  async findNextAvailableStep(
    taskId: string,
    roleId: string,
    include?: WorkflowStepIncludeOptions,
  ): Promise<WorkflowStepWithRelations | null> {
    try {
      // Find the execution for this task
      const execution = await this.prisma.workflowExecution.findFirst({
        where: { taskId: parseInt(taskId) },
        orderBy: { createdAt: 'desc' },
      });

      if (!execution) return null;

      // Find the next available step for this role
      return await this.prisma.workflowStep.findFirst({
        where: {
          roleId,
          stepProgress: {
            none: {
              executionId: execution.id,
              status: { in: ['COMPLETED', 'IN_PROGRESS'] },
            },
          },
        },
        include: this.buildInclude(include),
        orderBy: { sequenceNumber: 'asc' },
      });
    } catch (error) {
      this.logger.error(
        `Failed to find next available step for task ${taskId}, role ${roleId}:`,
        error,
      );
      throw error;
    }
  }

  async findFirstStepForRole(
    roleId: string,
    include?: WorkflowStepIncludeOptions,
  ): Promise<WorkflowStepWithRelations | null> {
    try {
      return await this.prisma.workflowStep.findFirst({
        where: { roleId },
        include: this.buildInclude(include),
        orderBy: { sequenceNumber: 'asc' },
      });
    } catch (error) {
      this.logger.error(`Failed to find first step for role ${roleId}:`, error);
      throw error;
    }
  }

  async findWithAllRelations(
    stepId: string,
  ): Promise<WorkflowStepWithRelations | null> {
    try {
      return (await this.prisma.workflowStep.findUnique({
        where: { id: stepId },
        include: {
          role: true,
          stepProgress: true,
          stepGuidance: true,
          qualityChecks: true,
          stepDependencies: true,
        },
      })) as unknown as WorkflowStepWithRelations;
    } catch (error) {
      this.logger.error(
        `Failed to find step with all relations ${stepId}:`,
        error,
      );
      throw error;
    }
  }

  // ===================================================================
  // STEP PROGRESS & STATUS MANAGEMENT
  // ===================================================================

  async updateStepStatus(
    stepId: string,
    executionId: string,
    status: StepProgressStatus,
    executionData?: any,
  ): Promise<WorkflowStep> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // Find existing progress record
        const existingProgress = await tx.workflowStepProgress.findFirst({
          where: {
            executionId,
            stepId,
          },
        });

        if (existingProgress) {
          // Update existing progress
          await tx.workflowStepProgress.update({
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
          const step = await tx.workflowStep.findUniqueOrThrow({
            where: { id: stepId },
          });

          // Create new progress record
          await tx.workflowStepProgress.create({
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
        return await tx.workflowStep.findUniqueOrThrow({
          where: { id: stepId },
          include: {
            stepProgress: {
              where: { executionId },
            },
          },
        });
      });
    } catch (error) {
      this.logger.error(`Failed to update step status for ${stepId}:`, error);
      throw error;
    }
  }

  async createStepProgress(
    stepId: string,
    executionId: string,
    roleId: string,
    taskId?: string,
  ): Promise<WorkflowStepProgress> {
    try {
      return await this.prisma.workflowStepProgress.create({
        data: {
          stepId,
          executionId,
          roleId,
          ...(taskId && { taskId: taskId }),
          status: 'NOT_STARTED',
        },
      });
    } catch (error) {
      this.logger.error(`Failed to create step progress for ${stepId}:`, error);
      throw error;
    }
  }

  async updateStepProgress(
    progressId: string,
    data: Partial<WorkflowStepProgress>,
  ): Promise<WorkflowStepProgress> {
    try {
      return await this.prisma.workflowStepProgress.update({
        where: { id: progressId },
        data: data as any,
      });
    } catch (error) {
      this.logger.error(`Failed to update step progress ${progressId}:`, error);
      throw error;
    }
  }

  async findStepProgress(
    stepId: string,
    executionId: string,
  ): Promise<WorkflowStepProgress | null> {
    try {
      return await this.prisma.workflowStepProgress.findFirst({
        where: {
          stepId,
          executionId,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to find step progress for ${stepId}, execution ${executionId}:`,
        error,
      );
      throw error;
    }
  }

  // ===================================================================
  // PRIVATE HELPER METHODS
  // ===================================================================

  private buildInclude(include?: WorkflowStepIncludeOptions): any {
    if (!include) return undefined;

    const result: any = {};

    if (include.role) {
      result.role = true;
    }

    if (include.stepProgress) {
      if (typeof include.stepProgress === 'boolean') {
        result.stepProgress = true;
      } else {
        result.stepProgress = {
          where: include.stepProgress.where,
          orderBy: include.stepProgress.orderBy,
          take: include.stepProgress.take,
        };
      }
    }

    if (include.stepGuidance) {
      if (typeof include.stepGuidance === 'boolean') {
        result.stepGuidance = true;
      } else {
        result.stepGuidance = {
          where: include.stepGuidance.where,
          orderBy: include.stepGuidance.orderBy,
        };
      }
    }

    if (include.qualityChecks) {
      if (typeof include.qualityChecks === 'boolean') {
        result.qualityChecks = true;
      } else {
        result.qualityChecks = {
          where: include.qualityChecks.where,
          orderBy: include.qualityChecks.orderBy,
        };
      }
    }

    if (include.dependencies) {
      if (typeof include.dependencies === 'boolean') {
        result.stepDependencies = true;
      } else {
        result.stepDependencies = {
          where: include.dependencies.where,
          orderBy: include.dependencies.orderBy,
        };
      }
    }

    return result;
  }
}
