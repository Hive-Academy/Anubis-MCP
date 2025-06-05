import { Injectable } from '@nestjs/common';
import {
  ImplementationPlanWithRelations,
  SubtaskWithRelations,
} from '../../shared/types';

@Injectable()
export class ImplementationPlanAnalyzerService {
  /**
   * Analyze plan execution progress and metrics
   */
  analyzePlanExecution(subtasks: SubtaskWithRelations[]) {
    const totalSubtasks = subtasks.length;
    const completedSubtasks = subtasks.filter(
      (s) => s.status === 'completed',
    ).length;
    const completionPercentage =
      totalSubtasks > 0
        ? Math.round((completedSubtasks / totalSubtasks) * 100)
        : 0;

    const batchSummary = this.calculateBatchSummary(subtasks);
    const estimatedEffort = this.calculateEstimatedEffort(subtasks);

    return {
      totalSubtasks,
      completedSubtasks,
      completionPercentage,
      batchSummary,
      estimatedEffort,
    };
  }

  /**
   * Generate execution guidance and recommendations
   */
  generateExecutionGuidance(
    implementationPlans: ImplementationPlanWithRelations[],
    subtasks: SubtaskWithRelations[],
  ) {
    const nextSteps = this.identifyNextSteps(subtasks);
    const dependencies = this.extractDependencies(implementationPlans);
    const riskFactors = this.assessRiskFactors(implementationPlans, subtasks);
    const qualityChecks = this.generateQualityChecks(implementationPlans);

    return {
      nextSteps,
      dependencies,
      riskFactors,
      qualityChecks,
    };
  }

  /**
   * Calculate complexity score for the implementation
   */
  calculateComplexityScore(
    implementationPlans: ImplementationPlanWithRelations[],
    subtasks: SubtaskWithRelations[],
  ): number {
    let complexityScore = 0;

    // Base complexity from number of subtasks
    complexityScore += subtasks.length * 2;

    // Complexity from file modifications
    const totalFiles = implementationPlans.reduce(
      (sum, plan) => sum + plan.filesToModify.length,
      0,
    );
    complexityScore += totalFiles * 3;

    // Complexity from technical decisions
    const technicalDecisionComplexity = implementationPlans.reduce(
      (sum, plan) => {
        return sum + Object.keys(plan.technicalDecisions || {}).length * 5;
      },
      0,
    );
    complexityScore += technicalDecisionComplexity;

    return Math.min(100, Math.round(complexityScore));
  }

  private calculateBatchSummary(subtasks: SubtaskWithRelations[]) {
    const batchGroups = subtasks.reduce(
      (groups, subtask) => {
        const batchId = subtask.batchId || 'default';
        if (!groups[batchId]) {
          groups[batchId] = [];
        }
        groups[batchId].push(subtask);
        return groups;
      },
      {} as Record<string, SubtaskWithRelations[]>,
    );

    return Object.entries(batchGroups).map(([batchId, batchSubtasks]) => {
      const completedCount = batchSubtasks.filter(
        (s) => s.status === 'completed',
      ).length;
      const inProgressCount = batchSubtasks.filter(
        (s) => s.status === 'in-progress',
      ).length;

      let status: 'not-started' | 'in-progress' | 'completed';
      if (completedCount === batchSubtasks.length) {
        status = 'completed';
      } else if (inProgressCount > 0 || completedCount > 0) {
        status = 'in-progress';
      } else {
        status = 'not-started';
      }

      return {
        batchId,
        taskCount: batchSubtasks.length,
        completedCount,
        status,
      };
    });
  }

  private calculateEstimatedEffort(subtasks: SubtaskWithRelations[]) {
    // Simple effort estimation based on subtask count and complexity
    const totalHours = subtasks.length * 4; // 4 hours per subtask average
    const completedSubtasks = subtasks.filter(
      (s) => s.status === 'completed',
    ).length;
    const remainingHours = (subtasks.length - completedSubtasks) * 4;
    const complexityScore = Math.min(100, subtasks.length * 5);

    return {
      totalHours,
      remainingHours,
      complexityScore,
    };
  }

  private identifyNextSteps(subtasks: SubtaskWithRelations[]): string[] {
    const nextSteps: string[] = [];

    // Find next subtasks to work on
    const notStartedSubtasks = subtasks
      .filter((s) => s.status === 'not-started')
      .sort((a, b) => a.sequenceNumber - b.sequenceNumber)
      .slice(0, 3);

    nextSteps.push(
      ...notStartedSubtasks.map((s) => `Start subtask: ${s.name}`),
    );

    // Check for stuck in-progress tasks
    const inProgressSubtasks = subtasks.filter(
      (s) => s.status === 'in-progress',
    );
    if (inProgressSubtasks.length > 0) {
      nextSteps.push('Review in-progress subtasks for completion');
    }

    return nextSteps.length > 0 ? nextSteps : ['All subtasks completed'];
  }

  private extractDependencies(
    implementationPlans: ImplementationPlanWithRelations[],
  ): string[] {
    const dependencies: string[] = [];

    implementationPlans.forEach((plan) => {
      // Extract dependencies from technical decisions
      if (
        typeof plan.technicalDecisions === 'object' &&
        plan.technicalDecisions
      ) {
        const deps = plan.technicalDecisions['dependencies'] as string[];
        if (Array.isArray(deps)) {
          dependencies.push(...deps);
        }
      }

      // Extract from files to modify (external dependencies)
      plan.filesToModify.forEach((file) => {
        if (file.includes('external') || file.includes('third-party')) {
          dependencies.push(`External dependency: ${file}`);
        }
      });
    });

    return [...new Set(dependencies)];
  }

  private assessRiskFactors(
    implementationPlans: ImplementationPlanWithRelations[],
    subtasks: SubtaskWithRelations[],
  ) {
    const risks: Array<{
      risk: string;
      impact: 'low' | 'medium' | 'high';
      mitigation: string;
    }> = [];

    // High number of files to modify
    const totalFiles = implementationPlans.reduce(
      (sum, plan) => sum + plan.filesToModify.length,
      0,
    );
    if (totalFiles > 10) {
      risks.push({
        risk: 'High number of file modifications',
        impact: 'medium',
        mitigation: 'Break down into smaller batches and test incrementally',
      });
    }

    // Complex subtask dependencies
    if (subtasks.length > 15) {
      risks.push({
        risk: 'Complex implementation with many subtasks',
        impact: 'high',
        mitigation: 'Ensure clear batch organization and frequent reviews',
      });
    }

    return risks;
  }

  private generateQualityChecks(
    implementationPlans: ImplementationPlanWithRelations[],
  ): string[] {
    const checks: string[] = [
      'Unit tests for all new functionality',
      'Integration tests for modified components',
      'Code review for all changes',
    ];

    // Add specific checks based on files being modified
    const hasServices = implementationPlans.some((plan) =>
      plan.filesToModify.some((file) => file.includes('.service.')),
    );
    if (hasServices) {
      checks.push('Service dependency injection validation');
    }

    const hasControllers = implementationPlans.some((plan) =>
      plan.filesToModify.some((file) => file.includes('.controller.')),
    );
    if (hasControllers) {
      checks.push('API endpoint testing and documentation');
    }

    return checks;
  }
}
