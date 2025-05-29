import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  QueryTaskContextSchema,
  QueryTaskContextInput,
} from './schemas/query-task-context.schema';
import { ImplementationPlan } from 'generated/prisma';

// Add interface for batch organization
interface BatchGroup {
  batchId: string;
  batchTitle: string;
  subtasks: any[];
}

interface BatchAccumulator {
  [key: string]: BatchGroup;
}

/**
 * Query Task Context Service
 *
 * Pre-configured task context queries with comprehensive relationships.
 * Eliminates complex include/select decisions.
 */
@Injectable()
export class QueryTaskContextService {
  private readonly logger = new Logger(QueryTaskContextService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Tool({
    name: 'query_task_context',
    description: `
Pre-configured task context retrieval with comprehensive relationships.

**Include Levels:**
- basic: Task + description only
- full: Task + description + plans + subtasks (default)
- comprehensive: Everything including analysis, comments, reports

**Features:**
- Automatic relationship loading based on level
- Subtask batch organization
- Optional filtering by status and batch
- Optimized single query with pre-configured includes

**Examples:**
- Basic context: { taskId: "TSK-001", includeLevel: "basic" }
- Full context: { taskId: "TSK-001", includeLevel: "full" }
- Filtered subtasks: { taskId: "TSK-001", batchId: "B001", subtaskStatus: "completed" }
`,
    parameters: QueryTaskContextSchema,
  })
  async queryTaskContext(input: QueryTaskContextInput): Promise<any> {
    try {
      const {
        taskId,
        includeLevel,
        includePlans,
        includeSubtasks,
        includeAnalysis,
        includeComments,
        subtaskStatus,
        batchId,
      } = input;

      // Build include based on level
      const include: any = {};

      // Always include description
      include.taskDescription = true;

      if (includeLevel === 'full' || includeLevel === 'comprehensive') {
        if (includePlans) {
          const subtaskWhere: any = {};
          if (subtaskStatus) subtaskWhere.status = subtaskStatus;
          if (batchId) subtaskWhere.batchId = batchId;

          include.implementationPlans = {
            include: {
              subtasks: includeSubtasks
                ? {
                    where:
                      Object.keys(subtaskWhere).length > 0
                        ? subtaskWhere
                        : undefined,
                    orderBy: { sequenceNumber: 'asc' },
                  }
                : false,
            },
          };
        }
      }

      if (includeLevel === 'comprehensive') {
        if (includeAnalysis) include.codebaseAnalysis = true;
        if (includeComments)
          include.comments = { orderBy: { createdAt: 'desc' } };
        include.researchReports = true;
        include.codeReviews = true;
        include.completionReports = true;
        include.delegationRecords = {
          orderBy: { delegationTimestamp: 'desc' },
        };
        include.workflowTransitions = {
          orderBy: { transitionTimestamp: 'desc' },
        };
      }

      const task = await this.prisma.task.findUnique({
        where: { taskId },
        include,
      });

      if (!task) {
        throw new Error(`Task ${taskId} not found`);
      }

      // Organize subtasks by batch if included
      if (task.implementationPlans && includeSubtasks) {
        task.implementationPlans = task.implementationPlans.map((plan: any) => {
          if (plan.subtasks) {
            const batches: BatchAccumulator = plan.subtasks.reduce(
              (acc: BatchAccumulator, subtask: any): BatchAccumulator => {
                const batch = subtask.batchId || 'no-batch';
                if (!acc[batch]) {
                  acc[batch] = {
                    batchId: batch,
                    batchTitle: subtask.batchTitle || 'Untitled Batch',
                    subtasks: [],
                  };
                }
                acc[batch].subtasks.push(subtask);
                return acc;
              },
              {},
            );
            plan.batches = Object.values(batches);
          }
          return plan as ImplementationPlan;
        });
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                data: task,
                metadata: {
                  includeLevel,
                  relationships: Object.keys(include),
                  taskId,
                },
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
                  code: 'QUERY_TASK_CONTEXT_FAILED',
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
}
