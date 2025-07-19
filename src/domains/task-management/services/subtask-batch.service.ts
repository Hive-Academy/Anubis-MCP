import { Injectable, Inject } from '@nestjs/common';
import { Subtask } from 'generated/prisma';
import { ISubtaskRepository } from '../repositories/interfaces/subtask.repository.interface';

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
  };
  message: string;
}

/**
 * SubtaskBatchService
 *
 * Responsible for:
 * - Batch completion detection
 * - Aggregated evidence collection
 * - Batch status management
 * - Cross-subtask completion logic
 */
@Injectable()
export class SubtaskBatchService {
  constructor(
    @Inject('ISubtaskRepository')
    private readonly subtaskRepository: ISubtaskRepository,
  ) {}

  /**
   * Check and trigger batch completion detection
   *
   * This method checks if all subtasks in a batch are completed and provides
   * aggregated evidence collection for batch completion tracking.
   */
  async checkAndTriggerBatchCompletion(
    taskId: number,
    batchId: string,
  ): Promise<BatchCompletionResult> {
    try {
      // Get all subtasks in the batch
      const subtasks = await this.subtaskRepository.findByBatchId(
        batchId,
        taskId,
      );

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
