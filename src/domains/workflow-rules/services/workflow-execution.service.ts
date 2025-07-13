import { Injectable, Inject } from '@nestjs/common';
import { WorkflowExecutionMode } from 'generated/prisma';
import { IWorkflowExecutionRepository } from '../repositories/interfaces/workflow-execution.repository.interface';
import {
  CreateWorkflowExecutionData,
  WorkflowExecutionWithRelations,
} from '../repositories/types/workflow-execution.types';
import {
  BaseServiceConfig,
  ConfigurableService,
} from '../utils/configurable-service.base';
import { ExecutionDataUtils } from '../utils/execution-data.utils';
import {
  WorkflowExecutionState,
  WorkflowExecutionStateSchema,
} from '../utils/workflow-execution-state.schema';

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

// WorkflowExecutionWithRelations is now imported from repository types

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

  constructor(
    @Inject('IWorkflowExecutionRepository')
    private readonly workflowExecutionRepository: IWorkflowExecutionRepository,
  ) {
    super();
    this.initializeConfig();
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
    this.validateInput(input);

    // Build create data with repository type
    const createData: CreateWorkflowExecutionData = {
      taskId: input.taskId,
      currentRoleId: input.currentRoleId,
      executionMode:
        input.executionMode || this.getConfigValue('defaults').executionMode,
      autoCreatedTask: input.autoCreatedTask || false,
      executionContext: input.executionContext || {},
      executionState: {
        phase: this.getConfigValue('phases').initialized,
        currentContext: input.executionContext || {},
        progressMarkers: [],
      },
    };

    const execution = await this.workflowExecutionRepository.create(createData);

    return execution;
  }

  /**
   * Get execution by ID
   */
  async getExecutionById(
    executionId: string,
  ): Promise<WorkflowExecutionWithRelations> {
    const execution = await this.workflowExecutionRepository.findById(
      executionId,
      {
        task: true,
        currentRole: true,
        currentStep: true,
      },
    );

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
    return await this.workflowExecutionRepository.findByTaskId(taskId, {
      task: true,
      currentRole: true,
      currentStep: true,
    });
  }

  /**
   * Update execution state
   */
  async updateExecution(
    executionId: string,
    updateData: Record<string, any>,
  ): Promise<WorkflowExecutionWithRelations> {
    const execution = await this.workflowExecutionRepository.update(
      executionId,
      updateData,
    );

    return execution;
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

    return this.workflowExecutionRepository.updateProgress(executionId, {
      stepsCompleted,
      totalSteps,
      progressPercentage,
      currentStepId: currentExecution.currentStepId as string,
      currentRoleId: currentExecution.currentRoleId,
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
    return await this.workflowExecutionRepository.findActiveExecutions({
      task: true,
      currentRole: true,
      currentStep: true,
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
    const result = await this.workflowExecutionRepository.handleExecutionError(
      executionId,
      error,
    );

    return {
      canRetry: result.canRecover,
      retryCount: result.recoveryAttempts,
      maxRetries: result.maxRecoveryAttempts,
    };
  }

  // -----------------------------------------------------------------------------
  // NEW HELPER: Validated executionState update (DRY & SAFE)
  // -----------------------------------------------------------------------------
  async updateExecutionState(
    executionId: string,
    patch: Partial<WorkflowExecutionState>,
  ): Promise<void> {
    // Fetch current execution
    const exec = await this.getExecutionById(executionId);

    const currentState = (exec.executionState ||
      {}) as Partial<WorkflowExecutionState>;

    const newState: WorkflowExecutionState = {
      ...currentState,
      ...patch,
    } as WorkflowExecutionState;

    // Runtime validation – throws if schema mismatch
    WorkflowExecutionStateSchema.parse(newState);

    await this.workflowExecutionRepository.update(executionId, {
      executionState: newState as unknown as Record<string, any>,
    });
  }
}
