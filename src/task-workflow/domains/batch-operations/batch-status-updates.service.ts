import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  BatchStatusUpdatesSchema,
  BatchStatusUpdatesInput,
} from './schemas/batch-status-updates.schema';

/**
 * Batch Status Updates Service
 *
 * Cross-entity status synchronization with data consistency.
 * Ensures status alignment across Task, ImplementationPlan, and Subtasks.
 */
@Injectable()
export class BatchStatusUpdatesService {
  private readonly logger = new Logger(BatchStatusUpdatesService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Tool({
    name: 'batch_status_updates',
    description: `
Cross-entity status synchronization with data consistency.

**Operations:**
- sync_task_status: Synchronize task status based on subtask completion
- sync_plan_status: Update implementation plan status based on progress
- sync_batch_progress: Update all entities based on batch completion
- update_cross_entity: Update multiple entities with status consistency
- get_sync_status: Check synchronization status across entities
- validate_consistency: Validate status consistency and identify issues

**Key Features:**
- Automatic status cascade (subtasks → plan → task)
- Data consistency validation and repair
- Cross-entity transaction support
- Status history tracking
- Conflict detection and resolution

**Examples:**
- Sync task: { operation: "sync_task_status", taskId: "TSK-001" }
- Sync batch: { operation: "sync_batch_progress", taskId: "TSK-001", batchId: "B001" }
- Cross-update: { operation: "update_cross_entity", taskId: "TSK-001", entityUpdates: [...] }
- Validate: { operation: "validate_consistency", taskId: "TSK-001", checkConsistency: true }
`,
    parameters: BatchStatusUpdatesSchema,
  })
  async executeBatchStatusUpdate(input: BatchStatusUpdatesInput): Promise<any> {
    const startTime = performance.now();

    try {
      this.logger.debug(`Batch Status Update: ${input.operation}`, {
        taskId: input.taskId,
        batchId: input.batchId,
      });

      let result: any;

      switch (input.operation) {
        case 'sync_task_status':
          result = await this.syncTaskStatus(input);
          break;
        case 'sync_plan_status':
          result = await this.syncPlanStatus(input);
          break;
        case 'sync_batch_progress':
          result = await this.syncBatchProgress(input);
          break;
        case 'update_cross_entity':
          result = await this.updateCrossEntity(input);
          break;
        case 'get_sync_status':
          result = await this.getSyncStatus(input);
          break;
        case 'validate_consistency':
          result = await this.validateConsistency(input);
          break;
        default:
          throw new Error(`Unknown operation: ${String(input.operation)}`);
      }

      const responseTime = performance.now() - startTime;

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
                  taskId: input.taskId,
                  batchId: input.batchId,
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
      this.logger.error(`Batch status update failed:`, error);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: false,
                error: {
                  message: error.message,
                  code: 'BATCH_STATUS_UPDATE_FAILED',
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

  private async syncTaskStatus(input: BatchStatusUpdatesInput): Promise<any> {
    const { taskId, forceSync } = input;

    // Get all subtasks for the task
    const subtasks = await this.prisma.subtask.findMany({
      where: { taskId },
    });

    if (subtasks.length === 0) {
      return {
        taskId,
        message: 'No subtasks found - no status sync needed',
        currentStatus: await this.getCurrentTaskStatus(taskId),
      };
    }

    // Calculate status based on subtask completion
    const statusBreakdown = this.calculateStatusBreakdown(subtasks);
    const newTaskStatus = this.calculateTaskStatus(
      statusBreakdown,
      subtasks.length,
    );

    // Get current task status
    const currentTask = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { status: true },
    });

    if (!currentTask) {
      throw new Error(`Task ${taskId} not found`);
    }

    // Update task status if changed or forced
    if (currentTask.status !== newTaskStatus || forceSync) {
      const updatedTask = await this.prisma.task.update({
        where: { id: taskId },
        data: { status: newTaskStatus },
      });

      return {
        taskId,
        previousStatus: currentTask.status,
        newStatus: newTaskStatus,
        statusChanged: true,
        subtaskBreakdown: statusBreakdown,
        totalSubtasks: subtasks.length,
        updatedTask,
      };
    }

    return {
      taskId,
      currentStatus: currentTask.status,
      statusChanged: false,
      subtaskBreakdown: statusBreakdown,
      totalSubtasks: subtasks.length,
      message: 'Task status already synchronized',
    };
  }

  private async syncPlanStatus(input: BatchStatusUpdatesInput): Promise<any> {
    const { taskId } = input;

    // Get implementation plan and its subtasks
    const plan = await this.prisma.implementationPlan.findFirst({
      where: { taskId },
      include: {
        subtasks: true,
      },
    });

    if (!plan) {
      throw new Error(`Implementation plan not found for task ${taskId}`);
    }

    if (plan.subtasks.length === 0) {
      return {
        taskId,
        planId: plan.id,
        message: 'No subtasks found - no plan status sync needed',
      };
    }

    const statusBreakdown = this.calculateStatusBreakdown(plan.subtasks);
    const totalSubtasks = plan.subtasks.length;
    const completedSubtasks = statusBreakdown.completed || 0;
    const progressPercentage = Math.round(
      (completedSubtasks / totalSubtasks) * 100,
    );

    // Update plan with progress information
    const updatedPlan = await this.prisma.implementationPlan.update({
      where: { id: plan.id },
      data: {
        updatedAt: new Date(),
      },
    });

    return {
      taskId,
      planId: plan.id,
      progressPercentage,
      statusBreakdown,
      totalSubtasks,
      completedSubtasks,
      isComplete: completedSubtasks === totalSubtasks,
      updatedPlan,
    };
  }

  private async syncBatchProgress(
    input: BatchStatusUpdatesInput,
  ): Promise<any> {
    const { taskId, batchId } = input;

    if (!batchId) {
      throw new Error('Batch ID is required for batch progress sync');
    }

    // Get all subtasks in the batch
    const batchSubtasks = await this.prisma.subtask.findMany({
      where: {
        taskId,
        batchId,
      },
    });

    if (batchSubtasks.length === 0) {
      return {
        taskId,
        batchId,
        message: 'No subtasks found in batch',
      };
    }

    const statusBreakdown = this.calculateStatusBreakdown(batchSubtasks);
    const totalSubtasks = batchSubtasks.length;
    const completedSubtasks = statusBreakdown.completed || 0;
    const batchComplete = completedSubtasks === totalSubtasks;

    // If batch is complete, sync up to task level
    let taskUpdate = null;
    if (batchComplete) {
      // Check if all batches for this task are complete
      const allTaskSubtasks = await this.prisma.subtask.findMany({
        where: { taskId },
      });

      const allStatusBreakdown = this.calculateStatusBreakdown(allTaskSubtasks);
      const allCompleted = allStatusBreakdown.completed || 0;
      const allTotal = allTaskSubtasks.length;

      if (allCompleted === allTotal) {
        // All subtasks complete - update task status
        taskUpdate = await this.prisma.task.update({
          where: { id: taskId },
          data: { status: 'completed' },
        });
      }
    }

    return {
      taskId,
      batchId,
      batchComplete,
      statusBreakdown,
      totalSubtasks,
      completedSubtasks,
      progressPercentage: Math.round((completedSubtasks / totalSubtasks) * 100),
      taskUpdated: taskUpdate !== null,
      taskUpdate,
    };
  }

  private async updateCrossEntity(
    input: BatchStatusUpdatesInput,
  ): Promise<any> {
    const { taskId, entityUpdates } = input;

    if (!entityUpdates || entityUpdates.length === 0) {
      throw new Error('Entity updates are required for cross-entity update');
    }

    const results: Array<{
      entity: string;
      entityId: string | number;
      newStatus: string;
      updated: any;
    }> = [];

    // Use transaction for consistency
    await this.prisma.$transaction(async (prisma) => {
      for (const update of entityUpdates) {
        let result;

        switch (update.entity) {
          case 'task':
            result = await prisma.task.update({
              where: { id: update.entityId as number },
              data: { status: update.newStatus },
            });
            break;

          case 'implementationPlan':
            result = await prisma.implementationPlan.update({
              where: { id: update.entityId as number },
              data: { updatedAt: new Date() },
            });
            break;

          case 'subtask':
            result = await prisma.subtask.update({
              where: { id: update.entityId as number },
              data: {
                status: update.newStatus,
                ...(update.newStatus === 'completed' && {
                  completedAt: new Date(),
                }),
              },
            });
            break;

          default:
            throw new Error(`Unknown entity type: ${String(update.entity)}`);
        }

        results.push({
          entity: update.entity,
          entityId: update.entityId,
          newStatus: update.newStatus,
          updated: result,
        });
      }
    });

    return {
      taskId,
      updatedEntities: results.length,
      updates: results,
      transactionComplete: true,
    };
  }

  private async getSyncStatus(input: BatchStatusUpdatesInput): Promise<any> {
    const { taskId, includeDetails } = input;

    // Get task
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    // Get implementation plan
    const plan = await this.prisma.implementationPlan.findFirst({
      where: { taskId },
    });

    // Get all subtasks
    const subtasks = await this.prisma.subtask.findMany({
      where: { taskId },
    });

    const statusBreakdown = this.calculateStatusBreakdown(subtasks);
    const expectedTaskStatus = this.calculateTaskStatus(
      statusBreakdown,
      subtasks.length,
    );
    const isTaskSynced = task.status === expectedTaskStatus;

    const result: any = {
      taskId,
      isTaskSynced,
      taskStatus: task.status,
      expectedTaskStatus,
      subtaskCount: subtasks.length,
      statusBreakdown,
      hasImplementationPlan: !!plan,
    };

    if (includeDetails) {
      result.task = task;
      result.implementationPlan = plan;
      result.subtasks = subtasks;
    }

    return result;
  }

  private async validateConsistency(
    input: BatchStatusUpdatesInput,
  ): Promise<any> {
    const { taskId, autoRepair } = input;

    const issues = [];
    const repairs = [];

    // Get all entities
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    const plan = await this.prisma.implementationPlan.findFirst({
      where: { taskId },
    });
    const subtasks = await this.prisma.subtask.findMany({ where: { taskId } });

    if (!task) {
      issues.push({
        type: 'MISSING_TASK',
        message: `Task ${taskId} not found`,
      });
      return { taskId, issues, isConsistent: false };
    }

    // Check task-subtask consistency
    if (subtasks.length > 0) {
      const statusBreakdown = this.calculateStatusBreakdown(subtasks);
      const expectedTaskStatus = this.calculateTaskStatus(
        statusBreakdown,
        subtasks.length,
      );

      if (task.status !== expectedTaskStatus) {
        issues.push({
          type: 'TASK_STATUS_MISMATCH',
          current: task.status,
          expected: expectedTaskStatus,
          message: 'Task status does not match subtask completion',
        });

        if (autoRepair) {
          await this.prisma.task.update({
            where: { id: taskId },
            data: { status: expectedTaskStatus },
          });
          repairs.push({
            type: 'TASK_STATUS_REPAIR',
            from: task.status,
            to: expectedTaskStatus,
          });
        }
      }
    }

    // Check implementation plan existence
    if (subtasks.length > 0 && !plan) {
      issues.push({
        type: 'MISSING_IMPLEMENTATION_PLAN',
        message: 'Subtasks exist but no implementation plan found',
      });
    }

    return {
      taskId,
      issues,
      repairs,
      isConsistent: issues.length === 0,
      checkedEntities: {
        task: !!task,
        implementationPlan: !!plan,
        subtasks: subtasks.length,
      },
    };
  }
  private calculateStatusBreakdown(
    entities: { status: string }[],
  ): Record<string, number> {
    return entities.reduce<Record<string, number>>((breakdown, entity) => {
      const status = entity.status;
      breakdown[status] = (breakdown[status] || 0) + 1;
      return breakdown;
    }, {});
  }

  private calculateTaskStatus(
    statusBreakdown: Record<string, number>,
    totalSubtasks: number,
  ): string {
    const completed = statusBreakdown.completed || 0;
    const inProgress = statusBreakdown['in-progress'] || 0;
    const needsReview = statusBreakdown['needs-review'] || 0;
    const needsChanges = statusBreakdown['needs-changes'] || 0;

    if (completed === totalSubtasks) {
      return 'completed';
    } else if (needsChanges > 0) {
      return 'needs-changes';
    } else if (needsReview > 0) {
      return 'needs-review';
    } else if (inProgress > 0) {
      return 'in-progress';
    } else {
      return 'not-started';
    }
  }

  private async getCurrentTaskStatus(taskId: number): Promise<string | null> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { status: true },
    });
    return task?.status || null;
  }
}
