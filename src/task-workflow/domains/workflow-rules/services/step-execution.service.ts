import { Injectable, Logger } from '@nestjs/common';
import { WorkflowStep } from 'generated/prisma';
import {
  StepExecutionCoreService,
  StepExecutionContext,
} from './step-execution-core.service';
import { StepGuidanceService } from './step-guidance.service';
import { StepProgressTrackerService } from './step-progress-tracker.service';
import { StepQueryService } from './step-query.service';

// ===================================================================
// 🎯 STEP EXECUTION SERVICE - Lightweight Orchestrator
// ===================================================================
// Purpose: Main interface for step execution with delegation to specialized services
// Scope: Public API, backwards compatibility, service coordination
// Optimization: Minimal code, delegates to focused services, eliminates duplication

/**
 * ✅ OPTIMIZED: Lightweight orchestrator service that delegates to specialized services
 *
 * BEFORE: 1400+ lines monolithic service with multiple responsibilities
 * AFTER: ~200 lines orchestrator that delegates to focused services
 *
 * Delegation Pattern:
 * - Core execution logic → StepExecutionCoreService
 * - Guidance & validation → StepGuidanceService
 * - Progress tracking → StepProgressTrackerService
 * - Database queries → StepQueryService
 *
 * Benefits:
 * - Single Responsibility Principle (SRP)
 * - Easier testing and maintenance
 * - Reduced code duplication
 * - Better separation of concerns
 * - Maintains backwards compatibility
 */

export interface StepExecutionResult {
  success: boolean;
  guidance: {
    description: string;
    expectedOutput: string;
    suggestedTools: string[];
    localExecution: {
      commands: string[];
      aiIntelligence: string;
    };
    successCriteria: string[];
  };
  nextStep?: WorkflowStep;
  duration?: number;
  errors?: string[];
  progressMetrics?: any;
  validationContext?: any;
  requiredInputs?: any[];
  actionGuidance?: string;
}

@Injectable()
export class StepExecutionService {
  private readonly logger = new Logger(StepExecutionService.name);

  constructor(
    private readonly coreService: StepExecutionCoreService,
    private readonly guidanceService: StepGuidanceService,
    private readonly progressTracker: StepProgressTrackerService,
    private readonly queryService: StepQueryService,
  ) {}

  // ===================================================================
  // 🎯 PRIMARY EXECUTION API - Delegates to Core Service
  // ===================================================================

  /**
   * ✅ DELEGATES: Execute a workflow step with validation and progress tracking
   * Delegates to StepExecutionCoreService for actual execution
   */
  async executeWorkflowStep(
    context: StepExecutionContext,
    executionData?: any,
  ): Promise<StepExecutionResult> {
    return this.coreService.executeWorkflowStep({
      ...context,
      executionData,
    });
  }

  // ===================================================================
  // 🧭 GUIDANCE API - Delegates to Guidance Service
  // ===================================================================

  /**
   * ✅ DELEGATES: Get step guidance for what AI should execute locally
   * Delegates to StepGuidanceService for database-driven guidance
   */
  async getStepGuidance(
    taskId: number,
    roleId: string,
    stepId?: string,
  ): Promise<any> {
    return this.guidanceService.getStepGuidance({
      taskId,
      roleId,
      stepId,
    });
  }

  /**
   * ✅ DELEGATES: Get validation criteria for AI to check locally
   * Delegates to StepGuidanceService for validation criteria
   */
  async getStepValidationCriteria(
    stepId: string,
    _taskId: number, // Kept for backwards compatibility
  ): Promise<any> {
    return this.guidanceService.getStepValidationCriteria(stepId);
  }

  // ===================================================================
  // 📊 PROGRESS API - Delegates to Progress Tracker
  // ===================================================================

  /**
   * ✅ DELEGATES: Process step completion results from AI
   * Delegates to StepProgressTrackerService for completion processing
   */
  async processStepCompletion(
    taskId: number,
    stepId: string,
    result: 'success' | 'failure',
    executionData?: any,
    executionTime?: number,
  ): Promise<any> {
    return this.progressTracker.processStepCompletion({
      taskId,
      stepId,
      result,
      executionData,
      executionTime,
    });
  }

  /**
   * ✅ DELEGATES: Get step execution progress for a task
   * Delegates to StepProgressTrackerService for progress calculation
   */
  async getStepProgress(taskId: string, roleId?: string) {
    return this.progressTracker.getStepProgress(taskId, roleId);
  }

  /**
   * ✅ DELEGATES: Get the next available step for a role
   * Delegates to StepProgressTrackerService for next step calculation
   */
  async getNextAvailableStep(
    roleId: string,
    taskId: string,
  ): Promise<WorkflowStep | null> {
    return this.progressTracker.getNextAvailableStep(roleId, taskId);
  }

