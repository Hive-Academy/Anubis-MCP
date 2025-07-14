import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { IProgressCalculationRepository } from '../interfaces/progress-calculation.repository.interface';
import {
  TaskBasicInfo,
  RoleWithSteps,
  StepProgressWithRelations,
  ProgressCalculationResult,
  PrismaTransaction,
} from '../types/progress-calculation.types';

/**
 * Progress Calculation Repository Implementation
 *
 * FOCUSED APPROACH: Implements only the methods actually used by progress-calculator.service.ts
 * - findTaskBasicInfo: Gets basic task data
 * - findRoleWithSteps: Gets role and its ordered steps
 * - findStepProgressByTaskId: Gets step progress with relations
 */
@Injectable()
export class ProgressCalculationRepository
  implements IProgressCalculationRepository
{
  private readonly logger = new Logger(ProgressCalculationRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get basic task information by ID
   * Replaces: prisma.task.findUnique() in getTaskBasicInfo()
   */
  async findTaskBasicInfo(
    taskId: number,
    tx?: PrismaTransaction,
  ): Promise<ProgressCalculationResult<TaskBasicInfo | null>> {
    try {
      const prismaClient = tx || this.prisma;

      const task = await prismaClient.task.findUnique({
        where: { id: taskId },
        select: {
          id: true,
          name: true,
          status: true,
          createdAt: true,
        },
      });

      return {
        success: true,
        data: task,
      };
    } catch (error) {
      this.logger.error(
        `Failed to find task basic info for taskId ${taskId}:`,
        error,
      );
      return {
        success: false,
        error: `Failed to find task: ${error.message}`,
      };
    }
  }

  /**
   * Get role with its steps by role name
   * Replaces: prisma.workflowRole.findUnique() in getRoleSteps()
   */
  async findRoleWithSteps(
    roleName: string,
    tx?: PrismaTransaction,
  ): Promise<ProgressCalculationResult<RoleWithSteps | null>> {
    try {
      const prismaClient = tx || this.prisma;

      const role = await prismaClient.workflowRole.findUnique({
        where: { name: roleName },
        select: {
          id: true,
          name: true,
          steps: {
            select: {
              id: true,
              name: true,
              sequenceNumber: true,
              description: true,
              approach: true,
              roleId: true,
              isRequired: true,
              stepType: true,
            },
            orderBy: { sequenceNumber: 'asc' },
          },
        },
      });

      return {
        success: true,
        data: role,
      };
    } catch (error) {
      this.logger.error(
        `Failed to find role with steps for role ${roleName}:`,
        error,
      );
      return {
        success: false,
        error: `Failed to find role: ${error.message}`,
      };
    }
  }

  /**
   * Get step progress for a task with related step and role data
   * Replaces: prisma.workflowStepProgress.findMany() in getStepProgress()
   */
  async findStepProgressByTaskId(
    taskId: number,
    tx?: PrismaTransaction,
  ): Promise<ProgressCalculationResult<StepProgressWithRelations[]>> {
    try {
      const prismaClient = tx || this.prisma;

      const stepProgress = await prismaClient.workflowStepProgress.findMany({
        where: {
          taskId: taskId.toString(),
        },
        select: {
          id: true,
          taskId: true,
          stepId: true,
          roleId: true,
          status: true,
          result: true,
          startedAt: true,
          completedAt: true,
          failedAt: true,
          createdAt: true,
          updatedAt: true,
          step: {
            select: {
              id: true,
              name: true,
              sequenceNumber: true,
              description: true,
              approach: true,
              roleId: true,
              isRequired: true,
              stepType: true,
            },
          },
          role: {
            select: {
              id: true,
              name: true,
              description: true,
              priority: true,
              isActive: true,
              capabilities: true,
              coreResponsibilities: true,
              keyCapabilities: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      return {
        success: true,
        data: stepProgress,
      };
    } catch (error) {
      this.logger.error(
        `Failed to find step progress for taskId ${taskId}:`,
        error,
      );
      return {
        success: false,
        error: `Failed to find step progress: ${error.message}`,
      };
    }
  }
}
