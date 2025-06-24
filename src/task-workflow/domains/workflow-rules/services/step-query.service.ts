import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';

// ===================================================================
// 🔥 STEP QUERY SERVICE - ENHANCED WITH ROLE TRANSITION AWARENESS
// ===================================================================
// Purpose: Query workflow steps with MCP execution data and role transition support
// Scope: MCP-focused step retrieval, progress queries, and transition-aware step management
// Schema: Aligned with streamlined schema structure
// CRITICAL FIX: Enhanced to handle post-transition state and role context synchronization

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

export interface PostTransitionState {
  isPostTransition: boolean;
  assignedStep: WorkflowStep | null;
  executionState: any;
  transitionTimestamp?: string;
  newRoleId?: string;
}

export interface StepQueryOptions {
  checkTransitionState?: boolean;
  validateContext?: boolean;
  includeTransitionInfo?: boolean;
}

/**
 * 🚀 ENHANCED: StepQueryService with Role Transition Awareness
 *
 * CRITICAL FIXES IMPLEMENTED:
 * - Added post-transition state detection to prevent null currentStepId issues
 * - Enhanced getNextAvailableStep to handle role transition context properly
 * - Added role-aware step progression logic for seamless transitions
 * - Implemented state validation and recovery mechanisms
 * - Added transition context support throughout step queries
 */