  // ===================================================================
  // 🗄️ QUERY API - Delegates to Query Service
  // ===================================================================

  /**
   * ✅ DELEGATES: Get step with details
   * Delegates to StepQueryService for optimized database queries
   */
  async getStepWithDetails(stepId: string, includeAll = true) {
    return this.queryService.getStepById(stepId, {
      includeConditions: includeAll,
      includeActions: includeAll,
      includeProgress: includeAll,
      includeRole: includeAll,
    });
  }

  /**
   * ✅ DELEGATES: Get steps for role
   * Delegates to StepQueryService for role-based step retrieval
   */
  async getStepsForRole(roleId: string, taskId?: string) {
    return this.queryService.getStepsForRole(roleId, taskId, {
      includeConditions: true,
      includeActions: true,
      includeProgress: !!taskId,
    });
  }

  /**
   * ✅ DELEGATES: Search steps
   * Delegates to StepQueryService for step search functionality
   */
  async searchSteps(searchTerm: string) {
    return this.queryService.searchSteps(searchTerm, {
      includeConditions: true,
      includeActions: true,
      includeRole: true,
    });
  }

  // ===================================================================
  // ⚙️ CONFIGURATION API - Delegates to Core Service
  // ===================================================================

  /**
   * ✅ DELEGATES: Update step execution configuration
   * Delegates to StepExecutionCoreService for configuration management
   */
  updateConfig(config: any): void {
    return this.coreService.updateConfig(config);
  }

  /**
   * ✅ DELEGATES: Get current configuration
   * Delegates to StepExecutionCoreService for configuration retrieval
   */
  getConfig(): any {
    return this.coreService.getConfig();
  }

  // ===================================================================
  // 📈 ANALYTICS API - Delegates to Query Service
  // ===================================================================

  /**
   * ✅ DELEGATES: Get step statistics
   * Delegates to StepQueryService for analytics data
   */
  async getStepStatistics() {
    return this.queryService.getStepStatistics();
  }

  /**
   * ✅ DELEGATES: Get step count by role
   * Delegates to StepQueryService for role statistics
   */
  async getStepCountByRole(roleId: string): Promise<number> {
    return this.queryService.getStepCountByRole(roleId);
  }

  // ===================================================================
  // 🔄 BACKWARDS COMPATIBILITY METHODS
  // ===================================================================
  // These methods maintain backwards compatibility with existing code
  // while delegating to the appropriate specialized services

  /**
   * ✅ COMPATIBILITY: Legacy method - delegates to guidance service
   * @deprecated Use guidanceService.getStepGuidance() directly
   */
  async getDefaultGitVerificationGuidance(): Promise<any> {
    this.logger.warn(
      'getDefaultGitVerificationGuidance is deprecated, use guidanceService.getStepGuidance()',
    );
    return this.guidanceService.getStepGuidance({
      taskId: 0,
      roleId: 'unknown',
    });
  }

  /**
   * ✅ COMPATIBILITY: Legacy method - delegates to query service
   * @deprecated Use queryService.getNextStepInSequence() directly
   */
  async getNextStep(
    roleId: string,
    currentSequenceNumber: number,
  ): Promise<WorkflowStep | null> {
    this.logger.warn(
      'getNextStep is deprecated, use queryService.getNextStepInSequence()',
    );
    return this.queryService.getNextStepInSequence(
      roleId,
      currentSequenceNumber,
    );
  }

  /**
   * ✅ COMPATIBILITY: Legacy method - delegates to progress tracker
   * @deprecated Use progressTracker.calculateTaskProgress() directly
   */
  async calculateTaskProgress(taskId: number): Promise<any> {
    this.logger.warn(
      'calculateTaskProgress is deprecated, use progressTracker.getStepProgress()',
    );
    const progress = await this.progressTracker.getStepProgress(
      taskId.toString(),
    );
    return {
      percentage: progress.percentage,
      completed: progress.completed,
      estimatedTime: progress.estimatedTime,
    };
  }

  // ===================================================================
  // 📝 SERVICE SUMMARY LOGGING
  // ===================================================================

  onModuleInit() {
    this.logger.log(
      '✅ Step Execution Service initialized with delegation pattern:',
    );
    this.logger.log('  → Core execution: StepExecutionCoreService');
    this.logger.log('  → Guidance & validation: StepGuidanceService');
    this.logger.log('  → Progress tracking: StepProgressTrackerService');
    this.logger.log('  → Database queries: StepQueryService');
    this.logger.log(
      '📊 Service optimization: 1400+ lines → ~200 lines with improved maintainability',
    );
  }
}
