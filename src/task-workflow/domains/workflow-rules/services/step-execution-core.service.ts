import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { WorkflowStep } from 'generated/prisma';
import { StepGuidanceService } from './step-guidance.service';
import { StepProgressTrackerService } from './step-progress-tracker.service';
import { RequiredInputExtractorService } from '../../../utils/envelope-builder/required-input-extractor.service';
import { ActionGuidanceGeneratorService } from '../../../utils/envelope-builder/action-guidance-generator.service';
import { ProgressCalculatorService } from '../../../utils/envelope-builder/progress-calculator.service';
import { ValidationContextBuilderService } from '../../../utils/envelope-builder/validation-context-builder.service';

// ===================================================================
// ⚡ STEP EXECUTION CORE SERVICE - MCP Guidance-Only Architecture
// ===================================================================
// Purpose: Provide intelligent guidance for AI agents to execute locally
// Scope: Step guidance generation, progress tracking, and context building
// MCP Compliance: NO execution - only guidance and intelligence

// Configuration interfaces to eliminate hardcoding
export interface StepExecutionConfig {
  defaults: {
    progressStatus: {
      inProgress: 'IN_PROGRESS';
      completed: 'COMPLETED';
      failed: 'FAILED';
      pending: 'PENDING';
    };
  };
  validation: {
    requireStepId: boolean;
    requireTaskId: boolean;
    requireRoleId: boolean;
  };
  performance: {
    executionTimeoutMs: number;
    maxRetryAttempts: number;
    queryTimeoutMs: number;
    maxConcurrentExecutions: number;
  };
}

export interface StepExecutionContext {
  taskId: number;
  roleId: string;
  stepId?: string;
  projectPath?: string;
  executionData?: any;
}

// ✅ MCP COMPLIANT: Guidance-only result interface
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
  // Enhanced business logic data (no envelope duplication)
  progressMetrics?: any;
  validationContext?: any;
  requiredInputs?: any[];
  actionGuidance?: string;
}

@Injectable()
export class StepExecutionCoreService {
  private readonly logger = new Logger(StepExecutionCoreService.name);

  // Configuration with sensible defaults
  private readonly config: StepExecutionConfig = {
    defaults: {
      progressStatus: {
        inProgress: 'IN_PROGRESS',
        completed: 'COMPLETED' as const,
        failed: 'FAILED' as const,
        pending: 'PENDING',
      },
    },
    validation: {
      requireStepId: true,
      requireTaskId: true,
      requireRoleId: true,
    },
    performance: {
      executionTimeoutMs: 30000,
      maxRetryAttempts: 3,
      queryTimeoutMs: 5000,
      maxConcurrentExecutions: 5,
    },
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly guidanceService: StepGuidanceService,
    private readonly progressTracker: StepProgressTrackerService,
    // Enhanced services for business logic enhancement
    private readonly inputExtractor: RequiredInputExtractorService,
    private readonly guidanceGenerator: ActionGuidanceGeneratorService,
    private readonly progressCalculator: ProgressCalculatorService,
    private readonly validationBuilder: ValidationContextBuilderService,
  ) {}