@Injectable()
export class StepQueryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get next available step for execution - ENHANCED with transition awareness
   *
   * CRITICAL FIX: Now properly handles post-transition state where currentStepId
   * might be null but execution state contains the assigned step for new role
   */
  async getNextAvailableStep(
    taskId: string,
    roleId: string,
    options: StepQueryOptions = { checkTransitionState: true },
  ): Promise<WorkflowStep | null> {
    try {
      console.log(
        `🔍 getNextAvailableStep called: taskId=${taskId}, roleId=${roleId}`,
      );

      // 🔧 CRITICAL FIX: Check for post-transition state first
      if (options.checkTransitionState) {
        const transitionState = await this.checkPostTransitionState(
          taskId,
          roleId,
        );

        if (transitionState.isPostTransition && transitionState.assignedStep) {
          // Don't return current step - we need the NEXT step after the assigned step
          console.log(
            `🔄 Post-transition detected: current step is ${transitionState.assignedStep.name} (seq: ${transitionState.assignedStep.sequenceNumber})`,
          );

          // Get NEXT step after the assigned current step
          const nextStep = await this.prisma.workflowStep.findFirst({
            where: {
              roleId,
              sequenceNumber: {
                gt: transitionState.assignedStep.sequenceNumber,
              },
            },
            orderBy: { sequenceNumber: 'asc' },
          });

          if (nextStep) {
            console.log(
              `➡️ Next step after transition: ${nextStep.name} (seq: ${nextStep.sequenceNumber})`,
            );
            return nextStep;
          } else {
            console.log(
              `🏁 No more steps after ${transitionState.assignedStep.name} in role ${roleId}`,
            );
            return null;
          }
        }
      }

      // Get the current execution state
      console.log(`📋 Getting execution for taskId: ${taskId}`);
      const execution = await this.prisma.workflowExecution.findFirst({
        where: { taskId: parseInt(taskId) },
        include: {
          currentStep: true,
          currentRole: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!execution) {
        console.log(`❌ No execution found for taskId: ${taskId}`);
        // No execution found, return first step for role
        return this.getFirstStepForRole(roleId);
      }

      console.log(
        `📋 Execution found: currentStepId=${execution.currentStepId}, currentRoleId=${execution.currentRoleId}`,
      );

      // 🔧 CRITICAL FIX: Validate role matches
      if (execution.currentRoleId !== roleId) {
        console.log(
          `⚠️ Role mismatch: execution has ${execution.currentRoleId}, requested ${roleId}`,
        );
        // Role mismatch - return first step for the requested role
        return this.getFirstStepForRole(roleId);
      }

      // 🔧 CRITICAL FIX: Handle null currentStep after transitions
      if (!execution.currentStep) {
        console.log(`❌ No currentStep in execution`);
        // Check if execution state has currentStep info from transition
        const executionState = execution.executionState as any;
        if (executionState?.currentStep?.id) {
          console.log(
            `🔍 Checking execution state for step: ${executionState.currentStep.id}`,
          );
          // Validate the step exists and belongs to current role
          const stepFromState = await this.prisma.workflowStep.findUnique({
            where: { id: executionState.currentStep.id },
          });

          if (stepFromState && stepFromState.roleId === roleId) {
            console.log(
              `✅ Found step from execution state: ${stepFromState.name}`,
            );
            return stepFromState;
          }
        }

        // Fallback: return first step for current role
        console.log(`🔄 Fallback: getting first step for role ${roleId}`);
        return this.getFirstStepForRole(roleId);
      }

      // Standard logic: get next step in sequence for this role
      console.log(
        `📋 Standard logic: looking for next step after sequence ${execution.currentStep.sequenceNumber} for role ${roleId}`,
      );
      const nextStep = await this.prisma.workflowStep.findFirst({
        where: {
          roleId,
          sequenceNumber: { gt: execution.currentStep.sequenceNumber },
        },
        orderBy: { sequenceNumber: 'asc' },
      });

      if (nextStep) {
        console.log(
          `✅ Found next step: ${nextStep.name} (seq: ${nextStep.sequenceNumber})`,
        );
      } else {
        console.log(
          `🏁 No next step found after sequence ${execution.currentStep.sequenceNumber} for role ${roleId}`,
        );
      }

      return nextStep;
    } catch (error) {
      console.error('❌ Error in getNextAvailableStep:', error);
      // Fallback: return first step for role
      return this.getFirstStepForRole(roleId);
    }
  }

  /**
   * 🔥 FIXED: Check for post-transition state - DATA-DRIVEN, NO TIME-BASED CHECKS
   *
   * Detects when we're in a post-transition state using execution phase and state consistency,
   * relying on proper workflow execution state from our transition service
   */
  async checkPostTransitionState(
    taskId: string,
    roleId: string,
  ): Promise<PostTransitionState> {
    try {
      const execution = await this.prisma.workflowExecution.findFirst({
        where: { taskId: parseInt(taskId) },
        include: {
          currentStep: true,
          currentRole: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!execution) {
        return {
          isPostTransition: false,
          assignedStep: null,
          executionState: null,
        };
      }

      const executionState = execution.executionState as any;

      // 🔥 DATA-DRIVEN DETECTION: Use execution state phase set by transition service
      const isPostTransition = this.detectPostTransitionFromState(
        execution,
        executionState,
        roleId,
      );

      let assignedStep: WorkflowStep | null = null;

      if (isPostTransition && executionState?.currentStep?.id) {
        // Get the step from execution state (set by transition service)
        assignedStep = await this.prisma.workflowStep.findUnique({
          where: { id: executionState.currentStep.id },
        });

        // Validate step belongs to current role
        if (assignedStep && assignedStep.roleId !== roleId) {
          console.log(
            `⚠️ Step ${assignedStep.name} belongs to role ${assignedStep.roleId}, not ${roleId}`,
          );
          assignedStep = null;
        }
      }

      console.log(
        `🔍 Post-transition check: isPostTransition=${isPostTransition}, assignedStep=${assignedStep?.name || 'null'}`,
      );

      return {
        isPostTransition,
        assignedStep,
        executionState,
        transitionTimestamp: executionState?.lastTransition?.timestamp,
        newRoleId: executionState?.lastTransition?.newRoleId,
      };
    } catch (error) {
      console.error('Error checking post-transition state:', error);
      return {
        isPostTransition: false,
        assignedStep: null,
        executionState: null,
      };
    }
  }

  /**
   * 🔥 COMPLETELY REWRITTEN: Data-driven post-transition detection
   *
   * Uses reliable execution state indicators set by our transition service:
   * 1. Execution phase is "role_transitioned"
   * 2. Current role in execution matches requested roleId
   * 3. Execution state has currentStep assigned by transition service
   * 4. Last transition indicates successful role change
   *
   * NO TIME-BASED CHECKS - PURELY DATA-DRIVEN
   */
  private detectPostTransitionFromState(
    execution: any,
    executionState: any,
    roleId: string,
  ): boolean {
    // Primary indicator: Execution phase explicitly states role transition
    // This is set by our RoleTransitionService after successful transition
    if (executionState?.phase === 'role_transitioned') {
      console.log(
        '🔄 Post-transition detected: execution phase = role_transitioned',
      );

      // Validate this transition was to the requested role
      if (execution.currentRoleId === roleId) {
        console.log(
          `✅ Role transition confirmed: current role matches requested role ${roleId}`,
        );
        return true;
      } else {
        console.log(
          `❌ Role mismatch: execution has ${execution.currentRoleId}, requested ${roleId}`,
        );
        return false;
      }
    }

    // Secondary indicator: Recent transition to this role with step assignment
    // but execution hasn't been updated yet (state synchronization gap)
    if (
      executionState?.lastTransition?.newRoleId === roleId &&
      execution.currentRoleId === roleId &&
      executionState?.currentStep?.id &&
      !execution.currentStepId
    ) {
      console.log(
        '🔄 Post-transition detected: role assigned but step not synchronized in DB',
      );
      return true;
    }

    // Tertiary indicator: Role transition completed but phase not cleared
    // This handles edge cases where phase wasn't reset after step assignment
    if (
      executionState?.lastTransition?.newRoleId === roleId &&
      execution.currentRoleId === roleId &&
      executionState?.currentStep?.assignedAt
    ) {
      console.log(
        '🔄 Post-transition detected: role and step assigned via transition',
      );
      return true;
    }

    console.log(`ℹ️ No post-transition state detected for role ${roleId}`);
    return false;
  }

  /**
   * 🆕 NEW: Get first step for a role
   *
   * Helper method to get the first step in sequence for a given role
   */
  async getFirstStepForRole(roleId: string): Promise<WorkflowStep | null> {
    return this.prisma.workflowStep.findFirst({
      where: { roleId },
      orderBy: { sequenceNumber: 'asc' },
    });
  }

  /**
   * Get next step after completing current step - ENHANCED with role validation
   */
  async getNextStepAfterCompletion(
    currentStepId: string,
  ): Promise<WorkflowStep | null> {
    const currentStep = await this.prisma.workflowStep.findUnique({
      where: { id: currentStepId },
      select: { sequenceNumber: true, roleId: true },
    });

    if (!currentStep) return null;

    // Get next step in sequence for the SAME role
    const nextStep = await this.prisma.workflowStep.findFirst({
      where: {
        roleId: currentStep.roleId,
        sequenceNumber: { gt: currentStep.sequenceNumber },
      },
      orderBy: { sequenceNumber: 'asc' },
    });

    return nextStep;
  }

  /**
   * 🆕 NEW: Validate and sync execution state after role transitions
   *
   * Ensures execution state is consistent and recovers from state mismatches
   */
  async validateAndSyncExecutionState(
    taskId: string,
    roleId: string,
  ): Promise<{
    isValid: boolean;
    corrected: boolean;
    currentStep: WorkflowStep | null;
  }> {
    try {
      const execution = await this.prisma.workflowExecution.findFirst({
        where: { taskId: parseInt(taskId) },
        include: {
          currentStep: true,
          currentRole: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!execution) {
        return { isValid: false, corrected: false, currentStep: null };
      }

      const executionState = execution.executionState as any;
      let isValid = true;
      let corrected = false;
      let currentStep: WorkflowStep | null = null;

      // Check if currentStepId is null but execution state has step info
      if (!execution.currentStepId && executionState?.currentStep?.id) {
        const stepFromState = await this.prisma.workflowStep.findUnique({
          where: { id: executionState.currentStep.id },
        });

        if (stepFromState && stepFromState.roleId === roleId) {
          // Sync the currentStepId with execution state
          await this.prisma.workflowExecution.update({
            where: { id: execution.id },
            data: { currentStepId: stepFromState.id },
          });

          currentStep = stepFromState;
          corrected = true;
          isValid = true;
        } else {
          isValid = false;
        }
      } else if (execution.currentStepId) {
        currentStep = await this.prisma.workflowStep.findUnique({
          where: { id: execution.currentStepId },
        });

        if (!currentStep || currentStep.roleId !== roleId) {
          isValid = false;
        }
      } else {
        isValid = false;
      }

      return { isValid, corrected, currentStep };
    } catch (error) {
      console.error('Error validating execution state:', error);
      return { isValid: false, corrected: false, currentStep: null };
    }
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
