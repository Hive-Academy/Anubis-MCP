import { Injectable } from '@nestjs/common';
import { Prisma, Subtask } from 'generated/prisma';
import { PrismaService } from '../../../prisma/prisma.service';
import { IndividualSubtaskOperationsInput } from './schemas/individual-subtask-operations.schema';

// Type-safe interfaces for subtask operations
export interface SubtaskOperationResult {
  success: boolean;
  data?:
    | Subtask
    | SubtaskWithDependencies
    | NextSubtaskResult
    | SubtaskCreationResult
    | SubtaskUpdateResult;
  error?: {
    message: string;
    code: string;
    operation: string;
  };
  metadata?: {
    operation: string;
    taskId: number;
    subtaskId?: number;
    responseTime: number;
  };
}

export interface SubtaskWithDependencies {
  subtask: Subtask;
  dependsOn: Array<{
    id: number;
    name: string;
    status: string;
    sequenceNumber: number;
  }>;
  dependents: Array<{
    id: number;
    name: string;
    status: string;
    sequenceNumber: number;
  }>;
  dependencyStatus: {
    totalDependencies: number;
    completedDependencies: number;
    canStart: boolean;
  };
}

export interface NextSubtaskResult {
  nextSubtask: Subtask | null;
  message: string;
  blockedSubtasks?: Array<{
    id: number;
    name: string;
    pendingDependencies: string[];
  }>;
}

export interface SubtaskCreationResult {
  subtask: Subtask;
  message: string;
}

export interface SubtaskUpdateResult {
  subtask: Subtask;
  message: string;
  batchCompletionInfo?: {
    batchId: string | null;
    batchCompleted: boolean;
    automaticCompletionTriggered: boolean;
    completionMessage: string;
    aggregatedEvidence?: {
      completionSummary: string;
      filesModified: string[];
      implementationNotes: string;
      totalSubtasks: number;
      completedSubtasks: number;
      automaticCompletion: boolean;
      completedAt: string;
    };
  } | null;
}

// Type definitions for batch completion detection
interface BatchCompletionResult {
  batchCompleted: boolean;
  completionTriggered: boolean;
  aggregatedEvidence?: {
    completionSummary: string;
    filesModified: string[];
    implementationNotes: string;
    totalSubtasks: number;
    completedSubtasks: number;
    automaticCompletion: boolean;
    completedAt: string;
  };
  message: string;
}

/**
 * Individual Subtask Operations Service (Internal)
 *
 * Internal service for individual subtask management with evidence collection
 * and dependency validation. No longer exposed as MCP tool - used by
 * workflow-rules MCP interface.
 *
 * SOLID Principles Applied:
 * - Single Responsibility: Focused on individual subtask operations only
 * - Open/Closed: Extensible through input schema without modifying core logic
 * - Liskov Substitution: Consistent interface for all subtask operations
 * - Interface Segregation: Clean separation of subtask concerns
 * - Dependency Inversion: Depends on PrismaService abstraction
 */
@Injectable()
export class IndividualSubtaskOperationsService {
  constructor(private readonly prisma: PrismaService) {}

  async executeIndividualSubtaskOperation(
    input: IndividualSubtaskOperationsInput,
  ): Promise<SubtaskOperationResult> {
    const startTime = performance.now();

    try {
      let result:
        | Subtask
        | SubtaskWithDependencies
        | NextSubtaskResult
        | SubtaskCreationResult
        | SubtaskUpdateResult;

      switch (input.operation) {
        case 'create_subtask':
          result = await this.createSubtask(input);
          break;
        case 'update_subtask':
          result = await this.updateSubtask(input);
          break;
        case 'get_subtask':
          result = await this.getSubtask(input);
          break;
        case 'get_next_subtask':
          result = await this.getNextSubtask(input);
          break;
        default:
          throw new Error(`Unknown operation: ${String(input.operation)}`);
      }

      const responseTime = performance.now() - startTime;

      return {
        success: true,
        data: result,
        metadata: {
          operation: input.operation,
          taskId: input.taskId,
          subtaskId: input.subtaskId,
          responseTime: Math.round(responseTime),
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message,
          code: 'SUBTASK_OPERATION_FAILED',
          operation: input.operation,
        },
      };
    }
  }

