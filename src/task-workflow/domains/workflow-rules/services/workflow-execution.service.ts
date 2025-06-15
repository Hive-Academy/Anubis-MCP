import { Injectable, Logger } from '@nestjs/common';
import { WorkflowExecution, WorkflowExecutionMode } from 'generated/prisma';
import { PrismaService } from '../../../../prisma/prisma.service';
import { ExecutionDataUtils } from '../utils/execution-data.utils';
import {
  ConfigurableService,
  BaseServiceConfig,
} from '../utils/configurable-service.base';

// Configuration interfaces to eliminate hardcoding
export interface ExecutionServiceConfig extends BaseServiceConfig {
  defaults: {
    executionMode: WorkflowExecutionMode;
    maxRecoveryAttempts: number;
    completionPercentage: number;
  };
  phases: {
    initialized: string;
    inProgress: string;
    completed: string;
    failed: string;
    paused: string;
  };
  validation: {
    requireTaskId: boolean;
    requireRoleId: boolean;
    maxContextSize: number;
  };
  performance: {
    queryTimeoutMs: number;
    maxActiveExecutions: number;
    progressUpdateIntervalMs: number;
  };
}

export interface CreateWorkflowExecutionInput {
  taskId?: number;
  currentRoleId: string;
  executionMode?: WorkflowExecutionMode;
  autoCreatedTask?: boolean;
  executionContext?: Record<string, any>;
}

export interface UpdateWorkflowExecutionDto {
  currentRoleId?: string;
  currentStepId?: string;
  executionState?: Record<string, any>;
  stepsCompleted?: number;
  totalSteps?: number;
  executionContext?: Record<string, any>;
  lastError?: Record<string, any>;
}

export interface WorkflowExecutionWithRelations extends WorkflowExecution {
  task?: any;
  currentRole?: any;
  currentStep?: any;
}

/**
 * Workflow Execution Service
 *
 * Single Responsibility: Manage workflow execution state and lifecycle
 * Open/Closed: Extensible for new execution modes without modifying existing code
 * Liskov Substitution: Implements consistent service contract
 * Interface Segregation: Focused interface for execution management only
 * Dependency Inversion: Depends on PrismaService abstraction
 */
@Injectable()
export class WorkflowExecutionService extends ConfigurableService<ExecutionServiceConfig> {
  private readonly logger = new Logger(WorkflowExecutionService.name);

  // Default configuration implementation (required by ConfigurableService)
  protected readonly defaultConfig: ExecutionServiceConfig = {
    defaults: {
      executionMode: 'GUIDED',
      maxRecoveryAttempts: 3,
      completionPercentage: 100,
    },
    phases: {
      initialized: 'initialized',
      inProgress: 'in-progress',
      completed: 'completed',
      failed: 'failed',
      paused: 'paused',
    },
    validation: {
      requireTaskId: true,
      requireRoleId: true,
      maxContextSize: 10000, // 10KB limit for context
    },
    performance: {
      queryTimeoutMs: 5000,
      maxActiveExecutions: 100,
      progressUpdateIntervalMs: 1000,
    },
  };

  constructor(private readonly prisma: PrismaService) {
    super();
    this.initializeConfig();
  }

  // Optional: Override configuration change hook
  protected onConfigUpdate(): void {
    this.logger.log('Execution service configuration updated');
  }

  /**
   * Validate input parameters
   */
  private validateInput(input: CreateWorkflowExecutionInput): void {
    // taskId is now optional for bootstrap workflows
    if (
      this.getConfigValue('validation').requireRoleId &&
      !input.currentRoleId
    ) {
      throw new Error('currentRoleId is required');
    }

    if (input.executionContext) {
      const contextSize = JSON.stringify(input.executionContext).length;
      const maxContextSize = this.getConfigValue('validation').maxContextSize;
      if (contextSize > maxContextSize) {
        throw new Error(
          `Execution context too large: ${contextSize} bytes. Maximum: ${maxContextSize} bytes`,
        );
      }
    }
  }

