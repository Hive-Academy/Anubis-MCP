import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  PlanningOperationsSchema,
  PlanningOperationsInput,
} from './schemas/planning-operations.schema';

/**
 * Planning Operations Service
 *
 * Focused service for ImplementationPlan and Subtask batch operations.
 * Eliminates complex batch parameter decisions with clear, obvious interfaces.
 */
@Injectable()
export class PlanningOperationsService {
  private readonly logger = new Logger(PlanningOperationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Tool({
    name: 'planning_operations',
    description: `
Implementation planning and batch subtask management.

**Operations:**
- create_plan: Create implementation plan for a task
- update_plan: Update existing implementation plan
- get_plan: Retrieve plan with subtasks
- create_subtasks: Create batch of subtasks for a plan
- update_batch: Update all subtasks in a batch
- get_batch: Retrieve all subtasks for a specific batch

**Key Features:**
- Automatic batch management (group subtasks by batchId)
- Sequential numbering for subtasks
- Clear plan-to-subtask relationships
- Batch status updates (update entire batches at once)

**Subtask Creation Requirements:**
- REQUIRED: name, description, sequenceNumber
- OPTIONAL: status (defaults to 'not-started' if not provided)

**Examples:**
- Create plan: { operation: "create_plan", taskId: "TSK-001", planData: { overview: "Auth implementation", approach: "JWT-based" } }
- Create batch: { operation: "create_subtasks", taskId: "TSK-001", batchData: { batchId: "B001", subtasks: [{ name: "Task", description: "Desc", sequenceNumber: 1 }] } }
- Update batch: { operation: "update_batch", taskId: "TSK-001", batchId: "B001", newStatus: "completed" }
`,
    parameters: PlanningOperationsSchema,
  })
  async executePlanningOperation(input: PlanningOperationsInput): Promise<any> {
    const startTime = performance.now();

    try {
      this.logger.debug(`Planning Operation: ${input.operation}`, {
        taskId: input.taskId,
        batchId: input.batchId,
      });

      let result: any;

      switch (input.operation) {
        case 'create_plan':
          result = await this.createPlan(input);
          break;
        case 'update_plan':
          result = await this.updatePlan(input);
          break;
        case 'get_plan':
          result = await this.getPlan(input);
          break;
        case 'create_subtasks':
          result = await this.createSubtasks(input);
          break;
        case 'update_batch':
          result = await this.updateBatch(input);
          break;
        case 'get_batch':
          result = await this.getBatch(input);
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
      this.logger.error(`Planning operation failed:`, error);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: false,
                error: {
                  message: error.message,
                  code: 'PLANNING_OPERATION_FAILED',
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

  private async createPlan(input: PlanningOperationsInput): Promise<any> {
    const { taskId, planData } = input;

    if (!planData) {
      throw new Error('Plan data is required for creation');
    }

    const plan = await this.prisma.implementationPlan.create({
      data: {
        taskId,
        overview: planData.overview || '',
        approach: planData.approach || '',
        technicalDecisions: planData.technicalDecisions || '',
        filesToModify: planData.filesToModify || [],
        createdBy: planData.createdBy || 'system',

        // Strategic Architecture Context - NEW FIELDS
        ...(planData.strategicGuidance && {
          strategicGuidance: planData.strategicGuidance,
        }),
        ...(planData.strategicContext && {
          strategicContext: planData.strategicContext,
        }),
        ...(planData.verificationEvidence && {
          verificationEvidence: planData.verificationEvidence,
        }),
        ...(planData.architecturalRationale && {
          architecturalRationale: planData.architecturalRationale,
        }),

        // Redelegation and Issue Context - NEW FIELDS
        ...(planData.redelegationContext && {
          redelegationContext: planData.redelegationContext,
        }),
        ...(planData.issueAnalysis && {
          issueAnalysis: planData.issueAnalysis,
        }),
        ...(planData.solutionStrategy && {
          solutionStrategy: planData.solutionStrategy,
        }),

        // Quality and Compliance - NEW FIELDS
        ...(planData.qualityGates && { qualityGates: planData.qualityGates }),
        ...(planData.patternCompliance && {
          patternCompliance: planData.patternCompliance,
        }),
        ...(planData.antiPatternPrevention && {
          antiPatternPrevention: planData.antiPatternPrevention,
        }),
      },
      include: {
        subtasks: {
          orderBy: { sequenceNumber: 'asc' },
        },
      },
    });

    return plan;
  }

  private async updatePlan(input: PlanningOperationsInput): Promise<any> {
    const { taskId, planData, planId } = input;

    if (!planData) {
      throw new Error('Plan data is required for update');
    }

    let plan;
    if (planId) {
      plan = await this.prisma.implementationPlan.update({
        where: { id: planId },
        data: {
          ...(planData.overview && { overview: planData.overview }),
          ...(planData.approach && { approach: planData.approach }),
          ...(planData.technicalDecisions && {
            technicalDecisions: planData.technicalDecisions,
          }),
          ...(planData.filesToModify && {
            filesToModify: planData.filesToModify,
          }),
          ...(planData.createdBy && { createdBy: planData.createdBy }),

          // Strategic Architecture Context - NEW FIELDS
          ...(planData.strategicGuidance && {
            strategicGuidance: planData.strategicGuidance,
          }),
          ...(planData.strategicContext && {
            strategicContext: planData.strategicContext,
          }),
          ...(planData.verificationEvidence && {
            verificationEvidence: planData.verificationEvidence,
          }),
          ...(planData.architecturalRationale && {
            architecturalRationale: planData.architecturalRationale,
          }),

          // Redelegation and Issue Context - NEW FIELDS
          ...(planData.redelegationContext && {
            redelegationContext: planData.redelegationContext,
          }),
          ...(planData.issueAnalysis && {
            issueAnalysis: planData.issueAnalysis,
          }),
          ...(planData.solutionStrategy && {
            solutionStrategy: planData.solutionStrategy,
          }),

          // Quality and Compliance - NEW FIELDS
          ...(planData.qualityGates && { qualityGates: planData.qualityGates }),
          ...(planData.patternCompliance && {
            patternCompliance: planData.patternCompliance,
          }),
          ...(planData.antiPatternPrevention && {
            antiPatternPrevention: planData.antiPatternPrevention,
          }),
        },
        include: {
          subtasks: {
            orderBy: { sequenceNumber: 'asc' },
          },
        },
      });
    } else {
      const existingPlan = await this.prisma.implementationPlan.findFirst({
        where: { taskId },
      });

      if (!existingPlan) {
        throw new Error(`Implementation plan not found for task ${taskId}`);
      }

      plan = await this.prisma.implementationPlan.update({
        where: { id: existingPlan.id },
        data: {
          ...(planData.overview && { overview: planData.overview }),
          ...(planData.approach && { approach: planData.approach }),
          ...(planData.technicalDecisions && {
            technicalDecisions: planData.technicalDecisions,
          }),
          ...(planData.filesToModify && {
            filesToModify: planData.filesToModify,
          }),
          ...(planData.createdBy && { createdBy: planData.createdBy }),

          // Strategic Architecture Context - NEW FIELDS
          ...(planData.strategicGuidance && {
            strategicGuidance: planData.strategicGuidance,
          }),
          ...(planData.strategicContext && {
            strategicContext: planData.strategicContext,
          }),
          ...(planData.verificationEvidence && {
            verificationEvidence: planData.verificationEvidence,
          }),
          ...(planData.architecturalRationale && {
            architecturalRationale: planData.architecturalRationale,
          }),

          // Redelegation and Issue Context - NEW FIELDS
          ...(planData.redelegationContext && {
            redelegationContext: planData.redelegationContext,
          }),
          ...(planData.issueAnalysis && {
            issueAnalysis: planData.issueAnalysis,
          }),
          ...(planData.solutionStrategy && {
            solutionStrategy: planData.solutionStrategy,
          }),

          // Quality and Compliance - NEW FIELDS
          ...(planData.qualityGates && { qualityGates: planData.qualityGates }),
          ...(planData.patternCompliance && {
            patternCompliance: planData.patternCompliance,
          }),
          ...(planData.antiPatternPrevention && {
            antiPatternPrevention: planData.antiPatternPrevention,
          }),
        },
        include: {
          subtasks: {
            orderBy: { sequenceNumber: 'asc' },
          },
        },
      });
    }

    return plan;
  }

  private async getPlan(input: PlanningOperationsInput): Promise<any> {
    const { taskId, planId, includeBatches } = input;

    const whereClause = planId ? { id: planId } : { taskId };

    const include: any = {};
    if (includeBatches) {
      include.subtasks = {
        orderBy: { sequenceNumber: 'asc' },
      };
    }

    const plan = await this.prisma.implementationPlan.findFirst({
      where: whereClause,
      include,
    });

    if (!plan) {
      throw new Error(
        `Implementation plan not found for ${planId ? `planId ${planId}` : `taskId ${taskId}`}`,
      );
    }

    // Group subtasks by batch if included
    if (includeBatches && plan.subtasks) {
      const batchMap: Record<string, any> = {};

      plan.subtasks.forEach((subtask: any) => {
        const batchId = subtask.batchId || 'no-batch';
        if (!batchMap[batchId]) {
          batchMap[batchId] = {
            batchId,
            batchTitle: subtask.batchTitle || 'Untitled Batch',
            subtasks: [],
          };
        }
        batchMap[batchId].subtasks.push(subtask);
      });

      return {
        ...plan,
        batches: Object.values(batchMap),
      };
    }

    return plan;
  }

  private async createSubtasks(input: PlanningOperationsInput): Promise<any> {
    const { taskId, batchData } = input;

    if (!batchData?.batchId || !batchData.subtasks) {
      throw new Error('Batch ID and subtasks are required');
    }

    // Get the implementation plan
    const plan = await this.prisma.implementationPlan.findFirst({
      where: { taskId },
    });

    if (!plan) {
      throw new Error(`Implementation plan not found for task ${taskId}`);
    }

    // Create subtasks in batch
    const subtasksData = batchData.subtasks.map((subtask) => ({
      taskId,
      planId: plan.id,
      name: subtask.name,
      description: subtask.description,
      sequenceNumber: subtask.sequenceNumber,
      status: subtask.status || 'not-started',
      batchId: batchData.batchId,
      batchTitle: batchData.batchTitle || 'Untitled Batch',

      // Strategic Implementation Guidance - NEW FIELDS
      ...(subtask.strategicGuidance && {
        strategicGuidance: subtask.strategicGuidance,
      }),
      ...(subtask.qualityConstraints && {
        qualityConstraints: subtask.qualityConstraints,
      }),
      ...(subtask.successCriteria && {
        successCriteria: subtask.successCriteria,
      }),
      ...(subtask.architecturalRationale && {
        architecturalRationale: subtask.architecturalRationale,
      }),
    }));

    const result = await this.prisma.subtask.createMany({
      data: subtasksData,
    });

    // Return created subtasks
    const createdSubtasks = await this.prisma.subtask.findMany({
      where: {
        taskId,
        batchId: batchData.batchId,
      },
      orderBy: { sequenceNumber: 'asc' },
    });

    return {
      created: result.count,
      batchId: batchData.batchId,
      subtasks: createdSubtasks,
    };
  }

  private async updateBatch(input: PlanningOperationsInput): Promise<any> {
    const { taskId, batchId, newStatus } = input;

    if (!batchId) {
      throw new Error('Batch ID is required for batch updates');
    }

    const updateData: any = {};
    if (newStatus) {
      updateData.status = newStatus;
      if (newStatus === 'completed') {
        updateData.completedAt = new Date();
      } else if (newStatus === 'in-progress') {
        updateData.startedAt = new Date();
      }
    }

    const result = await this.prisma.subtask.updateMany({
      where: {
        taskId,
        batchId,
      },
      data: updateData,
    });

    // Return updated subtasks
    const updatedSubtasks = await this.prisma.subtask.findMany({
      where: {
        taskId,
        batchId,
      },
      orderBy: { sequenceNumber: 'asc' },
    });

    return {
      updated: result.count,
      batchId,
      newStatus,
      subtasks: updatedSubtasks,
    };
  }

  private async getBatch(input: PlanningOperationsInput): Promise<any> {
    const { taskId, batchId } = input;

    if (!batchId) {
      throw new Error('Batch ID is required for batch retrieval');
    }

    const subtasks = await this.prisma.subtask.findMany({
      where: {
        taskId,
        batchId,
      },
      orderBy: { sequenceNumber: 'asc' },
    });

    if (subtasks.length === 0) {
      throw new Error(
        `No subtasks found for batch ${batchId} in task ${taskId}`,
      );
    }

    const batchSummary = {
      batchId,
      batchTitle: subtasks[0]?.batchTitle || 'Untitled Batch',
      totalSubtasks: subtasks.length,
      completed: subtasks.filter((s) => s.status === 'completed').length,
      inProgress: subtasks.filter((s) => s.status === 'in-progress').length,
      notStarted: subtasks.filter((s) => s.status === 'not-started').length,
    };

    return {
      ...batchSummary,
      subtasks,
    };
  }
}
