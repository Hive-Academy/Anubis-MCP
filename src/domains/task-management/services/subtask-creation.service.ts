import { Inject, Injectable } from '@nestjs/common';
import { ISubtaskRepository } from '../repositories/interfaces/subtask.repository.interface';
import {
  SubtaskBatchData,
  SubtaskWithRelations,
} from '../repositories/types/subtask.types';
import {
  BulkSubtaskCreationResult,
  IndividualSubtaskOperationsInput,
} from '../schemas/individual-subtask-operations.schema';

export interface SubtaskCreationResult {
  message: string;
}

/**
 * SubtaskCreationService
 *
 * Responsible for:
 * - Creating individual subtasks
 * - Creating batch subtasks with optimization
 * - Validating subtask data before creation
 * - Managing subtask sequence numbers
 */
@Injectable()
export class SubtaskCreationService {
  constructor(
    @Inject('ISubtaskRepository')
    private readonly subtaskRepository: ISubtaskRepository,
  ) {}

  /**
   * Create individual subtask with detailed specifications
   */
  async createSubtask(
    input: IndividualSubtaskOperationsInput,
  ): Promise<SubtaskCreationResult> {
    const { taskId, subtaskData } = input;

    if (!subtaskData) {
      throw new Error(
        'Subtask data is required for individual subtask creation',
      );
    }

    // Create the individual subtask with enhanced evidence fields
    await this.subtaskRepository.create({
      taskId,
      name: subtaskData.name,
      description: subtaskData.description,
      sequenceNumber: subtaskData.sequenceNumber,
      status: 'not-started',
      batchId: subtaskData.batchId,
      batchTitle: subtaskData.batchTitle || 'Untitled Batch',
      acceptanceCriteria: subtaskData.acceptanceCriteria || [],
      implementationApproach: subtaskData.implementationApproach,
    });

    return {
      message: `Individual subtask '${subtaskData.name}' created successfully`,
    };
  }

  /**
   * Create multiple subtasks in batches with sequence management
   */
  async createSubtasksBatch(
    input: IndividualSubtaskOperationsInput,
  ): Promise<BulkSubtaskCreationResult> {
    const { taskId, subtasksBatchData } = input;

    if (!subtasksBatchData) {
      throw new Error('Subtasks batch data is required for bulk creation');
    }

    const { batches } = subtasksBatchData;
    const createdSubtasks: Array<{
      id: number;
      name: string;
      batchId: string;
      sequenceNumber: number;
      status: string;
    }> = [];
    const batchSummary: Array<{
      batchId: string;
      batchTitle: string;
      subtaskCount: number;
    }> = [];

    // Create subtasks using repository batch creation
    const createdSubtasksFromRepo: SubtaskWithRelations[] = [];

    for (const batch of batches) {
      const batchData: SubtaskBatchData = {
        taskId,
        batchId: batch.batchId,
        batchTitle: batch.batchTitle,
        batchDescription: batch.batchDescription || '',
        subtasks: batch.subtasks.map((subtask) => ({
          taskId,
          name: subtask.name,
          description: subtask.description,
          batchId: batch.batchId,
          batchTitle: batch.batchTitle,
          sequenceNumber: subtask.sequenceNumber,
          acceptanceCriteria: subtask.acceptanceCriteria || [],
          implementationApproach: subtask.implementationApproach || '',
        })),
      };

      const batchSubtasks = await this.subtaskRepository.createBatch(batchData);
      createdSubtasksFromRepo.push(...batchSubtasks);
    }

    // Map results to expected format
    for (const subtask of createdSubtasksFromRepo) {
      createdSubtasks.push({
        id: subtask.id,
        name: subtask.name,
        batchId: subtask.batchId!,
        sequenceNumber: subtask.sequenceNumber,
        status: subtask.status,
      });
    }

    // Build batch summary
    for (const batch of batches) {
      batchSummary.push({
        batchId: batch.batchId,
        batchTitle: batch.batchTitle,
        subtaskCount: batch.subtasks.length,
      });
    }

    return {
      message: `Successfully created ${createdSubtasks.length} subtasks across ${batchSummary.length} batches`,
    };
  }
}
