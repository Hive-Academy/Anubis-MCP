import { Inject, Injectable, Logger } from '@nestjs/common';
import { ICodeReviewRepository } from '../../task-management/repositories/interfaces/code-review.repository.interface';
import { ITaskRepository } from '../../task-management/repositories/interfaces/task.repository.interface';
import { IStepProgressRepository } from '../repositories/interfaces/step-progress.repository.interface';
import { IWorkflowExecutionRepository } from '../repositories/interfaces/workflow-execution.repository.interface';
import { IWorkflowRoleRepository } from '../repositories/interfaces/workflow-role.repository.interface';
import { WorkflowExecutionService } from './workflow-execution.service';

// Configuration interfaces to eliminate hardcoding
export interface QualityGateConfig {
  testCoverageThreshold: number;
  documentationMinLength: number;
  timeoutMs: number;
  commands: {
    lint: string;
    test: string;
    testUnit: string;
    testIntegration: string;
    testE2e: string;
    testCoverage: string;
    build: string;
  };
}

export interface TransitionScoringConfig {
  baseScore: number;
  commonTransitionBonus: number;
  randomVariance: number;
  commonTransitions: string[];
}

export interface TransitionValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface AvailableTransition {
  id: string;
  transitionName: string;
  fromRole: {
    name: string;
    description: string;
  };
  toRole: {
    name: string;
    description: string;
  };
  conditions: any;
  requirements: any;
  handoffGuidance?: any;
}

@Injectable()
export class RoleTransitionService {
  private readonly logger = new Logger(RoleTransitionService.name);
  // Configuration with sensible defaults
  private readonly qualityGateConfig: QualityGateConfig = {
    testCoverageThreshold: 80,
    documentationMinLength: 100,
    timeoutMs: 30000,
    commands: {
      lint: 'npm run lint',
      test: 'npm test',
      testUnit: 'npm run test:unit',
      testIntegration: 'npm run test:integration',
      testE2e: 'npm run test:e2e',
      testCoverage: 'npm run test:coverage',
      build: 'npm run build',
    },
  };

  private readonly scoringConfig: TransitionScoringConfig = {
    baseScore: 50,
    commonTransitionBonus: 20,
    randomVariance: 30,
    commonTransitions: [
      'product_manager_to_architect',
      'architect_to_senior_developer',
      'senior_developer_to_code_review',
      'code_review_to_product_manager',
    ],
  };

  constructor(
    @Inject('IWorkflowRoleRepository')
    private readonly workflowRoleRepository: IWorkflowRoleRepository,
    @Inject('IWorkflowExecutionRepository')
    private readonly workflowExecutionRepository: IWorkflowExecutionRepository,
    @Inject('IStepProgressRepository')
    private readonly stepProgressRepository: IStepProgressRepository,
    @Inject('ITaskRepository')
    private readonly taskRepository: ITaskRepository,
    @Inject('ICodeReviewRepository')
    private readonly codeReviewRepository: ICodeReviewRepository,
    private workflowExecutionService: WorkflowExecutionService,
  ) {}

  /**
   * Get available role transitions for a given role
   */
  async getAvailableTransitions(
    fromRoleName: string,
  ): Promise<AvailableTransition[]> {
    const fromRole = await this.workflowRoleRepository.findByName(fromRoleName);

    if (!fromRole) {
      throw new Error(`Role '${fromRoleName}' not found`);
    }

    // Get transitions from the database using the repository method
    const transitions =
      await this.workflowRoleRepository.findTransitionsFromRole(fromRole.id);

    return transitions.map((transition: any) => ({
      id: transition.id,
      transitionName: transition.transitionName,
      fromRole: {
        name: fromRole.name,
        description: fromRole.description,
      },
      toRole: {
        name: transition.toRole.name,
        description: transition.toRole.description,
      },
      conditions: transition.conditions, // Populated from structured conditions
      requirements: transition.requirements, // Populated from structured requirements
      handoffGuidance: {
        contextElements: transition.contextElements,
        deliverables: transition.deliverables,
        handoffMessage: transition.handoffMessage,
      },
    }));
  }

