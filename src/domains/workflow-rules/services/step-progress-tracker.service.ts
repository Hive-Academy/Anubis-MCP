import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  isDefined,
  safeJsonCast,
  StepProgressError,
} from '../utils/step-service-shared.utils';
import { getErrorMessage } from '../utils/type-safety.utils';

// ===================================================================
// 🔥 STEP PROGRESS TRACKER SERVICE - COMPLETE REVAMP FOR MCP-ONLY
// ===================================================================
// Purpose: Track MCP execution progress and provide progress analytics
// Scope: MCP-focused progress tracking, step lifecycle management
// ZERO Legacy Support: Complete removal of all non-MCP tracking logic

// 🎯 STRICT TYPE DEFINITIONS - ZERO ANY USAGE - SCHEMA ALIGNED

export interface StepProgressRecord {
  id: string;
  stepId: string;
  executionId: string; // 🔧 FIXED: Added required executionId
  taskId?: string; // 🔧 FIXED: Made optional (can be null for bootstrap)
  roleId: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'FAILED';
  startedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  duration?: number;
  executionData?: McpExecutionData;
  validationResults?: unknown;
  errorDetails?: unknown;
  result?: 'SUCCESS' | 'FAILURE';
}

export interface McpExecutionData {
  executionType: 'MCP_ONLY';
  phase: 'GUIDANCE_PREPARED' | 'EXECUTING' | 'COMPLETED' | 'FAILED';
  mcpActionsCompleted?: number;
  mcpActionsTotal?: number;
  lastMcpResult?: McpExecutionResult;
  mcpResults?: McpExecutionResult[];
  totalDuration?: number;
  errors?: string[];
}

export interface McpProgressUpdate {
  completedActions: number;
  totalActions: number;
  lastResult: McpExecutionResult;
}

export interface StepCompletionData {
  result: 'SUCCESS' | 'FAILURE';
  mcpResults: McpExecutionResult[];
  duration: number;
}

export interface StepFailureData {
  errors: string[];
  mcpResults?: McpExecutionResult[];
}

export interface McpExecutionResult {
  actionId: string;
  actionName: string;
  success: boolean;
  output?: string;
  error?: string;
  executionTime?: number;
}

export interface RoleProgressSummary {
  roleId: string;
  totalSteps: number;
  completedSteps: number;
  failedSteps: number;
  inProgressSteps: number;
  averageExecutionTime: number;
  successRate: number;
}

// Custom Error Classes - Using shared utilities

/**
 * 🚀 REVAMPED: StepProgressTrackerService
 *
 * COMPLETE OVERHAUL FOR MCP-ONLY EXECUTION:
 * - Schema-aligned field names (executionData, not progressData)
 * - Correct enum values (IN_PROGRESS, SUCCESS/FAILURE)
 * - Correct table name (workflowStepProgress)
 * - Enhanced failure tracking with failedAt and result fields
 * - Zero legacy code - MCP-only focus
 * - Reduced dependencies: Only PrismaService
 */
