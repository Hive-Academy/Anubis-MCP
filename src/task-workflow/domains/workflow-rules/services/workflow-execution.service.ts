import { Injectable, Logger } from '@nestjs/common';
import { WorkflowExecution, WorkflowExecutionMode } from 'generated/prisma';
import { PrismaService } from '../../../../prisma/prisma.service';

// Configuration interfaces to eliminate hardcoding
export interface ExecutionServiceConfig {
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
  taskId: number;
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
export class WorkflowExecutionService {
  private readonly logger = new Logger(WorkflowExecutionService.name);

  // Configuration with sensible defaults
  private readonly config: ExecutionServiceConfig = {
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

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Update execution service configuration
   */
  updateConfig(config: Partial<ExecutionServiceConfig>): void {
    if (config.defaults) {
      Object.assign(this.config.defaults, config.defaults);
    }
    if (config.phases) {
      Object.assign(this.config.phases, config.phases);
    }
    if (config.validation) {
      Object.assign(this.config.validation, config.validation);
    }
    if (config.performance) {
      Object.assign(this.config.performance, config.performance);
    }
    this.logger.log('Execution service configuration updated');
  }

  /**
   * Get current configuration
   */
  getConfig(): ExecutionServiceConfig {
    return {
      defaults: { ...this.config.defaults },
      phases: { ...this.config.phases },
      validation: { ...this.config.validation },
      performance: { ...this.config.performance },
    };
  }

  /**
   * Validate input parameters
   */
  private validateInput(input: CreateWorkflowExecutionInput): void {
    if (this.config.validation.requireTaskId && !input.taskId) {
      throw new Error('taskId is required');
    }

    if (this.config.validation.requireRoleId && !input.currentRoleId) {
      throw new Error('currentRoleId is required');
    }

    if (input.executionContext) {
      const contextSize = JSON.stringify(input.executionContext).length;
      if (contextSize > this.config.validation.maxContextSize) {
        throw new Error(
          `Execution context too large: ${contextSize} bytes. Maximum: ${this.config.validation.maxContextSize} bytes`,
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
      this.logger.debug(`Creating workflow execution for task ${input.taskId}`);

      // Get the first step for the role to assign as currentStepId
      const firstStep = await this.prisma.workflowStep.findFirst({
        where: { roleId: input.currentRoleId },
        orderBy: { sequenceNumber: 'asc' },
      });

      if (!firstStep) {
        this.logger.warn(`No steps found for role ${input.currentRoleId}`);
      }

      const execution = await this.prisma.workflowExecution.create({
        data: {
          taskId: input.taskId,
          currentRoleId: input.currentRoleId,
          currentStepId: firstStep?.id || null, // Assign first step if available
          executionMode:
            input.executionMode || this.config.defaults.executionMode,
          autoCreatedTask: input.autoCreatedTask || false,
          executionContext: input.executionContext || {},
          executionState: {
            phase: this.config.phases.initialized,
            currentContext: input.executionContext || {},
            progressMarkers: [],
            // Include current step information in execution state
            ...(firstStep && {
              currentStep: {
                id: firstStep.id,
                name: firstStep.name,
                sequenceNumber: firstStep.sequenceNumber,
                assignedAt: new Date().toISOString(),
              },
            }),
          },
        },
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
   * Update execution progress
   */
  async updateProgress(
    executionId: string,
    stepsCompleted: number,
    totalSteps?: number,
  ): Promise<WorkflowExecutionWithRelations> {
    const currentExecution = await this.getExecutionById(executionId);
    let progressPercentage = currentExecution.progressPercentage;

    if (totalSteps && totalSteps > 0) {
      progressPercentage = Math.round((stepsCompleted / totalSteps) * 100);
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
      progressPercentage: this.config.defaults.completionPercentage,
      executionState: {
        phase: this.config.phases.completed,
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
