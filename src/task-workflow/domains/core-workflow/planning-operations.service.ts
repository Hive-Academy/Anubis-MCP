import { Injectable } from '@nestjs/common';
import { ImplementationPlan, Prisma, Subtask } from 'generated/prisma';
import { PrismaService } from '../../../prisma/prisma.service';
import { PlanningOperationsInput } from './schemas/planning-operations.schema';

// Type-safe interfaces for planning operations
export interface PlanningOperationResult {
  success: boolean;
  data?: PlanWithSubtasks | Subtask[] | SubtaskBatchResult;
  error?: {
    message: string;
    code: string;
    operation: string;
  };
  metadata?: {
    operation: string;
    taskId?: number;
    planId?: number;
    batchId?: string;
    responseTime: number;
  };
}

export interface SubtaskBatchResult {
  subtasks: Subtask[];
  batchId: string;
  batchTitle: string;
  count: number;
  created?: number;
  updated?: number;
  totalSubtasks?: number;
  completed?: number;
  inProgress?: number;
  notStarted?: number;
}

export interface PlanWithSubtasks extends ImplementationPlan {
  subtasks?: Subtask[];
  batches?: Array<{
    batchId: string;
    batchTitle: string;
    subtasks: Subtask[];
  }>;
}

/**
 * Planning Operations Service (Internal)
 *
 * Internal service for implementation planning and batch subtask management.
 * No longer exposed as MCP tool - used by workflow-rules MCP interface.
 *
 * SOLID Principles Applied:
 * - Single Responsibility: Focused on planning and subtask operations only
 * - Open/Closed: Extensible through input schema without modifying core logic
 * - Liskov Substitution: Consistent interface for all planning operations
 * - Interface Segregation: Clean separation of planning concerns
 * - Dependency Inversion: Depends on PrismaService abstraction
 */
@Injectable()
export class PlanningOperationsService {
  constructor(private readonly prisma: PrismaService) {}

  async executePlanningOperation(
    input: PlanningOperationsInput,
  ): Promise<PlanningOperationResult> {
    const startTime = performance.now();

    try {
      let result:
        | ImplementationPlan
        | Subtask[]
        | SubtaskBatchResult
        | PlanWithSubtasks;

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
        success: true,
        data: result,
        metadata: {
          operation: input.operation,
          taskId: input.taskId,
          batchId: input.batchId,
          responseTime: Math.round(responseTime),
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message,
          code: 'PLANNING_OPERATION_FAILED',
          operation: input.operation,
        },
      };
    }
  }

  private async createPlan(
    input: PlanningOperationsInput,
  ): Promise<PlanWithSubtasks> {
    const { taskId, planData } = input;

    if (!planData) {
      throw new Error('Plan data is required for creation');
    }

    const plan = await this.prisma.implementationPlan.create({
      data: {
        task: { connect: { id: taskId } },
        overview: planData.overview || '',
        approach: planData.approach || '',
        technicalDecisions: planData.technicalDecisions || {},
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
      } satisfies Prisma.ImplementationPlanCreateInput,
      include: {
        subtasks: {
          orderBy: { sequenceNumber: 'asc' },
        },
      },
    });

    return plan;
  }

  private async updatePlan(
    input: PlanningOperationsInput,
  ): Promise<PlanWithSubtasks> {
    const { taskId, planData, planId } = input;

    if (!planData) {
      throw new Error('Plan data is required for update');
    }

    let plan: PlanWithSubtasks;
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

  private async getPlan(
    input: PlanningOperationsInput,
  ): Promise<PlanWithSubtasks> {
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

  private async createSubtasks(
    input: PlanningOperationsInput,
  ): Promise<SubtaskBatchResult> {
    const { taskId, batchData } = input;

    if (!batchData?.batchId || !batchData.subtasks) {
      throw new Error('Batch ID and subtasks are required');
    }

    // 🎯 ENHANCED: Make implementation plan optional for turbo-dev workflow
    // Try to get the implementation plan, but don't fail if it doesn't exist
    let planId: number | null = null;

    try {
      const plan = await this.prisma.implementationPlan.findFirst({
        where: { taskId },
      });

      if (plan) {
        planId = plan.id;
      }
    } catch (_error) {
      // Implementation plan doesn't exist - this is fine for turbo-dev workflow
      console.log(
        `No implementation plan found for task ${taskId}, creating subtasks without plan`,
      );
    }

    // Verify the task exists
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new Error(`Task with ID ${taskId} not found`);
    }

    // Create subtasks with optional planId
    const subtasksData = batchData.subtasks.map((subtask) => ({
      taskId,
      ...(planId && { planId }), // Only include planId if it exists
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
      count: createdSubtasks.length,
      batchId: batchData.batchId,
      batchTitle: batchData.batchTitle || 'Untitled Batch',
      subtasks: createdSubtasks,
    };
  }

  private async updateBatch(
    input: PlanningOperationsInput,
  ): Promise<SubtaskBatchResult> {
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
      count: updatedSubtasks.length,
      batchId,
      batchTitle: updatedSubtasks[0]?.batchTitle || 'Untitled Batch',
      subtasks: updatedSubtasks,
    };
  }

  private async getBatch(
    input: PlanningOperationsInput,
  ): Promise<SubtaskBatchResult> {
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
      count: subtasks.length,
      subtasks,
    };
  }
}
