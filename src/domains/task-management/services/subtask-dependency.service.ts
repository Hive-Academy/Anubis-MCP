import { Injectable, Inject } from '@nestjs/common';
import { Subtask } from 'generated/prisma';
import { ISubtaskRepository } from '../repositories/interfaces/subtask.repository.interface';

/**
 * SubtaskDependencyService
 *
 * Responsible for:
 * - Validating subtask dependencies with helpful error messages
 * - Creating dependency relationships (idempotent - handles duplicates gracefully)
 * - Checking dependency satisfaction
 * - Managing dependency chains
 * - Providing case-insensitive and partial name matching
 */
@Injectable()
export class SubtaskDependencyService {
  constructor(
    @Inject('ISubtaskRepository')
    private readonly subtaskRepository: ISubtaskRepository,
  ) {}

  /**
   * Simplify and normalize dependency names for better user experience
   * This method can be called before validation to clean up dependency names
   */
  normalizeDependencyNames(dependencyNames: string[]): string[] {
    return dependencyNames.map((name) =>
      name
        .trim()
        .replace(/^['"`]|['"`]$/g, '') // Remove surrounding quotes
        .replace(/[_\-\s]+/g, ' ') // Normalize separators to spaces
        .replace(/\s+/g, ' ') // Remove extra spaces
        .trim(),
    );
  }

  /**
   * Validate that dependency subtask names exist in the task (with helpful suggestions)
   */
  async validateSubtaskDependencies(
    taskId: number,
    dependencyNames: string[],
  ): Promise<void> {
    const existingSubtasks = await this.subtaskRepository.findByTaskId(taskId);

    // Create a case-insensitive name mapping for better matching
    const nameMap = new Map<string, string>();
    existingSubtasks.forEach((subtask) => {
      nameMap.set(subtask.name.toLowerCase().trim(), subtask.name);
    });

    const foundNames: string[] = [];
    const missingDependencies: string[] = [];

    dependencyNames.forEach((depName) => {
      const normalizedName = depName.toLowerCase().trim();
      const actualName = nameMap.get(normalizedName);

      if (actualName) {
        foundNames.push(actualName);
      } else {
        // Try partial matching for suggestions
        const similarNames = existingSubtasks
          .filter(
            (s) =>
              s.name.toLowerCase().includes(normalizedName) ||
              normalizedName.includes(s.name.toLowerCase()),
          )
          .map((s) => s.name);

        if (similarNames.length > 0) {
          missingDependencies.push(
            `"${depName}" (did you mean: ${similarNames.join(', ')}?)`,
          );
        } else {
          missingDependencies.push(`"${depName}"`);
        }
      }
    });

    if (missingDependencies.length > 0) {
      const availableNames = existingSubtasks.map((s) => s.name).join(', ');
      throw new Error(
        `Dependency subtasks not found: ${missingDependencies.join(', ')}.\n` +
          `Available subtasks in task ${taskId}: ${availableNames}`,
      );
    }
  }

  /**
   * Create subtask dependency relationships (idempotent - handles existing dependencies gracefully)
   */
  async createSubtaskDependencyRelations(
    subtaskId: number,
    taskId: number,
    dependencyNames: string[],
  ): Promise<void> {
    // Get dependency subtask IDs with normalized name matching
    const dependencySubtasks =
      await this.subtaskRepository.findByTaskId(taskId);

    // Create a case-insensitive name mapping for better matching
    const nameMap = new Map<string, any>();
    dependencySubtasks.forEach((subtask) => {
      nameMap.set(subtask.name.toLowerCase().trim(), subtask);
    });

    // Find dependencies using normalized matching
    const filteredDependencies: any[] = [];
    dependencyNames.forEach((depName) => {
      const normalizedName = depName.toLowerCase().trim();
      const subtask = nameMap.get(normalizedName);
      if (subtask) {
        filteredDependencies.push(subtask);
      }
    });

    // Get existing dependencies to avoid duplicates
    const existingDependencies =
      await this.subtaskRepository.findDependencies(subtaskId);
    const existingDependencyIds = new Set(
      existingDependencies.map((dep) => dep.id),
    );

    // Create dependency relations only for new dependencies
    for (const dep of filteredDependencies) {
      // Skip if dependency already exists
      if (existingDependencyIds.has(dep.id)) {
        continue;
      }

      try {
        await this.subtaskRepository.createDependency(subtaskId, dep.id);
      } catch (error: any) {
        // Handle unique constraint violations gracefully
        if (
          error.code === 'P2002' ||
          error.message.includes('Unique constraint failed')
        ) {
          // Dependency already exists, skip silently
          continue;
        }
        // Re-throw other errors
        throw error;
      }
    }
  }

  /**
   * Check if a subtask's dependencies are satisfied (using JSON guidance instead of DB relationships)
   */
  async checkSubtaskDependencies(subtask: Subtask): Promise<{
    canStart: boolean;
    totalDependencies: number;
    completedDependencies: number;
    pendingDependencies: string[];
  }> {
    try {
      // NEW APPROACH: Use JSON dependencies field instead of DB relationships
      const dependencies = (subtask.dependencies as string[]) || [];

      if (dependencies.length === 0) {
        return {
          canStart: true,
          totalDependencies: 0,
          completedDependencies: 0,
          pendingDependencies: [],
        };
      }

      // Find actual subtasks in same task that match dependency names
      const taskSubtasks = await this.subtaskRepository.findByTaskId(
        subtask.taskId,
      );
      const dependencySubtasks = taskSubtasks.filter((t) =>
        dependencies.includes(t.name),
      );

      const completedDependencies = dependencySubtasks.filter(
        (dep) => dep.status === 'completed',
      );
      const pendingDependencies = dependencySubtasks
        .filter((dep) => dep.status !== 'completed')
        .map((dep) => dep.name);

      return {
        canStart: pendingDependencies.length === 0,
        totalDependencies: dependencySubtasks.length,
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
   * Validate subtask status transitions and dependency requirements (using JSON guidance)
   */
  async validateSubtaskStatusTransition(
    subtask: Subtask,
    newStatus: string,
  ): Promise<void> {
    // If transitioning to in-progress or completed, check dependencies
    if (newStatus === 'in-progress' || newStatus === 'completed') {
      // NEW APPROACH: Use JSON dependencies field instead of DB relationships
      const dependencyNames = (subtask.dependencies as string[]) || [];

      if (dependencyNames.length > 0) {
        // Find actual subtasks in same task that match dependency names
        const taskSubtasks = await this.subtaskRepository.findByTaskId(
          subtask.taskId,
        );
        const dependencySubtasks = taskSubtasks.filter((t) =>
          dependencyNames.includes(t.name),
        );

        const incompleteDependencies = dependencySubtasks.filter(
          (dep) => dep.status !== 'completed',
        );

        if (incompleteDependencies.length > 0) {
          const dependencyNamesIncomplete = incompleteDependencies.map(
            (dep) => dep.name,
          );
          throw new Error(
            `Cannot transition to '${newStatus}' - incomplete dependencies: ${dependencyNamesIncomplete.join(', ')}`,
          );
        }
      }
    }
  }
}
