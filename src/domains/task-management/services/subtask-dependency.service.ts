import { Injectable, Inject } from '@nestjs/common';
import { Subtask } from 'generated/prisma';
import { ISubtaskRepository } from '../repositories/interfaces/subtask.repository.interface';

/**
 * SubtaskDependencyService
 *
 * Responsible for:
 * - Validating subtask dependencies
 * - Creating dependency relationships
 * - Checking dependency satisfaction
 * - Managing dependency chains
 */
@Injectable()
export class SubtaskDependencyService {
  constructor(
    @Inject('ISubtaskRepository')
    private readonly subtaskRepository: ISubtaskRepository,
  ) {}

  /**
   * Validate that dependency subtask names exist in the task
   */
  async validateSubtaskDependencies(
    taskId: number,
    dependencyNames: string[],
  ): Promise<void> {
    const existingSubtasks = await this.subtaskRepository.findByTaskId(taskId);
    const foundNames = existingSubtasks
      .filter((s) => dependencyNames.includes(s.name))
      .map((s) => s.name);

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
  async createSubtaskDependencyRelations(
    subtaskId: number,
    taskId: number,
    dependencyNames: string[],
  ): Promise<void> {
    // Get dependency subtask IDs
    const dependencySubtasks =
      await this.subtaskRepository.findByTaskId(taskId);
    const filteredDependencies = dependencySubtasks.filter((s) =>
      dependencyNames.includes(s.name),
    );

    // Create dependency relations
    for (const dep of filteredDependencies) {
      await this.subtaskRepository.createDependency(subtaskId, dep.id);
    }
  }

  /**
   * Check if a subtask's dependencies are satisfied
   */
  async checkSubtaskDependencies(subtask: Subtask): Promise<{
    canStart: boolean;
    totalDependencies: number;
    completedDependencies: number;
    pendingDependencies: string[];
  }> {
    try {
      // Get dependency relationships for this subtask
      const dependencies = await this.subtaskRepository.findDependencies(
        subtask.id,
      );

      if (dependencies.length === 0) {
        return {
          canStart: true,
          totalDependencies: 0,
          completedDependencies: 0,
          pendingDependencies: [],
        };
      }

      const completedDependencies = dependencies.filter(
        (dep) => dep.status === 'completed',
      );
      const pendingDependencies = dependencies
        .filter((dep) => dep.status !== 'completed')
        .map((dep) => dep.name);

      return {
        canStart: pendingDependencies.length === 0,
        totalDependencies: dependencies.length,
        completedDependencies: completedDependencies.length,
        pendingDependencies,
      };
    } catch (_error) {
      // If we can't check dependencies, assume we can start
      return {
        canStart: true,
        totalDependencies: 0,
        completedDependencies: 0,
        pendingDependencies: [],
      };
    }
  }

  /**
   * Validate subtask status transitions and dependency requirements
   */
  async validateSubtaskStatusTransition(
    subtask: Subtask,
    newStatus: string,
  ): Promise<void> {
    // If transitioning to in-progress or completed, check dependencies
    if (newStatus === 'in-progress' || newStatus === 'completed') {
      // Get actual dependency relationships from the database
      const dependencies = await this.subtaskRepository.findDependencies(
        subtask.id,
      );

      if (dependencies.length > 0) {
        const incompleteDependencies = dependencies.filter(
          (dep) => dep.status !== 'completed',
        );

        if (incompleteDependencies.length > 0) {
          const dependencyNames = incompleteDependencies.map((dep) => dep.name);
          throw new Error(
            `Cannot transition to '${newStatus}' - incomplete dependencies: ${dependencyNames.join(', ')}`,
          );
        }
      }
    }
  }
}
