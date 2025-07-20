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
import { SubtaskDependencyService } from './subtask-dependency.service';

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
 * - Managing subtask creation dependencies
 */
@Injectable()
export class SubtaskCreationService {
  constructor(
    @Inject('ISubtaskRepository')
    private readonly subtaskRepository: ISubtaskRepository,
    private readonly subtaskDependencyService: SubtaskDependencyService,
  ) {}

  /**
   * Create individual subtask with detailed specifications and evidence collection
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

    // SIMPLIFIED: Make dependencies optional guidance, not rigid requirements
    if (subtaskData.dependencies && subtaskData.dependencies.length > 0) {
      // Just store as guidance - don't create complex relationships
      console.log(
        `📋 Suggested prerequisite tasks: ${subtaskData.dependencies.join(', ')}`,
      );

      // Skip complex dependency validation and creation
      // Dependencies are stored in subtask.dependencies array for reference only
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
      dependencies: subtaskData.dependencies || [],
      implementationApproach: subtaskData.implementationApproach,
    });

    // SIMPLIFIED: No complex dependency relationship creation
    // Dependencies are stored as guidance in the subtask.dependencies JSON field
    // This avoids unique constraint issues and complex relationship management

    const dependencyCount = subtaskData.dependencies?.length || 0;
    const dependencyMessage =
      dependencyCount > 0
        ? ` (suggested prerequisites: ${subtaskData.dependencies!.join(', ')})`
        : '';

    return {
      message: `Individual subtask '${subtaskData.name}' created successfully${dependencyMessage}`,
    };
  }

  /**
   * Create multiple subtasks in batches with advanced dependency management
   */
  async createSubtasksBatch(
    input: IndividualSubtaskOperationsInput,
  ): Promise<BulkSubtaskCreationResult> {
    const { taskId, subtasksBatchData } = input;

    if (!subtasksBatchData) {
      throw new Error('Subtasks batch data is required for bulk creation');
    }

    const { batches, batchDependencies, validationOptions } = subtasksBatchData;
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
    const dependencyGraph: Array<{
      subtaskId: number;
      dependsOn: number[];
    }> = [];

    // Validation settings with defaults
    const validation = {
      validateDependencies: validationOptions?.validateDependencies ?? true,
      optimizeSequencing: validationOptions?.optimizeSequencing ?? true,
      allowParallelExecution: validationOptions?.allowParallelExecution ?? true,
    };

    // Step 1: Validate batch dependencies if enabled
    if (validation.validateDependencies && batchDependencies) {
      this.validateBatchDependencies(batches, batchDependencies);
    }

    // Step 2: Optimize batch sequencing if enabled
    let optimizedBatches = batches;
    if (validation.optimizeSequencing) {
      optimizedBatches = this.optimizeBatchSequencing(
        batches,
        batchDependencies,
      );
    }

    // Step 3: Create subtasks using repository batch creation
    const createdSubtasksFromRepo: SubtaskWithRelations[] = [];

    for (const batch of optimizedBatches) {
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
          dependencies: subtask.dependencies || [],
        })),
      };

      const batchSubtasks = await this.subtaskRepository.createBatch(batchData);
      createdSubtasksFromRepo.push(...batchSubtasks);
    }

    // Map results to expected format
    const subtaskIdMap = new Map<string, number>();
    for (const subtask of createdSubtasksFromRepo) {
      subtaskIdMap.set(subtask.name, subtask.id);
      createdSubtasks.push({
        id: subtask.id,
        name: subtask.name,
        batchId: subtask.batchId!,
        sequenceNumber: subtask.sequenceNumber,
        status: subtask.status,
      });
    }

    // Build batch summary
    for (const batch of optimizedBatches) {
      batchSummary.push({
        batchId: batch.batchId,
        batchTitle: batch.batchTitle,
        subtaskCount: batch.subtasks.length,
      });
    }

    // Build dependency graph
    for (const batch of optimizedBatches) {
      for (const subtaskData of batch.subtasks) {
        if (subtaskData.dependencies && subtaskData.dependencies.length > 0) {
          const subtaskId = subtaskIdMap.get(subtaskData.name)!;
          const dependsOn: number[] = [];

          for (const depName of subtaskData.dependencies) {
            const depId = subtaskIdMap.get(depName);
            if (depId) {
              dependsOn.push(depId);
            }
          }

          if (dependsOn.length > 0) {
            dependencyGraph.push({
              subtaskId,
              dependsOn,
            });
          }
        }
      }
    }

    // Generate validation results
    const validationResults = {
      totalSubtasks: createdSubtasks.length,
      totalBatches: batchSummary.length,
      dependenciesResolved: dependencyGraph.reduce(
        (sum, dep) => sum + dep.dependsOn.length,
        0,
      ),
      optimizationApplied: validation.optimizeSequencing,
    };

    return {
      message: `Successfully created ${validationResults.totalSubtasks} subtasks across ${validationResults.totalBatches} batches with ${validationResults.dependenciesResolved} dependencies`,
    };
  }

  /**
   * Validate batch dependencies to ensure no circular references
   */
  private validateBatchDependencies(
    batches: Array<{
      batchId: string;
      subtasks: Array<{ name: string; dependencies?: string[] }>;
    }>,
    batchDependencies?: Array<{ batchId: string; dependsOnBatches: string[] }>,
  ): void {
    if (!batchDependencies) return;

    // Create a map of all subtask names to their batch IDs
    const subtaskToBatch = new Map<string, string>();
    for (const batch of batches) {
      for (const subtask of batch.subtasks) {
        subtaskToBatch.set(subtask.name, batch.batchId);
      }
    }

    // Validate that dependencies don't create circular references
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (batchId: string): boolean => {
      if (recursionStack.has(batchId)) return true;
      if (visited.has(batchId)) return false;

      visited.add(batchId);
      recursionStack.add(batchId);

      const batchDep = batchDependencies.find((dep) => dep.batchId === batchId);
      if (batchDep) {
        for (const depBatch of batchDep.dependsOnBatches) {
          if (hasCycle(depBatch)) return true;
        }
      }

      recursionStack.delete(batchId);
      return false;
    };

    for (const batch of batches) {
      if (hasCycle(batch.batchId)) {
        throw new Error(
          `Circular dependency detected in batch dependencies involving batch: ${batch.batchId}`,
        );
      }
    }
  }

  /**
   * Optimize batch sequencing based on dependencies
   */
  private optimizeBatchSequencing(
    batches: Array<any>,
    batchDependencies?: Array<{ batchId: string; dependsOnBatches: string[] }>,
  ): Array<any> {
    if (!batchDependencies || batchDependencies.length === 0) {
      return batches; // No optimization needed
    }

    // Topological sort of batches based on dependencies
    const batchMap = new Map(batches.map((batch) => [batch.batchId, batch]));
    const inDegree = new Map<string, number>();
    const adjList = new Map<string, string[]>();

    // Initialize
    for (const batch of batches) {
      inDegree.set(batch.batchId, 0);
      adjList.set(batch.batchId, []);
    }

    // Build dependency graph
    for (const dep of batchDependencies) {
      for (const requiredBatch of dep.dependsOnBatches) {
        adjList.get(requiredBatch)?.push(dep.batchId);
        inDegree.set(dep.batchId, (inDegree.get(dep.batchId) || 0) + 1);
      }
    }

    // Topological sort
    const queue: string[] = [];
    const result: Array<any> = [];

    for (const [batchId, degree] of inDegree) {
      if (degree === 0) {
        queue.push(batchId);
      }
    }

    while (queue.length > 0) {
      const currentBatch = queue.shift()!;
      result.push(batchMap.get(currentBatch));

      for (const neighbor of adjList.get(currentBatch) || []) {
        inDegree.set(neighbor, inDegree.get(neighbor)! - 1);
        if (inDegree.get(neighbor) === 0) {
          queue.push(neighbor);
        }
      }
    }

    return result;
  }
}
