import { Injectable, Logger } from '@nestjs/common';
import {
  WorkflowExecutionService,
  CreateWorkflowExecutionInput,
} from './workflow-execution.service';
import {
  ExecutionDataEnricherService,
  EnrichedExecutionData,
} from './execution-data-enricher.service';
import {
  ExecutionAnalyticsService,
  CompletionSummary,
  ProgressOverview,
} from './execution-analytics.service';
import {
  ConfigurableService,
  BaseServiceConfig,
} from '../utils/configurable-service.base';

// Configuration interfaces to eliminate hardcoding
export interface ExecutionOperationsConfig extends BaseServiceConfig {
  defaults: {
    executionMode: 'GUIDED' | 'AUTOMATED' | 'HYBRID';
    orchestrationMode: 'sequential' | 'parallel';
    continueOnFailure: boolean;
  };
  validation: {
    requireExecutionId: boolean;
    requireRoleName: boolean;
    maxServiceCalls: number;
  };
  performance: {
    operationTimeoutMs: number;
    maxConcurrentExecutions: number;
    cacheResultsMs: number;
  };
}

export interface ExecutionResult {
  execution: any;
  nextSteps?: any[];
  recommendations?: string[];
  progressUpdate?: any;
  nextActions?: any[];
  completionSummary?: CompletionSummary;
  finalRecommendations?: string[];
  availableTransitions?: unknown[];
}

export interface ExecutionsSummary {
  executions: any[];
  summary: {
    total: number;
    byRole: Record<string, number>;
    progressOverview: ProgressOverview;
  };
}

export interface WorkflowExecutionInput {
  taskId?: number;
  executionId?: string;
  roleName?: string;
  executionMode?: 'GUIDED' | 'AUTOMATED' | 'HYBRID';
  autoCreatedTask?: boolean;
  executionContext?: Record<string, any>;
  updateData?: Record<string, any>;
  stepId?: string;
  orchestrationConfig?: {
    serviceCalls?: Array<{
      serviceName: string;
      operation: string;
      parameters: Record<string, any>;
    }>;
    executionMode?: 'sequential' | 'parallel';
    continueOnFailure?: boolean;
  };
}

/**
 * Workflow Execution Operations Service
 *
 * Focused service for workflow execution operations.
 * Delegates to specialized services following Single Responsibility Principle.
 */
@Injectable()
export class WorkflowExecutionOperationsService extends ConfigurableService<ExecutionOperationsConfig> {
  private readonly logger = new Logger(WorkflowExecutionOperationsService.name);

  // Configuration with sensible defaults
  protected readonly defaultConfig: ExecutionOperationsConfig = {
    defaults: {
      executionMode: 'GUIDED',
      orchestrationMode: 'sequential',
      continueOnFailure: false,
    },
    validation: {
      requireExecutionId: true,
      requireRoleName: true,
      maxServiceCalls: 20,
    },
    performance: {
      operationTimeoutMs: 30000,
      maxConcurrentExecutions: 10,
      cacheResultsMs: 300000, // 5 minutes
    },
  };

  constructor(
    private readonly workflowExecution: WorkflowExecutionService,
    private readonly dataEnricher: ExecutionDataEnricherService,
    private readonly analytics: ExecutionAnalyticsService,
  ) {
    super();
    this.initializeConfig();
  }

  // Optional: Override configuration change hook
  protected onConfigUpdate(): void {
    this.logger.log('Execution operations configuration updated');
  }

  /**
   * Validate input parameters
   */
  private validateInput(
    input: WorkflowExecutionInput,
    operation: string,
  ): void {
    // Special handling for operations that can work without taskId

    // get_execution can work with either taskId OR executionId
    if (operation === 'get_execution') {
      if (!input.taskId && !input.executionId) {
        throw new Error(`get_execution requires either taskId or executionId`);
      }
    }

    if (
      operation === 'create' &&
      this.getConfigValue('validation').requireRoleName &&
      !input.roleName
    ) {
      throw new Error(`roleName is required for ${operation}`);
    }

    if (
      ['update', 'complete'].includes(operation) &&
      this.getConfigValue('validation').requireExecutionId &&
      !input.executionId
    ) {
      throw new Error(`executionId is required for ${operation}`);
    }

    if (input.orchestrationConfig?.serviceCalls) {
      const serviceCallCount = input.orchestrationConfig.serviceCalls.length;
      const maxServiceCalls = this.getConfigValue('validation').maxServiceCalls;
      if (serviceCallCount > maxServiceCalls) {
        throw new Error(
          `Too many service calls: ${serviceCallCount}. Maximum allowed: ${maxServiceCalls}`,
        );
      }
    }
  }