  /**
   * ✅ MCP COMPLIANT: Provide guidance for AI agent to execute locally
   * NO execution - only intelligent guidance generation
   */
  async executeWorkflowStep(
    context: StepExecutionContext,
  ): Promise<StepExecutionResult> {
    const startTime = Date.now();

    try {
      this.validateInput(context);
      const { taskId, roleId, stepId, executionData } = context;

      // Get the step details (single query)
      const step = await this.getStepWithDetails(stepId!); // Safe after validation
      if (!step) {
        throw new Error(`Workflow step '${stepId}' not found`);
      }

      // ✅ ENHANCED: Build baseline guidance for enhanced services
      const baseGuidance = this.buildBaseGuidance(roleId, step);

      // ✅ ENHANCED: Parallel execution of enhanced services for performance
      const [
        validationResult,
        requiredInputsResult,
        progressResult,
        actionGuidanceResult,
      ] = await Promise.all([
        this.validationBuilder.buildValidationContext(
          baseGuidance,
          stepId!,
          taskId,
        ),
        this.inputExtractor.extractRequiredInput(stepId || null, baseGuidance),
        this.progressCalculator.calculateProgress(
          taskId,
          baseGuidance,
          stepId || null,
        ),
        this.guidanceGenerator.generateActionGuidance(
          baseGuidance,
          stepId!,
          context,
        ),
      ]);

      // ✅ MCP COMPLIANT: Generate guidance instead of executing
      const stepGuidance = this.generateStepGuidance(step, context, {
        validationResult,
        requiredInputsResult,
        progressResult,
        actionGuidanceResult,
      });

      // Record step progress start (guidance provided)
      const progressRecord = await this.createProgressRecord(
        String(taskId),
        roleId,
        stepId!,
        executionData,
      );

      // Update progress record with guidance provided
      await this.updateProgressRecord(
        progressRecord.id,
        this.config.defaults.progressStatus.completed,
        {
          guidanceProvided: stepGuidance,
          duration: Date.now() - startTime,
        },
      );

      // Get next step in sequence
      const nextStep = await this.getNextStep(step.roleId, step.sequenceNumber);

      // ✅ MCP COMPLIANT: Return guidance for AI agent execution
      return {
        success: true,
        guidance: stepGuidance,
        nextStep: nextStep || undefined,
        duration: Date.now() - startTime,
        // Enhanced data without duplication
        progressMetrics: progressResult.success ? progressResult.metrics : null,
        validationContext: validationResult.success
          ? validationResult.context
          : null,
        requiredInputs: Array.isArray(requiredInputsResult)
          ? requiredInputsResult
          : [],
        actionGuidance: actionGuidanceResult.success
          ? actionGuidanceResult.guidance || undefined
          : undefined,
      };
    } catch (error) {
      this.logger.error(`Error generating step guidance:`, error);
      return {
        success: false,
        guidance: {
          description: 'Error generating step guidance',
          expectedOutput: 'Error resolution',
          suggestedTools: ['error_handling'],
          localExecution: {
            commands: ['Handle error locally'],
            aiIntelligence: 'Apply error resolution strategies',
          },
          successCriteria: ['Error resolved and step can proceed'],
        },
        errors: [error.message],
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * ✅ MCP COMPLIANT: Generate intelligent guidance for step execution
   */
  private generateStepGuidance(
    step: WorkflowStep,
    context: StepExecutionContext,
    _enhancedData: any,
  ): {
    description: string;
    expectedOutput: string;
    suggestedTools: string[];
    localExecution: {
      commands: string[];
      aiIntelligence: string;
    };
    successCriteria: string[];
  } {
    // Extract guidance from step configuration - handle JsonValue type safely
    const actionData = step.actionData as any;
    const stepGuidance = actionData?.guidance || {};

    return {
      description: stepGuidance.description || `Execute ${step.name} step`,
      expectedOutput:
        stepGuidance.expectedOutput || `${step.name} completion results`,
      suggestedTools: stepGuidance.suggestedTools || [
        'codebase_search',
        'read_file',
        'edit_file',
      ],
      localExecution: {
        commands: stepGuidance.localExecution?.commands || [
          `Execute ${step.name} using AI intelligence and local tools`,
        ],
        aiIntelligence:
          stepGuidance.localExecution?.aiIntelligence ||
          `Apply ${context.roleId} role expertise to complete ${step.name}`,
      },
      successCriteria: stepGuidance.successCriteria || [
        `${step.name} completed successfully`,
        'Quality standards met',
        'Next step ready for execution',
      ],
    };
  }

  /**
   * ✅ DELEGATION: Get step guidance (delegates to guidance service)
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
   * ✅ DELEGATION: Get step validation criteria (delegates to guidance service)
   */
  async getStepValidationCriteria(stepId: string): Promise<any> {
    return this.guidanceService.getStepValidationCriteria(stepId);
  }

  /**
   * ✅ DELEGATION: Process step completion (delegates to progress tracker)
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
   * ✅ DELEGATION: Get step progress (delegates to progress tracker)
   */
  async getStepProgress(taskId: string, roleId?: string) {
    return this.progressTracker.getStepProgress(taskId, roleId);
  }

  /**
   * ✅ DELEGATION: Get next available step (delegates to progress tracker)
   */
  async getNextAvailableStep(
    roleId: string,
    taskId: string,
  ): Promise<WorkflowStep | null> {
    return this.progressTracker.getNextAvailableStep(roleId, taskId);
  }

  /**
   * Update step execution configuration
   */
  updateConfig(config: Partial<StepExecutionConfig>): void {
    if (config.defaults) {
      Object.assign(this.config.defaults, config.defaults);
    }
    if (config.validation) {
      Object.assign(this.config.validation, config.validation);
    }
    if (config.performance) {
      Object.assign(this.config.performance, config.performance);
    }
    this.logger.log('Step execution configuration updated');
  }

  /**
   * Get current configuration
   */
  getConfig(): StepExecutionConfig {
    return {
      defaults: JSON.parse(JSON.stringify(this.config.defaults)),
      validation: { ...this.config.validation },
      performance: { ...this.config.performance },
    };
  }

  // ===================================================================
  // 🔧 PRIVATE HELPER METHODS (Minimal, focused)
  // ===================================================================

  private validateInput(context: StepExecutionContext): void {
    if (this.config.validation.requireTaskId && !context.taskId) {
      throw new Error('taskId is required for step execution');
    }

    if (this.config.validation.requireRoleId && !context.roleId) {
      throw new Error('roleId is required for step execution');
    }

    if (this.config.validation.requireStepId && !context.stepId) {
      throw new Error('stepId is required for step execution');
    }
  }

  private getStepWithDetails(stepId: string) {
    return this.prisma.workflowStep.findUnique({
      where: { id: stepId },
      include: {
        conditions: true,
        actions: true,
      },
    });
  }

  private buildBaseGuidance(roleId: string, step: WorkflowStep) {
    return {
      currentRole: {
        name: roleId,
        displayName: roleId,
        description: `Role: ${roleId}`,
        capabilities: {},
      },
      currentStep: step
        ? {
            name: step.name,
            displayName: step.displayName,
            description: step.description,
            stepType: step.stepType,
          }
        : null,
      nextActions: [], // Actions will be loaded separately if needed
      projectContext: {},
      qualityReminders: [],
      ruleEnforcement: {
        requiredPatterns: [],
        antiPatterns: [],
        complianceChecks: [],
      },
      reportingStatus: { shouldTriggerReport: false },
    };
  }

  private createProgressRecord(
    taskId: string,
    roleId: string,
    stepId: string,
    executionData?: any,
  ) {
    return this.prisma.workflowStepProgress.create({
      data: {
        taskId,
        roleId,
        stepId,
        status: 'IN_PROGRESS',
        startedAt: new Date(),
        executionData,
      },
    });
  }

  private updateProgressRecord(
    progressId: string,
    status: 'COMPLETED' | 'FAILED',
    updateData: any,
  ) {
    return this.prisma.workflowStepProgress.update({
      where: { id: progressId },
      data: {
        status,
        completedAt: new Date(),
        ...updateData,
      },
    });
  }

  private getNextStep(
    roleId: string,
    currentSequenceNumber: number,
  ): Promise<WorkflowStep | null> {
    return this.prisma.workflowStep.findFirst({
      where: {
        roleId,
        sequenceNumber: { gt: currentSequenceNumber },
      },
      orderBy: { sequenceNumber: 'asc' },
    });
  }
}
