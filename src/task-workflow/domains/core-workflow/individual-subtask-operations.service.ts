import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { Subtask, SubtaskDependency } from '../../../../generated/prisma';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  IndividualSubtaskOperationsInput,
  IndividualSubtaskOperationsSchema,
} from './schemas/individual-subtask-operations.schema';

// Type definitions for Prisma relations
type SubtaskWithDependencies = Subtask & {
  dependencyRelations: (SubtaskDependency & {
    dependsOnSubtask: {
      id: number;
      name: string;
      status: string;
      sequenceNumber: number;
    };
  })[];
  dependentRelations: (SubtaskDependency & {
    subtask: {
      id: number;
      name: string;
      status: string;
      sequenceNumber: number;
    };
  })[];
};

/**
 * Individual Subtask Operations Service
 *
 * Focused service for individual subtask CRUD operations with evidence collection,
 * dependency validation, and workflow coordination.
 *
 * Follows Single Responsibility Principle - handles only individual subtask operations.
 */
@Injectable()
export class IndividualSubtaskOperationsService {
  private readonly logger = new Logger(IndividualSubtaskOperationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Tool({
    name: 'individual_subtask_operations',
    description: `
Individual subtask management with evidence collection and dependency validation.

**Operations:**
- create_subtask: Create individual subtask with detailed specifications
- update_subtask: Update subtask with evidence collection
- get_subtask: Retrieve specific subtask details
- get_next_subtask: Get next available subtask based on dependencies

**Key Features:**
- Individual subtask creation with acceptance criteria
- Evidence collection per subtask completion
- Dependency validation and tracking
- Strategic guidance and technical specifications
- Automatic dependency resolution

**Examples:**
- Create: { operation: "create_subtask", taskId: "TSK-001", subtaskData: { name: "Task", description: "Desc", batchId: "B001", sequenceNumber: 1 } }
- Update: { operation: "update_subtask", taskId: "TSK-001", subtaskId: 123, updateData: { status: "completed", completionEvidence: {...} } }
- Get: { operation: "get_subtask", taskId: "TSK-001", subtaskId: 123, includeEvidence: true }
- Next: { operation: "get_next_subtask", taskId: "TSK-001", status: "not-started" }
`,
    parameters: IndividualSubtaskOperationsSchema,
  })
  async executeIndividualSubtaskOperation(
    input: IndividualSubtaskOperationsInput,
  ): Promise<any> {
    const startTime = performance.now();

    try {
      this.logger.debug(`Individual Subtask Operation: ${input.operation}`, {
        taskId: input.taskId,
        subtaskId: input.subtaskId,
      });

      let result: any;

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
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                data: result,
                metadata: {
                  operation: input.operation,
                  taskId: input.taskId,
                  subtaskId: input.subtaskId,
                  responseTime: Math.round(responseTime),
                },
              },
              null,
              2,
            ),
          },
        ],
      } as const;
    } catch (error: any) {
      this.logger.error(`Individual subtask operation failed:`, error);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: false,
                error: {
                  message: error.message,
                  code: 'INDIVIDUAL_SUBTASK_OPERATION_FAILED',
                  operation: input.operation,
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

  /**
   * Create individual subtask with detailed specifications and evidence collection
   */
  private async createSubtask(
    input: IndividualSubtaskOperationsInput,
  ): Promise<any> {
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
        taskId,
        planId: plan.id,
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
      },
      include: {
        dependencyRelations: {
          include: {
            dependsOnSubtask: {
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
  ): Promise<any> {
    const { taskId, subtaskId, updateData } = input;

    if (!subtaskId) {
      throw new Error('Subtask ID is required for individual subtask update');
    }

    if (!updateData) {
      throw new Error('Update data is required for subtask update');
    }

    // Verify subtask exists and belongs to task
    const existingSubtask = (await this.prisma.subtask.findFirst({
      where: { id: subtaskId, taskId },
      include: {
        dependencyRelations: {
          include: {
            dependsOnSubtask: {
              select: {
                id: true,
                name: true,
                status: true,
                sequenceNumber: true,
              },
            },
          },
        },
        dependentRelations: {
          include: {
            subtask: {
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
    })) as SubtaskWithDependencies | null;

    if (!existingSubtask) {
      throw new Error(`Subtask ${subtaskId} not found for task ${taskId}`);
    }

    // Validate status transition and dependencies
    if (updateData.status) {
      this.validateSubtaskStatusTransition(existingSubtask, updateData.status);
    }

    // Prepare update data
    const updateFields: any = {};

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
        dependencyRelations: {
          include: {
            dependsOnSubtask: {
              select: { id: true, name: true, status: true },
            },
          },
        },
        dependentRelations: {
          include: {
            subtask: {
              select: { id: true, name: true, status: true },
            },
          },
        },
      },
    });

    return {
      subtask: updatedSubtask,
      message: `Subtask '${updatedSubtask.name}' updated successfully to status: ${updateData.status || 'unchanged'}`,
    };
  }

  /**
   * Get specific subtask details with optional evidence
   */
  private async getSubtask(input: IndividualSubtaskOperationsInput): Promise<{
    subtask: SubtaskWithDependencies;
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
  }> {
    const { taskId, subtaskId, includeEvidence } = input;

    if (!subtaskId) {
      throw new Error('Subtask ID is required for subtask retrieval');
    }

    const subtask = (await this.prisma.subtask.findFirst({
      where: { id: subtaskId, taskId },
      include: {
        dependencyRelations: {
          include: {
            dependsOnSubtask: {
              select: {
                id: true,
                name: true,
                status: true,
                sequenceNumber: true,
              },
            },
          },
        },
        dependentRelations: {
          include: {
            subtask: {
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
    })) as SubtaskWithDependencies | null;

    if (!subtask) {
      throw new Error(`Subtask ${subtaskId} not found for task ${taskId}`);
    }

    // Format dependency information
    const dependsOn = (subtask.dependencyRelations || []).map(
      (dep) => dep.dependsOnSubtask,
    );
    const dependents = (subtask.dependentRelations || []).map(
      (dep) => dep.subtask,
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

    if (!includeEvidence) {
      // Remove evidence fields if not requested
      const { completionEvidence, ...subtaskWithoutEvidence } = subtask;
      return {
        ...result,
        subtask: subtaskWithoutEvidence as SubtaskWithDependencies,
      };
    }

    return result;
  }

  /**
   * Get next subtask in sequence based on dependencies and status
   */
  private async getNextSubtask(
    input: IndividualSubtaskOperationsInput,
  ): Promise<any> {
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
        dependencyRelations: {
          include: {
            dependsOnSubtask: {
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
      const dependencyRelations = subtask.dependencyRelations || [];
      const allDependenciesCompleted = dependencyRelations.every(
        (dep) => dep.dependsOnSubtask.status === 'completed',
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
          pendingDependencies: (s.dependencyRelations || [])
            .filter((dep) => dep.dependsOnSubtask.status !== 'completed')
            .map((dep) => dep.dependsOnSubtask?.name),
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
    taskId: string,
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
    taskId: string,
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
      subtaskId,
      dependsOnSubtaskId: dep.id,
    }));

    await this.prisma.subtaskDependency.createMany({
      data: dependencyData,
    });
  }

  /**
   * Validate subtask status transitions and dependency requirements
   */
  private validateSubtaskStatusTransition(
    subtask: SubtaskWithDependencies,
    newStatus: string,
  ): void {
    // If transitioning to in-progress or completed, check dependencies
    if (newStatus === 'in-progress' || newStatus === 'completed') {
      // Check if dependencyRelations exists and has incomplete dependencies
      const dependencyRelations = subtask.dependencyRelations || [];

      if (dependencyRelations.length > 0) {
        const incompleteDependencies = dependencyRelations.filter(
          (dep) => dep.dependsOnSubtask?.status !== 'completed',
        );

        if (incompleteDependencies.length > 0) {
          const dependencyNames = incompleteDependencies.map(
            (dep) => dep.dependsOnSubtask?.name || 'Unknown',
          );
          throw new Error(
            `Cannot transition to '${newStatus}' - incomplete dependencies: ${dependencyNames.join(', ')}`,
          );
        }
      }
    }
  }
}
