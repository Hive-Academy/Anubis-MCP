import { Injectable } from '@nestjs/common';
import {
  CodebaseAnalysis,
  Prisma,
  Task,
  TaskDescription,
  Subtask,
} from 'generated/prisma';
import { PrismaService } from '../../../prisma/prisma.service';
import { TaskOperationsInput } from './schemas/task-operations.schema';

// Type-safe interfaces for service operations
export interface TaskOperationResult {
  success: boolean;
  data?:
    | TaskWithRelations
    | TaskWithRelations[]
    | TaskListResult
    | TaskWithSubtasks;
  error?: {
    message: string;
    code: string;
    operation: string;
  };
  metadata?: {
    operation: string;
    id: string | number;
    responseTime: number;
  };
}

export interface TaskWithRelations extends Task {
  taskDescription?: TaskDescription | null;
  codebaseAnalysis?: CodebaseAnalysis | null;
  implementationPlans?: Prisma.ImplementationPlanGetPayload<
    Record<string, never>
  >[];
  subtasks?: Prisma.SubtaskGetPayload<Record<string, never>>[];
  delegationRecords?: Prisma.DelegationRecordGetPayload<
    Record<string, never>
  >[];
  researchReports?: Prisma.ResearchReportGetPayload<Record<string, never>>[];
  codeReviews?: Prisma.CodeReviewGetPayload<Record<string, never>>[];
  completionReports?: Prisma.CompletionReportGetPayload<
    Record<string, never>
  >[];
  comments?: Prisma.CommentGetPayload<Record<string, never>>[];
  workflowTransitions?: Prisma.WorkflowTransitionGetPayload<
    Record<string, never>
  >[];
  workflowExecutions?: Prisma.WorkflowExecutionGetPayload<
    Record<string, never>
  >[];
}

// NEW: Enhanced interface for tasks with subtasks
export interface TaskWithSubtasks extends TaskWithRelations {
  subtasks: Subtask[];
  subtaskSummary?: {
    total: number;
    completed: number;
    inProgress: number;
    notStarted: number;
    batches: Array<{
      batchId: string;
      batchTitle: string;
      count: number;
    }>;
  };
}

export interface TaskListResult {
  tasks: TaskWithRelations[];
  count: number;
  filters: {
    status?: string;
    priority?: string;
    slug?: string;
  };
}

/**
 * Task Operations Service (Internal)
 *
 * Provides core task lifecycle management as internal service.
 * Now called by workflow-rules MCP tools instead of being exposed directly.
 *
 * SOLID Principles Applied:
 * - Single Responsibility: Focused on task CRUD operations only
 * - Open/Closed: Extensible through input schema without modifying core logic
 * - Liskov Substitution: Consistent interface for all task operations
 * - Interface Segregation: Clean separation of concerns with focused methods
 * - Dependency Inversion: Depends on PrismaService abstraction
 */
