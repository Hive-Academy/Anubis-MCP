import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { getErrorMessage } from '../utils/type-safety.utils';
import { RoleTransitionService } from './role-transition.service';
import { StepExecutionService } from './step-execution.service';
import { WorkflowExecutionWithRelations } from './workflow-execution.service';
import { WorkflowGuidanceService } from './workflow-guidance.service';

// Configuration interfaces to eliminate hardcoding
export interface DataEnricherConfig {
  defaults: {
    projectPath: string;
    fallbackRecommendations: string[];
    completionMessages: {
      nearCompletion: string;
      stepsRemaining: string;
    };
  };
  fallbackSteps: {
    executionNotFound: {
      name: string;
      description: string;
    };
    noNextStep: {
      name: string;
      description: string;
    };
    errorFallback: {
      name: string;
      description: string;
    };
  };
  performance: {
    cacheTimeoutMs: number;
    maxRecommendations: number;
    queryTimeoutMs: number;
  };
}

export interface NextStep {
  name: string;
  status: 'pending' | 'ready' | 'completed' | 'skipped';
  description?: string;
}

export interface ProgressMetrics {
  percentage: number;
  stepsCompleted: number;
  totalSteps: number;
  estimatedCompletion: string | null;
}

export interface EnrichedExecutionData {
  execution: WorkflowExecutionWithRelations;
  nextSteps: NextStep[];
  availableTransitions: unknown[];
  progressMetrics: ProgressMetrics;
}

/**
 * Execution Data Enricher Service
 *
 * Focused service for enriching execution data with additional context.
 * Follows Single Responsibility Principle - only handles data enrichment.
 */
@Injectable()
export class ExecutionDataEnricherService {
  private readonly logger = new Logger(ExecutionDataEnricherService.name);

  // Configuration with sensible defaults
  private readonly config: DataEnricherConfig = {
    defaults: {
      projectPath: process.cwd(),
      fallbackRecommendations: [
        'Review task requirements',
        'Execute next workflow step',
        'Validate current progress',
        'Check for blockers',
        'Update task status',
      ],
      completionMessages: {
        nearCompletion: 'Near completion',
        stepsRemaining: 'steps remaining',
      },
    },
    fallbackSteps: {
      executionNotFound: {
        name: 'Review workflow state',
        description:
          'Review current execution state and determine next actions',
      },
      noNextStep: {
        name: 'Role transition or completion',
        description:
          'All steps completed for current role - consider role transition',
      },
      errorFallback: {
        name: 'Review workflow state',
        description:
          'Review current execution state and determine next actions',
      },
    },
    performance: {
      cacheTimeoutMs: 300000, // 5 minutes
      maxRecommendations: 10,
      queryTimeoutMs: 5000,
    },
  };

  constructor(
    private readonly stepExecution: StepExecutionService,
    private readonly roleTransition: RoleTransitionService,
    private readonly workflowGuidance: WorkflowGuidanceService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Update data enricher configuration
   */
  updateConfig(config: Partial<DataEnricherConfig>): void {
    if (config.defaults) {
      Object.assign(this.config.defaults, config.defaults);
    }
    if (config.fallbackSteps) {
      Object.assign(this.config.fallbackSteps, config.fallbackSteps);
    }
    if (config.performance) {
      Object.assign(this.config.performance, config.performance);
    }
    this.logger.log('Data enricher configuration updated');
  }

  /**
   * Get current configuration
   */
  getConfig(): DataEnricherConfig {
    return {
      defaults: { ...this.config.defaults },
      fallbackSteps: JSON.parse(JSON.stringify(this.config.fallbackSteps)),
      performance: { ...this.config.performance },
    };
  }

  /**
   * Enrich execution with all additional context data
   */
  async enrichExecutionData(
    execution: WorkflowExecutionWithRelations,
  ): Promise<EnrichedExecutionData> {
    const nextSteps = await this.getNextStepsForExecution(execution.id);
    const availableTransitions = await this.getAvailableTransitions(execution);
    const progressMetrics = this.calculateProgressMetrics(execution);

    return {
      execution,
      nextSteps,
      availableTransitions,
      progressMetrics,
    };
  }

  /**
   * Get next steps for execution
   */
  async getNextStepsForExecution(executionId: string): Promise<NextStep[]> {
    try {
      // Get the execution to find current role and task
      const execution = await this.prisma.workflowExecution.findUnique({
        where: { id: executionId },
        include: {
          currentRole: true,
          task: true,
        },
      });

      if (!execution) {
        this.logger.warn(`Execution not found: ${executionId}`);
        return [
          {
            name: this.config.fallbackSteps.executionNotFound.name,
            status: 'ready',
            description:
              this.config.fallbackSteps.executionNotFound.description,
          },
        ];
      }

      // Get the next available step for the current role
      const nextStep = await this.stepExecution.getNextAvailableStep(
        Number(execution.taskId),
        execution.currentRoleId,
      );

      if (!nextStep) {
        return [
          {
            name: this.config.fallbackSteps.noNextStep.name,
            status: 'ready',
            description: this.config.fallbackSteps.noNextStep.description,
          },
        ];
      }

      // Get step progress to determine status
      const stepProgress = await this.prisma.workflowStepProgress.findFirst({
        where: {
          taskId: String(execution.taskId),
          roleId: execution.currentRoleId,
          stepId: nextStep.id,
        },
      });

      const stepStatus =
        stepProgress?.status === 'IN_PROGRESS' ? 'pending' : 'ready';

      return [
        {
          name: nextStep.name,
          status: stepStatus,
          description:
            nextStep.description || `Execute ${nextStep.displayName}`,
        },
      ];
    } catch (error) {
      this.logger.warn('Failed to get next steps:', getErrorMessage(error));
      return [
        {
          name: this.config.fallbackSteps.errorFallback.name,
          status: 'ready',
          description: this.config.fallbackSteps.errorFallback.description,
        },
      ];
    }
  }

  /**
   * Get available role transitions
   */
  private async getAvailableTransitions(
    execution: WorkflowExecutionWithRelations,
  ): Promise<unknown[]> {
    try {
      return await this.roleTransition.getAvailableTransitions(
        execution.currentRoleId,
      );
    } catch (error) {
      this.logger.warn(
        'Failed to get available transitions:',
        getErrorMessage(error),
      );
      return [];
    }
  }

  /**
   * Calculate progress metrics with type safety
   */
  calculateProgressMetrics(
    execution: WorkflowExecutionWithRelations,
  ): ProgressMetrics {
    const percentage = this.safeGetNumber(execution, 'progressPercentage', 0);
    const stepsCompleted = this.safeGetNumber(execution, 'stepsCompleted', 0);
    const totalSteps = this.safeGetNumber(execution, 'totalSteps', 0);

    return {
      percentage,
      stepsCompleted,
      totalSteps,
      estimatedCompletion: this.estimateCompletion(totalSteps, stepsCompleted),
    };
  }

  /**
   * Estimate completion time
   */
  private estimateCompletion(
    totalSteps: number,
    stepsCompleted: number,
  ): string | null {
    if (!totalSteps || totalSteps === 0) return null;

    const remaining = totalSteps - stepsCompleted;
    return remaining > 0
      ? `${remaining} ${this.config.defaults.completionMessages.stepsRemaining}`
      : this.config.defaults.completionMessages.nearCompletion;
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
}
