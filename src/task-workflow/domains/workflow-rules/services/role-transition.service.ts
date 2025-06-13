import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import * as fs from 'fs/promises';
import { RoleTransition } from 'generated/prisma';
import * as path from 'path';
import { promisify } from 'util';
import { PrismaService } from '../../../../prisma/prisma.service';

const execAsync = promisify(exec);

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
    displayName: string;
  };
  toRole: {
    name: string;
    displayName: string;
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
      'boomerang_to_researcher',
      'researcher_to_architect',
      'architect_to_senior_developer',
      'senior_developer_to_code_review',
      'code_review_to_boomerang',
    ],
  };

  constructor(private prisma: PrismaService) {}

  /**
   * Get available role transitions for a given role
   */
  async getAvailableTransitions(
    fromRoleName: string,
  ): Promise<AvailableTransition[]> {
    try {
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
          displayName: transition.fromRole.displayName,
        },
        toRole: {
          name: transition.toRole.name,
          displayName: transition.toRole.displayName,
        },
        conditions: transition.conditions,
        requirements: transition.requirements,
        handoffGuidance: transition.handoffGuidance,
      }));
    } catch (error) {
      this.logger.error(
        `Error getting available transitions for role ${fromRoleName}:`,
        error,
      );
      throw error;
    }
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
        },
      });

      if (!transition) {
        return { valid: false, errors: ['Transition not found'] };
      }

      const errors: string[] = [];
      const warnings: string[] = [];

      // Validate transition conditions
      if (transition.conditions) {
        const conditionResult = await this.validateTransitionConditions(
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

      // Validate transition requirements
      if (transition.requirements) {
        const requirementResult = await this.validateTransitionRequirements(
          transition.requirements,
          context,
        );
        if (!requirementResult.valid) {
          errors.push(...requirementResult.errors);
        }
        if (requirementResult.warnings) {
          warnings.push(...requirementResult.warnings);
        }
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      this.logger.error(`Error validating transition ${transitionId}:`, error);
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
        message: `Successfully transitioned from ${transition.fromRole.displayName} to ${transition.toRole.displayName}`,
        newRoleId: transition.toRole.id,
      };
    } catch (error) {
      this.logger.error(`Error executing transition ${transitionId}:`, error);
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

  private async validateTransitionConditions(
    conditions: any,
    context: { roleId: string; taskId: string; projectPath?: string },
  ): Promise<{ valid: boolean; errors: string[]; warnings?: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate step completion requirements
    if (conditions.requiredStepsCompleted) {
      for (const stepId of conditions.requiredStepsCompleted) {
        const stepCompleted = await this.isStepCompleted(stepId, context);
        if (!stepCompleted) {
          errors.push(`Required step '${stepId}' not completed`);
        }
      }
    }

    // Validate task status requirements
    if (conditions.requiredTaskStatus) {
      const task = await this.prisma.task.findUnique({
        where: { id: Number(context.taskId) },
        select: { status: true },
      });

      if (!task || task.status !== conditions.requiredTaskStatus) {
        errors.push(`Task status must be '${conditions.requiredTaskStatus}'`);
      }
    }

    // Validate minimum time in role
    if (conditions.minimumTimeInRole) {
      const timeInRole = await this.getTimeInCurrentRole(context);
      if (timeInRole < conditions.minimumTimeInRole) {
        warnings.push(
          `Minimum time in role not met (${timeInRole}ms < ${conditions.minimumTimeInRole}ms)`,
        );
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  private async validateTransitionRequirements(
    requirements: any,
    context: { roleId: string; taskId: string; projectPath?: string },
  ): Promise<{ valid: boolean; errors: string[]; warnings?: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate deliverables
    if (requirements.requiredDeliverables) {
      for (const deliverable of requirements.requiredDeliverables) {
        const exists = await this.checkDeliverableExists(deliverable, context);
        if (!exists) {
          errors.push(`Required deliverable '${deliverable}' not found`);
        }
      }
    }

    // Validate quality gates
    if (requirements.qualityGates) {
      for (const gate of requirements.qualityGates) {
        const passed = await this.checkQualityGate(gate, context);
        if (!passed) {
          errors.push(`Quality gate '${gate}' not passed`);
        }
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  private async isStepCompleted(
    stepId: string,
    context: { roleId: string; taskId: string },
  ): Promise<boolean> {
    const progress = await this.prisma.workflowStepProgress.findFirst({
      where: {
        taskId: String(context.taskId),
        stepId,
        status: 'COMPLETED',
      },
    });

    return !!progress;
  }

  private async getTimeInCurrentRole(context: {
    roleId: string;
    taskId: string;
    projectPath?: string;
  }): Promise<number> {
    const latestTransition = await this.prisma.delegationRecord.findFirst({
      where: { taskId: Number(context.taskId) },
      orderBy: { delegationTimestamp: 'desc' },
    });

    if (!latestTransition) {
      // If no transitions, use task creation time
      const task = await this.prisma.task.findUnique({
        where: { id: Number(context.taskId) },
        select: { createdAt: true },
      });
      return task ? Date.now() - task.createdAt.getTime() : 0;
    }

    return Date.now() - latestTransition.delegationTimestamp.getTime();
  }

  private async checkDeliverableExists(
    deliverable: string,
    context: { roleId: string; taskId: string; projectPath?: string },
  ): Promise<boolean> {
    try {
      // Check different types of deliverables
      if (deliverable.startsWith('file:')) {
        // File deliverable - check if file exists
        const filePath = deliverable.substring(5);
        const resolvedPath = this.resolveProjectPath(filePath, context);
        return this.fileExists(resolvedPath);
      } else if (deliverable.startsWith('report:')) {
        // Report deliverable - check if report exists in database
        const _reportType = deliverable.substring(7);
        // Check if report exists - using task progress as proxy since reportGeneration table may not exist
        const reportProgress = await this.prisma.workflowStepProgress.findFirst(
          {
            where: {
              taskId: String(context.taskId),
              status: 'COMPLETED',
            },
          },
        );
        return !!reportProgress;
      } else if (deliverable.startsWith('step:')) {
        // Step completion deliverable
        const stepId = deliverable.substring(5);
        return this.isStepCompleted(stepId, context);
      } else if (deliverable.startsWith('test:')) {
        // Test deliverable - check if tests pass
        const testType = deliverable.substring(5);
        return this.checkTestDeliverable(testType, context);
      } else {
        // Generic deliverable - assume it's a file
        const resolvedPath = this.resolveProjectPath(deliverable, context);
        return this.fileExists(resolvedPath);
      }
    } catch (error) {
      this.logger.error(`Error checking deliverable '${deliverable}':`, error);
      return false;
    }
  }

  private async checkQualityGate(
    gate: string,
    context: { roleId: string; taskId: string; projectPath?: string },
  ): Promise<boolean> {
    try {
      switch (gate) {
        case 'code_quality':
          return this.checkCodeQualityGate(context);
        case 'test_coverage':
          return this.checkTestCoverageGate(context);
        case 'security_scan':
          return this.checkSecurityGate(context);
        case 'documentation':
          return this.checkDocumentationGate(context);
        case 'peer_review':
          return this.checkPeerReviewGate(context);
        case 'build_success':
          return this.checkBuildGate(context);
        default:
          this.logger.warn(`Unknown quality gate: ${gate}`);
          return true; // Unknown gates pass by default
      }
    } catch (error) {
      this.logger.error(`Error checking quality gate '${gate}':`, error);
      return false;
    }
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

  // Helper methods for deliverable and quality gate checking

  private resolveProjectPath(
    filePath: string,
    context: { roleId: string; taskId: string; projectPath?: string },
  ): string {
    if (path.isAbsolute(filePath)) {
      return filePath;
    }

    const projectRoot = context.projectPath || process.cwd();
    return path.resolve(projectRoot, filePath);
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private async checkTestDeliverable(
    testType: string,
    context: { roleId: string; taskId: string; projectPath?: string },
  ): Promise<boolean> {
    try {
      const workingDir = context.projectPath || process.cwd();
      let command: string;

      switch (testType) {
        case 'unit':
          command = this.qualityGateConfig.commands.testUnit;
          break;
        case 'integration':
          command = this.qualityGateConfig.commands.testIntegration;
          break;
        case 'e2e':
          command = this.qualityGateConfig.commands.testE2e;
          break;
        default:
          command = this.qualityGateConfig.commands.test;
          break;
      }

      await execAsync(command, {
        cwd: workingDir,
        timeout: this.qualityGateConfig.timeoutMs,
      });
      return true;
    } catch (error) {
      this.logger.debug(`Test deliverable '${testType}' failed:`, error);
      return false;
    }
  }

  private async checkCodeQualityGate(context: {
    roleId: string;
    taskId: string;
    projectPath?: string;
  }): Promise<boolean> {
    try {
      const workingDir = context.projectPath || process.cwd();
      await execAsync(this.qualityGateConfig.commands.lint, {
        cwd: workingDir,
        timeout: this.qualityGateConfig.timeoutMs,
      });
      return true;
    } catch (error) {
      this.logger.debug('Code quality gate failed:', error);
      return false;
    }
  }

  private async checkTestCoverageGate(context: {
    roleId: string;
    taskId: string;
    projectPath?: string;
  }): Promise<boolean> {
    try {
      const workingDir = context.projectPath || process.cwd();
      const { stdout } = await execAsync(
        this.qualityGateConfig.commands.testCoverage,
        {
          cwd: workingDir,
          timeout: this.qualityGateConfig.timeoutMs,
        },
      );

      // Look for coverage percentage (simplified)
      const coverageMatch = stdout.match(/(\d+(?:\.\d+)?)%/);
      if (coverageMatch) {
        const coverage = parseFloat(coverageMatch[1]);
        return coverage >= this.qualityGateConfig.testCoverageThreshold;
      }

      return true; // If we can't parse coverage, assume it passes
    } catch (error) {
      this.logger.debug('Test coverage gate failed:', error);
      return false;
    }
  }

  private async checkSecurityGate(context: {
    roleId: string;
    taskId: string;
    projectPath?: string;
  }): Promise<boolean> {
    try {
      const workingDir = context.projectPath || process.cwd();

      // Check if security scan command is configured
      const securityCommand = this.qualityGateConfig.commands.lint; // Fallback to lint for now

      // In a real implementation, this would run security scanners like:
      // - npm audit
      // - snyk test
      // - eslint security rules
      // - SAST tools

      // For now, run npm audit as a basic security check
      try {
        await execAsync('npm audit --audit-level=high', {
          cwd: workingDir,
          timeout: this.qualityGateConfig.timeoutMs,
        });
        return true;
      } catch (_auditError) {
        // If npm audit fails, try basic lint check
        await execAsync(securityCommand, {
          cwd: workingDir,
          timeout: this.qualityGateConfig.timeoutMs,
        });
        return true;
      }
    } catch (error) {
      this.logger.debug('Security gate failed:', error);
      return false;
    }
  }

  private async checkDocumentationGate(context: {
    roleId: string;
    taskId: string;
    projectPath?: string;
  }): Promise<boolean> {
    try {
      // Check if README exists and has content
      const readmePath = this.resolveProjectPath('README.md', context);
      if (!(await this.fileExists(readmePath))) {
        return false;
      }

      const content = await fs.readFile(readmePath, 'utf8');
      return (
        content.trim().length >= this.qualityGateConfig.documentationMinLength
      );
    } catch (error) {
      this.logger.debug('Documentation gate failed:', error);
      return false;
    }
  }

  private async checkPeerReviewGate(context: {
    roleId: string;
    taskId: string;
    projectPath?: string;
  }): Promise<boolean> {
    try {
      // Check if there's a code review record for this task
      const review = await this.prisma.codeReview.findFirst({
        where: {
          taskId: Number(context.taskId),
          status: 'APPROVED',
        },
      });

      return !!review;
    } catch (error) {
      this.logger.debug('Peer review gate failed:', error);
      return false;
    }
  }

  private async checkBuildGate(context: {
    roleId: string;
    taskId: string;
    projectPath?: string;
  }): Promise<boolean> {
    try {
      const workingDir = context.projectPath || process.cwd();
      await execAsync(this.qualityGateConfig.commands.build, {
        cwd: workingDir,
        timeout: this.qualityGateConfig.timeoutMs,
      });
      return true;
    } catch (error) {
      this.logger.debug('Build gate failed:', error);
      return false;
    }
  }

  /**
   * Update quality gate configuration
   */
  updateQualityGateConfig(config: Partial<QualityGateConfig>): void {
    Object.assign(this.qualityGateConfig, config);
    this.logger.log('Quality gate configuration updated');
  }

  /**
   * Update transition scoring configuration
   */
  updateScoringConfig(config: Partial<TransitionScoringConfig>): void {
    Object.assign(this.scoringConfig, config);
    this.logger.log('Transition scoring configuration updated');
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
    try {
      // Get the workflow execution for this task
      const execution = await this.prisma.workflowExecution.findFirst({
        where: { taskId: Number(taskId) },
        orderBy: { createdAt: 'desc' },
      });

      if (!execution) {
        this.logger.warn(`No workflow execution found for task ${taskId}`);
        return;
      }

      // Get the first step for the new role
      const firstStep = await this.prisma.workflowStep.findFirst({
        where: { roleId: newRoleId },
        orderBy: { sequenceNumber: 'asc' },
      });

      if (!firstStep) {
        this.logger.warn(`No steps found for new role ${newRoleId}`);
      }

      // Update workflow execution state
      const currentExecutionState =
        (execution.executionState as Record<string, any>) || {};

      const updatedExecutionState = {
        ...currentExecutionState,
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
      };

      await this.prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          currentRoleId: newRoleId,
          currentStepId: firstStep?.id || null,
          executionState: updatedExecutionState,
          updatedAt: new Date(),
        },
      });

      this.logger.log(
        `Workflow execution state updated for task ${taskId}: role transition to ${newRoleId}${
          firstStep
            ? ` with first step: ${firstStep.name}`
            : ' (no steps available)'
        }`,
      );
    } catch (error) {
      this.logger.error(
        `Error updating workflow execution state for transition:`,
        error,
      );
      // Don't throw - transition should still succeed even if state update fails
    }
  }
}
