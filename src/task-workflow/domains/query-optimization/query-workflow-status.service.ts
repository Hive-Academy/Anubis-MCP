import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  QueryWorkflowStatusInput,
  QueryWorkflowStatusSchema,
} from './schemas/query-workflow-status.schema';

/**
 * Query Workflow Status Service
 *
 * Pre-configured delegation and workflow status queries.
 */
@Injectable()
export class QueryWorkflowStatusService {
  private readonly logger = new Logger(QueryWorkflowStatusService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Tool({
    name: 'query_workflow_status',
    description: `
Pre-configured delegation and workflow status queries.

**Query Types:**
- task_status: Current task status and ownership
- delegation_history: Complete delegation chain
- workflow_transitions: All workflow state changes
- current_assignments: Tasks by current role

**Examples:**
- Current status: { taskId: "TSK-001", queryType: "task_status" }
- Delegation history: { taskId: "TSK-001", queryType: "delegation_history" }
- Role assignments: { queryType: "current_assignments", currentRole: "senior-developer" }
`,
    parameters: QueryWorkflowStatusSchema,
  })
  async queryWorkflowStatus(input: QueryWorkflowStatusInput): Promise<any> {
    try {
      let result: any;

      switch (input.queryType) {
        case 'task_status':
          result = await this.getTaskStatus(input);
          break;
        case 'delegation_history':
          result = await this.getDelegationHistory(input);
          break;
        case 'workflow_transitions':
          result = await this.getWorkflowTransitions(input);
          break;
        case 'current_assignments':
          result = await this.getCurrentAssignments(input);
          break;
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                data: result,
                metadata: { queryType: input.queryType, taskId: input.taskId },
              },
              null,
              2,
            ),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: false,
                error: {
                  message: error.message,
                  code: 'QUERY_WORKFLOW_STATUS_FAILED',
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

  private getTaskStatus(input: QueryWorkflowStatusInput) {
    if (!input.taskId) throw new Error('TaskId required for task_status query');

    return this.prisma.task.findUnique({
      where: { id: input.taskId },
      select: {
        id: true,
        name: true,
        status: true,
        currentMode: true,
        priority: true,
        createdAt: true,
        completionDate: true,
        slug: true,
      },
    });
  }

  private async getDelegationHistory(input: QueryWorkflowStatusInput) {
    if (!input.taskId)
      throw new Error('TaskId required for delegation_history query');

    return await this.prisma.delegationRecord.findMany({
      where: { taskId: input.taskId },
      orderBy: { delegationTimestamp: 'asc' },
    });
  }

  private async getWorkflowTransitions(input: QueryWorkflowStatusInput) {
    if (!input.taskId)
      throw new Error('TaskId required for workflow_transitions query');

    return await this.prisma.workflowTransition.findMany({
      where: { taskId: input.taskId },
      orderBy: { transitionTimestamp: 'asc' },
    });
  }

  private async getCurrentAssignments(input: QueryWorkflowStatusInput) {
    const where: any = {};
    if (input.currentRole) where.currentMode = input.currentRole;
    if (input.status) where.status = input.status;

    return await this.prisma.task.findMany({
      where,
      select: {
        id: true,
        name: true,
        status: true,
        currentMode: true,
        priority: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
