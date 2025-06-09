import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  WorkflowOperationsSchema,
  WorkflowOperationsInput,
} from './schemas/workflow-operations.schema';

/**
 * Workflow Operations Service
 *
 * Focused service for role transitions and delegation management.
 * Clear, obvious operations with built-in business rule validation.
 */
@Injectable()
export class WorkflowOperationsService {
  private readonly logger = new Logger(WorkflowOperationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Tool({
    name: 'workflow_operations',
    description: `
Role-based workflow transitions and delegation management.

**Operations:**
- delegate: Hand off task from one role to another
- complete: Mark task as completed with evidence
- escalate: Escalate issues or blockers to previous role
- transition: Change task status with role validation

**Key Features:**
- Built-in business rule validation (prevents invalid transitions)
- Automatic delegation record creation
- Role-based authorization (validates current ownership)
- Workflow transition logging

**Examples:**
- Delegate: { operation: "delegate", taskId: "TSK-001", fromRole: "architect", toRole: "senior-developer", message: "Plan ready" }
- Complete: { operation: "complete", taskId: "TSK-001", fromRole: "senior-developer", completionData: { summary: "Auth implemented" } }
- Escalate: { operation: "escalate", taskId: "TSK-001", fromRole: "senior-developer", toRole: "architect", escalationData: { reason: "Blocker found" } }
`,
    parameters: WorkflowOperationsSchema,
  })
  async executeWorkflowOperation(input: WorkflowOperationsInput): Promise<any> {
    const startTime = performance.now();

    try {
      this.logger.debug(`Workflow Operation: ${input.operation}`, {
        taskId: input.taskId,
        fromRole: input.fromRole,
        toRole: input.toRole,
      });

      // Validate task ownership
      await this.validateTaskOwnership(input.taskId, input.fromRole);

      let result: any;

      switch (input.operation) {
        case 'delegate':
          result = await this.handleDelegation(input);
          break;
        case 'complete':
          result = await this.handleCompletion(input);
          break;
        case 'escalate':
          result = await this.handleEscalation(input);
          break;
        case 'transition':
          result = await this.handleTransition(input);
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
                  transition: result.transition,
                  responseTime: Math.round(responseTime),
                },
              },
              null,
              2,
            ),
          },
        ],
      };
    } catch (error: any) {
      this.logger.error(`Workflow operation failed:`, error);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: false,
                error: {
                  message: error.message,
                  code: 'WORKFLOW_OPERATION_FAILED',
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

  private async validateTaskOwnership(
    taskId: number,
    fromRole: string,
  ): Promise<void> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    if (task.currentMode !== fromRole) {
      throw new Error(
        `Cannot operate from ${fromRole}: task is currently owned by ${task.currentMode}`,
      );
    }

    if (task.status === 'completed') {
      throw new Error('Cannot modify completed tasks');
    }

    if (task.status === 'cancelled') {
      throw new Error('Cannot modify cancelled tasks');
    }
  }

  private async handleDelegation(input: WorkflowOperationsInput): Promise<any> {
    const { taskId, fromRole, toRole, message } = input;

    if (!toRole) {
      throw new Error('Target role is required for delegation');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // Create delegation record
      const delegation = await tx.delegationRecord.create({
        data: {
          taskId: taskId,
          fromMode: fromRole,
          toMode: toRole,
          delegationTimestamp: new Date(),
        },
      });

      // Update task
      const task = await tx.task.update({
        where: { id: taskId },
        data: {
          currentMode: toRole,
          status: input.newStatus || 'in-progress',
        },
      });

      // Create workflow transition
      await tx.workflowTransition.create({
        data: {
          taskId: taskId,
          fromMode: fromRole,
          toMode: toRole,
          reason: message || `Delegated from ${fromRole} to ${toRole}`,
          transitionTimestamp: new Date(),
        },
      });

      return { delegation, task, transition: 'delegation_completed' };
    });

    return result;
  }

  private async handleCompletion(input: WorkflowOperationsInput): Promise<any> {
    const { taskId, fromRole, completionData } = input;

    if (!completionData) {
      throw new Error('Completion data is required for completion');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // Create completion report
      const completionReport = await tx.completionReport.create({
        data: {
          taskId,
          summary: completionData.summary,
          filesModified: completionData.filesModified || [],
          acceptanceCriteriaVerification:
            completionData.acceptanceCriteriaVerification || {},
          delegationSummary: `Task completed by ${fromRole}`,
        },
      });

      // Update task
      const task = await tx.task.update({
        where: { id: taskId },
        data: {
          status: 'completed',
          currentMode: 'boomerang', // Task returns to boomerang when completed
          completionDate: new Date(),
        },
      });

      // Create workflow transition
      await tx.workflowTransition.create({
        data: {
          taskId,
          fromMode: fromRole,
          toMode: 'boomerang', // Completion always transitions to boomerang
          reason: `Task completed: ${completionData.summary}`,
          transitionTimestamp: new Date(),
        },
      });

      return { completionReport, task, transition: 'completion_recorded' };
    });

    return result;
  }

  private async handleEscalation(input: WorkflowOperationsInput): Promise<any> {
    const { taskId, fromRole, toRole, escalationData } = input;

    if (!toRole || !escalationData) {
      throw new Error('Target role and escalation data are required');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // Create escalation delegation record
      const delegation = await tx.delegationRecord.create({
        data: {
          taskId,
          fromMode: fromRole,
          toMode: toRole,
          delegationTimestamp: new Date(),
          message: `Escalation: ${escalationData.reason}`,
        },
      });

      // Update task
      const task = await tx.task.update({
        where: { id: taskId },
        data: {
          currentMode: toRole,
          status: input.newStatus || 'needs-changes',
        },
      });

      // Create workflow transition
      await tx.workflowTransition.create({
        data: {
          taskId,
          fromMode: fromRole,
          toMode: toRole,
          reason: `Escalated: ${escalationData.reason}`,
          transitionTimestamp: new Date(),
        },
      });

      return { delegation, task, transition: 'escalation_completed' };
    });

    return result;
  }

  private async handleTransition(input: WorkflowOperationsInput): Promise<any> {
    const { taskId, fromRole, toRole, newStatus, message } = input;

    const result = await this.prisma.$transaction(async (tx) => {
      // Update task
      const updateData: any = {};
      if (toRole) updateData.currentMode = toRole;
      if (newStatus) updateData.status = newStatus;

      const task = await tx.task.update({
        where: { id: taskId },
        data: updateData,
      });

      // Create workflow transition
      await tx.workflowTransition.create({
        data: {
          taskId,
          fromMode: fromRole,
          toMode: toRole || fromRole,
          reason: message || `Status transition to ${newStatus || 'updated'}`,
          transitionTimestamp: new Date(),
        },
      });

      return { task, transition: 'status_transition_completed' };
    });

    return result;
  }
}
