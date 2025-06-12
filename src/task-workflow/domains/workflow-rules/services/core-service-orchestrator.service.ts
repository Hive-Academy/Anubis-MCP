import { Injectable, Logger } from '@nestjs/common';
import { TaskOperationsService } from '../../core-workflow/task-operations.service';
import { PlanningOperationsService } from '../../core-workflow/planning-operations.service';
import { WorkflowOperationsService } from '../../core-workflow/workflow-operations.service';
import { ReviewOperationsService } from '../../core-workflow/review-operations.service';
import { ResearchOperationsService } from '../../core-workflow/research-operations.service';
import { IndividualSubtaskOperationsService } from '../../core-workflow/individual-subtask-operations.service';

// Configuration interfaces to eliminate hardcoding
export interface OrchestratorConfig {
  services: {
    [serviceName: string]: {
      operations: string[];
      timeout: number;
      retryAttempts: number;
      circuitBreakerThreshold: number;
    };
  };
  execution: {
    defaultTimeout: number;
    maxConcurrentCalls: number;
    defaultExecutionMode: 'sequential' | 'parallel';
  };
  validation: {
    requireAllParameters: boolean;
    allowedServiceNames: string[];
  };
}

export interface ServiceCallResult {
  success: boolean;
  serviceName: string;
  operation: string;
  data?: any;
  error?: string;
  duration: number;
  retryCount?: number;
}

// Type-safe service operation interfaces
export interface ServiceOperation {
  serviceName: string;
  operation: string;
  parameters: Record<string, any>;
}

export interface ServiceExecutionResult {
  stepId: string;
  serviceResults: ServiceCallResult[];
  overallSuccess: boolean;
  duration: number;
  failedServices?: string[];
  successfulServices?: string[];
}

// Circuit breaker state interface
interface CircuitBreakerState {
  failures: number;
  lastFailure: Date;
  isOpen: boolean;
}

/**
 * Core Service Orchestrator
 *
 * Single Responsibility: Orchestrate calls to core-workflow services based on step actions
 * Open/Closed: Extensible for new service types without modifying existing code
 * Liskov Substitution: All core services follow same contract pattern
 * Interface Segregation: Focused interface for service orchestration only
 * Dependency Inversion: Depends on service abstractions, not concrete implementations
 */
@Injectable()
export class CoreServiceOrchestrator {
  private readonly logger = new Logger(CoreServiceOrchestrator.name);

  // Configuration with sensible defaults
  private readonly config: OrchestratorConfig = {
    services: {
      TaskOperations: {
        operations: ['create', 'update', 'get', 'list'],
        timeout: 10000,
        retryAttempts: 3,
        circuitBreakerThreshold: 5,
      },
      PlanningOperations: {
        operations: [
          'create_plan',
          'update_plan',
          'get_plan',
          'create_subtasks',
          'update_batch',
          'get_batch',
        ],
        timeout: 15000,
        retryAttempts: 2,
        circuitBreakerThreshold: 3,
      },
      WorkflowOperations: {
        operations: ['delegate', 'complete', 'escalate', 'pause', 'resume'],
        timeout: 8000,
        retryAttempts: 3,
        circuitBreakerThreshold: 4,
      },
      ReviewOperations: {
        operations: [
          'create_review',
          'update_review',
          'get_review',
          'create_completion',
          'get_completion',
        ],
        timeout: 12000,
        retryAttempts: 2,
        circuitBreakerThreshold: 3,
      },
      ResearchOperations: {
        operations: [
          'create_research',
          'update_research',
          'get_research',
          'add_comment',
          'get_comments',
        ],
        timeout: 20000,
        retryAttempts: 2,
        circuitBreakerThreshold: 3,
      },
      SubtaskOperations: {
        operations: [
          'create_subtask',
          'update_subtask',
          'get_subtask',
          'get_next_subtask',
        ],
        timeout: 8000,
        retryAttempts: 3,
        circuitBreakerThreshold: 4,
      },
    },
    execution: {
      defaultTimeout: 30000,
      maxConcurrentCalls: 10,
      defaultExecutionMode: 'sequential',
    },
    validation: {
      requireAllParameters: true,
      allowedServiceNames: [
        'TaskOperations',
        'PlanningOperations',
        'WorkflowOperations',
        'ReviewOperations',
        'ResearchOperations',
        'SubtaskOperations',
      ],
    },
  };

  // Circuit breaker state tracking with proper typing
  private readonly circuitBreakerState = new Map<string, CircuitBreakerState>();