  /**
   * Create new workflow execution
   */
  async createExecution(
    input: CreateWorkflowExecutionInput,
  ): Promise<WorkflowExecutionWithRelations> {
    try {
      this.validateInput(input);
      this.logger.debug(
        `Creating workflow execution for ${input.taskId ? `task ${input.taskId}` : 'bootstrap workflow'}`,
      );

      // Get the first step for the role to assign as currentStepId
      const firstStep = await this.prisma.workflowStep.findFirst({
        where: { roleId: input.currentRoleId },
        orderBy: { sequenceNumber: 'asc' },
      });

      if (!firstStep) {
        this.logger.warn(`No steps found for role ${input.currentRoleId}`);
      }

      // Build create data with optional taskId
      const createData: any = {
        currentRoleId: input.currentRoleId,
        currentStepId: firstStep?.id || null,
        executionMode:
          input.executionMode || this.getConfigValue('defaults').executionMode,
        autoCreatedTask: input.autoCreatedTask || false,
        executionContext: input.executionContext || {},
        executionState: {
          phase: this.getConfigValue('phases').initialized,
          currentContext: input.executionContext || {},
          progressMarkers: [],
          ...(firstStep && {
            currentStep: {
              id: firstStep.id,
              name: firstStep.name,
              sequenceNumber: firstStep.sequenceNumber,
              assignedAt: new Date().toISOString(),
            },
          }),
        },
      };

      // Only add taskId if provided
      if (input.taskId !== undefined) {
        createData.taskId = input.taskId;
      }

      const execution = await this.prisma.workflowExecution.create({
        data: createData,
        include: {
          task: true,
          currentRole: true,
          currentStep: true,
        },
      });

      this.logger.log(
        `Workflow execution created: ${execution.id}${
          firstStep
            ? ` with first step: ${firstStep.name}`
            : ' (no steps available)'
        }`,
      );
      return execution;
    } catch (error) {
      this.logger.error('Failed to create workflow execution:', error);
      throw error;
    }
  }

  /**
   * Get execution by ID
   */
  async getExecutionById(
    executionId: string,
  ): Promise<WorkflowExecutionWithRelations> {
    const execution = await this.prisma.workflowExecution.findUnique({
      where: { id: executionId },
      include: {
        task: true,
        currentRole: true,
        currentStep: true,
      },
    });

    if (!execution) {
      throw new Error(`Workflow execution not found: ${executionId}`);
    }

    return execution;
  }

  /**
   * Get execution by task ID
   */
  async getExecutionByTaskId(
    taskId: number,
  ): Promise<WorkflowExecutionWithRelations | null> {
    return await this.prisma.workflowExecution.findFirst({
      where: { taskId },
      include: {
        task: true,
        currentRole: true,
        currentStep: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update execution state
   */
  async updateExecution(
    executionId: string,
    updateData: Record<string, any>,
  ): Promise<WorkflowExecutionWithRelations> {
    try {
      this.logger.debug(`Updating workflow execution ${executionId}`);

      const execution = await this.prisma.workflowExecution.update({
        where: { id: executionId },
        data: updateData,
        include: {
          task: true,
          currentRole: true,
          currentStep: true,
        },
      });

      return execution;
    } catch (error) {
      this.logger.error('Failed to update workflow execution:', error);
      throw error;
    }
  }

  /**
   * Update execution progress using centralized calculation (DRY compliance)
   */
  async updateProgress(
    executionId: string,
    stepsCompleted: number,
    totalSteps?: number,
  ): Promise<WorkflowExecutionWithRelations> {
    const currentExecution = await this.getExecutionById(executionId);
    let progressPercentage = currentExecution.progressPercentage;

    // Use centralized progress calculation from ExecutionDataUtils
    if (totalSteps && totalSteps > 0) {
      progressPercentage = ExecutionDataUtils.calculatePercentage(
        stepsCompleted,
        totalSteps,
        0, // No decimal precision for execution progress
      );
    }

    return this.updateExecution(executionId, {
      stepsCompleted,
      totalSteps,
      progressPercentage,
      executionState: {
        ...(currentExecution.executionState as Record<string, any>),
        lastProgressUpdate: new Date().toISOString(),
        stepsCompleted,
        totalSteps,
      },
    });
  }

  /**
   * Complete execution
   */
  async completeExecution(
    executionId: string,
  ): Promise<WorkflowExecutionWithRelations> {
    return this.updateExecution(executionId, {
      completedAt: new Date(),
      progressPercentage: this.getConfigValue('defaults').completionPercentage,
      executionState: {
        phase: this.getConfigValue('phases').completed,
        completedAt: new Date().toISOString(),
      },
    });
  }

  /**
   * Get all active executions
   */
  async getActiveExecutions(): Promise<WorkflowExecutionWithRelations[]> {
    return await this.prisma.workflowExecution.findMany({
      where: {
        completedAt: null,
      },
      include: {
        task: true,
        currentRole: true,
        currentStep: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Handle execution errors with recovery logic
   */
  async handleExecutionError(
    executionId: string,
    error: any,
  ): Promise<{
    canRetry: boolean;
    retryCount: number;
    maxRetries: number;
  }> {
    const currentExecution = await this.getExecutionById(executionId);
    const newRecoveryAttempts = currentExecution.recoveryAttempts + 1;

    await this.updateExecution(executionId, {
      lastError: {
        message: error.message,
        timestamp: new Date().toISOString(),
        stack: error.stack,
      },
      recoveryAttempts: newRecoveryAttempts,
    });

    return {
      canRetry: newRecoveryAttempts < currentExecution.maxRecoveryAttempts,
      retryCount: newRecoveryAttempts,
      maxRetries: currentExecution.maxRecoveryAttempts,
    };
  }
}
