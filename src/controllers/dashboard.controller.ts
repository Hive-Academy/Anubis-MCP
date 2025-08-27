import {
  Controller,
  Get,
  Param,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ExecutionOverview {
  id: string;
  taskId: number;
  currentRole: string;
  currentStep: string;
  progress: number;
  elapsedTime: string;
  nextSteps: string[];
  status: string;
  taskName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskDetail {
  id: number;
  name: string;
  description: string;
  businessRequirements: string;
  technicalRequirements: string;
  acceptanceCriteria: string[];
  status: string;
  priority: string;
  subtasks: SubtaskDetail[];
  totalSubtasks: number;
  completedSubtasks: number;
  progress: number;
}

export interface SubtaskDetail {
  id: number;
  name: string;
  description: string;
  status: string;
  batchId: string;
  batchTitle: string;
  sequenceNumber: number;
  dependencies: string[];
  acceptanceCriteria: string[];
}

@Controller('dashboard/api')
export class DashboardController {
  constructor(private readonly prismaService: PrismaService) {}

  @Get('executions')
  async getExecutions(@Query('status') status?: string): Promise<{
    executions: ExecutionOverview[];
    count: number;
  }> {
    try {
      const whereClause = status
        ? { executionState: { path: ['phase'], equals: status } }
        : {};

      const executions = await this.prismaService.workflowExecution.findMany({
        where: whereClause,
        include: {
          task: {
            include: {
              taskDescription: true,
            },
          },
          currentRole: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const executionOverviews: ExecutionOverview[] = executions.map(
        (execution) => {
          const executionState = execution.executionState as any;
          const currentStep = executionState?.currentStep || {};
          const startTime = new Date(execution.createdAt);
          const now = new Date();
          const elapsedMs = now.getTime() - startTime.getTime();
          const elapsedHours = Math.floor(elapsedMs / (1000 * 60 * 60));
          const elapsedMinutes = Math.floor(
            (elapsedMs % (1000 * 60 * 60)) / (1000 * 60),
          );

          return {
            id: execution.id,
            taskId: execution.taskId || 0,
            currentRole: execution.currentRole?.name || 'Unknown',
            currentStep: currentStep.name || 'Unknown',
            progress: execution.progressPercentage || 0,
            elapsedTime: `${elapsedHours}h ${elapsedMinutes}m`,
            nextSteps: [], // Will be populated by real-time updates
            status: executionState?.phase || 'unknown',
            taskName: execution.task?.name || 'Unknown Task',
            createdAt: execution.createdAt,
            updatedAt: execution.updatedAt,
          };
        },
      );

      return {
        executions: executionOverviews,
        count: executionOverviews.length,
      };
    } catch (error) {
      throw new HttpException(
        {
          message: 'Failed to fetch executions',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('task/:id')
  async getTaskDetail(@Param('id') taskId: string): Promise<TaskDetail> {
    try {
      const id = parseInt(taskId, 10);
      if (isNaN(id)) {
        throw new HttpException('Invalid task ID', HttpStatus.BAD_REQUEST);
      }

      const task = await this.prismaService.task.findUnique({
        where: { id },
        include: {
          taskDescription: true,
          subtasks: {
            orderBy: {
              sequenceNumber: 'asc',
            },
          },
        },
      });

      if (!task) {
        throw new HttpException('Task not found', HttpStatus.NOT_FOUND);
      }

      const subtasks: SubtaskDetail[] = task.subtasks.map((subtask) => ({
        id: subtask.id,
        name: subtask.name,
        description: subtask.description,
        status: subtask.status,
        batchId: subtask.batchId || '',
        batchTitle: subtask.batchTitle || '',
        sequenceNumber: subtask.sequenceNumber,
        dependencies: [], // Will be populated if dependency system is implemented
        acceptanceCriteria: Array.isArray(subtask.acceptanceCriteria)
          ? (subtask.acceptanceCriteria as string[])
          : [],
      }));

      const completedSubtasks = subtasks.filter(
        (s) => s.status === 'completed',
      ).length;
      const progress =
        subtasks.length > 0
          ? Math.round((completedSubtasks / subtasks.length) * 100)
          : 0;

      return {
        id: task.id,
        name: task.name,
        description: task.taskDescription?.description || '',
        businessRequirements: task.taskDescription?.businessRequirements || '',
        technicalRequirements:
          task.taskDescription?.technicalRequirements || '',
        acceptanceCriteria: Array.isArray(
          task.taskDescription?.acceptanceCriteria,
        )
          ? (task.taskDescription.acceptanceCriteria as string[])
          : [],
        status: task.status,
        priority: task.priority,
        subtasks,
        totalSubtasks: subtasks.length,
        completedSubtasks,
        progress,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          message: 'Failed to fetch task details',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
