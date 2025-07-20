import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from 'generated/prisma';
import { ISubtaskRepository } from '../repositories/interfaces/subtask.repository.interface';
import { UpdateSubtaskData } from '../repositories/types/subtask.types';
import { IndividualSubtaskOperationsInput } from '../schemas/individual-subtask-operations.schema';
import { SubtaskBatchService } from './subtask-batch.service';

export interface SubtaskUpdateResult {
  message: string;
}

/**
 * SubtaskUpdateService
 *
 * Responsible for:
 * - Updating individual subtasks
 * - Status transitions with validation
 * - Evidence collection during updates
 */
@Injectable()
export class SubtaskUpdateService {
  constructor(
    @Inject('ISubtaskRepository')
    private readonly subtaskRepository: ISubtaskRepository,
    private readonly subtaskBatchService: SubtaskBatchService,
  ) {}

  /**
   * Update individual subtask with evidence collection and validation
   */
  async updateSubtask(
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
    const existingSubtask = await this.subtaskRepository.findById(subtaskId);

    if (!existingSubtask || existingSubtask.taskId !== taskId) {
      throw new Error(`Subtask ${subtaskId} not found for task ${taskId}`);
    }

    // Prepare update data
    const updateFields: Prisma.SubtaskUpdateInput = {};

    // Basic subtask properties
    if (updateData.name !== undefined) {
      updateFields.name = updateData.name;
    }

    if (updateData.description !== undefined) {
      updateFields.description = updateData.description;
    }

    if (updateData.sequenceNumber !== undefined) {
      updateFields.sequenceNumber = updateData.sequenceNumber;
    }

    if (updateData.batchId !== undefined) {
      updateFields.batchId = updateData.batchId;
    }

    if (updateData.batchTitle !== undefined) {
      updateFields.batchTitle = updateData.batchTitle;
    }

    // Implementation details
    if (updateData.implementationApproach !== undefined) {
      updateFields.implementationApproach = updateData.implementationApproach;
    }

    if (updateData.acceptanceCriteria !== undefined) {
      updateFields.acceptanceCriteria = updateData.acceptanceCriteria;
    }

    // Status and completion
    if (updateData.status) {
      updateFields.status = updateData.status;
    }

    if (updateData.completionEvidence) {
      updateFields.completionEvidence = updateData.completionEvidence;
    }

    // Update the subtask
    const repositoryUpdateData: UpdateSubtaskData = {
      ...(updateFields.name && { name: updateFields.name as string }),
      ...(updateFields.description && {
        description: updateFields.description as string,
      }),
      ...(updateFields.batchId && { batchId: updateFields.batchId as string }),
      ...(updateFields.batchTitle && {
        batchTitle: updateFields.batchTitle as string,
      }),
      ...(updateFields.sequenceNumber !== undefined && {
        sequenceNumber: updateFields.sequenceNumber as number,
      }),
      ...(updateFields.implementationApproach && {
        implementationApproach: updateFields.implementationApproach as string,
      }),
      ...(updateFields.acceptanceCriteria && {
        acceptanceCriteria: updateFields.acceptanceCriteria as string[],
      }),
      ...(updateFields.status && { status: updateFields.status as string }),
      ...(updateFields.completionEvidence && {
        completionEvidence: updateFields.completionEvidence,
      }),
    };

    const updatedSubtask = await this.subtaskRepository.update(
      subtaskId,
      repositoryUpdateData,
    );

    if (updateData.status === 'completed' && updatedSubtask.batchId) {
      try {
        await this.subtaskBatchService.checkAndTriggerBatchCompletion(
          taskId,
          updatedSubtask.batchId,
        );
      } catch (_error: any) {
        // Don't fail the subtask update if batch completion check fails
      }
    }

    // Build comprehensive update message
    const updatedFields = [];
    if (updateFields.name !== undefined) updatedFields.push('name');
    if (updateFields.description !== undefined)
      updatedFields.push('description');
    if (updateFields.sequenceNumber !== undefined)
      updatedFields.push('sequenceNumber');
    if (updateFields.batchId !== undefined) updatedFields.push('batchId');
    if (updateFields.batchTitle !== undefined) updatedFields.push('batchTitle');
    if (updateFields.implementationApproach !== undefined)
      updatedFields.push('implementationApproach');
    if (updateFields.acceptanceCriteria !== undefined)
      updatedFields.push('acceptanceCriteria');
    if (updateFields.status) updatedFields.push('status');
    if (updateFields.completionEvidence)
      updatedFields.push('completionEvidence');

    const updateMessage =
      updatedFields.length > 0
        ? `Subtask '${updatedSubtask.name}' updated successfully. Fields updated: ${updatedFields.join(', ')}`
        : `Subtask '${updatedSubtask.name}' - no changes made`;

    return {
      message: updateMessage,
    };
  }
}
