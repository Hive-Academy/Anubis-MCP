import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CoreServiceOrchestrator } from './core-service-orchestrator.service';
import {
  WorkflowExecutionService,
  CreateWorkflowExecutionInput,
} from './workflow-execution.service';
import { WorkflowGuidanceService } from './workflow-guidance.service';

// Configuration interfaces to eliminate hardcoding
export interface BootstrapConfig {
  validation: {
    taskNameMaxLength: number;
    taskNameMinLength: number;
    validRoles: string[];
    validPriorities: string[];
    validExecutionModes: string[];
  };
  defaults: {
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    executionMode: 'GUIDED' | 'AUTOMATED' | 'HYBRID';
    initialStepsCount: number;
  };
  performance: {
    transactionTimeoutMs: number;
    maxRetries: number;
  };
}

export interface BootstrapWorkflowInput {
  // Task creation data
  taskName: string;
  taskDescription?: string;
  businessRequirements?: string;
  technicalRequirements?: string;
  acceptanceCriteria?: string[];
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';

  // Codebase analysis data (optional)
  codebaseAnalysis?: {
    architectureFindings?: any;
    problemsIdentified?: any;
    implementationContext?: any;
    integrationPoints?: any;
    qualityAssessment?: any;
    filesCovered?: string[];
    technologyStack?: any;
    analyzedBy?: string;
  };

  // Workflow execution setup
  initialRole:
    | 'boomerang'
    | 'researcher'
    | 'architect'
    | 'senior-developer'
    | 'code-review';
  executionMode?: 'GUIDED' | 'AUTOMATED' | 'HYBRID';
  projectPath?: string;
  executionContext?: Record<string, any>;
}

export interface BootstrapResult {
  success: boolean;
  task: any;
  workflowExecution: any;
  initialGuidance: any;
  nextSteps: any[];
  message: string;
}

/**
 * Workflow Bootstrap Service
 *
 * Single Responsibility: Bootstrap new workflows from scratch
 * - Creates task with full context
 * - Initializes workflow execution
 * - Provides initial guidance
 * - Sets up proper role context
 */
@Injectable()
export class WorkflowBootstrapService {
  private readonly logger = new Logger(WorkflowBootstrapService.name);

  // Configuration with sensible defaults
  private readonly config: BootstrapConfig = {
    validation: {
      taskNameMaxLength: 200,
      taskNameMinLength: 3,
      validRoles: [
        'boomerang',
        'researcher',
        'architect',
        'senior-developer',
        'code-review',
        'integration-engineer',
      ],
      validPriorities: ['Low', 'Medium', 'High', 'Critical'],
      validExecutionModes: ['GUIDED', 'AUTOMATED', 'HYBRID'],
    },
    defaults: {
      priority: 'Medium',
      executionMode: 'GUIDED',
      initialStepsCount: 3,
    },
    performance: {
      transactionTimeoutMs: 30000,
      maxRetries: 3,
    },
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly coreOrchestrator: CoreServiceOrchestrator,
    private readonly workflowExecution: WorkflowExecutionService,
    private readonly workflowGuidance: WorkflowGuidanceService,
  ) {}

  /**
   * Update bootstrap configuration
   */
  updateConfig(config: Partial<BootstrapConfig>): void {
    if (config.validation) {
      Object.assign(this.config.validation, config.validation);
    }
    if (config.defaults) {
      Object.assign(this.config.defaults, config.defaults);
    }
    if (config.performance) {
      Object.assign(this.config.performance, config.performance);
    }
    this.logger.log('Bootstrap configuration updated');
  }

  /**
   * Get current configuration
   */
  getConfig(): BootstrapConfig {
    return {
      validation: { ...this.config.validation },
      defaults: { ...this.config.defaults },
      performance: { ...this.config.performance },
    };
  }

  /**
   * Bootstrap a complete workflow from scratch
   * Creates task, workflow execution, and provides initial guidance
   */
  async bootstrapWorkflow(
    input: BootstrapWorkflowInput,
  ): Promise<BootstrapResult> {
    const startTime = Date.now();

    try {
      this.logger.log(`Bootstrapping workflow: ${input.taskName}`);

      // Use database transaction to ensure data consistency
      const result = await this.prisma.$transaction(async (tx) => {
        // Step 1: Create the task using TaskOperations service
        const taskResult = await this.createTaskWithContext(input);

        if (!taskResult.success) {
          throw new Error(`Task creation failed: ${taskResult.error}`);
        }

        const task = taskResult.data.task;
        const taskId = task.id;

        this.logger.debug(`Task created with ID: ${taskId}`);

        // Step 2: Get the role ID for the initial role
        const role = await tx.workflowRole.findUnique({
          where: { name: input.initialRole },
        });

        if (!role) {
          throw new Error(
            `Role '${input.initialRole}' not found in database. Please ensure workflow roles are properly initialized.`,
          );
        }

        // Step 3: Create workflow execution for the task
        const executionInput: CreateWorkflowExecutionInput = {
          taskId,
          currentRoleId: role.id, // Use the actual role ID, not the name
          executionMode:
            input.executionMode || this.config.defaults.executionMode,
          autoCreatedTask: true,
          executionContext: {
            ...input.executionContext,
            bootstrapped: true,
            bootstrapTime: new Date().toISOString(),
            projectPath: input.projectPath,
            initialRoleName: input.initialRole, // Keep the role name for reference
          },
        };

        // Create execution within transaction
        const workflowExecution = await this.createExecutionInTransaction(
          tx,
          executionInput,
        );

        this.logger.debug(
          `Workflow execution created: ${workflowExecution.id}`,
        );

        return { task, workflowExecution, role };
      });

      // Step 4: Get initial workflow guidance (outside transaction)
      const guidanceContext = {
        taskId: result.task.id,
        roleId: input.initialRole,
        projectPath: input.projectPath,
        executionData: {
          bootstrapped: true,
          taskName: input.taskName,
        },
      };

      const initialGuidance = await this.workflowGuidance.getWorkflowGuidance(
        input.initialRole,
        guidanceContext,
      );

      // Step 5: Get next steps for the role (outside transaction)
      const nextSteps = await this.getInitialNextSteps(
        input.initialRole,
        result.task.id,
      );

      const duration = Date.now() - startTime;

      this.logger.log(
        `Workflow bootstrapped successfully in ${duration}ms: Task ${result.task.id}, Execution ${result.workflowExecution.id}`,
      );

      return {
        success: true,
        task: result.task,
        workflowExecution: result.workflowExecution,
        initialGuidance,
        nextSteps,
        message: `Workflow successfully bootstrapped for "${input.taskName}" with ${input.initialRole} role`,
      };
    } catch (error) {
      this.logger.error(`Workflow bootstrap failed:`, error);

      return {
        success: false,
        task: null,
        workflowExecution: null,
        initialGuidance: null,
        nextSteps: [],
        message: `Bootstrap failed: ${error.message}`,
      };
    }
  }

