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
import { CoreServiceOrchestrator } from './core-service-orchestrator.service';

// Configuration interfaces to eliminate hardcoding
export interface ExecutionOperationsConfig {
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
  taskId: number;
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
export class WorkflowExecutionOperationsService {
  private readonly logger = new Logger(WorkflowExecutionOperationsService.name);

  // Configuration with sensible defaults
  private readonly config: ExecutionOperationsConfig = {
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
    private readonly coreServiceOrchestrator: CoreServiceOrchestrator,
  ) {}

  /**
   * Update execution operations configuration
   */
  updateConfig(config: Partial<ExecutionOperationsConfig>): void {
    if (config.defaults) {
      Object.assign(this.config.defaults, config.defaults);
    }
    if (config.validation) {
      Object.assign(this.config.validation, config.validation);
    }
    if (config.performance) {
      Object.assign(this.config.performance, config.performance);
    }
    this.logger.log('Execution operations configuration updated');
  }

  /**
   * Get current configuration
   */
  getConfig(): ExecutionOperationsConfig {
    return {
      defaults: { ...this.config.defaults },
      validation: { ...this.config.validation },
      performance: { ...this.config.performance },
    };
  }

  /**
   * Validate input parameters
   */
  private validateInput(
    input: WorkflowExecutionInput,
    operation: string,
  ): void {
    if (!input.taskId) {
      throw new Error(`taskId is required for ${operation}`);
    }

    if (
      operation === 'create' &&
      this.config.validation.requireRoleName &&
      !input.roleName
    ) {
      throw new Error(`roleName is required for ${operation}`);
    }

    if (
      ['update', 'complete'].includes(operation) &&
      this.config.validation.requireExecutionId &&
      !input.executionId
    ) {
      throw new Error(`executionId is required for ${operation}`);
    }

    if (input.orchestrationConfig?.serviceCalls) {
      const serviceCallCount = input.orchestrationConfig.serviceCalls.length;
      if (serviceCallCount > this.config.validation.maxServiceCalls) {
        throw new Error(
          `Too many service calls: ${serviceCallCount}. Maximum allowed: ${this.config.validation.maxServiceCalls}`,
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
      executionMode: input.executionMode || this.config.defaults.executionMode,
      autoCreatedTask: input.autoCreatedTask,
      executionContext: input.executionContext,
    };

    const execution = await this.workflowExecution.createExecution(createInput);
    const nextSteps = await this.dataEnricher.getNextStepsForExecution(
      execution.id,
    );
    const recommendations = await this.dataEnricher.getRoleRecommendations(
      input.roleName!, // Safe after validation
      input.taskId,
    );

    return {
      execution,
      nextSteps,
      recommendations,
    };
  }

  /**
   * Get execution with enriched context
   */
  async getExecution(input: WorkflowExecutionInput): Promise<ExecutionResult> {
    this.validateInput(input, 'get');

    let execution: any;

    if (!input.executionId) {
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
   * Execute step with services orchestration
   */
  async executeStepWithServices(
    input: WorkflowExecutionInput,
  ): Promise<Record<string, unknown>> {
    if (!input.stepId || !input.orchestrationConfig?.serviceCalls) {
      throw new Error(
        'stepId and orchestrationConfig.serviceCalls are required for executing a step with services',
      );
    }

    const result = await this.coreServiceOrchestrator.executeStepWithServices(
      input.stepId,
      input.orchestrationConfig.serviceCalls,
      input.orchestrationConfig.executionMode ||
        this.config.defaults.orchestrationMode,
      input.orchestrationConfig.continueOnFailure ??
        this.config.defaults.continueOnFailure,
    );

    return {
      executionResult: result,
      taskId: input.taskId,
      stepId: input.stepId,
      timestamp: new Date().toISOString(),
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
    };
  }
}
