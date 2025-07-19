import { Injectable, Inject } from '@nestjs/common';
import { Subtask } from 'generated/prisma';
import { ISubtaskRepository } from '../repositories/interfaces/subtask.repository.interface';
import { IndividualSubtaskOperationsInput } from '../schemas/individual-subtask-operations.schema';
import { SubtaskDependencyService } from './subtask-dependency.service';

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

/**
 * SubtaskQueryService
 *
 * Responsible for:
 * - Getting subtask details with dependencies
 * - Finding next available subtasks
 * - Sequence-based subtask discovery
 * - Handling in-progress subtask detection
 */
@Injectable()
export class SubtaskQueryService {
  constructor(
    @Inject('ISubtaskRepository')
    private readonly subtaskRepository: ISubtaskRepository,
    private readonly subtaskDependencyService: SubtaskDependencyService,
  ) {}

  /**
   * Get specific subtask details with optional evidence
   */
  async getSubtask(
    input: IndividualSubtaskOperationsInput,
  ): Promise<SubtaskWithDependencies> {
    const { taskId, subtaskId } = input;

    if (!subtaskId) {
      throw new Error('Subtask ID is required for subtask retrieval');
    }

    const subtask =
      await this.subtaskRepository.findWithDependencies(subtaskId);

    if (!subtask || subtask.taskId !== taskId) {
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
   *
   * ENHANCED: Handles cases where only taskId is provided by finding the last completed
   * subtask and determining the next one based on sequence number and dependencies.
   */
  async getNextSubtask(
    input: IndividualSubtaskOperationsInput,
  ): Promise<NextSubtaskResult> {
    const { taskId, currentSubtaskId, status } = input;

    // ENHANCED: Handle case where only taskId is provided
    if (!currentSubtaskId) {
      return await this.findNextSubtaskBySequence(taskId, status);
    }

    // Original logic: Use repository to find next eligible subtask
    const nextSubtask = await this.subtaskRepository.findNextSubtask(
      taskId,
      currentSubtaskId,
    );

    if (!nextSubtask) {
      // Fallback to sequence-based approach
      return await this.findNextSubtaskBySequence(taskId, status);
    }

    return {
      nextSubtask,
      message: `Next available subtask: '${nextSubtask.name}' in batch ${nextSubtask.batchId}`,
    };
  }

  /**
   * NEW: Find next subtask based on sequence number and completion status
   *
   * This method:
   * 1. FIRST checks for any in-progress subtasks (critical for workflow integrity)
   * 2. Finds the last completed subtask by sequence number
   * 3. Finds the next subtask in sequence that's not completed
   * 4. Validates that all dependencies are met
   * 5. Returns the next available subtask or explains why none are available
   */
  async findNextSubtaskBySequence(
    taskId: number,
    _status?: string | string[],
  ): Promise<NextSubtaskResult> {
    try {
      // Get all subtasks for this task, ordered by sequence number
      const allSubtasks = await this.subtaskRepository.findByTaskId(taskId);

      if (allSubtasks.length === 0) {
        return {
          nextSubtask: null,
          message: 'No subtasks found for this task',
        };
      }

      // Sort by sequence number to ensure correct order
      const sortedSubtasks = allSubtasks.sort(
        (a, b) => a.sequenceNumber - b.sequenceNumber,
      );

      // 🚨 CRITICAL: Check for in-progress subtasks FIRST
      const inProgressSubtasks = sortedSubtasks.filter(
        (s) => s.status === 'in-progress',
      );

      if (inProgressSubtasks.length > 0) {
        // Return first in-progress subtask, don't start new ones
        const inProgressSubtask = inProgressSubtasks[0];
        return {
          nextSubtask: inProgressSubtask,
          message: `Resuming in-progress subtask: '${inProgressSubtask.name}' (sequence ${inProgressSubtask.sequenceNumber}) - complete this before starting new subtasks`,
        };
      }

      // Find the last completed subtask
      const lastCompletedSubtask = sortedSubtasks
        .filter((s) => s.status === 'completed')
        .pop(); // Get the last one in sequence

      let startSequence = 0;
      if (lastCompletedSubtask) {
        startSequence = lastCompletedSubtask.sequenceNumber;
      }

      // Find the next subtask that's not completed, starting from the sequence after last completed
      const candidateSubtasks = sortedSubtasks.filter(
        (s) =>
          s.sequenceNumber > startSequence &&
          s.status !== 'completed' &&
          s.status !== 'in-progress', // Exclude in-progress (already handled above)
      );

      if (candidateSubtasks.length === 0) {
        return {
          nextSubtask: null,
          message: 'All subtasks have been completed',
        };
      }

      // Check each candidate subtask for dependency readiness
      for (const candidate of candidateSubtasks) {
        const dependencyCheck =
          await this.subtaskDependencyService.checkSubtaskDependencies(
            candidate,
          );

        if (dependencyCheck.canStart) {
          return {
            nextSubtask: candidate,
            message: `Next available subtask: '${candidate.name}' (sequence ${candidate.sequenceNumber}) in batch ${candidate.batchId}`,
          };
        }
      }

      // If no subtasks are ready due to dependencies, return blocked subtasks info
      const blockedSubtasks =
        await this.getBlockedSubtasksInfo(candidateSubtasks);

      return {
        nextSubtask: null,
        message:
          'No subtasks available - all remaining subtasks have incomplete dependencies',
        blockedSubtasks,
      };
    } catch (error: any) {
      return {
        nextSubtask: null,
        message: `Error finding next subtask: ${error.message}`,
      };
    }
  }

  /**
   * Get detailed information about blocked subtasks
   */
  async getBlockedSubtasksInfo(subtasks: Subtask[]): Promise<
    Array<{
      id: number;
      name: string;
      pendingDependencies: string[];
    }>
  > {
    const blockedInfo = [];

    for (const subtask of subtasks) {
      const dependencyCheck =
        await this.subtaskDependencyService.checkSubtaskDependencies(subtask);

      blockedInfo.push({
        id: subtask.id,
        name: subtask.name,
        pendingDependencies: dependencyCheck.pendingDependencies,
      });
    }

    return blockedInfo;
  }
}