  /**
   * Create task with full context using CoreServiceOrchestrator
   */
  private async createTaskWithContext(input: BootstrapWorkflowInput) {
    const taskOperationParams = {
      operation: 'create',
      taskData: {
        name: input.taskName,
        status: 'not-started',
        priority: input.priority || this.config.defaults.priority,
        dependencies: [],
      },
      description:
        input.taskDescription ||
        input.businessRequirements ||
        input.technicalRequirements
          ? {
              description: input.taskDescription || '',
              businessRequirements: input.businessRequirements || '',
              technicalRequirements: input.technicalRequirements || '',
              acceptanceCriteria: input.acceptanceCriteria || [],
            }
          : undefined,
      codebaseAnalysis: input.codebaseAnalysis,
    };

    return await this.coreOrchestrator.executeServiceCall(
      'TaskOperations',
      'create',
      taskOperationParams,
    );
  }

  /**
   * Create workflow execution within a database transaction
   */
  private async createExecutionInTransaction(
    tx: any,
    input: CreateWorkflowExecutionInput,
  ): Promise<any> {
    // Get the first step for the role to assign as currentStepId
    const firstStep = await tx.workflowStep.findFirst({
      where: { roleId: input.currentRoleId },
      orderBy: { sequenceNumber: 'asc' },
    });

    if (!firstStep) {
      this.logger.warn(`No steps found for role ${input.currentRoleId}`);
    }

    const execution = await tx.workflowExecution.create({
      data: {
        taskId: input.taskId,
        currentRoleId: input.currentRoleId,
        currentStepId: firstStep?.id || null, // Assign first step if available
        executionMode:
          input.executionMode || this.config.defaults.executionMode,
        autoCreatedTask: input.autoCreatedTask || false,
        executionContext: input.executionContext || {},
        executionState: {
          phase: 'initialized',
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
      `Workflow execution created in transaction: ${execution.id}${
        firstStep
          ? ` with first step: ${firstStep.name}`
          : ' (no steps available)'
      }`,
    );

    return execution;
  }

  /**
   * Get initial next steps for a role
   */
  private async getInitialNextSteps(
    roleName: string,
    _taskId: number,
  ): Promise<any[]> {
    try {
      // Get the role to find its initial steps
      const role = await this.prisma.workflowRole.findUnique({
        where: { name: roleName },
      });

      if (!role) {
        return [];
      }

      // Get the first few steps for this role
      const steps = await this.prisma.workflowStep.findMany({
        where: { roleId: role.id },
        orderBy: { sequenceNumber: 'asc' },
        take: this.config.defaults.initialStepsCount,
      });

      return steps.map((step) => ({
        stepId: step.id,
        name: step.name,
        displayName: step.displayName,
        description: step.description,
        stepType: step.stepType,
        sequenceNumber: step.sequenceNumber,
        status: 'ready',
      }));
    } catch (error) {
      this.logger.warn(`Failed to get initial next steps:`, error);
      return [
        {
          name: 'initial_analysis',
          displayName: 'Initial Analysis',
          description: `Begin ${roleName} workflow with initial analysis`,
          stepType: 'ANALYSIS',
          status: 'ready',
        },
      ];
    }
  }

  /**
   * Validate bootstrap input
   */
  validateBootstrapInput(input: BootstrapWorkflowInput): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!input.taskName || input.taskName.trim().length === 0) {
      errors.push('Task name is required');
    }

    if (
      input.taskName &&
      input.taskName.length > this.config.validation.taskNameMaxLength
    ) {
      errors.push(
        `Task name must be less than ${this.config.validation.taskNameMaxLength} characters`,
      );
    }

    if (
      input.taskName &&
      input.taskName.length < this.config.validation.taskNameMinLength
    ) {
      errors.push(
        `Task name must be at least ${this.config.validation.taskNameMinLength} characters`,
      );
    }

    const validRoles = this.config.validation.validRoles;
    if (!validRoles.includes(input.initialRole)) {
      errors.push(`Initial role must be one of: ${validRoles.join(', ')}`);
    }

    const validPriorities = this.config.validation.validPriorities;
    if (input.priority && !validPriorities.includes(input.priority)) {
      errors.push(`Priority must be one of: ${validPriorities.join(', ')}`);
    }

    const validExecutionModes = this.config.validation.validExecutionModes;
    if (
      input.executionMode &&
      !validExecutionModes.includes(input.executionMode)
    ) {
      errors.push(
        `Execution mode must be one of: ${validExecutionModes.join(', ')}`,
      );
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