  constructor(
    private readonly taskOperations: TaskOperationsService,
    private readonly planningOperations: PlanningOperationsService,
    private readonly workflowOperations: WorkflowOperationsService,
    private readonly reviewOperations: ReviewOperationsService,
    private readonly researchOperations: ResearchOperationsService,
    private readonly subtaskOperations: IndividualSubtaskOperationsService,
  ) {}

  /**
   * Update orchestrator configuration
   */
  updateConfig(config: Partial<OrchestratorConfig>): void {
    if (config.services) {
      Object.assign(this.config.services, config.services);
    }
    if (config.execution) {
      Object.assign(this.config.execution, config.execution);
    }
    if (config.validation) {
      Object.assign(this.config.validation, config.validation);
    }
    this.logger.log('Orchestrator configuration updated');
  }

  /**
   * Get current configuration
   */
  getConfig(): OrchestratorConfig {
    return {
      services: JSON.parse(JSON.stringify(this.config.services)),
      execution: { ...this.config.execution },
      validation: { ...this.config.validation },
    };
  }

  /**
   * Execute a core service call based on step action data
   * Now returns type-safe results
   */
  async executeServiceCall(
    serviceName: string,
    operation: string,
    parameters: Record<string, any>,
  ): Promise<ServiceCallResult> {
    const startTime = performance.now();

    try {
      this.logger.debug(`Orchestrating: ${serviceName}.${operation}`);

      // Validate service call before execution
      if (!this.validateServiceCall(serviceName, operation, parameters)) {
        throw new Error(`Invalid service call: ${serviceName}.${operation}`);
      }

      // Check circuit breaker
      if (this.isCircuitBreakerOpen(serviceName)) {
        throw new Error(`Circuit breaker is open for service: ${serviceName}`);
      }

      const result = await this.delegateServiceCall(
        serviceName,
        operation,
        parameters,
      );

      const duration = performance.now() - startTime;

      // Reset circuit breaker on success
      this.resetCircuitBreaker(serviceName);

      return {
        success: true,
        serviceName,
        operation,
        data: result,
        duration: Math.round(duration),
      };
    } catch (error: any) {
      const duration = performance.now() - startTime;

      // Update circuit breaker on failure
      this.recordFailure(serviceName);

      this.logger.error(
        `Service call failed: ${serviceName}.${operation}`,
        error,
      );

      return {
        success: false,
        serviceName,
        operation,
        error: error.message,
        duration: Math.round(duration),
      };
    }
  }

  /**
   * Execute multiple service calls in sequence
   */
  async executeServiceSequence(
    serviceCallSpecs: Array<{
      serviceName: string;
      operation: string;
      parameters: any;
    }>,
  ): Promise<ServiceCallResult[]> {
    const results: ServiceCallResult[] = [];

    for (const spec of serviceCallSpecs) {
      const result = await this.executeServiceCall(
        spec.serviceName,
        spec.operation,
        spec.parameters,
      );

      results.push(result);

      // Stop on failure unless explicitly configured to continue
      if (!result.success && spec.parameters?.continueOnFailure !== true) {
        this.logger.warn(
          `Service sequence stopped due to failure in ${spec.serviceName}.${spec.operation}`,
        );
        break;
      }
    }

    return results;
  }

  /**
   * Delegate to the appropriate service based on service name
   */
  private async delegateServiceCall(
    serviceName: string,
    operation: string,
    parameters: any,
  ): Promise<any> {
    switch (serviceName) {
      case 'TaskOperations':
        return this.taskOperations.executeTaskOperation({
          operation: operation as any,
          ...parameters,
        });

      case 'PlanningOperations':
        return this.planningOperations.executePlanningOperation({
          operation: operation as any,
          ...parameters,
        });

      case 'WorkflowOperations':
        return this.workflowOperations.executeWorkflowOperation({
          operation: operation as any,
          ...parameters,
        });

      case 'ReviewOperations':
        return this.reviewOperations.executeReviewOperation({
          operation: operation as any,
          ...parameters,
        });

      case 'ResearchOperations':
        return this.researchOperations.executeResearchOperation({
          operation: operation as any,
          ...parameters,
        });

      case 'SubtaskOperations':
        return this.subtaskOperations.executeIndividualSubtaskOperation({
          operation: operation as any,
          ...parameters,
        });

      default:
        throw new Error(`Unknown service: ${serviceName}`);
    }
  }

