import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import {
  ProgressCalculationResult,
  ProgressMetrics,
} from '../types/progress-calculator.types';
import { createErrorResult } from '../utils/type-safety.utils';
import { WorkflowGuidance } from './workflow-guidance.service';

@Injectable()
export class ProgressCalculatorService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculate real-time progress from database with type safety
   */
  async calculateProgress(
    taskId: number,
    guidance: WorkflowGuidance,
    currentStepId?: string | null,
  ): Promise<ProgressCalculationResult> {
    try {
      // Get basic task information
      const task = await this.getTaskBasicInfo(taskId);
      if (!task) {
        return {
          success: true,
          metrics: this.getDefaultProgress(),
          context: {
            taskId,
            roleName: guidance.currentRole.name,
            stepId: currentStepId || null,
          },
        };
      }

      // Get role steps and progress data
      const [roleSteps, stepProgress] = await Promise.all([
        this.getRoleSteps(guidance.currentRole.name),
        this.getStepProgress(taskId),
      ]);

      // Calculate progress metrics with type safety
      const currentStepProgress = this.calculateCurrentStepProgress(
        currentStepId || null,
        stepProgress,
      );
      const roleProgress = this.calculateRoleProgress(
        roleSteps,
        stepProgress,
        guidance.currentRole.name,
      );
      const overallProgress = this.calculateOverallProgress(
        stepProgress,
        roleSteps.length,
      );

      // Calculate additional metrics
      const completedSteps = this.countCompletedSteps(stepProgress);
      const totalSteps = roleSteps.length;
      const estimatedTimeRemaining = this.estimateTimeRemaining(roleProgress);
      const nextMilestone = this.getNextMilestone(guidance.currentRole.name);

      const metrics: ProgressMetrics = {
        currentStepProgress,
        roleProgress,
        overallProgress,
        completedSteps,
        totalSteps,
        estimatedTimeRemaining,
        nextMilestone,
      };

      return {
        success: true,
        metrics,
        context: {
          taskId,
          roleName: guidance.currentRole.name,
          stepId: currentStepId || null,
        },
      };
    } catch (error) {
      return createErrorResult(error, 'Progress calculation failed');
    }
  }

  /**
   * Get basic task information from database
   */
  private async getTaskBasicInfo(taskId: number) {
    return await this.prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true,
      },
    });
  }

  /**
   * Get steps for a specific role from database
   */
  private async getRoleSteps(roleName: string) {
    const role = await this.prisma.workflowRole.findUnique({
      where: { name: roleName },
      include: {
        steps: {
          orderBy: { sequenceNumber: 'asc' },
        },
      },
    });

    return role?.steps || [];
  }

  /**
   * Get step progress for task
   */
  private async getStepProgress(taskId: number) {
    return await this.prisma.workflowStepProgress.findMany({
      where: {
        taskId: taskId.toString(),
      },
      include: {
        step: true,
        role: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Calculate current step progress with type safety
   */
  private calculateCurrentStepProgress(
    currentStepId: string | null,
    stepProgress: any[],
  ): number {
    if (!currentStepId) {
      return 0;
    }

    // Find current step progress
    const currentProgress = stepProgress.find(
      (progress) => progress.step.id === currentStepId,
    );

    if (!currentProgress) {
      return 0;
    }

    // Calculate progress based on status
    switch (currentProgress.status) {
      case 'completed':
        return 100;
      case 'in_progress':
        return 50; // Default to 50% for in-progress steps
      case 'failed':
        return 0;
      default:
        return 0;
    }
  }

  /**
   * Calculate role progress with type safety
   */
  private calculateRoleProgress(
    roleSteps: any[],
    stepProgress: any[],
    currentRoleName: string,
  ): number {
    if (roleSteps.length === 0) {
      return 0;
    }

    // Filter progress for current role
    const roleProgress = stepProgress.filter(
      (progress) => progress.role.name === currentRoleName,
    );

    // Count completed steps
    const completedSteps = roleProgress.filter(
      (progress) => progress.status === 'completed',
    ).length;

    // Add partial progress for in-progress steps
    const inProgressSteps = roleProgress.filter(
      (progress) => progress.status === 'in_progress',
    ).length;

    const totalProgress = completedSteps + inProgressSteps * 0.5;
    return Math.round((totalProgress / roleSteps.length) * 100);
  }

  /**
   * Calculate overall workflow progress
   */
  private calculateOverallProgress(
    stepProgress: any[],
    totalRoleSteps: number,
  ): number {
    if (totalRoleSteps === 0) {
      return 0;
    }

    // Count completed steps across all roles
    const completedSteps = stepProgress.filter(
      (progress) => progress.status === 'completed',
    ).length;

    // Add partial progress for in-progress steps
    const inProgressSteps = stepProgress.filter(
      (progress) => progress.status === 'in_progress',
    ).length;

    const totalProgress = completedSteps + inProgressSteps * 0.5;
    return Math.round((totalProgress / totalRoleSteps) * 100);
  }

  /**
   * Count completed steps with type safety
   */
  private countCompletedSteps(stepProgress: any[]): number {
    return stepProgress.filter((progress) => progress.status === 'completed')
      .length;
  }

  /**
   * Estimate time remaining based on role progress
   */
  private estimateTimeRemaining(roleProgress: number): string | undefined {
    if (roleProgress >= 100) {
      return undefined;
    }

    // Simple estimation based on progress
    const remainingPercentage = 100 - roleProgress;
    const estimatedMinutes = Math.round(remainingPercentage * 2); // 2 minutes per percentage point

    if (estimatedMinutes < 60) {
      return `${estimatedMinutes} minutes`;
    } else {
      const hours = Math.round(estimatedMinutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    }
  }

  /**
   * Get next milestone for role
   */
  private getNextMilestone(currentRoleName: string): string | undefined {
    // Simple milestone mapping
    const milestones: Record<string, string> = {
      boomerang: 'Task Analysis Complete',
      architect: 'Subtasks Ready',
      'senior-developer': 'Implementation Complete',
      'code-review': 'Quality Review Complete',
    };

    return milestones[currentRoleName];
  }

  /**
   * Get default progress when calculation fails
   */
  private getDefaultProgress(): ProgressMetrics {
    return {
      currentStepProgress: 0,
      roleProgress: 0,
      overallProgress: 0,
      completedSteps: 0,
      totalSteps: 0,
      estimatedTimeRemaining: undefined,
      nextMilestone: undefined,
    };
  }
}
