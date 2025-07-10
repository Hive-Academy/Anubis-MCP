import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import {
  ITaskRepository,
  TaskIncludeOptions,
  TaskFindManyOptions,
} from '../interfaces/task.repository.interface';
import {
  TaskWithRelations,
  TaskWithSubtasks,
  CreateTaskData,
  UpdateTaskData,
  PrismaTransaction,
} from '../types/task.types';
import { Task, Prisma } from '../../../../../generated/prisma';

@Injectable()
export class TaskRepository implements ITaskRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(
    id: number,
    include?: TaskIncludeOptions,
  ): Promise<TaskWithRelations | null> {
    return this.prisma.task.findUnique({
      where: { id },
      include: this.buildInclude(include),
    });
  }

  async findBySlug(
    slug: string,
    include?: TaskIncludeOptions,
  ): Promise<TaskWithRelations | null> {
    return this.prisma.task.findUnique({
      where: { slug },
      include: this.buildInclude(include),
    });
  }

  async create(data: CreateTaskData): Promise<TaskWithRelations> {
    const { taskDescription, codebaseAnalysis, ...taskData } = data;

    return this.prisma.$transaction(async (tx) => {
      // Ensure unique slug
      const slug = await this.ensureUniqueSlug(
        data.slug || this.generateSlug(data.name),
      );

      const task = await tx.task.create({
        data: {
          ...taskData,
          slug,
          taskDescription: taskDescription
            ? {
                create: {
                  description: taskDescription.description || '',
                  businessRequirements:
                    taskDescription.businessRequirements || '',
                  technicalRequirements:
                    taskDescription.technicalRequirements || '',
                  acceptanceCriteria: taskDescription.acceptanceCriteria || [],
                },
              }
            : undefined,
          codebaseAnalysis: codebaseAnalysis
            ? {
                create: {
                  architectureFindings:
                    codebaseAnalysis.architectureFindings || {},
                  problemsIdentified: codebaseAnalysis.problemsIdentified || {},
                  implementationContext:
                    codebaseAnalysis.implementationContext || {},
                  qualityAssessment: codebaseAnalysis.qualityAssessment || {},
                  filesCovered: codebaseAnalysis.filesCovered || [],
                  technologyStack: codebaseAnalysis.technologyStack || {},
                  analyzedBy: codebaseAnalysis.analyzedBy || 'system',
                },
              }
            : undefined,
        },
        include: {
          taskDescription: true,
          codebaseAnalysis: true,
          researchReports: true,
          subtasks: true,
        },
      });

      return task;
    });
  }

  async update(id: number, data: UpdateTaskData): Promise<TaskWithRelations> {
    const { taskDescription, codebaseAnalysis, ...taskData } = data;

    return this.prisma.$transaction(async (tx) => {
      const task = await tx.task.update({
        where: { id },
        data: {
          ...taskData,
          taskDescription: taskDescription
            ? {
                upsert: {
                  create: {
                    description: taskDescription.description || '',
                    businessRequirements:
                      taskDescription.businessRequirements || '',
                    technicalRequirements:
                      taskDescription.technicalRequirements || '',
                    acceptanceCriteria:
                      taskDescription.acceptanceCriteria || [],
                  },
                  update: {
                    description: taskDescription.description,
                    businessRequirements: taskDescription.businessRequirements,
                    technicalRequirements:
                      taskDescription.technicalRequirements,
                    acceptanceCriteria: taskDescription.acceptanceCriteria,
                  },
                },
              }
            : undefined,
          codebaseAnalysis: codebaseAnalysis
            ? {
                upsert: {
                  create: {
                    architectureFindings:
                      codebaseAnalysis.architectureFindings || {},
                    problemsIdentified:
                      codebaseAnalysis.problemsIdentified || {},
                    implementationContext:
                      codebaseAnalysis.implementationContext || {},
                    qualityAssessment: codebaseAnalysis.qualityAssessment || {},
                    filesCovered: codebaseAnalysis.filesCovered || [],
                    technologyStack: codebaseAnalysis.technologyStack || {},
                    analyzedBy: codebaseAnalysis.analyzedBy || 'system',
                  },
                  update: {
                    architectureFindings: codebaseAnalysis.architectureFindings,
                    problemsIdentified: codebaseAnalysis.problemsIdentified,
                    implementationContext:
                      codebaseAnalysis.implementationContext,
                    qualityAssessment: codebaseAnalysis.qualityAssessment,
                    filesCovered: codebaseAnalysis.filesCovered,
                    technologyStack: codebaseAnalysis.technologyStack,
                    analyzedBy: codebaseAnalysis.analyzedBy,
                  },
                },
              }
            : undefined,
        },
        include: {
          taskDescription: true,
          codebaseAnalysis: true,
          researchReports: true,
          subtasks: true,
        },
      });

      return task;
    });
  }

  async delete(id: number): Promise<Task> {
    return this.prisma.task.delete({
      where: { id },
    });
  }

  async findMany(options?: TaskFindManyOptions): Promise<TaskWithRelations[]> {
    return this.prisma.task.findMany({
      where: options?.where,
      include: this.buildInclude(options?.include),
      orderBy: options?.orderBy,
      skip: options?.skip,
      take: options?.take,
    });
  }

  async findByStatus(
    status: string,
    include?: TaskIncludeOptions,
  ): Promise<TaskWithRelations[]> {
    return this.prisma.task.findMany({
      where: { status },
      include: this.buildInclude(include),
    });
  }

  async findByPriority(
    priority: string,
    include?: TaskIncludeOptions,
  ): Promise<TaskWithRelations[]> {
    return this.prisma.task.findMany({
      where: { priority },
      include: this.buildInclude(include),
    });
  }

  async findByOwner(
    owner: string,
    include?: TaskIncludeOptions,
  ): Promise<TaskWithRelations[]> {
    return this.prisma.task.findMany({
      where: { owner },
      include: this.buildInclude(include),
    });
  }

  async findWithSubtasks(id: number): Promise<TaskWithSubtasks | null> {
    return this.prisma.task.findUnique({
      where: { id },
      include: {
        subtasks: true,
        taskDescription: true,
      },
    });
  }

  async findWithAllRelations(id: number): Promise<TaskWithRelations | null> {
    return this.prisma.task.findUnique({
      where: { id },
      include: {
        taskDescription: true,
        codebaseAnalysis: true,
        researchReports: true,
        subtasks: true,
        delegationRecords: true,
        codeReviews: true,
        completionReports: true,
        workflowExecutions: true,
      },
    });
  }

  async ensureUniqueSlug(
    baseSlug: string,
    excludeId?: number,
  ): Promise<string> {
    let slug = baseSlug;
    let counter = 1;

    while (await this.isSlugTaken(slug, excludeId)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  async isSlugTaken(slug: string, excludeId?: number): Promise<boolean> {
    const existing = await this.prisma.task.findFirst({
      where: {
        slug,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });

    return !!existing;
  }

  async count(where?: Prisma.TaskWhereInput): Promise<number> {
    return this.prisma.task.count({ where });
  }

  async createWithTransaction(
    data: CreateTaskData,
    tx?: PrismaTransaction,
  ): Promise<TaskWithRelations> {
    const prismaClient = tx || this.prisma;
    const { taskDescription, codebaseAnalysis, ...taskData } = data;

    // Ensure unique slug
    const slug = await this.ensureUniqueSlug(
      data.slug || this.generateSlug(data.name),
    );

    return prismaClient.task.create({
      data: {
        ...taskData,
        slug,
        taskDescription: taskDescription
          ? {
              create: {
                description: taskDescription.description || '',
                businessRequirements:
                  taskDescription.businessRequirements || '',
                technicalRequirements:
                  taskDescription.technicalRequirements || '',
                acceptanceCriteria: taskDescription.acceptanceCriteria || [],
              },
            }
          : undefined,
        codebaseAnalysis: codebaseAnalysis
          ? {
              create: {
                architectureFindings:
                  codebaseAnalysis.architectureFindings || {},
                problemsIdentified: codebaseAnalysis.problemsIdentified || {},
                implementationContext:
                  codebaseAnalysis.implementationContext || {},
                qualityAssessment: codebaseAnalysis.qualityAssessment || {},
                filesCovered: codebaseAnalysis.filesCovered || [],
                technologyStack: codebaseAnalysis.technologyStack || {},
                analyzedBy: codebaseAnalysis.analyzedBy || 'system',
              },
            }
          : undefined,
      },
      include: {
        taskDescription: true,
        codebaseAnalysis: true,
        researchReports: true,
        subtasks: true,
      },
    });
  }

  async updateWithTransaction(
    id: number,
    data: UpdateTaskData,
    tx?: PrismaTransaction,
  ): Promise<TaskWithRelations> {
    const prismaClient = tx || this.prisma;
    const { taskDescription, codebaseAnalysis, ...taskData } = data;

    return prismaClient.task.update({
      where: { id },
      data: {
        ...taskData,
        taskDescription: taskDescription
          ? {
              upsert: {
                create: {
                  description: taskDescription.description || '',
                  businessRequirements:
                    taskDescription.businessRequirements || '',
                  technicalRequirements:
                    taskDescription.technicalRequirements || '',
                  acceptanceCriteria: taskDescription.acceptanceCriteria || [],
                },
                update: {
                  description: taskDescription.description,
                  businessRequirements: taskDescription.businessRequirements,
                  technicalRequirements: taskDescription.technicalRequirements,
                  acceptanceCriteria: taskDescription.acceptanceCriteria,
                },
              },
            }
          : undefined,
        codebaseAnalysis: codebaseAnalysis
          ? {
              upsert: {
                create: {
                  architectureFindings:
                    codebaseAnalysis.architectureFindings || {},
                  problemsIdentified: codebaseAnalysis.problemsIdentified || {},
                  implementationContext:
                    codebaseAnalysis.implementationContext || {},
                  qualityAssessment: codebaseAnalysis.qualityAssessment || {},
                  filesCovered: codebaseAnalysis.filesCovered || [],
                  technologyStack: codebaseAnalysis.technologyStack || {},
                  analyzedBy: codebaseAnalysis.analyzedBy || 'system',
                },
                update: {
                  architectureFindings: codebaseAnalysis.architectureFindings,
                  problemsIdentified: codebaseAnalysis.problemsIdentified,
                  implementationContext: codebaseAnalysis.implementationContext,
                  qualityAssessment: codebaseAnalysis.qualityAssessment,
                  filesCovered: codebaseAnalysis.filesCovered,
                  technologyStack: codebaseAnalysis.technologyStack,
                  analyzedBy: codebaseAnalysis.analyzedBy,
                },
              },
            }
          : undefined,
      },
      include: {
        taskDescription: true,
        codebaseAnalysis: true,
        researchReports: true,
        subtasks: true,
      },
    });
  }

  private buildInclude(
    include?: TaskIncludeOptions,
  ): Prisma.TaskInclude | undefined {
    if (!include) return undefined;

    return {
      taskDescription: include.taskDescription,
      codebaseAnalysis: include.codebaseAnalysis,
      researchReports: include.researchReports,
      subtasks: include.subtasks,
      delegationRecords: include.delegationRecords,
      codeReviews: include.codeReviews,
      completionReports: include.completionReports,
      workflowExecutions: include.workflowExecutions,
    };
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