  /**
   * Validate service call parameters before execution
   */
  validateServiceCall(
    serviceName: string,
    operation: string,
    parameters: any,
  ): boolean {
    // Basic validation - can be extended with specific validation rules
    return !!(serviceName && operation && parameters);
  }

  /**
   * Get supported services and their operations
   */
  getSupportedServices(): Record<string, string[]> {
    return {
      TaskOperations: ['create', 'update', 'get', 'list'],
      PlanningOperations: [
        'create_plan',
        'update_plan',
        'get_plan',
        'create_subtasks',
        'update_batch',
        'get_batch',
      ],
      WorkflowOperations: ['delegate', 'complete', 'escalate'],
      ReviewOperations: [
        'create_review',
        'update_review',
        'get_review',
        'create_completion',
        'get_completion',
      ],
      ResearchOperations: [
        'create_research',
        'update_research',
        'get_research',
        'add_comment',
        'get_comments',
      ],
      SubtaskOperations: [
        'create_subtask',
        'update_subtask',
        'get_subtask',
        'get_next_subtask',
      ],
    };
  }

  /**
   * Execute a step with associated services - the key orchestration method
   */
  async executeStepWithServices(
    stepId: string,
    serviceCalls?: Array<{
      serviceName: string;
      operation: string;
      parameters: any;
    }>,
    executionMode: 'sequential' | 'parallel' = 'sequential',
    continueOnFailure: boolean = false,
  ): Promise<{
    stepId: string;
    serviceResults: ServiceCallResult[];
    overallSuccess: boolean;
    duration: number;
  }> {
    const startTime = performance.now();

    if (!serviceCalls || serviceCalls.length === 0) {
      return {
        stepId,
        serviceResults: [],
        overallSuccess: true,
        duration: 0,
      };
    }

    this.logger.debug(
      `Executing step ${stepId} with ${serviceCalls.length} service calls in ${executionMode} mode`,
    );

    let serviceResults: ServiceCallResult[];

    if (executionMode === 'parallel') {
      // Execute all service calls in parallel
      const promises = serviceCalls.map((call) =>
        this.executeServiceCall(call.serviceName, call.operation, {
          ...call.parameters,
          continueOnFailure,
        }),
      );

      serviceResults = await Promise.allSettled(promises).then((results) =>
        results.map((result, index) => {
          if (result.status === 'fulfilled') {
            return result.value;
          } else {
            return {
              success: false,
              serviceName: serviceCalls[index].serviceName,
              operation: serviceCalls[index].operation,
              error: result.reason?.message || 'Unknown error',
              duration: 0,
            };
          }
        }),
      );
    } else {
      // Execute service calls sequentially
      serviceResults = await this.executeServiceSequence(serviceCalls);
    }

    const duration = performance.now() - startTime;
    const overallSuccess =
      serviceResults.every((result) => result.success) || continueOnFailure;

    this.logger.debug(
      `Step ${stepId} execution completed: ${serviceResults.length} services, ${duration.toFixed(2)}ms`,
    );

    return {
      stepId,
      serviceResults,
      overallSuccess,
      duration: Math.round(duration),
    };
  }

  /**
   * Circuit breaker methods for service reliability
   */
  private isCircuitBreakerOpen(serviceName: string): boolean {
    const state = this.circuitBreakerState.get(serviceName);
    if (!state) return false;

    const threshold =
      this.config.services[serviceName]?.circuitBreakerThreshold || 5;
    const timeWindow = 60000; // 1 minute

    if (state.failures >= threshold) {
      const timeSinceLastFailure = Date.now() - state.lastFailure.getTime();
      if (timeSinceLastFailure < timeWindow) {
        return true;
      } else {
        // Reset after time window
        this.resetCircuitBreaker(serviceName);
        return false;
      }
    }

    return false;
  }

  private recordFailure(serviceName: string): void {
    const state = this.circuitBreakerState.get(serviceName) || {
      failures: 0,
      lastFailure: new Date(),
      isOpen: false,
    };

    state.failures += 1;
    state.lastFailure = new Date();
    state.isOpen =
      state.failures >=
      (this.config.services[serviceName]?.circuitBreakerThreshold || 5);

    this.circuitBreakerState.set(serviceName, state);

    if (state.isOpen) {
      this.logger.warn(`Circuit breaker opened for service: ${serviceName}`);
    }
  }

  private resetCircuitBreaker(serviceName: string): void {
    const state = this.circuitBreakerState.get(serviceName);
    if (state) {
      state.failures = 0;
      state.isOpen = false;
      this.circuitBreakerState.set(serviceName, state);
    }
  }
}
