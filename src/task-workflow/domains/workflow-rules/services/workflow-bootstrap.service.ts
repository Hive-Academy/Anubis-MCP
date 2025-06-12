import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { ActionGuidanceGeneratorService } from '../../../utils/envelope-builder/action-guidance-generator.service';
import { ProgressCalculatorService } from '../../../utils/envelope-builder/progress-calculator.service';
import { RequiredInputExtractorService } from '../../../utils/envelope-builder/required-input-extractor.service';
import { ValidationContextBuilderService } from '../../../utils/envelope-builder/validation-context-builder.service';
// REMOVED: EnvelopeBuilderService - envelope building is MCP layer responsibility

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
  // Task creation data (minimal upfront requirements)
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
  initialGuidance: any;
  nextSteps: any[];
  message: string;
  // CORRECTED: Keep business logic enhancements, remove envelope metadata
  validationContext?: any;
  requiredInputs?: any[];
  progressMetrics?: any;
  actionGuidance?: string;
  enhancedContext?: any;
  // REMOVED: envelopeMetadata - that's MCP layer responsibility
}

/**
 * Workflow Bootstrap Service
 *
 * Single Responsibility: Bootstrap new workflows from scratch
 * - Creates task with full context
 * - Initializes workflow execution
 * - Provides initial guidance
 * - Sets up proper role context
 *
 * ENHANCED: Now includes enhanced envelope-builder integration for
 * comprehensive bootstrap validation and initial guidance generation
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
    private readonly inputExtractor: RequiredInputExtractorService,
    private readonly guidanceGenerator: ActionGuidanceGeneratorService,
    private readonly progressCalculator: ProgressCalculatorService,
    private readonly validationBuilder: ValidationContextBuilderService,
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
   * Bootstrap a complete workflow from scratch (optimized version)
   * Creates task, workflow execution, and provides initial guidance
   * - Eliminates nested transactions for better performance
   * - Reduces database operations
   * - Uses single transaction for all operations
   *
   * ENHANCED: Now includes enhanced envelope-builder integration for
   * comprehensive bootstrap validation and initial guidance generation
   */
  async bootstrapWorkflow(
    input: BootstrapWorkflowInput,
  ): Promise<BootstrapResult> {
    const startTime = Date.now();

    try {
      this.logger.log(`Bootstrapping workflow (enhanced): ${input.taskName}`);

      // ENHANCED: Validate input using enhanced validation services first
      const inputValidation = this.validateBootstrapInput(input);
      if (!inputValidation.valid) {
        return {
          success: false,
          task: null,
          workflowExecution: null,
          initialGuidance: null,
          nextSteps: [],
          message: `Bootstrap validation failed: ${inputValidation.errors.join(', ')}`,
        };
      }

      // Single transaction for all operations
      const result = await this.prisma.$transaction(
        async (tx) => {
          // Step 1: Direct task creation (no nested transaction)
          const taskSlug = await this.generateUniqueSlug(tx, input.taskName);

          const task = await tx.task.create({
            data: {
              name: input.taskName,
              slug: taskSlug,
              status: 'not-started',
              priority: input.priority || this.config.defaults.priority,
              dependencies: [],
              owner: 'boomerang',
              currentMode: 'boomerang',
            },
          });

          // Step 2: Create description if provided (minimal fields)
          let taskDescription = null;
          if (
            input.taskDescription ||
            input.businessRequirements ||
            input.technicalRequirements
          ) {
            taskDescription = await tx.taskDescription.create({
              data: {
                taskId: task.id,
                description: input.taskDescription || '',
                businessRequirements: input.businessRequirements || '',
                technicalRequirements: input.technicalRequirements || '',
                acceptanceCriteria: input.acceptanceCriteria || [],
              },
            });
          }

          // Step 3: Get role and first step in parallel
          const [role, firstStep] = await Promise.all([
            tx.workflowRole.findUnique({
              where: { name: input.initialRole },
              select: { id: true, name: true, displayName: true }, // Include displayName
            }),
            tx.workflowStep.findFirst({
              where: {
                role: { name: input.initialRole },
              },
              orderBy: { sequenceNumber: 'asc' },
              select: { id: true, name: true, sequenceNumber: true }, // Only select needed fields
            }),
          ]);

          if (!role) {
            throw new Error(`Role '${input.initialRole}' not found`);
          }

          // Step 4: Create execution (minimal includes)
          const workflowExecution = await tx.workflowExecution.create({
            data: {
              taskId: task.id,
              currentRoleId: role.id,
              currentStepId: firstStep?.id || null,
              executionMode:
                input.executionMode || this.config.defaults.executionMode,
              autoCreatedTask: true,
              executionContext: {
                bootstrapped: true,
                bootstrapTime: new Date().toISOString(),
                projectPath: input.projectPath,
                initialRoleName: input.initialRole,
                ...input.executionContext,
              },
              executionState: {
                phase: 'initialized',
                currentContext: input.executionContext || {},
                progressMarkers: [],
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
              currentRole: {
                select: { id: true, name: true, displayName: true },
              },
              currentStep: {
                select: { id: true, name: true, displayName: true },
              },
            },
          });

          return {
            task: { ...task, taskDescription },
            workflowExecution,
            role,
            firstStep,
          };
        },
        {
          timeout: 15000, // Reduced timeout since we're doing less work
        },
      );

      // ENHANCED: Get enhanced context for the bootstrapped workflow
      const baseGuidance = {
        currentRole: {
          name: result.role.name,
          displayName: result.role.displayName || result.role.name,
          description: `Role: ${result.role.name}`,
          capabilities: {},
        },
        currentStep: result.firstStep
          ? {
              name: result.firstStep.name,
              displayName: result.firstStep.name,
              description: `Initial step: ${result.firstStep.name}`,
              stepType: 'WORKFLOW',
            }
          : null,
        nextActions: [
          {
            name: `Begin with ${result.firstStep?.name || 'initial workflow step'}`,
            actionType: 'WORKFLOW',
            actionData: {
              stepId: result.firstStep?.id,
              stepName: result.firstStep?.name,
              serviceName: 'workflow-guidance',
              operation: 'initialize',
            },
            sequenceOrder: 1,
          },
        ],
        projectContext: {
          projectType: 'bootstrap',
          behavioralProfile: {
            projectPath: input.projectPath,
            initialRole: input.initialRole,
            executionMode:
              input.executionMode || this.config.defaults.executionMode,
          },
          detectedPatterns: [],
          qualityStandards: {},
        },
        qualityReminders: [],
        ruleEnforcement: {
          requiredPatterns: [],
          antiPatterns: [],
          complianceChecks: [],
        },
        reportingStatus: { shouldTriggerReport: false },
      };

      // ENHANCED: Use enhanced services for comprehensive bootstrap context
      const [
        validationResult,
        progressResult,
        requiredInputsResult,
        actionGuidanceResult,
      ] = await Promise.all([
        this.validationBuilder.buildValidationContext(
          baseGuidance,
          result.firstStep?.id || null,
          result.task.id,
        ),
        this.progressCalculator.calculateProgress(
          result.task.id,
          baseGuidance,
          result.firstStep?.id || null,
        ),
        this.inputExtractor.extractRequiredInput(
          result.firstStep?.id || null,
          baseGuidance,
        ),
        this.guidanceGenerator.generateActionGuidance(
          baseGuidance,
          result.firstStep?.id || null,
          {
            taskId: result.task.id,
            roleId: result.role.id,
          },
        ),
      ]);

      // Enhanced post-processing (outside transaction)
      const nextSteps = this.getSimpleNextSteps(
        input.initialRole,
        result.firstStep,
      );

      const duration = Date.now() - startTime;
      this.logger.log(`Workflow bootstrapped (enhanced) in ${duration}ms`);

      // ENHANCED: Build bootstrap envelope for standardized response format
      const bootstrapResult = {
        success: true,
        task: result.task,
        workflowExecution: result.workflowExecution,
        initialGuidance: {
          currentRole: result.role,
          currentStep: result.firstStep,
          nextActions: [
            {
              name: `Begin with ${result.firstStep?.name || 'initial workflow step'}`,
              actionType: 'WORKFLOW',
              actionData: {
                stepId: result.firstStep?.id,
                stepName: result.firstStep?.name,
                serviceName: 'workflow-guidance',
                operation: 'initialize',
              },
              sequenceOrder: 1,
            },
          ],
        },
        nextSteps,
        validationContext: validationResult.success
          ? validationResult.context
          : null,
        requiredInputs: Array.isArray(requiredInputsResult)
          ? requiredInputsResult
          : [],
        progressMetrics: progressResult.success ? progressResult.metrics : null,
        actionGuidance:
          actionGuidanceResult && typeof actionGuidanceResult === 'string'
            ? actionGuidanceResult
            : undefined,
        enhancedContext: {
          bootstrapDuration: duration,
          initialRole: input.initialRole,
          executionMode:
            input.executionMode || this.config.defaults.executionMode,
          taskCreated: {
            id: result.task.id,
            name: result.task.name,
            slug: result.task.slug,
          },
          workflowExecutionCreated: {
            id: result.workflowExecution.id,
            currentRoleId: result.workflowExecution.currentRoleId,
            currentStepId: result.workflowExecution.currentStepId,
          },
          enhancedValidation: validationResult.success,
          enhancedProgress: progressResult.success,
          enhancedInputs: Array.isArray(requiredInputsResult),
          enhancedGuidance: !!actionGuidanceResult,
        },
      };

      // CORRECTED: Return business result without envelope (MCP layer handles envelopes)
      return {
        ...bootstrapResult,
        message: `Workflow successfully bootstrapped for "${input.taskName}" with ${input.initialRole} role`,
      };
    } catch (error) {
      this.logger.error(`Optimized bootstrap failed:`, error);
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

  /**
   * Simple next steps without additional database calls
   */
  private getSimpleNextSteps(roleName: string, firstStep: any): any[] {
    if (firstStep) {
      return [
        {
          stepId: firstStep.id,
          name: firstStep.name,
          displayName: firstStep.displayName || firstStep.name,
          description: `Execute ${firstStep.name} for ${roleName} role`,
          stepType: 'WORKFLOW',
          sequenceNumber: firstStep.sequenceNumber,
          status: 'ready',
        },
      ];
    }

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