  /**
   * Create individual subtask with detailed specifications and evidence collection
   */
  private async createSubtask(
    input: IndividualSubtaskOperationsInput,
  ): Promise<SubtaskCreationResult> {
    const { taskId, subtaskData } = input;

    if (!subtaskData) {
      throw new Error(
        'Subtask data is required for individual subtask creation',
      );
    }

    // Get the implementation plan
    const plan = await this.prisma.implementationPlan.findFirst({
      where: { taskId },
    });

    if (!plan) {
      throw new Error(`Implementation plan not found for task ${taskId}`);
    }

    // Validate dependencies if provided
    if (subtaskData.dependencies && subtaskData.dependencies.length > 0) {
      await this.validateSubtaskDependencies(taskId, subtaskData.dependencies);
    }

    // Create the individual subtask with enhanced evidence fields
    const subtask = await this.prisma.subtask.create({
      data: {
        task: { connect: { id: taskId } },
        implementationPlan: { connect: { id: plan.id } },
        name: subtaskData.name,
        description: subtaskData.description,
        sequenceNumber: subtaskData.sequenceNumber,
        status: 'not-started',
        batchId: subtaskData.batchId,
        batchTitle: subtaskData.batchTitle || 'Untitled Batch',
        estimatedDuration: subtaskData.estimatedDuration,

        // Enhanced evidence collection fields
        acceptanceCriteria: subtaskData.acceptanceCriteria || [],
        technicalSpecifications: subtaskData.technicalSpecifications || {},
        dependencies: subtaskData.dependencies || [],

        // Strategic guidance
        strategicGuidance: subtaskData.strategicGuidance || {},
      } satisfies Prisma.SubtaskCreateInput,
      include: {
        dependencies_from: {
          include: {
            requiredSubtask: {
              select: { id: true, name: true, status: true },
            },
          },
        },
      },
    });

    // Create dependency relationships if specified
    if (subtaskData.dependencies && subtaskData.dependencies.length > 0) {
      await this.createSubtaskDependencyRelations(
        subtask.id,
        taskId,
        subtaskData.dependencies,
      );
    }

    return {
      subtask,
      message: `Individual subtask '${subtaskData.name}' created successfully with ${subtaskData.dependencies?.length || 0} dependencies`,
    };
  }

  /**
   * Update individual subtask with evidence collection
   */
  private async updateSubtask(
    input: IndividualSubtaskOperationsInput,
  ): Promise<SubtaskUpdateResult> {
    const { taskId, subtaskId, updateData } = input;

    if (!subtaskId) {
      throw new Error('Subtask ID is required for individual subtask update');
    }

    if (!updateData) {
      throw new Error('Update data is required for subtask update');
    }

    // Verify subtask exists and belongs to task
    const existingSubtask = await this.prisma.subtask.findFirst({
      where: { id: subtaskId, taskId },
      include: {
        dependencies_from: {
          include: {
            requiredSubtask: {
              select: {
                id: true,
                name: true,
                status: true,
                sequenceNumber: true,
              },
            },
          },
        },
        dependencies_to: {
          include: {
            dependentSubtask: {
              select: {
                id: true,
                name: true,
                status: true,
                sequenceNumber: true,
              },
            },
          },
        },
      },
    });

    if (!existingSubtask) {
      throw new Error(`Subtask ${subtaskId} not found for task ${taskId}`);
    }

    // Validate status transition and dependencies
    if (updateData.status) {
      await this.validateSubtaskStatusTransition(
        existingSubtask,
        updateData.status,
      );
    }

    // Prepare update data
    const updateFields: Prisma.SubtaskUpdateInput = {};

    if (updateData.status) {
      updateFields.status = updateData.status;

      if (updateData.status === 'completed') {
        updateFields.completedAt = new Date();
        updateFields.actualDuration = updateData.completionEvidence?.duration;
      } else if (updateData.status === 'in-progress') {
        updateFields.startedAt = new Date();
      }
    }

    if (updateData.completionEvidence) {
      updateFields.completionEvidence = updateData.completionEvidence;
    }

    // Update the subtask
    const updatedSubtask = await this.prisma.subtask.update({
      where: { id: subtaskId },
      data: updateFields,
      include: {
        dependencies_from: {
          include: {
            requiredSubtask: {
              select: { id: true, name: true, status: true },
            },
          },
        },
        dependencies_to: {
          include: {
            dependentSubtask: {
              select: { id: true, name: true, status: true },
            },
          },
        },
      },
    });

    // Enhanced: Trigger automatic batch completion detection when subtask is completed
    let batchCompletionResult = null;
    if (updateData.status === 'completed' && updatedSubtask.batchId) {
      try {
        batchCompletionResult = await this.checkAndTriggerBatchCompletion(
          taskId,
          updatedSubtask.batchId,
        );
      } catch (_error: any) {
        // Don't fail the subtask update if batch completion check fails
      }
    }

    return {
      subtask: updatedSubtask,
      message: `Subtask '${updatedSubtask.name}' updated successfully to status: ${updateData.status || 'unchanged'}`,

      // Enhanced: Include batch completion information
      batchCompletionInfo: batchCompletionResult
        ? {
            batchId: updatedSubtask.batchId,
            batchCompleted: batchCompletionResult.batchCompleted,
            automaticCompletionTriggered:
              batchCompletionResult.completionTriggered,
            completionMessage: batchCompletionResult.message,
            aggregatedEvidence: batchCompletionResult.aggregatedEvidence,
          }
        : null,
    };
  }