  /**
   * Validate if a role transition can be performed
   */
  async validateTransition(
    transitionId: string,
    context: { roleId: string; taskId: string; projectPath?: string },
  ): Promise<TransitionValidationResult> {
    try {
      const transition =
        await this.workflowRoleRepository.findTransitionById(transitionId);

      if (!transition) {
        return { valid: false, errors: ['Transition not found'] };
      }

      const errors: string[] = [];
      const warnings: string[] = [];

      // Validate transition conditions using structured data
      if (
        transition.conditions &&
        (transition.conditions as { name: string; value: boolean }[]).length > 0
      ) {
        const conditionResult =
          await this.validateStructuredTransitionConditions(
            transition.conditions as { name: string; value: boolean }[],
            context,
          );
        if (!conditionResult.valid) {
          errors.push(...conditionResult.errors);
        }
        if (conditionResult.warnings) {
          warnings.push(...conditionResult.warnings);
        }
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      return {
        valid: false,
        errors: [`Validation error: ${error.message}`],
      };
    }
  }

  /**
   * Execute a role transition
   */
  async executeTransition(
    transitionId: string,
    context: { roleId: string; taskId: string; projectPath?: string },
    handoffMessage?: string,
  ): Promise<{ success: boolean; message: string; newRoleId?: string }> {
    try {
      // First validate the transition
      const validation = await this.validateTransition(transitionId, context);
      if (!validation.valid) {
        return {
          success: false,
          message: `Transition validation failed: ${validation.errors.join(', ')}`,
        };
      }

      const transition =
        await this.workflowRoleRepository.findTransitionById(transitionId);

      if (!transition) {
        return { success: false, message: 'Transition not found' };
      }

      // Record the transition in the task workflow
      await this.recordTransition(transition, context, handoffMessage);

      // Update task ownership if needed
      await this.updateTaskOwnership(
        String(context.taskId),
        transition.toRole.name,
      );

      // 🔧 FIX: Update workflow execution state after role transition
      await this.updateWorkflowExecutionStateForTransition(
        context.taskId,
        transition.toRole.id,
        handoffMessage,
      );

      return {
        success: true,
        message: `Successfully transitioned from ${transition.fromRole.description} to ${transition.toRole.description}`,
        newRoleId: transition.toRole.id,
      };
    } catch (error) {
      return {
        success: false,
        message: `Transition execution failed: ${error.message}`,
      };
    }
  }

  /**
   * Get transition history for a task
   */
  getTransitionHistory(taskId: number) {
    return this.workflowRoleRepository.findDelegationHistory(taskId.toString());
  }

  /**
   * Get recommended next transitions based on current context
   */
  async getRecommendedTransitions(
    currentRoleName: string,
    context: { roleId: string; taskId: string },
  ): Promise<AvailableTransition[]> {
    const availableTransitions =
      await this.getAvailableTransitions(currentRoleName);

    // Filter and rank transitions based on context
    const recommendedTransitions = [];

    for (const transition of availableTransitions) {
      const validation = await this.validateTransition(transition.id, context);

      // Only recommend transitions that are valid or have only warnings
      if (
        validation.valid ||
        (validation.errors.length === 0 && validation.warnings)
      ) {
        recommendedTransitions.push({
          ...transition,
          recommendationScore: this.calculateRecommendationScore(transition),
        });
      }
    }

    // Sort by recommendation score (highest first)
    return recommendedTransitions
      .sort(
        (a, b) =>
          (b as any).recommendationScore - (a as any).recommendationScore,
      )
      .slice(0, 3); // Return top 3 recommendations
  }

  // Private helper methods

  private async validateStructuredTransitionConditions(
    conditions: Array<{ name: string; value: boolean }>,
    context: { roleId: string; taskId: string; projectPath?: string },
  ): Promise<{ valid: boolean; errors: string[]; warnings?: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const condition of conditions) {
      // Validate condition based on its name and required value
      const isConditionMet = await this.checkCondition(condition.name, context);

      if (condition.value && !isConditionMet) {
        errors.push(`Required condition '${condition.name}' not met`);
      } else if (!condition.value && isConditionMet) {
        warnings.push(`Condition '${condition.name}' is met but not required`);
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  private async checkCondition(
    conditionName: string,
    context: { roleId: string; taskId: string; projectPath?: string },
  ): Promise<boolean> {
    switch (conditionName) {
      case 'allStepsCompleted':
        return this.checkAllStepsCompleted(context);
      case 'taskStatusReady':
        return this.checkTaskStatus(context, 'READY');
      case 'reviewCompleted':
        return this.checkReviewCompleted(context);
      default:
        return true; // Unknown conditions pass by default
    }
  }

  private async checkAllStepsCompleted(context: {
    roleId: string;
    taskId: string;
  }): Promise<boolean> {
    const incompleteSteps =
      await this.stepProgressRepository.findIncompleteForRole(context.roleId);
    return !incompleteSteps;
  }

  private async checkTaskStatus(
    context: { taskId: string },
    requiredStatus: string,
  ): Promise<boolean> {
    const task = await this.taskRepository.findById(Number(context.taskId));
    return task?.status === requiredStatus;
  }

  private async checkReviewCompleted(context: {
    taskId: string;
  }): Promise<boolean> {
    const review = await this.codeReviewRepository.findLatestByTaskId(
      Number(context.taskId),
    );
    return !!review;
  }

  private calculateRecommendationScore(
    transition: AvailableTransition,
  ): number {
    // This would implement sophisticated recommendation logic
    // For now, we'll use a simple scoring system
    let score = this.scoringConfig.baseScore;

    // Boost score for common transitions
    if (
      this.scoringConfig.commonTransitions.includes(transition.transitionName)
    ) {
      score += this.scoringConfig.commonTransitionBonus;
    }

    // Add randomness to simulate context-based scoring
    score += Math.random() * this.scoringConfig.randomVariance;

    return score;
  }

  /**
   * Update quality gate configuration
   */
  updateQualityGateConfig(config: Partial<QualityGateConfig>): void {
    Object.assign(this.qualityGateConfig, config);
  }

  /**
   * Update transition scoring configuration
   */
  updateScoringConfig(config: Partial<TransitionScoringConfig>): void {
    Object.assign(this.scoringConfig, config);
  }

  /**
   * Get current configuration
   */
  getConfiguration(): {
    qualityGate: QualityGateConfig;
    scoring: TransitionScoringConfig;
  } {
    return {
      qualityGate: { ...this.qualityGateConfig },
      scoring: { ...this.scoringConfig },
    };
  }

  /**
   * Update workflow execution state after role transition
   */
  private async updateWorkflowExecutionStateForTransition(
    taskId: string,
    newRoleId: string,
    handoffMessage?: string,
  ): Promise<void> {
    // Get the workflow execution for this task
    const execution = await this.workflowExecutionRepository.findByTaskId(
      Number(taskId),
    );

    if (!execution) {
      return;
    }

    // Update core fields first (simplified: no step lookup)
    await this.workflowExecutionRepository.update(execution.id, {
      currentRoleId: newRoleId,
      currentStepId: undefined, // Simplified: no step assignment
    });

    // Update state with simplified execution state
    await this.workflowExecutionService.updateExecutionState(execution.id, {
      phase: 'role_transitioned',
      lastTransition: {
        timestamp: new Date().toISOString(),
        newRoleId,
        handoffMessage: handoffMessage || 'Role transition executed',
      },
    });
  }

  /**
   * Record a role transition in the task workflow
   */
  private async recordTransition(
    transition: any,
    context: { roleId: string; taskId: string; projectPath?: string },
    handoffMessage?: string,
  ): Promise<void> {
    try {
      // Record transition in workflow execution state
      await this.updateWorkflowExecutionStateForTransition(
        context.taskId,
        transition.toRole.id,
        handoffMessage,
      );

      this.logger.log(
        `Recorded transition ${transition.id} for task ${context.taskId}`,
      );
    } catch (error) {
      this.logger.error('Failed to record transition:', error);
      throw error;
    }
  }

  /**
   * Update task ownership after role transition
   */
  private async updateTaskOwnership(
    taskId: string,
    newRoleName: string,
  ): Promise<void> {
    try {
      // Update task ownership - for now just log since we may not have ownership tracking
      this.logger.log(
        `Updated task ${taskId} ownership to role ${newRoleName}`,
      );

      // If we had task ownership tracking, we would update it here:
      await this.taskRepository.update(Number(taskId), {
        owner: newRoleName,
        currentMode: newRoleName,
      });

      return Promise.resolve();
    } catch (error) {
      this.logger.error('Failed to update task ownership:', error);
      throw error;
    }
  }
}
