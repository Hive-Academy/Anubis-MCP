import { Injectable, Inject } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { Subtask } from 'generated/prisma';
import { ZodSchema } from 'zod';
import {
  BaseMcpService,
  McpResponse,
} from '../../domains/workflow-rules/utils/mcp-response.utils';
import { PrismaService } from '../../prisma/prisma.service';
import { ITaskRepository } from './repositories/interfaces/task.repository.interface';
import {
  CreateTaskData,
  TaskWithRelations,
  UpdateTaskData,
} from './repositories/types/task.types';
import {
  TaskOperationsInput,
  TaskOperationsInputSchema,
} from './schemas/task-operations.schema';

// Type-safe interfaces for service operations
export interface TaskOperationResult {
  success: boolean;
  data?: TaskWithRelations | TaskWithRelations[] | TaskListResult;
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
 * Task Operations MCP Service
 *
 * Provides core task lifecycle management as MCP tool.
 * Exposes task CRUD operations through MCP protocol.
 *
 * SOLID Principles Applied:
 * - Single Responsibility: Focused on task CRUD operations only
 * - Open/Closed: Extensible through input schema without modifying core logic
 * - Liskov Substitution: Consistent interface for all task operations
 * - Interface Segregation: Clean separation of concerns with focused methods
 * - Dependency Inversion: Depends on PrismaService abstraction
 */
@Injectable()
export class TaskOperationsService extends BaseMcpService {
  constructor(
    @Inject('ITaskRepository') private readonly taskRepository: ITaskRepository,
    private readonly prisma: PrismaService, // Keep for workflow execution updates
  ) {
    super();
  }

  /**
   * Execute task operation as MCP tool
   * Returns MCP-formatted response
   */
  @Tool({
    name: 'task_operations',
    description:
      'Execute task lifecycle operations (create, update, get, list) with comprehensive task management capabilities.',
    parameters: TaskOperationsInputSchema as ZodSchema<TaskOperationsInput>,
  })
  async executeTaskOperation(input: TaskOperationsInput): Promise<McpResponse> {
    const startTime = performance.now();

    try {
      let result: any;

      switch (input.operation) {
        case 'create_task':
          result = await this.createTask(input);
          break;
        case 'update_task':
          result = await this.updateTask(input);
          break;
        case 'get_task':
          result = await this.getTask(input);
          break;

        default:
          // This should never happen due to Zod validation, but TypeScript needs exhaustive checking
          throw new Error(
            `Unknown operation: ${String((input as any).operation)}`,
          );
      }

      const responseTime = performance.now() - startTime;

      // Return MCP-formatted response
      return this.buildResponse({
        success: true,
        data: result,
        metadata: {
          operation: input.operation,
          id: input.taskId ?? 'unknown',
          responseTime: Math.round(responseTime),
        },
      });
    } catch (error: any) {
      return this.buildResponse({
        success: false,
        error: {
          message: error.message,
          code: 'TASK_OPERATION_FAILED',
          operation: input.operation,
        },
      });
    }
  }

  private async createTask(
    input: TaskOperationsInput,
  ): Promise<{ id: number; name: string }> {
    const { taskData, description, codebaseAnalysis, executionId } = input;

    if (!taskData?.name) {
      throw new Error('Task name is required for creation');
    }

    // Prepare CreateTaskData for repository
    const createData: CreateTaskData = {
      name: taskData.name,
      status: taskData.status || 'not-started',
      priority: taskData.priority || 'Medium',
      dependencies: taskData.dependencies || [],
      gitBranch: taskData.gitBranch,
      owner: 'product-manager',
      currentMode: 'product-manager',
      taskDescription: description
        ? {
            description: description.description || '',
            businessRequirements: description.businessRequirements || '',
            technicalRequirements: description.technicalRequirements || '',
            acceptanceCriteria: description.acceptanceCriteria || [],
          }
        : undefined,
      codebaseAnalysis: codebaseAnalysis
        ? {
            architectureFindings: codebaseAnalysis.architectureFindings || {},
            problemsIdentified: codebaseAnalysis.problemsIdentified || {},
            implementationContext: codebaseAnalysis.implementationContext || {},
            qualityAssessment: codebaseAnalysis.qualityAssessment || {},
            filesCovered: codebaseAnalysis.filesCovered || [],
            technologyStack: codebaseAnalysis.technologyStack || {},
            analyzedBy: codebaseAnalysis.analyzedBy || 'system',
          }
        : undefined,
    };

    // Create task with repository transaction support
    const result = await this.prisma.$transaction(async (tx) => {
      // Create task using repository with transaction
      const task = await this.taskRepository.createWithTransaction(
        createData,
        tx,
      );

      // CRITICAL: Link task to workflow execution if executionId provided
      if (executionId) {
        await tx.workflowExecution.update({
          where: { id: executionId },
          data: { taskId: task.id },
        });
      }

      return task;
    });

    return { id: result.id, name: result.name };
  }