  /**
   * Create new workflow execution
   */
  async createExecution(
    input: WorkflowExecutionInput,
  ): Promise<ExecutionResult> {
    this.validateInput(input, 'create');

    const createInput: CreateWorkflowExecutionInput = {
      taskId: input.taskId,
      currentRoleId: input.roleName!, // Safe after validation
      executionMode:
        input.executionMode || this.getConfigValue('defaults').executionMode,
      autoCreatedTask: input.autoCreatedTask,
      executionContext: input.executionContext,
    };

    const execution = await this.workflowExecution.createExecution(createInput);
    const nextSteps = await this.dataEnricher.getNextStepsForExecution(
      execution.id,
    );

    return {
      execution,
      nextSteps,
    };
  }

  /**
   * Get execution with enriched context
   */
  async getExecution(input: WorkflowExecutionInput): Promise<ExecutionResult> {
    this.validateInput(input, 'get');

    let execution: any;

    if (!input.executionId) {
      if (!input.taskId) {
        throw new Error(
          `Either taskId or executionId is required for get operation`,
        );
      }
      execution = await this.workflowExecution.getExecutionByTaskId(
        input.taskId,
      );
      if (!execution) {
        throw new Error(`No execution found for task ${input.taskId}`);
      }
    } else {
      execution = await this.workflowExecution.getExecutionById(
        input.executionId, // Safe after validation
      );
    }

    const enrichedData = await this.dataEnricher.enrichExecutionData(execution);
    return this.convertToExecutionResult(enrichedData);
  }

  /**
   * Get execution context data
   * Used by boomerang workflow to retrieve task creation data
   */
  async getExecutionContext(input: {
    executionId: string;
    dataKey?: string;
  }): Promise<any> {
    const execution = await this.workflowExecution.getExecutionById(
      input.executionId,
    );

    if (input.dataKey) {
      // Return specific data from execution context
      if (
        execution.executionContext &&
        typeof execution.executionContext === 'object' &&
        execution.executionContext !== null &&
        input.dataKey in execution.executionContext
      ) {
        return (execution.executionContext as Record<string, any>)[
          input.dataKey
        ];
      }
      // Also check in taskCreationData for backward compatibility
      if (execution.taskCreationData && input.dataKey === 'taskCreationData') {
        return execution.taskCreationData;
      }
      throw new Error(
        `Data key '${input.dataKey}' not found in execution context`,
      );
    }

    // Return full execution context
    return {
      executionContext: execution.executionContext,
      taskCreationData: execution.taskCreationData,
      executionState: execution.executionState,
    };
  }

  /**
   * Update execution context
   * Used by boomerang workflow to update context after task updates
   */
  async updateExecutionContext(input: {
    executionId: string;
    contextUpdates: Record<string, any>;
  }): Promise<any> {
    const execution = await this.workflowExecution.getExecutionById(
      input.executionId,
    );

    // Merge context updates with existing context
    const currentContext =
      execution.executionContext &&
      typeof execution.executionContext === 'object' &&
      execution.executionContext !== null
        ? (execution.executionContext as Record<string, any>)
        : {};

    const updatedContext = {
      ...currentContext,
      ...input.contextUpdates,
    };

    const updatedExecution = await this.workflowExecution.updateExecution(
      input.executionId,
      {
        executionContext: updatedContext,
      },
    );

    return {
      success: true,
      updatedContext: updatedExecution.executionContext,
      executionId: input.executionId,
    };
  }

  /**
   * Update execution state
   */
  async updateExecution(
    input: WorkflowExecutionInput,
  ): Promise<ExecutionResult> {
    this.validateInput(input, 'update');

    const execution = await this.workflowExecution.updateExecution(
      input.executionId!, // Safe after validation
      input.updateData || {},
    );

    const nextActions = await this.dataEnricher.getNextStepsForExecution(
      execution.id,
    );
    const progressUpdate =
      this.dataEnricher.calculateProgressMetrics(execution);

    return {
      execution,
      progressUpdate,
      nextActions,
    };
  }

  /**
   * Complete execution
   */
  async completeExecution(
    input: WorkflowExecutionInput,
  ): Promise<ExecutionResult> {
    this.validateInput(input, 'complete');

    const execution = await this.workflowExecution.completeExecution(
      input.executionId!, // Safe after validation
    );
    const completionSummary =
      this.analytics.generateCompletionSummary(execution);
    const finalRecommendations = this.analytics.getFinalRecommendations();

    return {
      execution,
      completionSummary,
      finalRecommendations,
    };
  }

  /**
   * Get active executions with summary
   */
  async getActiveExecutions(): Promise<ExecutionsSummary> {
    const executions = await this.workflowExecution.getActiveExecutions();

    return {
      executions,
      summary: {
        total: executions.length,
        byRole: this.analytics.groupExecutionsByRole(executions),
        progressOverview: this.analytics.calculateOverallProgress(executions),
      },
    };
  }

  /**
   * Convert enriched data to execution result format
   */
  private convertToExecutionResult(
    enrichedData: EnrichedExecutionData,
  ): ExecutionResult {
    return {
      execution: enrichedData.execution,
      nextSteps: enrichedData.nextSteps,
      progressUpdate: enrichedData.progressMetrics,
      availableTransitions: enrichedData.availableTransitions,
    };
  }
}
