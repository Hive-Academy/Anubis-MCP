import { Injectable, Logger } from '@nestjs/common';
import { WorkflowExecutionWithRelations } from './workflow-execution.service';
import { getErrorMessage } from '../utils/type-safety.utils';
import {
  ConfigurableService,
  BaseServiceConfig,
} from '../utils/configurable-service.base';

// Configuration interface to eliminate hardcoding
export interface ExecutionAnalyticsConfig extends BaseServiceConfig {
  defaults: {
    executionMode: string;
    roleId: string;
    duration: string;
    progressPercentage: number;
    recoveryAttempts: number;
  };
  recommendations: {
    finalRecommendations: string[];
    maxRecommendations: number;
  };
  calculations: {
    progressRoundingPrecision: number;
    durationFormat: {
      showSeconds: boolean;
      showDays: boolean;
    };
  };
  performance: {
    maxExecutionsToAnalyze: number;
    calculationTimeoutMs: number;
  };
}

export interface CompletionSummary {
  totalDuration: string;
  stepsCompleted: number;
  finalRole: string;
  qualityMetrics: QualityMetrics;
}

export interface QualityMetrics {
  recoveryAttempts: number;
  hasErrors: boolean;
  executionMode: string;
}

export interface ProgressOverview {
  averageProgress: number;
  totalActive: number;
}

/**
 * Execution Analytics Service
 *
 * Focused service for execution analytics, summaries, and calculations.
 * Follows Single Responsibility Principle - only handles analytics.
 */
@Injectable()
export class ExecutionAnalyticsService extends ConfigurableService<ExecutionAnalyticsConfig> {
  private readonly logger = new Logger(ExecutionAnalyticsService.name);

  // Configuration with sensible defaults
  protected readonly defaultConfig: ExecutionAnalyticsConfig = {
    defaults: {
      executionMode: 'GUIDED',
      roleId: 'unknown',
      duration: '0h 0m',
      progressPercentage: 0,
      recoveryAttempts: 0,
    },
    recommendations: {
      finalRecommendations: [
        'Review execution metrics and performance',
        'Archive execution data for future reference',
        'Update workflow patterns based on learnings',
        'Prepare final deliverables and documentation',
        'Conduct retrospective on workflow effectiveness',
      ],
      maxRecommendations: 10,
    },
    calculations: {
      progressRoundingPrecision: 0, // Round to nearest integer
      durationFormat: {
        showSeconds: false,
        showDays: false,
      },
    },
    performance: {
      maxExecutionsToAnalyze: 1000,
      calculationTimeoutMs: 5000,
    },
  };

  constructor() {
    super();
    this.initializeConfig();
  }

  // Optional: Override configuration change hook
  protected onConfigUpdate(): void {
    this.logger.log('Execution analytics configuration updated');
  }

  /**
   * Generate completion summary for an execution
   */
  generateCompletionSummary(
    execution: WorkflowExecutionWithRelations,
  ): CompletionSummary {
    const startedAt = this.safeGetDate(execution, 'startedAt');
    const completedAt = this.safeGetDate(execution, 'completedAt');
    const stepsCompleted = this.safeGetNumber(execution, 'stepsCompleted', 0);
    const currentRoleId = this.safeGetString(
      execution,
      'currentRoleId',
      this.getConfigValue('defaults').roleId,
    );

    return {
      totalDuration: this.calculateDuration(startedAt, completedAt),
      stepsCompleted,
      finalRole: currentRoleId,
      qualityMetrics: this.extractQualityMetrics(execution),
    };
  }

  /**
   * Extract quality metrics from execution
   */
  extractQualityMetrics(
    execution: WorkflowExecutionWithRelations,
  ): QualityMetrics {
    const recoveryAttempts = this.safeGetNumber(
      execution,
      'recoveryAttempts',
      this.getConfigValue('defaults').recoveryAttempts,
    );
    const lastError = execution.lastError;
    const executionMode = this.safeGetString(
      execution,
      'executionMode',
      this.getConfigValue('defaults').executionMode,
    );

    return {
      recoveryAttempts,
      hasErrors: !!lastError,
      executionMode,
    };
  }

  /**
   * Group executions by role with type safety
   */
  groupExecutionsByRole(
    executions: WorkflowExecutionWithRelations[],
  ): Record<string, number> {
    return executions.reduce(
      (acc: Record<string, number>, exec: WorkflowExecutionWithRelations) => {
        const roleId = this.safeGetString(
          exec,
          'currentRoleId',
          this.getConfigValue('defaults').roleId,
        );
        acc[roleId] = (acc[roleId] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  /**
   * Calculate overall progress with type safety
   */
  calculateOverallProgress(
    executions: WorkflowExecutionWithRelations[],
  ): ProgressOverview {
    const total = executions.length;
    if (total === 0)
      return {
        averageProgress: this.getConfigValue('defaults').progressPercentage,
        totalActive: 0,
      };

    const averageProgress =
      executions.reduce((sum: number, exec: WorkflowExecutionWithRelations) => {
        const progress = this.safeGetNumber(
          exec,
          'progressPercentage',
          this.getConfigValue('defaults').progressPercentage,
        );
        return sum + progress;
      }, 0) / total;

    return {
      averageProgress: this.roundProgress(averageProgress),
      totalActive: total,
    };
  }

  /**
   * Calculate duration between dates
   */
  calculateDuration(start: Date, end: Date): string {
    try {
      const diff = end.getTime() - start.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m`;
    } catch (error) {
      this.logger.warn('Failed to calculate duration:', getErrorMessage(error));
      return this.getConfigValue('defaults').duration;
    }
  }

  /**
   * Get final recommendations for completed executions
   */
  getFinalRecommendations(): string[] {
    return this.getConfigValue('recommendations').finalRecommendations.slice(
      0,
      this.getConfigValue('recommendations').maxRecommendations,
    );
  }

  /**
   * Round progress percentage based on configuration
   */
  private roundProgress(progress: number): number {
    const precision =
      this.getConfigValue('calculations').progressRoundingPrecision;
    return (
      Math.round(progress * Math.pow(10, precision)) / Math.pow(10, precision)
    );
  }

  /**
   * Safely get number property from execution object
   */
  private safeGetNumber(
    execution: WorkflowExecutionWithRelations,
    key: keyof WorkflowExecutionWithRelations,
    fallback: number,
  ): number {
    const value = execution[key];
    return typeof value === 'number' ? value : fallback;
  }

  /**
   * Safely get string property from execution object
   */
  private safeGetString(
    execution: WorkflowExecutionWithRelations,
    key: keyof WorkflowExecutionWithRelations,
    fallback: string,
  ): string {
    const value = execution[key];
    return typeof value === 'string' ? value : fallback;
  }

  /**
   * Safely get date property from execution object
   */
  private safeGetDate(
    execution: WorkflowExecutionWithRelations,
    key: keyof WorkflowExecutionWithRelations,
  ): Date {
    const value = execution[key];
    return value instanceof Date ? value : new Date();
  }
}