  private async updateTask(
    input: TaskOperationsInput,
  ): Promise<{ id: number; name: string }> {
    const { taskId, taskData, description, codebaseAnalysis } = input;

    if (!taskId) {
      throw new Error('Task ID is required for updates');
    }

    // Prepare UpdateTaskData for repository
    const updateData: UpdateTaskData = {
      ...(taskData?.name && { name: taskData.name }),
      ...(taskData?.status && { status: taskData.status }),
      ...(taskData?.priority && { priority: taskData.priority }),
      ...(taskData?.dependencies && { dependencies: taskData.dependencies }),
      ...(taskData?.gitBranch && { gitBranch: taskData.gitBranch }),
      ...(description && {
        taskDescription: {
          description: description.description || '',
          businessRequirements: description.businessRequirements || '',
          technicalRequirements: description.technicalRequirements || '',
          acceptanceCriteria: description.acceptanceCriteria || [],
        },
      }),
      ...(codebaseAnalysis && {
        codebaseAnalysis: {
          architectureFindings: codebaseAnalysis.architectureFindings || {},
          problemsIdentified: codebaseAnalysis.problemsIdentified || {},
          implementationContext: codebaseAnalysis.implementationContext || {},
          qualityAssessment: codebaseAnalysis.qualityAssessment || {},
          filesCovered: codebaseAnalysis.filesCovered || [],
          technologyStack: codebaseAnalysis.technologyStack || {},
          analyzedBy: codebaseAnalysis.analyzedBy || 'system',
        },
      }),
    };

    // Update task using repository with transaction support
    const result = await this.prisma.$transaction(async (tx) => {
      return await this.taskRepository.updateWithTransaction(
        taskId,
        updateData,
        tx,
      );
    });

    return { id: result.id, name: result.name };
  }

  private async getTask(
    input: TaskOperationsInput,
  ): Promise<TaskWithRelations> {
    const {
      taskId,
      slug,
      includeDescription,
      includeAnalysis,
      includeResearch,
      includeSubtasks,
      includeCodeReviews,
    } = input;

    if (!taskId && !slug) {
      throw new Error('Either Task ID or Task Slug is required for retrieval');
    }

    const includeOptions = {
      taskDescription: includeDescription || false,
      codebaseAnalysis: includeAnalysis || false,
      researchReports: includeResearch || false,
      subtasks: includeSubtasks || false,
      codeReviews: includeCodeReviews || false,
    };

    let task: TaskWithRelations | null = null;

    if (slug) {
      task = await this.taskRepository.findBySlug(slug, includeOptions);
    } else if (taskId) {
      task = await this.taskRepository.findById(taskId, includeOptions);
    }

    if (!task) {
      throw new Error(`Task not found: ${slug || taskId}`);
    }

    // If subtasks are included, generate summary and return TaskWithSubtasks
    if (includeSubtasks && task.subtasks) {
      const subtaskSummary = this.generateSubtaskSummary(task.subtasks);
      return {
        ...task,
        subtaskSummary,
      } as TaskWithRelations;
    }

    return task;
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