@Injectable()
export class TaskOperationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Execute task operation as internal service
   * Returns type-safe data without MCP wrapping
   */
  async executeTaskOperation(
    input: TaskOperationsInput,
  ): Promise<TaskOperationResult> {
    const startTime = performance.now();

    try {
      let result: any;

      switch (input.operation) {
        case 'create':
          result = await this.createTask(input);
          break;
        case 'create_with_subtasks':
          result = await this.createTaskWithSubtasks(input);
          break;
        case 'update':
          result = await this.updateTask(input);
          break;
        case 'get':
          result = await this.getTask(input);
          break;
        case 'list':
          result = await this.listTasks(input);
          break;
        default:
          // This should never happen due to Zod validation, but TypeScript needs exhaustive checking
          throw new Error(
            `Unknown operation: ${String((input as any).operation)}`,
          );
      }

      const responseTime = performance.now() - startTime;

      // Return type-safe data for internal service use
      return {
        success: true,
        data: result,
        metadata: {
          operation: input.operation,
          id: input.taskId ?? 'unknown',
          responseTime: Math.round(responseTime),
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message,
          code: 'TASK_OPERATION_FAILED',
          operation: input.operation,
        },
      };
    }
  }

  private async createTask(
    input: TaskOperationsInput,
  ): Promise<TaskWithRelations> {
    const { taskData, description, codebaseAnalysis, executionId } = input;

    if (!taskData?.name) {
      throw new Error('Task name is required for creation');
    }

    // Create task with description in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Generate unique slug from task name
      const slug = await this.ensureUniqueSlug(
        this.generateSlugFromName(taskData.name!),
      );

      // Create the task with proper Prisma types
      const task = await tx.task.create({
        data: {
          name: taskData.name!,
          slug,
          status: taskData.status || 'not-started',
          priority: taskData.priority || 'Medium',
          dependencies: taskData.dependencies || [],
          gitBranch: taskData.gitBranch,
          owner: 'boomerang',
          currentMode: 'boomerang',
        } satisfies Prisma.TaskCreateInput,
      });

      // Use the auto-generated taskId for related records
      const taskId = task.id;

      // CRITICAL: Link task to workflow execution if executionId provided
      if (executionId) {
        await tx.workflowExecution.update({
          where: { id: executionId },
          data: { taskId: taskId },
        });
      }

      // Create task description if provided
      let taskDescription: TaskDescription | null = null;
      if (description) {
        taskDescription = await tx.taskDescription.create({
          data: {
            task: { connect: { id: taskId } },
            description: description.description || '',
            businessRequirements: description.businessRequirements || '',
            technicalRequirements: description.technicalRequirements || '',
            acceptanceCriteria: description.acceptanceCriteria || [],
          } satisfies Prisma.TaskDescriptionCreateInput,
        });
      }

      // Create codebase analysis if provided
      let analysis: CodebaseAnalysis | null = null;
      if (codebaseAnalysis) {
        analysis = await tx.codebaseAnalysis.create({
          data: {
            task: { connect: { id: taskId } },
            architectureFindings: codebaseAnalysis.architectureFindings || {},
            problemsIdentified: codebaseAnalysis.problemsIdentified || {},
            implementationContext: codebaseAnalysis.implementationContext || {},
            integrationPoints: codebaseAnalysis.integrationPoints || {},
            qualityAssessment: codebaseAnalysis.qualityAssessment || {},
            filesCovered: codebaseAnalysis.filesCovered || [],
            technologyStack: codebaseAnalysis.technologyStack || {},
            analyzedBy: codebaseAnalysis.analyzedBy || 'system',
          } satisfies Prisma.CodebaseAnalysisCreateInput,
        });
      }

      // Return as TaskWithRelations for consistent interface
      return {
        ...task,
        taskDescription,
        codebaseAnalysis: analysis,
      } as TaskWithRelations;
    });

    return result;
  }

  /**
   * NEW: Create task with subtasks directly - eliminates implementation plan
   */
  private async createTaskWithSubtasks(
    input: TaskOperationsInput,
  ): Promise<TaskWithSubtasks> {
    const { taskData, description, codebaseAnalysis, executionId, subtasks } =
      input;

    if (!taskData?.name) {
      throw new Error('Task name is required for creation');
    }

    if (!subtasks || subtasks.length === 0) {
      throw new Error(
        'Subtasks are required for create_with_subtasks operation',
      );
    }

    // Create task with subtasks in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Generate unique slug from task name
      const slug = await this.ensureUniqueSlug(
        this.generateSlugFromName(taskData.name!),
      );

      // Create the task with proper Prisma types
      const task = await tx.task.create({
        data: {
          name: taskData.name!,
          slug,
          status: taskData.status || 'not-started',
          priority: taskData.priority || 'Medium',
          dependencies: taskData.dependencies || [],
          gitBranch: taskData.gitBranch,
          owner: 'turbo-dev', // Default owner for direct creation
          currentMode: 'turbo-dev',
        } satisfies Prisma.TaskCreateInput,
      });

      // Use the auto-generated taskId for related records
      const taskId = task.id;

      // CRITICAL: Link task to workflow execution if executionId provided
      if (executionId) {
        await tx.workflowExecution.update({
          where: { id: executionId },
          data: { taskId: taskId },
        });
      }

      // Create task description if provided
      let taskDescription: TaskDescription | null = null;
      if (description) {
        taskDescription = await tx.taskDescription.create({
          data: {
            task: { connect: { id: taskId } },
            description: description.description || '',
            businessRequirements: description.businessRequirements || '',
            technicalRequirements: description.technicalRequirements || '',
            acceptanceCriteria: description.acceptanceCriteria || [],
          } satisfies Prisma.TaskDescriptionCreateInput,
        });
      }

      // Create codebase analysis if provided
      let analysis: CodebaseAnalysis | null = null;
      if (codebaseAnalysis) {
        analysis = await tx.codebaseAnalysis.create({
          data: {
            task: { connect: { id: taskId } },
            architectureFindings: codebaseAnalysis.architectureFindings || {},
            problemsIdentified: codebaseAnalysis.problemsIdentified || {},
            implementationContext: codebaseAnalysis.implementationContext || {},
            integrationPoints: codebaseAnalysis.integrationPoints || {},
            qualityAssessment: codebaseAnalysis.qualityAssessment || {},
            filesCovered: codebaseAnalysis.filesCovered || [],
            technologyStack: codebaseAnalysis.technologyStack || {},
            analyzedBy: codebaseAnalysis.analyzedBy || 'system',
          } satisfies Prisma.CodebaseAnalysisCreateInput,
        });
      }

      // Create subtasks directly without implementation plan - PURE DIRECT LINKING
      const createdSubtasks: Subtask[] = [];
      for (const subtaskData of subtasks) {
        const subtask = await tx.subtask.create({
          data: {
            task: { connect: { id: taskId } },
            // No planId - direct task-subtask relationship
            name: subtaskData.name,
            description: subtaskData.description,
            sequenceNumber: subtaskData.sequenceNumber,
            status: subtaskData.status || 'not-started',
            batchId: subtaskData.batchId || 'default-batch',
            batchTitle: subtaskData.batchTitle || 'Implementation Tasks',
            estimatedDuration: subtaskData.estimatedDuration,

            // Enhanced implementation details
            implementationOverview: subtaskData.implementationOverview,
            implementationApproach: subtaskData.implementationApproach,
            technicalDecisions: subtaskData.technicalDecisions || {},
            filesToModify: subtaskData.filesToModify || [],
            codeExamples: subtaskData.codeExamples || {},

            // Strategic context
            strategicGuidance: subtaskData.strategicGuidance || {},
            architecturalContext: subtaskData.architecturalContext,
            architecturalRationale: subtaskData.architecturalRationale || {},

            // Quality and constraints
            qualityConstraints: subtaskData.qualityConstraints || {},
            qualityGates: subtaskData.qualityGates || {},
            acceptanceCriteria: subtaskData.acceptanceCriteria || [],
            successCriteria: subtaskData.successCriteria || {},
            testingRequirements: subtaskData.testingRequirements || {},

            // Implementation specifications
            technicalSpecifications: subtaskData.technicalSpecifications || {},
            performanceTargets: subtaskData.performanceTargets || {},
            securityConsiderations: subtaskData.securityConsiderations || {},
            errorHandlingStrategy: subtaskData.errorHandlingStrategy,

            // Dependencies and integration
            dependencies: subtaskData.dependencies || [],
            integrationPoints: subtaskData.integrationPoints || {},
            externalDependencies: subtaskData.externalDependencies || {},

            // Evidence and validation
            validationSteps: subtaskData.validationSteps || {},
          } satisfies Prisma.SubtaskCreateInput,
        });
        createdSubtasks.push(subtask);
      }

      // Generate subtask summary
      const subtaskSummary = this.generateSubtaskSummary(createdSubtasks);

      // Return as TaskWithSubtasks for consistent interface
      return {
        ...task,
        taskDescription,
        codebaseAnalysis: analysis,
        subtasks: createdSubtasks,
        subtaskSummary,
      } as TaskWithSubtasks;
    });

    return result;
  }

  private async updateTask(
    input: TaskOperationsInput,
  ): Promise<TaskWithRelations> {
    const { taskId, taskData, description, codebaseAnalysis } = input;

    if (!taskId) {
      throw new Error('Task ID is required for updates');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      let task: Task | null = null;
      let taskDescription: TaskDescription | null = null;
      let analysis: CodebaseAnalysis | null = null;

      // Update task if data provided
      if (taskData) {
        const updateData: Prisma.TaskUpdateInput = {};

        if (taskData.name) updateData.name = taskData.name;
        if (taskData.status) updateData.status = taskData.status;
        if (taskData.priority) updateData.priority = taskData.priority;
        if (taskData.dependencies)
          updateData.dependencies = taskData.dependencies;
        if (taskData.gitBranch) updateData.gitBranch = taskData.gitBranch;

        task = await tx.task.update({
          where: { id: taskId },
          data: updateData,
        });
      }

      // Update task description if provided
      if (description) {
        const descriptionData: Prisma.TaskDescriptionUpsertArgs['update'] = {};

        if (description.description)
          descriptionData.description = description.description;
        if (description.businessRequirements)
          descriptionData.businessRequirements =
            description.businessRequirements;
        if (description.technicalRequirements)
          descriptionData.technicalRequirements =
            description.technicalRequirements;
        if (description.acceptanceCriteria)
          descriptionData.acceptanceCriteria = description.acceptanceCriteria;

        taskDescription = await tx.taskDescription.upsert({
          where: { taskId: taskId },
          update: descriptionData,
          create: {
            taskId: taskId,
            description: description.description || '',
            businessRequirements: description.businessRequirements || '',
            technicalRequirements: description.technicalRequirements || '',
            acceptanceCriteria: description.acceptanceCriteria || [],
          },
        });
      }

      // Update codebase analysis if provided
      if (codebaseAnalysis) {
        const analysisData: Prisma.CodebaseAnalysisUpsertArgs['update'] = {};

        if (codebaseAnalysis.architectureFindings)
          analysisData.architectureFindings =
            codebaseAnalysis.architectureFindings;
        if (codebaseAnalysis.problemsIdentified)
          analysisData.problemsIdentified = codebaseAnalysis.problemsIdentified;
        if (codebaseAnalysis.implementationContext)
          analysisData.implementationContext =
            codebaseAnalysis.implementationContext;
        if (codebaseAnalysis.integrationPoints)
          analysisData.integrationPoints = codebaseAnalysis.integrationPoints;
        if (codebaseAnalysis.qualityAssessment)
          analysisData.qualityAssessment = codebaseAnalysis.qualityAssessment;
        if (codebaseAnalysis.filesCovered)
          analysisData.filesCovered = codebaseAnalysis.filesCovered;
        if (codebaseAnalysis.technologyStack)
          analysisData.technologyStack = codebaseAnalysis.technologyStack;
        if (codebaseAnalysis.analyzedBy)
          analysisData.analyzedBy = codebaseAnalysis.analyzedBy;

        analysis = await tx.codebaseAnalysis.upsert({
          where: { taskId: taskId },
          update: analysisData,
          create: {
            taskId: taskId,
            architectureFindings: codebaseAnalysis.architectureFindings || {},
            problemsIdentified: codebaseAnalysis.problemsIdentified || {},
            implementationContext: codebaseAnalysis.implementationContext || {},
            integrationPoints: codebaseAnalysis.integrationPoints || {},
            qualityAssessment: codebaseAnalysis.qualityAssessment || {},
            filesCovered: codebaseAnalysis.filesCovered || [],
            technologyStack: codebaseAnalysis.technologyStack || {},
            analyzedBy: codebaseAnalysis.analyzedBy || 'system',
          },
        });
      }

      // If no task data was provided, fetch the current task
      if (!task) {
        task = await tx.task.findUnique({ where: { id: taskId } });
        if (!task) {
          throw new Error(`Task with id ${taskId} not found`);
        }
      }

      // Return as TaskWithRelations for consistent interface
      return {
        ...task,
        taskDescription,
        codebaseAnalysis: analysis,
      } as TaskWithRelations;
    });

    return result;
  }

  private async getTask(
    input: TaskOperationsInput,
  ): Promise<TaskWithRelations> {
    const {
      taskId,
      slug,
      includeDescription,
      includeAnalysis,
      includeSubtasks,
    } = input;

    if (!taskId && !slug) {
      throw new Error('Either Task ID or Task Slug is required for retrieval');
    }

    const include: Prisma.TaskInclude = {};
    if (includeDescription) {
      include.taskDescription = true;
    }
    if (includeAnalysis) {
      include.codebaseAnalysis = true;
    }
    if (includeSubtasks) {
      include.subtasks = {
        orderBy: { sequenceNumber: 'asc' },
      };
    }

    // Use slug first, fallback to taskId
    const whereClause = slug ? { slug } : { id: taskId };

    const task = await this.prisma.task.findFirst({
      where: whereClause,
      include,
    });

    if (!task) {
      throw new Error(`Task not found: ${slug || taskId}`);
    }

    // If subtasks are included, generate summary and return TaskWithSubtasks
    if (includeSubtasks && task.subtasks) {
      const subtaskSummary = this.generateSubtaskSummary(task.subtasks);
      return {
        ...task,
        subtaskSummary,
      } as TaskWithSubtasks;
    }

    return task as TaskWithRelations;
  }

  private async listTasks(input: TaskOperationsInput): Promise<TaskListResult> {
    const { status, priority, slug, includeDescription, includeAnalysis } =
      input;

    const where: Prisma.TaskWhereInput = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (slug) {
      // Support partial slug matching (contains the slug pattern)
      where.slug = { contains: slug };
    }

    const include: Prisma.TaskInclude = {};
    if (includeDescription) {
      include.taskDescription = true;
    }
    if (includeAnalysis) {
      include.codebaseAnalysis = true;
    }

    const tasks = await this.prisma.task.findMany({
      where,
      include,
      orderBy: { createdAt: 'desc' },
    });

    return {
      tasks: tasks as TaskWithRelations[],
      count: tasks.length,
      filters: { status, priority, slug },
    };
  }

  /**
   * Generate a kebab-case slug from a task name
   * Converts to lowercase, removes special characters, replaces spaces with hyphens
   */
  private generateSlugFromName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  }

  /**
   * Ensure the generated slug is unique by checking database and appending counter if needed
   */
  private async ensureUniqueSlug(
    baseSlug: string,
    excludeTaskId?: number,
  ): Promise<string> {
    let slug = baseSlug;
    let counter = 1;

    while (await this.isSlugTaken(slug, excludeTaskId)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  /**
   * Check if a slug is already taken by another task
   */
  private async isSlugTaken(
    slug: string,
    excludeTaskId?: number,
  ): Promise<boolean> {
    const existingTask = await this.prisma.task.findFirst({
      where: {
        slug: slug,
        ...(excludeTaskId && { id: { not: excludeTaskId } }),
      },
    });

    return !!existingTask;
  }

  /**
   * Generate subtask summary for TaskWithSubtasks interface
   */
  private generateSubtaskSummary(subtasks: Subtask[]) {
    const total = subtasks.length;
    const completed = subtasks.filter((s) => s.status === 'completed').length;
    const inProgress = subtasks.filter(
      (s) => s.status === 'in-progress',
    ).length;
    const notStarted = subtasks.filter(
      (s) => s.status === 'not-started',
    ).length;

    // Group by batch
    const batchMap = new Map<string, { batchTitle: string; count: number }>();
    subtasks.forEach((subtask) => {
      const batchId = subtask.batchId || 'no-batch';
      const batchTitle = subtask.batchTitle || 'Untitled Batch';

      if (!batchMap.has(batchId)) {
        batchMap.set(batchId, { batchTitle, count: 0 });
      }
      batchMap.get(batchId)!.count++;
    });

    const batches = Array.from(batchMap.entries()).map(([batchId, info]) => ({
      batchId,
      batchTitle: info.batchTitle,
      count: info.count,
    }));

    return {
      total,
      completed,
      inProgress,
      notStarted,
      batches,
    };
  }
}
