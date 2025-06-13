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
  // Task creation data (name and slug will be used immediately, rest stored for boomerang update)
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
  task: any;
  workflowExecution: any;
  firstStep: any;
  message: string;
  resources: {
    taskId: string;
    executionId: string;
    firstStepId: string | null;
  };
  currentStep: {
    stepId: string;
    name: string;
    displayName: string;
  };
  nextAction: string;
}

/**
 * Fixed Workflow Bootstrap Service
 *
 * NEW APPROACH (NO MORE PLACEHOLDER):
 * - Creates MINIMAL REAL TASK with just name and slug
 * - Stores additional task data in execution context for boomerang UPDATE
 * - Creates workflow execution pointing to first database step
 * - Loads first workflow step from database for the boomerang role
 * - Lets boomerang step 3 UPDATE the task with comprehensive data and analysis
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
   * Bootstrap a workflow - CREATES MINIMAL REAL TASK + EXECUTION
   *
   * WHAT THIS DOES:
   * 1. Creates MINIMAL REAL task with just name and generated slug
   * 2. Stores additional task data in execution context for boomerang UPDATE
   * 3. Finds the first workflow step for the boomerang role from database
   * 4. Creates workflow execution pointing to that first step
   * 5. Returns resources for the step guidance system to take over
   *
   * WHAT THE BOOMERANG STEP 3 WILL DO:
   * - Read the additional task data from execution context
   * - Perform codebase analysis and git setup (steps 1-2)
   * - UPDATE the REAL task with comprehensive data and analysis (step 3)
   * - Continue with normal workflow
   */
  async bootstrapWorkflow(
    input: BootstrapWorkflowInput,
  ): Promise<BootstrapResult> {
    const startTime = Date.now();

    try {
      this.logger.log(
        `Bootstrapping workflow with minimal real task: ${input.taskName}`,
      );

      // Validate input
      const inputValidation = this.validateBootstrapInput(input);
      if (!inputValidation.valid) {
        return {
          success: false,
          task: null,
          workflowExecution: null,
          firstStep: null,
          message: `Bootstrap validation failed: ${inputValidation.errors.join(', ')}`,
          resources: {
            taskId: '',
            executionId: '',
            firstStepId: null,
          },
          currentStep: {
            stepId: '',
            name: '',
            displayName: '',
          },
          nextAction: '',
        };
      }

      // Single transaction for all operations
      const result = await this.prisma.$transaction(async (tx) => {
        // Step 1: Generate unique slug from task name
        const taskSlug = await this.generateUniqueSlug(tx, input.taskName);

        // Step 2: Create MINIMAL REAL task with just name and slug
        const task = await tx.task.create({
          data: {
            name: input.taskName, // ✅ Real name, not placeholder
            slug: taskSlug, // ✅ Real slug, not placeholder
            status: 'not-started',
            priority: input.priority || 'Medium', // ✅ Use provided priority or default
            dependencies: [],
            owner: 'boomerang',
            currentMode: 'boomerang',
          },
        });

        // Step 3: Get boomerang role and its FIRST workflow step from database
        const role = await tx.workflowRole.findUnique({
          where: { name: input.initialRole },
          select: { id: true, name: true, displayName: true },
        });

        if (!role) {
          throw new Error(`Role '${input.initialRole}' not found`);
        }

        // Step 4: Get the FIRST workflow step for this role from database
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

        // Step 5: Create workflow execution with ADDITIONAL task data for UPDATE
        const workflowExecution = await tx.workflowExecution.create({
          data: {
            taskId: task.id,
            currentRoleId: role.id,
            currentStepId: firstStep.id,
            executionMode:
              input.executionMode || this.config.defaults.executionMode,
            autoCreatedTask: true,
            // ✅ Store ADDITIONAL data for boomerang step 3 to UPDATE the task with
            taskCreationData: {
              // Additional data for task UPDATE (not initial creation)
              taskDescription: input.taskDescription,
              businessRequirements: input.businessRequirements,
              technicalRequirements: input.technicalRequirements,
              acceptanceCriteria: input.acceptanceCriteria,
              projectPath: input.projectPath,
              // Task info for reference
              taskId: task.id,
              taskName: input.taskName,
              taskSlug: taskSlug,
            },
            executionContext: {
              bootstrapped: true,
              bootstrapTime: new Date().toISOString(),
              projectPath: input.projectPath,
              initialRoleName: input.initialRole,
              firstStepName: firstStep.name,
              realTaskCreated: true, // ✅ Real task already created
              taskUpdatePending: true, // ✅ Flag for boomerang step 3 to UPDATE
              taskInfo: {
                id: task.id,
                name: task.name,
                slug: taskSlug,
              },
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
              realTask: {
                id: task.id,
                name: task.name,
                slug: taskSlug,
                isMinimal: true, // ✅ Indicates it needs to be updated with comprehensive data
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
          task,
          workflowExecution,
          role,
          firstStep,
        };
      });

      const duration = Date.now() - startTime;
      this.logger.log(
        `Workflow bootstrapped in ${duration}ms - Minimal real task created, boomerang will update with comprehensive data`,
      );

      return {
        success: true,
        task: result.task,
        workflowExecution: result.workflowExecution,
        firstStep: result.firstStep,
        message: `Workflow successfully bootstrapped with minimal real task. Boomerang workflow will update task with comprehensive data after git setup and codebase analysis.`,
        resources: {
          taskId: result.task.id.toString(),
          executionId: result.workflowExecution.id,
          firstStepId: result.firstStep.id,
        },
        currentStep: {
          stepId: result.firstStep.id,
          name: result.firstStep.name,
          displayName: result.firstStep.displayName,
        },
        nextAction: 'get_workflow_guidance',
      };
    } catch (error) {
      this.logger.error(`Bootstrap failed:`, error);
      return {
        success: false,
        task: null,
        workflowExecution: null,
        firstStep: null,
        message: `Bootstrap failed: ${error.message}`,
        resources: {
          taskId: '',
          executionId: '',
          firstStepId: null,
        },
        currentStep: {
          stepId: '',
          name: '',
          displayName: '',
        },
        nextAction: '',
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
   * Generate unique slug from task name
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