@Injectable()
export class StepProgressTrackerService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Start step execution with MCP-focused tracking
   */
  async startStep(
    stepId: string,
    executionId: string,
    taskId?: string,
    roleId?: string,
  ): Promise<StepProgressRecord> {
    try {
      // Get roleId from execution if not provided
      let actualRoleId = roleId;
      if (!actualRoleId) {
        const execution = await this.prisma.workflowExecution.findUnique({
          where: { id: executionId },
          select: { currentRoleId: true },
        });
        if (!execution) {
          throw new Error(`Execution not found: ${executionId}`);
        }
        actualRoleId = execution.currentRoleId;
      }

      const progressRecord = await this.prisma.workflowStepProgress.create({
        data: {
          stepId,
          executionId, // 🔧 FIXED: Include required executionId
          taskId: taskId || null, // Optional - may be null for bootstrap executions
          roleId: actualRoleId,
          status: 'IN_PROGRESS',
          startedAt: new Date(),
          executionData: {
            executionType: 'MCP_ONLY',
            phase: 'GUIDANCE_PREPARED',
            mcpActionsTotal: 0,
            mcpActionsCompleted: 0,
          },
        },
      });

      return this.transformProgressRecord(progressRecord);
    } catch (error) {
      throw new StepProgressError(
        `Failed to start progress tracking: ${getErrorMessage(error)}`,
        'StepProgressTrackerService',
        'startStep',
        { stepId },
      );
    }
  }

  /**
   * Update progress during MCP execution
   */
  async updateProgress(
    stepId: string,
    update: McpProgressUpdate,
  ): Promise<StepProgressRecord> {
    try {
      const existing = await this.prisma.workflowStepProgress.findFirst({
        where: { stepId },
        orderBy: { startedAt: 'desc' },
      });

      if (!existing) {
        throw new Error(`No progress record found for step: ${stepId}`);
      }

      const currentData = safeJsonCast<McpExecutionData>(
        existing.executionData,
      ) || {
        executionType: 'MCP_ONLY',
        phase: 'EXECUTING',
      };

      const progressRecord = await this.prisma.workflowStepProgress.update({
        where: { id: existing.id },
        data: {
          executionData: JSON.parse(
            JSON.stringify({
              ...currentData,
              phase: 'EXECUTING',
              mcpActionsCompleted: update.completedActions,
              mcpActionsTotal: update.totalActions,
              lastMcpResult: update.lastResult,
            }),
          ),
        },
      });

      return this.transformProgressRecord(progressRecord);
    } catch (error) {
      throw new StepProgressError(
        `Failed to update progress: ${getErrorMessage(error)}`,
        'StepProgressTrackerService',
        'updateProgress',
        { stepId },
      );
    }
  }

  /**
   * Complete step execution tracking
   */
  async completeStep(
    stepId: string,
    completion: StepCompletionData,
  ): Promise<StepProgressRecord> {
    try {
      const existing = await this.prisma.workflowStepProgress.findFirst({
        where: { stepId },
        orderBy: { startedAt: 'desc' },
      });

      if (!existing) {
        throw new Error(`No progress record found for step: ${stepId}`);
      }

      const currentData = safeJsonCast<McpExecutionData>(
        existing.executionData,
      ) || {
        executionType: 'MCP_ONLY',
        phase: 'COMPLETED',
      };

      const progressRecord = await this.prisma.workflowStepProgress.update({
        where: { id: existing.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          result: completion.result,
          duration: completion.duration,
          executionData: JSON.parse(
            JSON.stringify({
              ...currentData,
              phase: 'COMPLETED',
              mcpResults: completion.mcpResults,
              totalDuration: completion.duration,
            }),
          ),
        },
      });

      return this.transformProgressRecord(progressRecord);
    } catch (error) {
      throw new StepProgressError(
        `Failed to complete step: ${getErrorMessage(error)}`,
        'StepProgressTrackerService',
        'completeStep',
        { stepId },
      );
    }
  }

  /**
   * Mark step as failed
   */
  async failStep(
    stepId: string,
    failure: StepFailureData,
  ): Promise<StepProgressRecord> {
    try {
      const existing = await this.prisma.workflowStepProgress.findFirst({
        where: { stepId },
        orderBy: { startedAt: 'desc' },
      });

      if (!existing) {
        throw new Error(`No progress record found for step: ${stepId}`);
      }

      const progressRecord = await this.prisma.workflowStepProgress.update({
        where: { id: existing.id },
        data: {
          status: 'FAILED',
          failedAt: new Date(),
          result: 'FAILURE',
          errorDetails: JSON.parse(
            JSON.stringify({
              errors: failure.errors,
              mcpResults: failure.mcpResults,
              timestamp: new Date().toISOString(),
            }),
          ),
        },
      });

      return this.transformProgressRecord(progressRecord);
    } catch (error) {
      throw new StepProgressError(
        `Failed to mark step as failed: ${getErrorMessage(error)}`,
        'StepProgressTrackerService',
        'failStep',
        { stepId },
      );
    }
  }

  /**
   * Get current step progress
   */
  async getStepProgress(stepId: string): Promise<StepProgressRecord | null> {
    try {
      const progressRecord = await this.prisma.workflowStepProgress.findFirst({
        where: { stepId },
        orderBy: { startedAt: 'desc' },
      });

      if (!progressRecord) {
        return null;
      }

      return this.transformProgressRecord(progressRecord);
    } catch (_error) {
      return null;
    }
  }

  /**
   * Get role execution statistics
   */
  async getRoleProgressSummary(roleId: string): Promise<RoleProgressSummary> {
    try {
      const progressRecords = await this.prisma.workflowStepProgress.findMany({
        where: { roleId },
      });

      const totalSteps = progressRecords.length;
      const completedSteps = progressRecords.filter(
        (p) => p.status === 'COMPLETED',
      ).length;
      const failedSteps = progressRecords.filter(
        (p) => p.status === 'FAILED',
      ).length;
      const inProgressSteps = progressRecords.filter(
        (p) => p.status === 'IN_PROGRESS',
      ).length;

      const completedRecords = progressRecords.filter(
        (p) => p.status === 'COMPLETED' && isDefined(p.duration),
      );
      const averageExecutionTime =
        completedRecords.length > 0
          ? completedRecords.reduce((sum, p) => sum + (p.duration || 0), 0) /
            completedRecords.length
          : 0;

      const successRate =
        totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

      return {
        roleId,
        totalSteps,
        completedSteps,
        failedSteps,
        inProgressSteps,
        averageExecutionTime,
        successRate,
      };
    } catch (error) {
      throw new StepProgressError(
        `Failed to get role progress summary: ${getErrorMessage(error)}`,
        'StepProgressTrackerService',
        'getRoleProgressSummary',
        { roleId },
      );
    }
  }

  /**
   * Transform Prisma record to our interface
   */
  private transformProgressRecord(record: unknown): StepProgressRecord {
    const typedRecord = record as {
      id: string;
      stepId: string;
      executionId: string; // 🔧 FIXED: Added executionId
      taskId: string | null; // 🔧 FIXED: Can be null now
      roleId: string;
      status: string;
      startedAt: Date | null;
      completedAt: Date | null;
      failedAt: Date | null;
      duration: number | null;
      executionData: unknown;
      validationResults: unknown;
      errorDetails: unknown;
      result: string | null;
    };

    return {
      id: typedRecord.id,
      stepId: typedRecord.stepId,
      executionId: typedRecord.executionId, // 🔧 FIXED: Include executionId
      taskId: typedRecord.taskId || undefined, // 🔧 FIXED: Convert null to undefined
      roleId: typedRecord.roleId,
      status: typedRecord.status as StepProgressRecord['status'],
      startedAt: typedRecord.startedAt || undefined,
      completedAt: typedRecord.completedAt || undefined,
      failedAt: typedRecord.failedAt || undefined,
      duration: typedRecord.duration || undefined,
      executionData: safeJsonCast<McpExecutionData>(
        typedRecord.executionData,
      ) || {
        executionType: 'MCP_ONLY',
        phase: 'GUIDANCE_PREPARED',
      },
      validationResults: typedRecord.validationResults,
      errorDetails: typedRecord.errorDetails,
      result: (typedRecord.result as 'SUCCESS' | 'FAILURE') || undefined,
    };
  }

  /**
   * Complete step with comprehensive tracking
   */
  private async completeStepWithTracking(
    stepId: string,
    completionData: StepCompletionData,
  ): Promise<void> {
    try {
      const existing = await this.prisma.workflowStepProgress.findFirst({
        where: { stepId },
        orderBy: { startedAt: 'desc' },
      });

      if (!existing) {
        throw new Error(`No progress record found for step: ${stepId}`);
      }

      const endTime = new Date();
      const duration = endTime.getTime() - (existing.startedAt?.getTime() || 0);

      const executionData = {
        phase: 'completion',
        mcpActionsCompleted: completionData.mcpResults?.length || 0,
        mcpActionsTotal: completionData.mcpResults?.length || 0,
        lastMcpResult: completionData.mcpResults?.[0] || null,
        executionType: 'MCP_ONLY' as const,
        mcpResults: completionData.mcpResults || [],
        totalDuration: completionData.duration,
      };

      await this.prisma.workflowStepProgress.update({
        where: { id: existing.id },
        data: {
          status: 'COMPLETED',
          completedAt: endTime,
          duration,
          executionData: JSON.parse(JSON.stringify(executionData)),
        },
      });
    } catch (error) {
      throw new StepProgressError(
        `Failed to complete step with tracking: ${getErrorMessage(error)}`,
        'StepProgressTrackerService',
        'completeStepWithTracking',
        { stepId },
      );
    }
  }
}
