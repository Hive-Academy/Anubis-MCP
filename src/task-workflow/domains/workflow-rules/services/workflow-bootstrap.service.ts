import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';

// Simplified configuration
export interface BootstrapConfig {
  validation: {
    taskNameMaxLength: number;
    taskNameMinLength: number;
    validRoles: string[];
    validExecutionModes: string[];
  };
  defaults: {
    executionMode: 'GUIDED' | 'AUTOMATED' | 'HYBRID';
  };
}

export interface BootstrapWorkflowInput {
  // Task creation data (this will be stored in execution context for boomerang to use)
  taskName: string;
  taskDescription?: string;
  businessRequirements?: string;
  technicalRequirements?: string;
  acceptanceCriteria?: string[];
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';

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
  placeholderTask: any;
  workflowExecution: any;
  firstStep: any;
  message: string;
  resources: {
    taskId: string;
    executionId: string;
    firstStepId: string | null;
  };
}

/**
 * Simplified Workflow Bootstrap Service
 *
 * ALIGNED WITH DATABASE-DRIVEN WORKFLOW STEPS:
 * - Creates MINIMAL PLACEHOLDER TASK for database constraints only
 * - Stores real task data in execution context for boomerang step 3 to use
 * - Creates workflow execution pointing to first database step
 * - Loads first workflow step from database for the boomerang role
 * - Lets boomerang step 3 handle the REAL task creation with analysis
 */
@Injectable()
export class WorkflowBootstrapService {
  private readonly logger = new Logger(WorkflowBootstrapService.name);

