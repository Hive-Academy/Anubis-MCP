import { Injectable, Inject } from '@nestjs/common';
import { Subtask } from 'generated/prisma';
import { ISubtaskRepository } from '../repositories/interfaces/subtask.repository.interface';
import { IndividualSubtaskOperationsInput } from '../schemas/individual-subtask-operations.schema';

export interface SubtaskWithDependencies {
  subtask: Subtask;
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
 * - Getting subtask details
 * - Finding next available subtasks
 * - Sequence-based subtask discovery
 * - Handling in-progress subtask detection
 */
@Injectable()
export class SubtaskQueryService {
  constructor(
    @Inject('ISubtaskRepository')
    private readonly subtaskRepository: ISubtaskRepository,
  ) {}

  /**
   * Get specific subtask details
   */
  async getSubtask(input: IndividualSubtaskOperationsInput): Promise<Subtask> {
    const { taskId, subtaskId } = input;

    if (!subtaskId) {
      throw new Error('Subtask ID is required for subtask retrieval');
    }

    const subtask = await this.subtaskRepository.findById(subtaskId);

    if (!subtask || subtask.taskId !== taskId) {
      throw new Error(`Subtask ${subtaskId} not found for task ${taskId}`);
    }

    return subtask;
  }

  /**
   * Get next subtask in sequence based on status
   *
   * Handles cases where only taskId is provided by finding the next subtask
   * based on sequence number and status.
   */
  async getNextSubtask(
    input: IndividualSubtaskOperationsInput,
  ): Promise<NextSubtaskResult> {
    const { taskId, status } = input;

    // Always use sequence-based approach since dependencies are removed
    return await this.findNextSubtaskBySequence(taskId, status);
  }

  /**
   * NEW: Find next subtask based on sequence number and completion status
   *
   * This method:
   * 1. FIRST checks for any in-progress subtasks (critical for workflow integrity)
   * 2. Finds the last completed subtask by sequence number
   * 3. Finds the next subtask in sequence that's not completed
   * 4. Returns the next available subtask or explains why none are available
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

      // Find the next subtask that's not completed or in-progress
      const nextSubtask = sortedSubtasks.find(
        (s) => s.status !== 'completed' && s.status !== 'in-progress',
      );

      if (!nextSubtask) {
        return {
          nextSubtask: null,
          message: 'All subtasks have been completed',
        };
      }

      return {
        nextSubtask,
        message: `Next available subtask: '${nextSubtask.name}' (sequence ${nextSubtask.sequenceNumber}) in batch ${nextSubtask.batchId}`,
      };
    } catch (error: any) {
      return {
        nextSubtask: null,
        message: `Error finding next subtask: ${error.message}`,
      };
    }
  }
}