  /**
   * Get specific subtask details with optional evidence
   */
  private async getSubtask(
    input: IndividualSubtaskOperationsInput,
  ): Promise<SubtaskWithDependencies> {
    const { taskId, subtaskId } = input;

    if (!subtaskId) {
      throw new Error('Subtask ID is required for subtask retrieval');
    }

    const subtask = await this.prisma.subtask.findFirst({
      where: { id: subtaskId, taskId },
      include: {
        dependencies_from: {
          include: {
            requiredSubtask: {
              select: {
                id: true,
                name: true,
                status: true,
                sequenceNumber: true,
              },
            },
          },
        },
        dependencies_to: {
          include: {
            dependentSubtask: {
              select: {
                id: true,
                name: true,
                status: true,
                sequenceNumber: true,
              },
            },
          },
        },
      },
    });

    if (!subtask) {
      throw new Error(`Subtask ${subtaskId} not found for task ${taskId}`);
    }

    // Format dependency information
    const dependsOn = (subtask.dependencies_from || []).map(
      (dep) => dep.requiredSubtask,
    );
    const dependents = (subtask.dependencies_to || []).map(
      (dep) => dep.dependentSubtask,
    );

    const result = {
      subtask,
      dependsOn,
      dependents,
      dependencyStatus: {
        totalDependencies: dependsOn.length,
        completedDependencies: dependsOn.filter(
          (dep) => dep.status === 'completed',
        ).length,
        canStart: dependsOn.every((dep) => dep.status === 'completed'),
      },
    };

    return result;
  }

  /**
   * Get next subtask in sequence based on dependencies and status
   */
  private async getNextSubtask(
    input: IndividualSubtaskOperationsInput,
  ): Promise<NextSubtaskResult> {
    const { taskId, currentSubtaskId, status } = input;

    // Build where clause for filtering
    const whereClause: any = { taskId };

    if (status) {
      whereClause.status = status;
    } else {
      // Default to not-started or in-progress subtasks
      whereClause.status = { in: ['not-started', 'in-progress'] };
    }

    // Get all eligible subtasks
    const subtasks = await this.prisma.subtask.findMany({
      where: whereClause,
      include: {
        dependencies_from: {
          include: {
            requiredSubtask: {
              select: { id: true, name: true, status: true },
            },
          },
        },
      },
      orderBy: [{ batchId: 'asc' }, { sequenceNumber: 'asc' }],
    });

    if (subtasks.length === 0) {
      return {
        nextSubtask: null,
        message: 'No eligible subtasks found',
      };
    }

    // Find next subtask that can be started (all dependencies completed)
    const nextSubtask = subtasks.find((subtask) => {
      // Skip current subtask if specified
      if (currentSubtaskId && subtask.id === currentSubtaskId) {
        return false;
      }

      // Check if all dependencies are completed
      const dependencies_from = subtask.dependencies_from || [];
      const allDependenciesCompleted = dependencies_from.every(
        (dep) => dep.requiredSubtask.status === 'completed',
      );

      return allDependenciesCompleted;
    });

    if (!nextSubtask) {
      return {
        nextSubtask: null,
        message: 'No subtasks available - all have incomplete dependencies',
        blockedSubtasks: subtasks.map((s) => ({
          id: s.id,
          name: s.name,
          pendingDependencies: (s.dependencies_from || [])
            .filter((dep) => dep.requiredSubtask.status !== 'completed')
            .map((dep) => dep.requiredSubtask?.name),
        })),
      };
    }

    return {
      nextSubtask,
      message: `Next available subtask: '${nextSubtask.name}' in batch ${nextSubtask.batchId}`,
    };
  }

  // Helper methods for dependency validation and management

  /**
   * Validate that dependency subtask names exist in the task
   */
  private async validateSubtaskDependencies(
    taskId: number,
    dependencyNames: string[],
  ): Promise<void> {
    const existingSubtasks = await this.prisma.subtask.findMany({
      where: {
        taskId,
        name: { in: dependencyNames },
      },
      select: { name: true },
    });

    const foundNames = existingSubtasks.map((s) => s.name);
    const missingDependencies = dependencyNames.filter(
      (name) => !foundNames.includes(name),
    );

    if (missingDependencies.length > 0) {
      throw new Error(
        `Dependency subtasks not found: ${missingDependencies.join(', ')}`,
      );
    }
  }

