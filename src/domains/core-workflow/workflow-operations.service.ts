import { Injectable } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { DelegationRecord, Prisma, WorkflowTransition } from 'generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';
import {
  BaseMcpService,
  McpResponse,
} from '../workflow-rules/utils/mcp-response.utils';
import {
  WorkflowOperationsInput,
  WorkflowOperationsSchema,
} from './schemas/workflow-operations.schema';

// Type-safe interfaces for workflow operations
export interface WorkflowOperationResult {
  success: boolean;
  data?: DelegationRecord | WorkflowTransition | DelegationRecord[];
  error?: {
    message: string;
    code: string;
    operation: string;
  };
  metadata?: {
    operation: string;
    taskId?: number;
    responseTime: number;
  };
}

/**
 * Workflow Operations Service - MCP Tool
 * Handles workflow delegation and state management for workflow tasks
 *
 * SOLID Principles Applied:
 * - Single Responsibility: Focused on workflow state transitions only
 * - Open/Closed: Extensible through input schema without modifying core logic
 * - Liskov Substitution: Consistent interface for all workflow operations
 * - Interface Segregation: Clean separation of workflow concerns
 * - Dependency Inversion: Depends on PrismaService abstraction
 */
@Injectable()
export class WorkflowOperationsService extends BaseMcpService {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  @Tool({
    name: 'execute_workflow_operation',
    description:
      'Execute workflow operations including delegate, complete, escalate, and transition operations',
    parameters: WorkflowOperationsSchema,
  })
  async executeWorkflowOperation(
    input: WorkflowOperationsInput,
  ): Promise<McpResponse> {
    const startTime = performance.now();

    try {
      let result: DelegationRecord | WorkflowTransition | DelegationRecord[];

      switch (input.operation) {
        case 'delegate':
          result = await this.delegateTask(input);
          break;
        case 'complete':
          result = await this.completeTask(input);
          break;
        case 'escalate':
          result = await this.escalateTask(input);
          break;
        case 'transition':
          result = await this.transitionTask(input);
          break;
        default:
          throw new Error(`Unknown operation: ${String(input.operation)}`);
      }

      const responseTime = performance.now() - startTime;

      return this.buildResponse({
        success: true,
        data: result,
        metadata: {
          operation: input.operation,
          taskId: input.taskId,
          responseTime: Math.round(responseTime),
        },
      });
    } catch (error: any) {
      return this.buildResponse({
        success: false,
        error: {
          message: error.message,
          code: 'WORKFLOW_OPERATION_FAILED',
          operation: input.operation,
        },
      });
    }
  }

  private async delegateTask(
    input: WorkflowOperationsInput,
  ): Promise<DelegationRecord> {
    const { taskId, fromRole, toRole, message } = input;

    if (!fromRole || !toRole) {
      throw new Error('Both fromRole and toRole are required for delegation');
    }

    // Create delegation record and update task in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create delegation record
      const delegationRecord = await tx.delegationRecord.create({
        data: {
          task: { connect: { id: taskId } },
          fromMode: fromRole,
          toMode: toRole,
          message: message || '',
        } satisfies Prisma.DelegationRecordCreateInput,
      });

      // Update task current mode and increment redelegation count
      await tx.task.update({
        where: { id: taskId },
        data: {
          currentMode: toRole,
          owner: toRole,
          redelegationCount: { increment: 1 },
        },
      });

      return delegationRecord;
    });

    return result;
  }

  private async completeTask(
    input: WorkflowOperationsInput,
  ): Promise<WorkflowTransition> {
    const { taskId, fromRole, completionData } = input;

    if (!completionData) {
      throw new Error('Completion data is required for task completion');
    }

    // Create workflow transition and update task status
    const result = await this.prisma.$transaction(async (tx) => {
      // Create workflow transition record
      const transition = await tx.workflowTransition.create({
        data: {
          task: { connect: { id: taskId } },
          fromMode: fromRole,
          toMode: 'completed',
          reason: `Task completed: ${completionData.summary}`,
        } satisfies Prisma.WorkflowTransitionCreateInput,
      });

      // Update task status to completed
      await tx.task.update({
        where: { id: taskId },
        data: {
          status: 'completed',
          completionDate: new Date(),
        },
      });

      return transition;
    });

    return result;
  }

  private async escalateTask(
    input: WorkflowOperationsInput,
  ): Promise<WorkflowTransition> {
    const { taskId, fromRole, escalationData } = input;

    if (!escalationData) {
      throw new Error('Escalation data is required for task escalation');
    }

    // Create workflow transition for escalation
    const transition = await this.prisma.workflowTransition.create({
      data: {
        task: { connect: { id: taskId } },
        fromMode: fromRole,
        toMode: 'escalated',
        reason: `Escalation: ${escalationData.reason}`,
      } satisfies Prisma.WorkflowTransitionCreateInput,
    });

    return transition;
  }

  private async transitionTask(
    input: WorkflowOperationsInput,
  ): Promise<WorkflowTransition> {
    const { taskId, fromRole, toRole, newStatus, message } = input;

    if (!newStatus) {
      throw new Error('New status is required for task transition');
    }

    // Create workflow transition and update task
    const result = await this.prisma.$transaction(async (tx) => {
      // Create workflow transition record
      const transition = await tx.workflowTransition.create({
        data: {
          task: { connect: { id: taskId } },
          fromMode: fromRole,
          toMode: toRole || fromRole,
          reason: message || `Status changed to ${newStatus}`,
        } satisfies Prisma.WorkflowTransitionCreateInput,
      });

      // Update task status
      const updateData: Prisma.TaskUpdateInput = { status: newStatus };

      if (newStatus === 'completed') {
        updateData.completionDate = new Date();
      }

      if (toRole) {
        updateData.currentMode = toRole;
        updateData.owner = toRole;
      }

      await tx.task.update({
        where: { id: taskId },
        data: updateData,
      });

      return transition;
    });

    return result;
  }
}
