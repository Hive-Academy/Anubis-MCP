import { Injectable } from '@nestjs/common';
import { RoleTransition } from 'generated/prisma';
import { PrismaService } from '../../../prisma/prisma.service';
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
      'boomerang_to_architect',
      'architect_to_senior_developer',
      'senior_developer_to_code_review',
      'code_review_to_boomerang',
    ],
  };

  constructor(
    private prisma: PrismaService,
    private workflowExecutionService: WorkflowExecutionService,
  ) {}

  /**
   * Get available role transitions for a given role
   */
  async getAvailableTransitions(
    fromRoleName: string,
  ): Promise<AvailableTransition[]> {
    const fromRole = await this.prisma.workflowRole.findUnique({
      where: { name: fromRoleName },
    });

    if (!fromRole) {
      throw new Error(`Role '${fromRoleName}' not found`);
    }

    const transitions = await this.prisma.roleTransition.findMany({
      where: {
        fromRoleId: fromRole.id,
        isActive: true,
      },
      include: {
        fromRole: true,
        toRole: true,
      },
    });

    return transitions.map((transition) => ({
      id: transition.id,
      transitionName: transition.transitionName,
      fromRole: {
        name: transition.fromRole.name,
        description: transition.fromRole.description,
      },
      toRole: {
        name: transition.toRole.name,
        description: transition.toRole.description,
      },
      conditions: null, // Will be populated from structured conditions
      requirements: null, // Will be populated from structured requirements
      handoffGuidance: null, // Will be populated from structured data
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
      const transition = await this.prisma.roleTransition.findUnique({
        where: { id: transitionId },
        include: {
          fromRole: true,
          toRole: true,
          conditions: true,
          requirements: true,
          validationCriteria: true,
        },
      });

      if (!transition) {
        return { valid: false, errors: ['Transition not found'] };
      }

      const errors: string[] = [];
      const warnings: string[] = [];

      // Validate transition conditions using structured data
      if (transition.conditions && transition.conditions.length > 0) {
        const conditionResult =
          await this.validateStructuredTransitionConditions(
            transition.conditions,
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

      const transition = await this.prisma.roleTransition.findUnique({
        where: { id: transitionId },
        include: {
          fromRole: true,
          toRole: true,
        },
      });

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
    return this.prisma.delegationRecord.findMany({
      where: { taskId },
      orderBy: { delegationTimestamp: 'desc' },
    });
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
    const incompleteSteps = await this.prisma.workflowStepProgress.findFirst({
      where: {
        taskId: context.taskId,
        roleId: context.roleId,
        status: { not: 'COMPLETED' },
      },
    });
    return !incompleteSteps;
  }

  private async checkTaskStatus(
    context: { taskId: string },
    requiredStatus: string,
  ): Promise<boolean> {
    const task = await this.prisma.task.findUnique({
      where: { id: Number(context.taskId) },
      select: { status: true },
    });
    return task?.status === requiredStatus;
  }

  private async checkReviewCompleted(context: {
    taskId: string;
  }): Promise<boolean> {
    const review = await this.prisma.codeReview.findFirst({
      where: {
        taskId: Number(context.taskId),
        status: 'APPROVED',
      },
    });
    return !!review;
  }

  private async recordTransition(
    transition: RoleTransition & { fromRole: any; toRole: any },
    context: { roleId: string; taskId: string },
    handoffMessage?: string,
  ): Promise<void> {
    await this.prisma.delegationRecord.create({
      data: {
        taskId: Number(context.taskId),
        fromMode: transition.fromRole.name,
        toMode: transition.toRole.name,
        delegationTimestamp: new Date(),
        message:
          handoffMessage || `Transitioned via ${transition.transitionName}`,
      },
    });
  }

  private async updateTaskOwnership(
    taskId: string,
    newOwner: string,
  ): Promise<void> {
    await this.prisma.task.update({
      where: { id: parseInt(taskId) },
      data: {
        owner: newOwner,
        currentMode: newOwner,
      },
    });
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
    const execution = await this.prisma.workflowExecution.findFirst({
      where: { taskId: Number(taskId) },
      orderBy: { createdAt: 'desc' },
    });

    if (!execution) {
      return;
    }

    // Get the first step for the new role
    const firstStep = await this.prisma.workflowStep.findFirst({
      where: { roleId: newRoleId },
      orderBy: { sequenceNumber: 'asc' },
    });

    // Update core fields first
    await this.prisma.workflowExecution.update({
      where: { id: execution.id },
      data: {
        currentRoleId: newRoleId,
        currentStepId: firstStep?.id || null,
        updatedAt: new Date(),
      },
    });

    // Update executionState via helper
    await this.workflowExecutionService.updateExecutionState(execution.id, {
      phase: 'role_transitioned',
      lastTransition: {
        timestamp: new Date().toISOString(),
        newRoleId,
        handoffMessage: handoffMessage || 'Role transition executed',
      },
      ...(firstStep && {
        currentStep: {
          id: firstStep.id,
          name: firstStep.name,
          sequenceNumber: firstStep.sequenceNumber,
          assignedAt: new Date().toISOString(),
        },
      }),
    });
  }
}
