import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  TaskOperationsSchema,
  TaskOperationsInput,
} from './schemas/task-operations.schema';

/**
 * Task Operations Service
 *
 * Focused service for Task, TaskDescription, and CodebaseAnalysis operations.
 * Eliminates universal tool complexity with clear, obvious parameters.
 */
@Injectable()
export class TaskOperationsService {
  private readonly logger = new Logger(TaskOperationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Tool({
    name: 'task_operations',
    description: `
Task lifecycle management with clear, focused operations.

**Operations:**
- create: Create new task with optional description and analysis (taskId auto-generated)
- update: Update task details, status, or related data  
- get: Retrieve task with description and optional analysis
- list: List tasks with filtering options

**Key Features:**
- Pre-configured relationships (always includes description when requested)
- Clear parameter requirements (no complex schema guessing)
- Business rule validation for status transitions
- Integrated codebase analysis management
- Auto-generated unique taskId (no need to provide taskId for create operations)

**Examples:**
- Create task: { operation: "create", taskData: { name: "Fix auth bug", priority: "High" } }
- Update status: { operation: "update", taskId: "TSK-001", taskData: { status: "in-progress" } }
- Get full context: { operation: "get", taskId: "TSK-001", includeDescription: true, includeAnalysis: true }
`,
    parameters: TaskOperationsSchema,
  })
  async executeTaskOperation(input: TaskOperationsInput): Promise<any> {
    const startTime = performance.now();

    try {
      this.logger.debug(`Task Operation: ${input.operation}`, {
        taskId: input.taskId ?? 'unknown',
        operation: input.operation,
      });

      let result: any;

      switch (input.operation) {
        case 'create':
          result = await this.createTask(input);
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

      this.logger.debug(
        `Task operation completed in ${responseTime.toFixed(2)}ms`,
        {
          operation: input.operation,
          taskId: input.taskId ?? 'unknown',
          responseTime,
        },
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                data: result,
                metadata: {
                  operation: input.operation,
                  taskId: input.taskId ?? 'unknown',
                  responseTime: Math.round(responseTime),
                },
              },
              null,
              2,
            ),
          },
        ],
      } as const;
    } catch (error: any) {
      this.logger.error(`Task operation failed:`, error);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: false,
                error: {
                  message: error.message,
                  code: 'TASK_OPERATION_FAILED',
                  operation: input.operation,
                },
              },
              null,
              2,
            ),
          },
        ],
      };
    }
  }

  private async createTask(input: TaskOperationsInput): Promise<any> {
    const { taskData, description, codebaseAnalysis } = input;

    if (!taskData?.name) {
      throw new Error('Task name is required for creation');
    }

    // Create task with description in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Generate unique slug from task name
      const taskSlug = await this.ensureUniqueSlug(
        this.generateSlugFromName(taskData.name!),
      );

      // Create the task - let Prisma auto-generate taskId
      const task = await tx.task.create({
        data: {
          // Remove taskId - let Prisma auto-generate it
          name: taskData.name!,
          taskSlug,
          status: taskData.status || 'not-started',
          priority: taskData.priority || 'Medium',
          dependencies: taskData.dependencies || [],
          gitBranch: taskData.gitBranch,
          creationDate: new Date(),
          owner: 'boomerang',
          currentMode: 'boomerang',
        },
      });

      // Use the auto-generated taskId for related records
      const taskId = task.taskId;

      // Create task description if provided
      let taskDescription = null;
      if (description) {
        taskDescription = await tx.taskDescription.create({
          data: {
            taskId,
            description: description.description || '',
            businessRequirements: description.businessRequirements || '',
            technicalRequirements: description.technicalRequirements || '',
            acceptanceCriteria: description.acceptanceCriteria || [],
          },
        });
      }

      // Create codebase analysis if provided
      let analysis = null;
      if (codebaseAnalysis) {
        analysis = await tx.codebaseAnalysis.create({
          data: {
            taskId,
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

      return { task, taskDescription, codebaseAnalysis: analysis };
    });

    return result;
  }

  private async updateTask(input: TaskOperationsInput): Promise<any> {
    const { taskId, taskData, description, codebaseAnalysis } = input;

    if (!taskId) {
      throw new Error('Task ID is required for updates');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      let task = null;
      let taskDescription = null;
      let analysis = null;

      // Update task if data provided
      if (taskData) {
        task = await tx.task.update({
          where: { taskId },
          data: {
            ...(taskData.name && { name: taskData.name }),
            ...(taskData.status && { status: taskData.status }),
            ...(taskData.priority && { priority: taskData.priority }),
            ...(taskData.dependencies && {
              dependencies: taskData.dependencies,
            }),
            ...(taskData.gitBranch && { gitBranch: taskData.gitBranch }),
          },
        });
      }

      // Update task description if provided
      if (description) {
        taskDescription = await tx.taskDescription.upsert({
          where: { taskId },
          update: {
            ...(description.description && {
              description: description.description,
            }),
            ...(description.businessRequirements && {
              businessRequirements: description.businessRequirements,
            }),
            ...(description.technicalRequirements && {
              technicalRequirements: description.technicalRequirements,
            }),
            ...(description.acceptanceCriteria && {
              acceptanceCriteria: description.acceptanceCriteria,
            }),
          },
          create: {
            taskId,
            description: description.description || '',
            businessRequirements: description.businessRequirements || '',
            technicalRequirements: description.technicalRequirements || '',
            acceptanceCriteria: description.acceptanceCriteria || [],
          },
        });
      }

      // Update codebase analysis if provided
      if (codebaseAnalysis) {
        analysis = await tx.codebaseAnalysis.upsert({
          where: { taskId },
          update: {
            ...(codebaseAnalysis.architectureFindings && {
              architectureFindings: codebaseAnalysis.architectureFindings,
            }),
            ...(codebaseAnalysis.problemsIdentified && {
              problemsIdentified: codebaseAnalysis.problemsIdentified,
            }),
            ...(codebaseAnalysis.implementationContext && {
              implementationContext: codebaseAnalysis.implementationContext,
            }),
            ...(codebaseAnalysis.integrationPoints && {
              integrationPoints: codebaseAnalysis.integrationPoints,
            }),
            ...(codebaseAnalysis.qualityAssessment && {
              qualityAssessment: codebaseAnalysis.qualityAssessment,
            }),
            ...(codebaseAnalysis.filesCovered && {
              filesCovered: codebaseAnalysis.filesCovered,
            }),
            ...(codebaseAnalysis.technologyStack && {
              technologyStack: codebaseAnalysis.technologyStack,
            }),
            ...(codebaseAnalysis.analyzedBy && {
              analyzedBy: codebaseAnalysis.analyzedBy,
            }),
          },
          create: {
            taskId,
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

      return { task, taskDescription, codebaseAnalysis: analysis };
    });

    return result;
  }

  private async getTask(input: TaskOperationsInput): Promise<any> {
    const { taskId, taskSlug, includeDescription, includeAnalysis } = input;

    if (!taskId && !taskSlug) {
      throw new Error('Either Task ID or Task Slug is required for retrieval');
    }

    const include: any = {};
    if (includeDescription) {
      include.taskDescription = true;
    }
    if (includeAnalysis) {
      include.codebaseAnalysis = true;
    }

    // Use taskSlug first, fallback to taskId
    const whereClause = taskSlug ? { taskSlug } : { taskId };

    const task = await this.prisma.task.findFirst({
      where: whereClause,
      include,
    });

    if (!task) {
      throw new Error(`Task not found: ${taskSlug || taskId}`);
    }

    return task;
  }

  private async listTasks(input: TaskOperationsInput): Promise<any> {
    const { status, priority, taskSlug, includeDescription, includeAnalysis } =
      input;

    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (taskSlug) {
      // Support partial slug matching (contains the slug pattern)
      where.taskSlug = { contains: taskSlug };
    }

    const include: any = {};
    if (includeDescription) {
      include.taskDescription = true;
    }
    if (includeAnalysis) {
      include.codebaseAnalysis = true;
    }

    const tasks = await this.prisma.task.findMany({
      where,
      include,
      orderBy: { creationDate: 'desc' },
    });

    return {
      tasks,
      count: tasks.length,
      filters: { status, priority, taskSlug },
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
    excludeTaskId?: string,
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
    excludeTaskId?: string,
  ): Promise<boolean> {
    const existingTask = await this.prisma.task.findFirst({
      where: {
        taskSlug: slug,
        ...(excludeTaskId && { taskId: { not: excludeTaskId } }),
      },
    });

    return !!existingTask;
  }
}