  /**
   * Create subtask dependency relationships
   */
  private async createSubtaskDependencyRelations(
    subtaskId: number,
    taskId: number,
    dependencyNames: string[],
  ): Promise<void> {
    // Get dependency subtask IDs
    const dependencySubtasks = await this.prisma.subtask.findMany({
      where: {
        taskId,
        name: { in: dependencyNames },
      },
      select: { id: true, name: true },
    });

    // Create dependency relations
    const dependencyData = dependencySubtasks.map((dep) => ({
      dependentSubtaskId: subtaskId,
      requiredSubtaskId: dep.id,
    }));

    await this.prisma.subtaskDependency.createMany({
      data: dependencyData,
    });
  }

  /**
   * Validate subtask status transitions and dependency requirements
   */
  private async validateSubtaskStatusTransition(
    subtask: Subtask,
    newStatus: string,
  ): Promise<void> {
    // If transitioning to in-progress or completed, check dependencies
    if (newStatus === 'in-progress' || newStatus === 'completed') {
      // Get actual dependency relationships from the database
      const dependencies = await this.prisma.subtaskDependency.findMany({
        where: { dependentSubtaskId: subtask.id },
        include: {
          requiredSubtask: {
            select: { id: true, name: true, status: true },
          },
        },
      });

      if (dependencies.length > 0) {
        const incompleteDependencies = dependencies.filter(
          (dep) => dep.requiredSubtask.status !== 'completed',
        );

        if (incompleteDependencies.length > 0) {
          const dependencyNames = incompleteDependencies.map(
            (dep) => dep.requiredSubtask.name,
          );
          throw new Error(
            `Cannot transition to '${newStatus}' - incomplete dependencies: ${dependencyNames.join(', ')}`,
          );
        }
      }
    }
  }

  /**
   * Check and trigger batch completion detection
   *
   * This method checks if all subtasks in a batch are completed and provides
   * aggregated evidence collection for batch completion tracking.
   */
  private async checkAndTriggerBatchCompletion(
    taskId: number,
    batchId: string,
  ): Promise<BatchCompletionResult> {
    try {
      // Get all subtasks in the batch
      const subtasks = await this.prisma.subtask.findMany({
        where: { taskId, batchId },
        orderBy: { sequenceNumber: 'asc' },
      });

      if (subtasks.length === 0) {
        return {
          batchCompleted: false,
          completionTriggered: false,
          message: `No subtasks found for batch ${batchId}`,
        };
      }

      // Check if all subtasks are completed
      const allCompleted = subtasks.every(
        (subtask) => subtask.status === 'completed',
      );

      if (!allCompleted) {
        const completedCount = subtasks.filter(
          (s) => s.status === 'completed',
        ).length;
        return {
          batchCompleted: false,
          completionTriggered: false,
          message: `Batch ${batchId} not ready for completion: ${completedCount}/${subtasks.length} subtasks completed`,
        };
      }

      // All subtasks are completed - prepare aggregated evidence
      const filesModified = this.extractFilesModifiedFromSubtasks(subtasks);
      const implementationNotes =
        this.generateBatchImplementationNotes(subtasks);
      const completionSummary = `Automatic batch completion: All ${subtasks.length} subtasks completed successfully`;

      return {
        batchCompleted: true,
        completionTriggered: true,
        aggregatedEvidence: {
          completionSummary,
          filesModified,
          implementationNotes,
          totalSubtasks: subtasks.length,
          completedSubtasks: subtasks.length,
          automaticCompletion: true,
          completedAt: new Date().toISOString(),
        },
        message: `Batch ${batchId} automatically completed - all ${subtasks.length} subtasks finished`,
      };
    } catch (error: any) {
      return {
        batchCompleted: false,
        completionTriggered: false,
        message: `Error checking batch completion: ${error.message}`,
      };
    }
  }

  /**
   * Extract all files modified across subtasks in the batch
   */
  private extractFilesModifiedFromSubtasks(subtasks: Subtask[]): string[] {
    const allFiles = new Set<string>();

    subtasks.forEach((subtask) => {
      const evidence = subtask.completionEvidence as {
        filesModified?: string[];
      } | null;
      if (evidence?.filesModified) {
        evidence.filesModified.forEach((file: string) => {
          allFiles.add(file);
        });
      }
    });

    return Array.from(allFiles);
  }

  /**
   * Generate implementation notes summarizing the batch completion
   */
  private generateBatchImplementationNotes(subtasks: Subtask[]): string {
    const completedSubtasks = subtasks.filter((s) => s.status === 'completed');
    const notes = [
      `Batch completed with ${completedSubtasks.length} subtasks:`,
    ];

    completedSubtasks.forEach((subtask) => {
      notes.push(`- ${subtask.name}: ${subtask.description}`);
    });

    notes.push('All acceptance criteria met and evidence collected.');
    return notes.join('\n');
  }
}