  // Simplified configuration
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
      validExecutionModes: ['GUIDED', 'AUTOMATED', 'HYBRID'],
    },
    defaults: {
      executionMode: 'GUIDED',
    },
  };

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Bootstrap a workflow - CREATES PLACEHOLDER TASK + EXECUTION
   *
   * WHAT THIS DOES:
   * 1. Creates MINIMAL PLACEHOLDER task (just for database constraints)
   * 2. Stores REAL task data in execution context for boomerang step 3
   * 3. Finds the first workflow step for the boomerang role from database
   * 4. Creates workflow execution pointing to that first step
   * 5. Returns resources for the step guidance system to take over
   *
   * WHAT THE BOOMERANG STEP 3 WILL DO:
   * - Read the real task data from execution context
   * - Perform codebase analysis and git setup (steps 1-2)
   * - Create the REAL comprehensive task with analysis (step 3)
   * - Update the workflow execution to point to the real task
   */
  async bootstrapWorkflow(
    input: BootstrapWorkflowInput,
  ): Promise<BootstrapResult> {
    const startTime = Date.now();

    try {
      this.logger.log(
        `Bootstrapping workflow with placeholder task: ${input.taskName}`,
      );

      // Validate input
      const inputValidation = this.validateBootstrapInput(input);
      if (!inputValidation.valid) {
        return {
          success: false,
          placeholderTask: null,
          workflowExecution: null,
          firstStep: null,
          message: `Bootstrap validation failed: ${inputValidation.errors.join(', ')}`,
          resources: {
            taskId: '',
            executionId: '',
            firstStepId: null,
          },
        };
      }

      // Single transaction for all operations
      const result = await this.prisma.$transaction(async (tx) => {
        // Step 1: Create MINIMAL PLACEHOLDER task (just for database constraints)
        const placeholderSlug = `bootstrap-placeholder-${Date.now()}`;

        const placeholderTask = await tx.task.create({
          data: {
            name: `[PLACEHOLDER] ${input.taskName}`,
            slug: placeholderSlug,
            status: 'not-started',
            priority: 'Medium', // Default, will be set by boomerang step 3
            dependencies: [],
            owner: 'boomerang',
            currentMode: 'boomerang',
          },
        });

        // Step 2: Get boomerang role and its FIRST workflow step from database
        const role = await tx.workflowRole.findUnique({
          where: { name: input.initialRole },
          select: { id: true, name: true, displayName: true },
        });

        if (!role) {
          throw new Error(`Role '${input.initialRole}' not found`);
        }

        // Step 3: Get the FIRST workflow step for this role from database
        const firstStep = await tx.workflowStep.findFirst({
          where: {
            roleId: role.id,
          },
          orderBy: { sequenceNumber: 'asc' },
          select: {
            id: true,
            name: true,
            displayName: true,
            description: true,
            sequenceNumber: true,
            stepType: true,
            estimatedTime: true,
            behavioralContext: true,
            approachGuidance: true,
            qualityChecklist: true,
          },
        });

        if (!firstStep) {
          throw new Error(
            `No workflow steps found for role '${input.initialRole}'`,
          );
        }

        // Step 4: Create workflow execution with REAL task data in context
        const workflowExecution = await tx.workflowExecution.create({
          data: {
            taskId: placeholderTask.id,
            currentRoleId: role.id,
            currentStepId: firstStep.id,
            executionMode:
              input.executionMode || this.config.defaults.executionMode,
            autoCreatedTask: true,
            // CRITICAL: Store REAL task data for boomerang step 3 to use
            taskCreationData: {
              // This is what boomerang step 3 will use to create the REAL task
              realTaskName: input.taskName,
              taskDescription: input.taskDescription,
              businessRequirements: input.businessRequirements,
              technicalRequirements: input.technicalRequirements,
              acceptanceCriteria: input.acceptanceCriteria,
              priority: input.priority,
              projectPath: input.projectPath,
            },
            executionContext: {
              bootstrapped: true,
              bootstrapTime: new Date().toISOString(),
              projectPath: input.projectPath,
              initialRoleName: input.initialRole,
              firstStepName: firstStep.name,
              placeholderTaskCreated: true,
              realTaskPending: true, // Flag for boomerang step 3
              ...input.executionContext,
            },
            executionState: {
              phase: 'initialized',
              currentContext: input.executionContext || {},
              progressMarkers: [],
              currentStep: {
                id: firstStep.id,
                name: firstStep.name,
                displayName: firstStep.displayName,
                sequenceNumber: firstStep.sequenceNumber,
                assignedAt: new Date().toISOString(),
              },
              placeholderTask: {
                id: placeholderTask.id,
                name: placeholderTask.name,
                isPlaceholder: true,
              },
            },
          },
          include: {
            task: true,
            currentRole: {
              select: { id: true, name: true, displayName: true },
            },
            currentStep: {
              select: { id: true, name: true, displayName: true },
            },
          },
        });

        return {
          placeholderTask,
          workflowExecution,
          role,
          firstStep,
        };
      });

      const duration = Date.now() - startTime;
      this.logger.log(
        `Workflow bootstrapped in ${duration}ms - Placeholder task created, boomerang step 3 will create real task`,
      );

      return {
        success: true,
        placeholderTask: result.placeholderTask,
        workflowExecution: result.workflowExecution,
        firstStep: result.firstStep,
        message: `Workflow successfully bootstrapped with placeholder task. Boomerang workflow will handle real task creation in step 3 after git setup and codebase analysis.`,
        resources: {
          taskId: result.placeholderTask.id.toString(),
          executionId: result.workflowExecution.id,
          firstStepId: result.firstStep.id,
        },
      };
    } catch (error) {
      this.logger.error(`Bootstrap failed:`, error);
      return {
        success: false,
        placeholderTask: null,
        workflowExecution: null,
        firstStep: null,
        message: `Bootstrap failed: ${error.message}`,
        resources: {
          taskId: '',
          executionId: '',
          firstStepId: null,
        },
      };
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

  /**
   * Generate unique slug without separate database calls
   */
  private async generateUniqueSlug(tx: any, taskName: string): Promise<string> {
    const baseSlug = taskName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);

    // Try the base slug first
    const existing = await tx.task.findUnique({
      where: { slug: baseSlug },
      select: { id: true },
    });

    if (!existing) {
      return baseSlug;
    }

    // If exists, append timestamp for uniqueness
    return `${baseSlug}-${Date.now()}`;
  }
}
