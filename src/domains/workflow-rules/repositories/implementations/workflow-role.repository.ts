import { Injectable, Logger } from '@nestjs/common';
import { Prisma, WorkflowRole } from '../../../../../generated/prisma';
import { PrismaService } from '../../../../prisma/prisma.service';
import { IWorkflowRoleRepository } from '../interfaces/workflow-role.repository.interface';
import {
  CreateWorkflowRoleData,
  PrismaTransaction,
  RoleCapability,
  UpdateWorkflowRoleData,
  WorkflowRoleFindManyOptions,
  WorkflowRoleIncludeOptions,
  WorkflowRoleWhereInput,
  WorkflowRoleWithRelations,
} from '../types/workflow-role.types';

@Injectable()
export class WorkflowRoleRepository implements IWorkflowRoleRepository {
  private readonly logger = new Logger(WorkflowRoleRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  // Basic CRUD Operations
  async findById(
    id: string,
    _include?: WorkflowRoleIncludeOptions,
  ): Promise<WorkflowRoleWithRelations | null> {
    try {
      return await this.prisma.workflowRole.findUnique({
        where: { id },
        include: {
          steps: {
            include: {
              stepGuidance: true,
              qualityChecks: true,
              stepDependencies: true,
            },
          },
          fromTransitions: { include: { toRole: true } },
          toTransitions: { include: { fromRole: true } },
        },
      });
    } catch (error) {
      this.logger.error(`Failed to find workflow role by id ${id}:`, error);
      throw error;
    }
  }

  async findByName(
    name: string,
    _include?: WorkflowRoleIncludeOptions,
  ): Promise<WorkflowRoleWithRelations | null> {
    try {
      return await this.prisma.workflowRole.findUnique({
        where: { name },
        include: {
          steps: {
            include: {
              stepGuidance: true,
              qualityChecks: true,
              stepDependencies: true,
            },
          },
          fromTransitions: { include: { toRole: true } },
          toTransitions: { include: { fromRole: true } },
        },
      });
    } catch (error) {
      this.logger.error(`Failed to find workflow role by name ${name}:`, error);
      throw error;
    }
  }

  async create(
    data: CreateWorkflowRoleData,
  ): Promise<WorkflowRoleWithRelations> {
    try {
      return await this.prisma.workflowRole.create({
        data,
        include: {
          steps: {
            include: {
              stepGuidance: true,
              qualityChecks: true,
              stepDependencies: true,
            },
          },
          fromTransitions: { include: { toRole: true } },
          toTransitions: { include: { fromRole: true } },
        },
      });
    } catch (error) {
      this.logger.error('Failed to create workflow role:', error);
      throw error;
    }
  }

  async update(
    id: string,
    data: UpdateWorkflowRoleData,
  ): Promise<WorkflowRoleWithRelations> {
    try {
      return await this.prisma.workflowRole.update({
        where: { id },
        data,
        include: {
          steps: {
            include: {
              stepGuidance: true,
              qualityChecks: true,
              stepDependencies: true,
            },
          },
          fromTransitions: { include: { toRole: true } },
          toTransitions: { include: { fromRole: true } },
        },
      });
    } catch (error) {
      this.logger.error(`Failed to update workflow role ${id}:`, error);
      throw error;
    }
  }

  async delete(id: string): Promise<WorkflowRole> {
    try {
      return await this.prisma.workflowRole.delete({
        where: { id },
      });
    } catch (error) {
      this.logger.error(`Failed to delete workflow role ${id}:`, error);
      throw error;
    }
  }

  // Query Operations
  async findMany(
    options?: WorkflowRoleFindManyOptions,
  ): Promise<WorkflowRoleWithRelations[]> {
    try {
      return await this.prisma.workflowRole.findMany({
        where: options?.where,
        include: this.buildInclude(options?.include),
        orderBy: options?.orderBy,
        skip: options?.skip,
        take: options?.take,
      });
    } catch (error) {
      this.logger.error('Failed to find many workflow roles:', error);
      throw error;
    }
  }

  async findActiveRoles(
    include?: WorkflowRoleIncludeOptions,
  ): Promise<WorkflowRoleWithRelations[]> {
    try {
      return await this.prisma.workflowRole.findMany({
        where: { isActive: true },
        include: this.buildInclude(include),
        orderBy: { priority: 'asc' },
      });
    } catch (error) {
      this.logger.error('Failed to find active workflow roles:', error);
      throw error;
    }
  }

  async findByPriority(
    priority: number,
    include?: WorkflowRoleIncludeOptions,
  ): Promise<WorkflowRoleWithRelations[]> {
    try {
      return await this.prisma.workflowRole.findMany({
        where: { priority },
        include: this.buildInclude(include),
        orderBy: { name: 'asc' },
      });
    } catch (error) {
      this.logger.error(
        `Failed to find workflow roles by priority ${priority}:`,
        error,
      );
      throw error;
    }
  }

  async findByPriorityRange(
    minPriority: number,
    maxPriority: number,
    include?: WorkflowRoleIncludeOptions,
  ): Promise<WorkflowRoleWithRelations[]> {
    try {
      return await this.prisma.workflowRole.findMany({
        where: {
          priority: {
            gte: minPriority,
            lte: maxPriority,
          },
        },
        include: this.buildInclude(include),
        orderBy: { priority: 'asc' },
      });
    } catch (error) {
      this.logger.error(
        `Failed to find workflow roles by priority range ${minPriority}-${maxPriority}:`,
        error,
      );
      throw error;
    }
  }

  // Role Hierarchy and Delegation
  async findRolesByHierarchy(
    orderBy: 'asc' | 'desc' = 'asc',
    include?: WorkflowRoleIncludeOptions,
  ): Promise<WorkflowRoleWithRelations[]> {
    try {
      return await this.prisma.workflowRole.findMany({
        where: { isActive: true },
        include: this.buildInclude(include),
        orderBy: { priority: orderBy },
      });
    } catch (error) {
      this.logger.error('Failed to find roles by hierarchy:', error);
      throw error;
    }
  }

  async findDelegationCandidates(
    fromRoleId: string,
    include?: WorkflowRoleIncludeOptions,
  ): Promise<WorkflowRoleWithRelations[]> {
    try {
      // Find roles that can be transitioned to from the current role
      const transitions = await this.prisma.roleTransition.findMany({
        where: { fromRoleId },
        include: {
          toRole: {
            include: this.buildInclude(include),
          },
        },
      });

      // Return the role objects directly
      return transitions.map(
        (transition) => transition.toRole as WorkflowRoleWithRelations,
      );
    } catch (error) {
      this.logger.error(
        `Failed to find delegation candidates for role ${fromRoleId}:`,
        error,
      );
      throw error;
    }
  }

  async findRolesWithTransitions(
    include?: WorkflowRoleIncludeOptions,
  ): Promise<WorkflowRoleWithRelations[]> {
    try {
      return await this.prisma.workflowRole.findMany({
        where: {
          OR: [
            { fromTransitions: { some: {} } },
            { toTransitions: { some: {} } },
          ],
        },
        include: this.buildInclude(include),
        orderBy: { priority: 'asc' },
      });
    } catch (error) {
      this.logger.error('Failed to find roles with transitions:', error);
      throw error;
    }
  }

  // Capability Management
  async getRoleCapabilities(roleId: string): Promise<RoleCapability> {
    try {
      const role = await this.prisma.workflowRole.findUnique({
        where: { id: roleId },
        select: { capabilities: true },
      });

      return (role?.capabilities as RoleCapability) || {};
    } catch (error) {
      this.logger.error(
        `Failed to get capabilities for role ${roleId}:`,
        error,
      );
      throw error;
    }
  }

  async updateRoleCapabilities(
    roleId: string,
    capabilities: RoleCapability,
  ): Promise<WorkflowRoleWithRelations> {
    try {
      return await this.prisma.workflowRole.update({
        where: { id: roleId },
        data: { capabilities },
        include: {
          steps: {
            include: {
              stepGuidance: true,
              qualityChecks: true,
              stepDependencies: true,
            },
          },
          fromTransitions: { include: { toRole: true } },
          toTransitions: { include: { fromRole: true } },
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to update capabilities for role ${roleId}:`,
        error,
      );
      throw error;
    }
  }

  async findRolesByCapability(
    capability: string,
    value?: any,
    include?: WorkflowRoleIncludeOptions,
  ): Promise<WorkflowRoleWithRelations[]> {
    try {
      const whereClause: any = {
        capabilities: {
          path: [capability],
          not: Prisma.DbNull,
        },
      };

      if (value !== undefined) {
        whereClause.capabilities.path = [capability];
        whereClause.capabilities.equals = value;
      }

      return await this.prisma.workflowRole.findMany({
        where: whereClause,
        include: this.buildInclude(include),
        orderBy: { priority: 'asc' },
      });
    } catch (error) {
      this.logger.error(
        `Failed to find roles by capability ${capability}:`,
        error,
      );
      throw error;
    }
  }

  async findRolesByResponsibility(
    responsibility: string,
    include?: WorkflowRoleIncludeOptions,
  ): Promise<WorkflowRoleWithRelations[]> {
    try {
      return await this.prisma.workflowRole.findMany({
        where: {
          coreResponsibilities: {
            path: '$',
            string_contains: responsibility,
          },
        },
        include: this.buildInclude(include),
        orderBy: { priority: 'asc' },
      });
    } catch (error) {
      this.logger.error(
        `Failed to find roles by responsibility ${responsibility}:`,
        error,
      );
      throw error;
    }
  }

  async findWithTransitions(
    roleId: string,
    _include?: WorkflowRoleIncludeOptions,
  ): Promise<WorkflowRoleWithRelations | null> {
    try {
      return await this.prisma.workflowRole.findUnique({
        where: { id: roleId },
        include: {
          steps: {
            include: {
              stepGuidance: true,
              qualityChecks: true,
              stepDependencies: true,
            },
          },
          fromTransitions: {
            include: {
              toRole: true,
            },
          },
          toTransitions: {
            include: {
              fromRole: true,
            },
          },
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to find role ${roleId} with transitions:`,
        error,
      );
      throw error;
    }
  }

  async findWithActiveExecutions(
    roleId: string,
    _include?: WorkflowRoleIncludeOptions,
  ): Promise<WorkflowRoleWithRelations | null> {
    try {
      return await this.prisma.workflowRole.findUnique({
        where: { id: roleId },
        include: {
          steps: {
            include: {
              stepGuidance: true,
              qualityChecks: true,
              stepDependencies: true,
            },
          },
          fromTransitions: {
            include: {
              toRole: true,
            },
          },
          toTransitions: {
            include: {
              fromRole: true,
            },
          },
          activeExecutions: {
            where: {
              completedAt: null,
            },
            include: {
              task: true,
              currentStep: true,
            },
          },
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to find role ${roleId} with active executions:`,
        error,
      );
      throw error;
    }
  }

  async findWithAllRelations(
    roleId: string,
  ): Promise<WorkflowRoleWithRelations | null> {
    try {
      return await this.prisma.workflowRole.findUnique({
        where: { id: roleId },
        include: {
          steps: {
            include: {
              stepGuidance: true,
              qualityChecks: true,
              stepDependencies: true,
            },
          },
          fromTransitions: {
            include: {
              toRole: true,
            },
          },
          toTransitions: {
            include: {
              fromRole: true,
            },
          },
          stepProgress: {
            include: {
              execution: true,
              step: true,
            },
          },
          activeExecutions: {
            include: {
              task: true,
              currentStep: true,
            },
          },
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to find role ${roleId} with all relations:`,
        error,
      );
      throw error;
    }
  }

  // Utility Operations
  async count(where?: WorkflowRoleWhereInput): Promise<number> {
    try {
      return await this.prisma.workflowRole.count({ where });
    } catch (error) {
      this.logger.error('Failed to count workflow roles:', error);
      throw error;
    }
  }

  async validateRoleExists(roleId: string): Promise<boolean> {
    try {
      const role = await this.prisma.workflowRole.findUnique({
        where: { id: roleId },
        select: { id: true },
      });
      return !!role;
    } catch (error) {
      this.logger.error(`Failed to validate role exists ${roleId}:`, error);
      throw error;
    }
  }

  // Transaction Support
  async createWithTransaction(
    data: CreateWorkflowRoleData,
    tx?: PrismaTransaction,
  ): Promise<WorkflowRoleWithRelations> {
    const prismaClient = tx || this.prisma;

    try {
      return await prismaClient.workflowRole.create({
        data,
        include: {
          steps: {
            include: {
              stepGuidance: true,
              qualityChecks: true,
              stepDependencies: true,
            },
          },
          fromTransitions: { include: { toRole: true } },
          toTransitions: { include: { fromRole: true } },
        },
      });
    } catch (error) {
      this.logger.error(
        'Failed to create workflow role with transaction:',
        error,
      );
      throw error;
    }
  }

  async updateWithTransaction(
    id: string,
    data: UpdateWorkflowRoleData,
    tx?: PrismaTransaction,
  ): Promise<WorkflowRoleWithRelations> {
    const prismaClient = tx || this.prisma;

    try {
      return await prismaClient.workflowRole.update({
        where: { id },
        data,
        include: {
          steps: {
            include: {
              stepGuidance: true,
              qualityChecks: true,
              stepDependencies: true,
            },
          },
          fromTransitions: { include: { toRole: true } },
          toTransitions: { include: { fromRole: true } },
        },
      });
    } catch (error) {
      this.logger.error(`Failed to update role ${id} with transaction:`, error);
      throw error;
    }
  }

  // Private helper methods
  private buildInclude(
    include?: WorkflowRoleIncludeOptions,
  ): Prisma.WorkflowRoleInclude | undefined {
    if (!include) return undefined;

    const result: Prisma.WorkflowRoleInclude = {};

    // Handle steps include
    if (include.steps !== undefined) {
      if (include.steps === true) {
        result.steps = {
          include: {
            stepGuidance: true,
            qualityChecks: true,
            stepDependencies: true,
          },
        };
      } else if (typeof include.steps === 'object') {
        result.steps = {
          include: {
            stepGuidance: include.steps.stepGuidance || true,
            qualityChecks: include.steps.qualityChecks || true,
            stepDependencies: include.steps.stepDependencies || true,
            stepProgress: include.steps.stepProgress,
          },
        };
      }
    }

    // Handle fromTransitions include
    if (include.fromTransitions !== undefined) {
      if (include.fromTransitions === true) {
        result.fromTransitions = {
          include: {
            toRole: true,
          },
        };
      } else if (typeof include.fromTransitions === 'object') {
        result.fromTransitions = {
          include: {
            toRole: include.fromTransitions.toRole || true,
          },
        };
      }
    }

    // Handle toTransitions include
    if (include.toTransitions !== undefined) {
      if (include.toTransitions === true) {
        result.toTransitions = {
          include: {
            fromRole: true,
          },
        };
      } else if (typeof include.toTransitions === 'object') {
        result.toTransitions = {
          include: {
            fromRole: include.toTransitions.fromRole || true,
          },
        };
      }
    }

    // Handle stepProgress include
    if (include.stepProgress !== undefined) {
      if (include.stepProgress === true) {
        result.stepProgress = true;
      } else if (typeof include.stepProgress === 'object') {
        result.stepProgress = {
          include: {
            execution: include.stepProgress.execution,
            step: include.stepProgress.step,
          },
        };
      }
    }

    // Handle activeExecutions include
    if (include.activeExecutions !== undefined) {
      if (include.activeExecutions === true) {
        result.activeExecutions = true;
      } else if (typeof include.activeExecutions === 'object') {
        result.activeExecutions = {
          include: {
            task: include.activeExecutions.task,
            currentStep: include.activeExecutions.currentStep,
            stepProgress: include.activeExecutions.stepProgress,
          },
        };
      }
    }

    return Object.keys(result).length > 0 ? result : undefined;
  }

  // Transition-related operations
  async findTransitionById(transitionId: string): Promise<any> {
    try {
      return await this.prisma.roleTransition.findUnique({
        where: { id: transitionId },
        include: {
          fromRole: true,
          toRole: true,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to find transition by id ${transitionId}:`,
        error,
      );
      throw error;
    }
  }

  findDelegationHistory(taskId: string): Promise<any[]> {
    try {
      // This would typically join with task workflow history
      // For now, return empty array since we don't have delegation history tracking yet
      this.logger.debug(`Finding delegation history for task ${taskId}`);
      return Promise.resolve([]);
    } catch (error) {
      this.logger.error(
        `Failed to find delegation history for task ${taskId}:`,
        error,
      );
      throw error;
    }
  }

  async findTransitionsFromRole(fromRoleId: string): Promise<any[]> {
    try {
      return await this.prisma.roleTransition.findMany({
        where: { fromRoleId },
        include: {
          toRole: true,
        },
        orderBy: { transitionName: 'asc' },
      });
    } catch (error) {
      this.logger.error(
        `Failed to find transitions from role ${fromRoleId}:`,
        error,
      );
      throw error;
    }
  }

  async findTransitionsToRole(toRoleId: string): Promise<any[]> {
    try {
      return await this.prisma.roleTransition.findMany({
        where: { toRoleId },
        include: {
          fromRole: true,
        },
        orderBy: { transitionName: 'asc' },
      });
    } catch (error) {
      this.logger.error(
        `Failed to find transitions to role ${toRoleId}:`,
        error,
      );
      throw error;
    }
  }
}
