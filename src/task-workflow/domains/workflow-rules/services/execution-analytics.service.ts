import { Injectable, Logger } from '@nestjs/common';
import { WorkflowExecutionWithRelations } from './workflow-execution.service';
import { ExecutionDataUtils } from '../utils/execution-data.utils';
import {
  ConfigurableService,
  BaseServiceConfig,
} from '../utils/configurable-service.base';

// Define ProgressOverview interface locally to remove dependency
export interface ProgressOverview {
  averageProgress: number;
  totalActive: number;
}

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

/**
 * Execution Analytics Service
 *
 * Focused service for execution analytics, summaries, and historical analysis.
 * Follows Single Responsibility Principle - only handles analytics and reporting.
 *
 * PROGRESS CALCULATIONS: Now consumes enriched data from ExecutionDataEnricherService
 * instead of calculating progress independently (DRY principle compliance).
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
    const startedAt = ExecutionDataUtils.safeGetDate(execution, 'startedAt');
    const completedAt = ExecutionDataUtils.safeGetDate(
      execution,
      'completedAt',
    );
    const stepsCompleted = ExecutionDataUtils.safeGetNumber(
      execution,
      'stepsCompleted',
      0,
    );
    const currentRoleId = ExecutionDataUtils.safeGetString(
      execution,
      'currentRoleId',
      this.getConfigValue('defaults').roleId,
    );

    return {
      totalDuration: ExecutionDataUtils.calculateDuration(
        startedAt,
        completedAt,
        {
          showSeconds:
            this.getConfigValue('calculations').durationFormat.showSeconds,
          showDays: this.getConfigValue('calculations').durationFormat.showDays,
          fallback: this.getConfigValue('defaults').duration,
        },
      ),
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
    const recoveryAttempts = ExecutionDataUtils.safeGetNumber(
      execution,
      'recoveryAttempts',
      this.getConfigValue('defaults').recoveryAttempts,
    );
    const lastError = execution.lastError;
    const executionMode = ExecutionDataUtils.safeGetString(
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
    return ExecutionDataUtils.groupBy(
      executions,
      (exec) =>
        ExecutionDataUtils.safeGetString(
          exec,
          'currentRoleId',
          this.getConfigValue('defaults').roleId,
        ),
      this.getConfigValue('defaults').roleId,
    );
  }

  /**
   * Calculate overall progress using centralized utility (DRY compliance)
   *
   * DEPENDENCY REDUCTION: Now uses ExecutionDataUtils.calculateOverallProgress
   * instead of depending on ExecutionDataEnricherService, eliminating circular dependency.
   */
  calculateOverallProgress(
    executions: WorkflowExecutionWithRelations[],
  ): ProgressOverview {
    // Use centralized utility function to eliminate service dependency
    return ExecutionDataUtils.calculateOverallProgress(
      executions,
      (exec) =>
        ExecutionDataUtils.safeGetNumber(
          exec,
          'progressPercentage',
          this.getConfigValue('defaults').progressPercentage,
        ),
      this.getConfigValue('defaults').progressPercentage,
    );
  }

  /**
   * Generate analytics report with enriched progress data
   */
  generateAnalyticsReport(executions: WorkflowExecutionWithRelations[]): {
    progressOverview: ProgressOverview;
    executionSummaries: CompletionSummary[];
    roleDistribution: Record<string, number>;
    recommendations: string[];
  } {
    // Use enriched progress calculations
    const progressOverview = this.calculateOverallProgress(executions);

    // Generate completion summaries for each execution
    const executionSummaries = executions.map((exec) =>
      this.generateCompletionSummary(exec),
    );

    // Analyze role distribution
    const roleDistribution = this.groupExecutionsByRole(executions);

    // Get final recommendations
    const recommendations = this.getFinalRecommendations();

    return {
      progressOverview,
      executionSummaries,
      roleDistribution,
      recommendations,
    };
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
}
