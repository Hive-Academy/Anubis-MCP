import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';

// ===================================================================
// 🔥 STEP QUERY SERVICE - UPDATED FOR STREAMLINED SCHEMA
// ===================================================================
// Purpose: Query workflow steps with MCP execution data
// Scope: MCP-focused step retrieval and progress queries
// Schema: Aligned with streamlined schema structure

// 🎯 UPDATED TYPE DEFINITIONS - STREAMLINED SCHEMA ALIGNED

export interface StepWithExecutionData {
  id: string;
  name: string;
  description: string;
  stepType: string;
  mcpActions: McpActionData[];
  stepDependencies: StepDependencyData[];
  stepProgress: WorkflowStepProgress[];
  stepGuidance: StepGuidanceData | null;
  qualityChecks: QualityCheckData[];
}

export interface McpActionData {
  id: string;
  name: string;
  serviceName: string;
  operation: string;
  parameters: unknown;
  sequenceOrder: number;
}

export interface StepDependencyData {
  id: string;
  dependsOnStep: string;
  isRequired: boolean;
}

export interface StepGuidanceData {
  id: string;
  stepByStep: unknown; // JSON array
}

export interface QualityCheckData {
  id: string;
  criterion: string;
  sequenceOrder: number;
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
 * 🚀 UPDATED: StepQueryService for Streamlined Schema
 *
 * STREAMLINED SCHEMA CHANGES:
 * - actions → mcpActions (all actions are MCP actions)
 * - conditions → stepDependencies (simplified dependencies)
 * - Added stepGuidance and qualityChecks relationships
 * - Removed actionType filtering (all actions are MCP_CALL)
 * - Updated field references to match new schema
 */
@Injectable()
export class StepQueryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get next available step for execution
   */
  async getNextAvailableStep(
    taskId: string,
    roleId: string,
  ): Promise<WorkflowStep | null> {
    // Get the current step from workflow execution
    const execution = await this.prisma.workflowExecution.findFirst({
      where: { taskId: parseInt(taskId) },
      include: { currentStep: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!execution || !execution.currentStep) {
      // No execution or current step, return first step for role
      return this.prisma.workflowStep.findFirst({
        where: { roleId },
        orderBy: { sequenceNumber: 'asc' },
      });
    }

    // Get next step in sequence for this role
    return this.prisma.workflowStep.findFirst({
      where: {
        roleId,
        sequenceNumber: { gt: execution.currentStep.sequenceNumber },
      },
      orderBy: { sequenceNumber: 'asc' },
    });
  }

  /**
   * Get next step after completing current step
   */
  async getNextStepAfterCompletion(
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
   * Check if step exists and has MCP actions
   */
  async validateStepForMcpExecution(stepId: string): Promise<boolean> {
    const step = await this.prisma.workflowStep.findUnique({
      where: { id: stepId },
      include: {
        mcpActions: true,
      },
    });

    return step !== null && step.mcpActions.length > 0;
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

  // ===================================================================
  // 🔧 PRIVATE IMPLEMENTATION METHODS - STREAMLINED SCHEMA
  // ===================================================================

  async getStepWithMcpActions(stepId: string) {
    const result = await this.prisma.workflowStep.findUnique({
      where: { id: stepId },
      include: {
        mcpActions: {
          orderBy: { sequenceOrder: 'asc' },
        },
        stepGuidance: true,
        qualityChecks: {
          orderBy: { sequenceOrder: 'asc' },
        },
      },
    });

    return result;
  }
}
