import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';

// ===================================================================
// 🔥 STEP QUERY SERVICE - COMPLETE REVAMP FOR MCP-ONLY
// ===================================================================
// Purpose: Query workflow steps with MCP execution data
// Scope: MCP-focused step retrieval and progress queries
// ZERO Legacy Support: Complete removal of all non-MCP query logic

// 🎯 STRICT TYPE DEFINITIONS - ZERO ANY USAGE - SCHEMA ALIGNED

export interface StepWithExecutionData {
  id: string;
  name: string;
  displayName: string;
  description: string;
  stepType: string;
  actions: StepAction[];
  conditions: StepCondition[];
  stepProgress: WorkflowStepProgress[];
}

export interface StepAction {
  id: string;
  name: string;
  actionType: string;
  actionData: unknown;
  sequenceOrder: number;
}

export interface StepCondition {
  id: string;
  name: string;
  conditionType: string;
  logic: unknown;
  isRequired: boolean;
}

export interface WorkflowStepProgress {
  id: string;
  status: string;
  startedAt?: Date | null;
  completedAt?: Date | null;
  failedAt?: Date | null;
  duration?: number | null;
  executionData?: unknown;
  validationResults?: unknown;
  errorDetails?: unknown;
  result?: string | null;
}

export interface WorkflowStep {
  id: string;
  name: string;
  displayName: string;
  description: string;
  sequenceNumber: number;
  stepType: string;
  roleId: string;
}

export interface RoleStepStatistics {
  roleId: string;
  totalSteps: number;
  completedSteps: number;
  failedSteps: number;
  inProgressSteps: number;
}

/**
 * 🚀 REVAMPED: StepQueryService
 *
 * COMPLETE OVERHAUL FOR MCP-ONLY EXECUTION:
 * - Schema-aligned field names (sequenceNumber, not sequenceOrder)
 * - Correct table names (workflowStep, workflowStepProgress)
 * - MCP_CALL-only action filtering
 * - Enhanced progress queries
 * - Zero legacy code - MCP-only focus
 * - Reduced dependencies: Only PrismaService
 */
@Injectable()
export class StepQueryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get step with all MCP execution data in single query
   */
  async getStepWithExecutionData(
    stepId: string,
  ): Promise<StepWithExecutionData | null> {
    const result = await this.prisma.workflowStep.findUnique({
      where: { id: stepId },
      include: {
        actions: {
          where: { actionType: 'MCP_CALL' },
          orderBy: { sequenceOrder: 'asc' },
        },
        conditions: true,
        stepProgress: {
          take: 1,
          orderBy: { startedAt: 'desc' },
        },
      },
    });

    return result as StepWithExecutionData | null;
  }

  /**
   * Get next available step for execution
   */
  async getNextAvailableStep(
    _executionId: string,
    currentStepId: string,
  ): Promise<WorkflowStep | null> {
    const currentStep = await this.prisma.workflowStep.findUnique({
      where: { id: currentStepId },
      select: { sequenceNumber: true, roleId: true },
    });

    if (!currentStep) return null;

    return this.prisma.workflowStep.findFirst({
      where: {
        roleId: currentStep.roleId,
        sequenceNumber: { gt: currentStep.sequenceNumber },
        stepProgress: {
          none: { status: 'COMPLETED' },
        },
      },
      orderBy: { sequenceNumber: 'asc' },
    });
  }

  /**
   * Get all steps for a specific role
   */
  async getStepsByRole(roleId: string): Promise<WorkflowStep[]> {
    return this.prisma.workflowStep.findMany({
      where: { roleId },
      orderBy: { sequenceNumber: 'asc' },
    });
  }

  /**
   * Get step by name within a role
   */
  async getStepByName(
    roleId: string,
    stepName: string,
  ): Promise<WorkflowStep | null> {
    return this.prisma.workflowStep.findFirst({
      where: {
        roleId,
        name: stepName,
      },
    });
  }

  /**
   * Get role step execution statistics
   */
  async getRoleStepStatistics(roleId: string): Promise<RoleStepStatistics> {
    const stats = await this.prisma.workflowStepProgress.groupBy({
      by: ['status'],
      where: { roleId },
      _count: { status: true },
    });

    return {
      roleId,
      totalSteps: stats.reduce((sum, stat) => sum + stat._count.status, 0),
      completedSteps:
        stats.find((s) => s.status === 'COMPLETED')?._count.status || 0,
      failedSteps: stats.find((s) => s.status === 'FAILED')?._count.status || 0,
      inProgressSteps:
        stats.find((s) => s.status === 'IN_PROGRESS')?._count.status || 0,
    };
  }

  /**
   * Get steps with MCP actions only
   */
  async getStepsWithMcpActions(
    roleId: string,
  ): Promise<StepWithExecutionData[]> {
    const results = await this.prisma.workflowStep.findMany({
      where: {
        roleId,
        actions: {
          some: {
            actionType: 'MCP_CALL',
          },
        },
      },
      include: {
        actions: {
          where: { actionType: 'MCP_CALL' },
          orderBy: { sequenceOrder: 'asc' },
        },
        conditions: true,
        stepProgress: {
          take: 1,
          orderBy: { startedAt: 'desc' },
        },
      },
      orderBy: { sequenceNumber: 'asc' },
    });

    return results as StepWithExecutionData[];
  }

  /**
   * Check if step exists and has MCP actions
   */
  async validateStepForMcpExecution(stepId: string): Promise<boolean> {
    const step = await this.prisma.workflowStep.findUnique({
      where: { id: stepId },
      include: {
        actions: {
          where: { actionType: 'MCP_CALL' },
        },
      },
    });

    return step !== null && step.actions.length > 0;
  }

  /**
   * Get step execution history
   */
  async getStepExecutionHistory(
    stepId: string,
  ): Promise<WorkflowStepProgress[]> {
    const results = await this.prisma.workflowStepProgress.findMany({
      where: { stepId },
      orderBy: { startedAt: 'desc' },
    });

    return results as WorkflowStepProgress[];
  }
}
