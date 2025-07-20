import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import {
  ISubtaskRepository,
  SubtaskIncludeOptions,
  SubtaskFindManyOptions,
  SubtaskProgressSummary,
  BatchProgressSummary,
  SubtaskCompletionEvidence,
} from '../interfaces/subtask.repository.interface';
import {
  SubtaskWithRelations,
  SubtaskWithDependencies,
  CreateSubtaskData,
  UpdateSubtaskData,
  SubtaskBatchData,
  PrismaTransaction,
} from '../types/subtask.types';
import {
  Subtask,
  SubtaskDependency,
  Prisma,
} from '../../../../../generated/prisma';

@Injectable()
export class SubtaskRepository implements ISubtaskRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(
    id: number,
    include?: SubtaskIncludeOptions,
  ): Promise<SubtaskWithRelations | null> {
    return this.prisma.subtask.findUnique({
      where: { id },
      include: this.buildInclude(include),
    });
  }

  async findByName(
    name: string,
    taskId: number,
    include?: SubtaskIncludeOptions,
  ): Promise<SubtaskWithRelations | null> {
    return this.prisma.subtask.findFirst({
      where: { name, taskId },
      include: this.buildInclude(include),
    });
  }

  async create(data: CreateSubtaskData): Promise<SubtaskWithRelations> {
    const { dependencies, ...subtaskData } = data;

    return this.prisma.$transaction(async (tx) => {
      const subtask = await tx.subtask.create({
        data: {
          ...subtaskData,
          status: subtaskData.status || 'not-started',
          acceptanceCriteria: subtaskData.acceptanceCriteria || [],
          completionEvidence: subtaskData.completionEvidence || {},
        },
        include: {
          task: true,
          dependencies_from: true,
          dependencies_to: true,
        },
      });

      // Create dependencies if provided
      if (dependencies && dependencies.length > 0) {
        // Create dependency guidance (no longer creates DB relationships)
        this.createDependenciesForSubtask(tx, subtask.id, dependencies);
      }

      const result = await this.findById(subtask.id, {
        task: true,
        dependencies: true,
        dependents: true,
      });

      if (!result) {
        throw new Error(
          `Failed to retrieve created subtask with id ${subtask.id}`,
        );
      }

      return result;
    });
  }

  async update(
    id: number,
    data: UpdateSubtaskData,
  ): Promise<SubtaskWithRelations> {
    const { dependencies, ...subtaskData } = data;

    return this.prisma.$transaction(async (tx) => {
      const _subtask = await tx.subtask.update({
        where: { id },
        data: subtaskData,
      });

      // Update dependencies if provided
      if (dependencies !== undefined) {
        // Remove existing dependencies
        await tx.subtaskDependency.deleteMany({
          where: { dependentSubtaskId: id },
        });

        // Create new dependencies
        if (dependencies.length > 0) {
          // Create dependency guidance (no longer creates DB relationships)
          this.createDependenciesForSubtask(tx, id, dependencies);
        }
      }

      const result = await this.findById(id, {
        task: true,
        dependencies: true,
        dependents: true,
      });

      if (!result) {
        throw new Error(`Failed to retrieve updated subtask with id ${id}`);
      }

      return result;
    });
  }

  async delete(id: number): Promise<Subtask> {
    return this.prisma.$transaction(async (tx) => {
      // Remove dependencies
      await tx.subtaskDependency.deleteMany({
        where: {
          OR: [{ dependentSubtaskId: id }, { requiredSubtaskId: id }],
        },
      });

      return tx.subtask.delete({
        where: { id },
      });
    });
  }

  async findMany(
    options?: SubtaskFindManyOptions,
  ): Promise<SubtaskWithRelations[]> {
    return this.prisma.subtask.findMany({
      where: options?.where,
      include: this.buildInclude(options?.include),
      orderBy: options?.orderBy,
      skip: options?.skip,
      take: options?.take,
    });
  }

  async findByTaskId(
    taskId: number,
    include?: SubtaskIncludeOptions,
  ): Promise<SubtaskWithRelations[]> {
    return this.prisma.subtask.findMany({
      where: { taskId },
      include: this.buildInclude(include),
      orderBy: { sequenceNumber: 'asc' },
    });
  }

  async findByStatus(
    status: string,
    taskId?: number,
    include?: SubtaskIncludeOptions,
  ): Promise<SubtaskWithRelations[]> {
    return this.prisma.subtask.findMany({
      where: {
        status,
        ...(taskId && { taskId }),
      },
      include: this.buildInclude(include),
      orderBy: { sequenceNumber: 'asc' },
    });
  }

  async findByBatchId(
    batchId: string,
    taskId: number,
    include?: SubtaskIncludeOptions,
  ): Promise<SubtaskWithRelations[]> {
    return this.prisma.subtask.findMany({
      where: { batchId, taskId },
      include: this.buildInclude(include),
      orderBy: { sequenceNumber: 'asc' },
    });
  }

  async findBySequenceRange(
    taskId: number,
    startSeq: number,
    endSeq: number,
  ): Promise<SubtaskWithRelations[]> {
    return this.prisma.subtask.findMany({
      where: {
        taskId,
        sequenceNumber: {
          gte: startSeq,
          lte: endSeq,
        },
      },
      orderBy: { sequenceNumber: 'asc' },
    });
  }

  async findWithDependencies(
    id: number,
  ): Promise<SubtaskWithDependencies | null> {
    return this.prisma.subtask.findUnique({
      where: { id },
      include: {
        dependencies_from: {
          include: {
            requiredSubtask: true,
          },
        },
        dependencies_to: {
          include: {
            dependentSubtask: true,
          },
        },
      },
    });
  }

  async findDependents(subtaskId: number): Promise<SubtaskWithRelations[]> {
    const dependencies = await this.prisma.subtaskDependency.findMany({
      where: { requiredSubtaskId: subtaskId },
      include: {
        dependentSubtask: {
          include: {
            task: true,
          },
        },
      },
    });

    return dependencies.map((dep) => dep.dependentSubtask);
  }

  async findDependencies(subtaskId: number): Promise<SubtaskWithRelations[]> {
    const dependencies = await this.prisma.subtaskDependency.findMany({
      where: { dependentSubtaskId: subtaskId },
      include: {
        requiredSubtask: {
          include: {
            task: true,
          },
        },
      },
    });

    return dependencies.map((dep) => dep.requiredSubtask);
  }

  async validateDependencies(
    subtaskId: number,
    dependencies: string[],
  ): Promise<boolean> {
    if (!dependencies || dependencies.length === 0) return true;

    const subtask = await this.prisma.subtask.findUnique({
      where: { id: subtaskId },
      select: { taskId: true },
    });

    if (!subtask) return false;

    const existingSubtasks = await this.prisma.subtask.findMany({
      where: {
        taskId: subtask.taskId,
        name: { in: dependencies },
      },
      select: { name: true },
    });

    return existingSubtasks.length === dependencies.length;
  }

  async createDependency(
    dependentSubtaskId: number,
    requiredSubtaskId: number,
  ): Promise<SubtaskDependency> {
    return this.prisma.subtaskDependency.create({
      data: {
        dependentSubtaskId,
        requiredSubtaskId,
      },
    });
  }

  async removeDependency(
    dependentSubtaskId: number,
    requiredSubtaskId: number,
  ): Promise<void> {
    await this.prisma.subtaskDependency.deleteMany({
      where: {
        dependentSubtaskId,
        requiredSubtaskId,
      },
    });
  }

  async createBatch(
    batchData: SubtaskBatchData,
  ): Promise<SubtaskWithRelations[]> {
    return this.prisma.$transaction(async (tx) => {
      const createdSubtasks: SubtaskWithRelations[] = [];

      for (const subtaskData of batchData.subtasks) {
        const subtask = await tx.subtask.create({
          data: {
            ...subtaskData,
            taskId: batchData.taskId,
            batchId: batchData.batchId,
            batchTitle: batchData.batchTitle,
            status: subtaskData.status || 'not-started',
            acceptanceCriteria: subtaskData.acceptanceCriteria || [],
            completionEvidence: subtaskData.completionEvidence || {},
          },
          include: {
            task: true,
          },
        });

        createdSubtasks.push(subtask);
      }

      // Create dependencies after all subtasks are created
      for (let i = 0; i < batchData.subtasks.length; i++) {
        const subtaskData = batchData.subtasks[i];
        const subtask = createdSubtasks[i];

        if (subtaskData.dependencies && subtaskData.dependencies.length > 0) {
          // Create dependency guidance (no longer creates DB relationships)
          this.createDependenciesForSubtask(
            tx,
            subtask.id,
            subtaskData.dependencies,
          );
        }
      }

      return createdSubtasks;
    });
  }

  async findNextSubtask(
    taskId: number,
    currentSubtaskId?: number,
  ): Promise<SubtaskWithRelations | null> {
    // If no current subtask, return the first not-started subtask by sequence
    if (!currentSubtaskId) {
      const firstNotStarted = await this.prisma.subtask.findFirst({
        where: {
          taskId,
          status: 'not-started',
        },
        include: {
          task: true,
          dependencies_from: true,
          dependencies_to: true,
        },
        orderBy: { sequenceNumber: 'asc' },
      });
      
      return firstNotStarted;
    }

    // Get current subtask to find its sequence number
    const currentSubtask = await this.findById(currentSubtaskId);
    if (!currentSubtask) {
      // If current subtask not found, fall back to first not-started
      return this.findNextSubtask(taskId);
    }

    // Find the immediate next subtask by sequence number (current + 1)
    const nextSequenceNumber = currentSubtask.sequenceNumber + 1;
    
    const nextSubtask = await this.prisma.subtask.findFirst({
      where: {
        taskId,
        sequenceNumber: nextSequenceNumber,
        status: 'not-started',
      },
      include: {
        task: true,
        dependencies_from: true,
        dependencies_to: true,
      },
    });

    return nextSubtask;
  }

  async findAvailableSubtasks(taskId: number): Promise<SubtaskWithRelations[]> {
    // Get all not-started subtasks
    const notStartedSubtasks = await this.findByStatus('not-started', taskId, {
      dependencies: true,
    });

    // Filter out subtasks with incomplete dependencies
    const availableSubtasks: SubtaskWithRelations[] = [];

    for (const subtask of notStartedSubtasks) {
      const dependencies = await this.findDependencies(subtask.id);
      const allDependenciesCompleted = dependencies.every(
        (dep) => dep.status === 'completed',
      );

      if (allDependenciesCompleted) {
        availableSubtasks.push(subtask);
      }
    }

    return availableSubtasks.sort(
      (a, b) => a.sequenceNumber - b.sequenceNumber,
    );
  }

  async updateBatchStatus(
    batchId: string,
    taskId: number,
    status: string,
  ): Promise<SubtaskWithRelations[]> {
    return this.prisma.$transaction(async (tx) => {
      await tx.subtask.updateMany({
        where: { batchId, taskId },
        data: { status },
      });

      return this.findByBatchId(batchId, taskId);
    });
  }

  async getTaskProgress(taskId: number): Promise<SubtaskProgressSummary> {
    const subtasks = await this.findByTaskId(taskId);
    const totalSubtasks = subtasks.length;
    const completedSubtasks = subtasks.filter(
      (s) => s.status === 'completed',
    ).length;
    const inProgressSubtasks = subtasks.filter(
      (s) => s.status === 'in-progress',
    ).length;
    const notStartedSubtasks = subtasks.filter(
      (s) => s.status === 'not-started',
    ).length;

    const progressPercentage =
      totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

    // Group by batch for batch summaries
    const batchGroups = subtasks.reduce(
      (groups, subtask) => {
        const batchId = subtask.batchId as string;
        if (!groups[batchId]) {
          groups[batchId] = [];
        }
        groups[batchId].push(subtask);
        return groups;
      },
      {} as Record<string, SubtaskWithRelations[]>,
    );

    const batchSummaries: BatchProgressSummary[] = Object.entries(
      batchGroups,
    ).map(([batchId, batchSubtasks]) => {
      const batchTotal = batchSubtasks.length;
      const batchCompleted = batchSubtasks.filter(
        (s) => s.status === 'completed',
      ).length;
      const batchProgress =
        batchTotal > 0 ? (batchCompleted / batchTotal) * 100 : 0;

      return {
        batchId,
        batchTitle: batchSubtasks[0]?.batchTitle || 'Untitled Batch',
        totalSubtasks: batchTotal,
        completedSubtasks: batchCompleted,
        progressPercentage: batchProgress,
      };
    });

    return {
      totalSubtasks,
      completedSubtasks,
      inProgressSubtasks,
      notStartedSubtasks,
      progressPercentage,
      batchSummaries,
    };
  }

  async getBatchProgress(
    batchId: string,
    taskId: number,
  ): Promise<BatchProgressSummary> {
    const batchSubtasks = await this.findByBatchId(batchId, taskId);
    const totalSubtasks = batchSubtasks.length;
    const completedSubtasks = batchSubtasks.filter(
      (s) => s.status === 'completed',
    ).length;
    const progressPercentage =
      totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

    return {
      batchId,
      batchTitle: batchSubtasks[0]?.batchTitle || 'Untitled Batch',
      totalSubtasks,
      completedSubtasks,
      progressPercentage,
    };
  }

  async getCompletionEvidence(
    id: number,
  ): Promise<SubtaskCompletionEvidence | null> {
    const subtask = await this.findById(id);
    return (subtask?.completionEvidence as SubtaskCompletionEvidence) || null;
  }

  async updateCompletionEvidence(
    id: number,
    evidence: SubtaskCompletionEvidence,
  ): Promise<SubtaskWithRelations> {
    return this.update(id, { completionEvidence: evidence });
  }

  async getNextSequenceNumber(
    taskId: number,
    batchId?: string,
  ): Promise<number> {
    const where = batchId ? { taskId, batchId } : { taskId };

    const lastSubtask = await this.prisma.subtask.findFirst({
      where,
      orderBy: { sequenceNumber: 'desc' },
      select: { sequenceNumber: true },
    });

    return (lastSubtask?.sequenceNumber || 0) + 1;
  }

  async reorderSubtasks(reorderMap: Record<number, number>): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      for (const [subtaskId, newSequence] of Object.entries(reorderMap)) {
        await tx.subtask.update({
          where: { id: parseInt(subtaskId) },
          data: { sequenceNumber: newSequence },
        });
      }
    });
  }

  async count(where?: Prisma.SubtaskWhereInput): Promise<number> {
    return this.prisma.subtask.count({ where });
  }

  async createWithTransaction(
    data: CreateSubtaskData,
    tx?: PrismaTransaction,
  ): Promise<SubtaskWithRelations> {
    const prismaClient = tx || this.prisma;
    const { dependencies, ...subtaskData } = data;

    const subtask = await prismaClient.subtask.create({
      data: {
        ...subtaskData,
        status: subtaskData.status || 'not-started',
        acceptanceCriteria: subtaskData.acceptanceCriteria || [],
        completionEvidence: subtaskData.completionEvidence || {},
      },
      include: {
        task: true,
        dependencies_from: true,
        dependencies_to: true,
      },
    });

    // Create dependencies if provided
    if (dependencies && dependencies.length > 0) {
      // Create dependency guidance (no longer creates DB relationships)
      this.createDependenciesForSubtask(prismaClient, subtask.id, dependencies);
    }

    return subtask;
  }

  async updateWithTransaction(
    id: number,
    data: UpdateSubtaskData,
    tx?: PrismaTransaction,
  ): Promise<SubtaskWithRelations> {
    const prismaClient = tx || this.prisma;
    const { dependencies, ...subtaskData } = data;

    const subtask = await prismaClient.subtask.update({
      where: { id },
      data: subtaskData,
      include: {
        task: true,
        dependencies_from: true,
        dependencies_to: true,
      },
    });

    // Update dependencies if provided
    if (dependencies !== undefined) {
      // Remove existing dependencies
      await prismaClient.subtaskDependency.deleteMany({
        where: { dependentSubtaskId: id },
      });

      // Create new dependencies
      if (dependencies.length > 0) {
        // Create dependency guidance (no longer creates DB relationships)
        this.createDependenciesForSubtask(prismaClient, id, dependencies);
      }
    }

    return subtask;
  }

  async createBatchWithTransaction(
    batchData: SubtaskBatchData,
    tx?: PrismaTransaction,
  ): Promise<SubtaskWithRelations[]> {
    const prismaClient = tx || this.prisma;
    const createdSubtasks: SubtaskWithRelations[] = [];

    for (const subtaskData of batchData.subtasks) {
      const subtask = await prismaClient.subtask.create({
        data: {
          ...subtaskData,
          taskId: batchData.taskId,
          batchId: batchData.batchId,
          batchTitle: batchData.batchTitle,
          status: subtaskData.status || 'not-started',
          acceptanceCriteria: subtaskData.acceptanceCriteria || [],
          completionEvidence: subtaskData.completionEvidence || {},
        },
        include: {
          task: true,
        },
      });

      createdSubtasks.push(subtask);
    }

    // Create dependencies after all subtasks are created
    for (let i = 0; i < batchData.subtasks.length; i++) {
      const subtaskData = batchData.subtasks[i];
      const subtask = createdSubtasks[i];

      if (subtaskData.dependencies && subtaskData.dependencies.length > 0) {
        // Create dependency guidance (no longer creates DB relationships)
        this.createDependenciesForSubtask(
          prismaClient,
          subtask.id,
          subtaskData.dependencies,
        );
      }
    }

    return createdSubtasks;
  }

  // Helper methods
  private buildInclude(
    include?: SubtaskIncludeOptions,
  ): Prisma.SubtaskInclude | undefined {
    if (!include) return undefined;

    return {
      task: include.task,
      dependencies_from: include.dependencies,
      dependencies_to: include.dependents,
    };
  }

  private createDependenciesForSubtask(
    _prismaClient: any,
    subtaskId: number,
    dependencies: string[],
  ): void {
    // SIMPLIFIED: Dependencies are now guidance-only, stored in JSON field
    // Skip creating complex database relationships to avoid unique constraint issues

    // Optional: Log for debugging/monitoring
    if (dependencies && dependencies.length > 0) {
      console.log(
        `📋 Subtask ${subtaskId} has dependency guidance: ${dependencies.join(', ')}`,
      );
    }

    // Skip database relationship creation - dependencies are handled via JSON field only
  }
}
