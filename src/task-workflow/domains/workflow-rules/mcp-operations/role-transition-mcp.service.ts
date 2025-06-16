import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { ZodSchema, z } from 'zod';
import { RoleTransitionService } from '../services/role-transition.service';
import { getErrorMessage } from '../utils/type-safety.utils';
import { BaseMcpService } from '../utils/mcp-response.utils';

// ===================================================================
// 🔥 ROLE TRANSITION MCP SERVICE - COMPLETE REVAMP FOR MINIMAL RESPONSES
// ===================================================================
// Purpose: Clean role transition interface with minimal responses
// Scope: Role transitions + validation + execution + history
// ZERO Envelope Usage: Eliminated EnvelopeBuilderService dependency
// Pattern: Apply minimal response building like our other fixed tools

const GetRoleTransitionsInputSchema = z.object({
  fromRoleName: z
    .enum([
      'boomerang',
      'researcher',
      'architect',
      'senior-developer',
      'code-review',
    ])
    .describe('Current role name'),
  taskId: z.number().describe('Task ID for transition context'),
  roleId: z.string().describe('Role ID for transition context'),
});

const ValidateTransitionInputSchema = z.object({
  transitionId: z.string().describe('Transition ID to validate'),
  taskId: z.number().describe('Task ID for validation context'),
  roleId: z.string().describe('Role ID for validation context'),
});

const ExecuteTransitionInputSchema = z.object({
  transitionId: z.string().describe('Transition ID to execute'),
  taskId: z.number().describe('Task ID for transition context'),
  roleId: z.string().describe('Role ID for transition context'),
  handoffMessage: z.string().optional().describe('Optional handoff message'),
});

const GetTransitionHistoryInputSchema = z.object({
  taskId: z.number().describe('Task ID for transition history'),
});

type GetRoleTransitionsInput = z.infer<typeof GetRoleTransitionsInputSchema>;
type ValidateTransitionInput = z.infer<typeof ValidateTransitionInputSchema>;
type ExecuteTransitionInput = z.infer<typeof ExecuteTransitionInputSchema>;
type GetTransitionHistoryInput = z.infer<
  typeof GetTransitionHistoryInputSchema
>;

/**
 * 🚀 REVAMPED: RoleTransitionMcpService
 *
 * COMPLETE OVERHAUL FOR MINIMAL RESPONSES:
 * - Eliminated EnvelopeBuilderService dependency
 * - Removed complex envelope building (4x reduction in response size)
 * - Applied minimal response pattern from other fixed tools
 * - Reduced dependencies from 2 to 1 (essential service only)
 * - Removed shouldIncludeDebugInfo() redundant patterns
 * - Simplified error handling with consistent responses
 * - Extends BaseMcpService for consistent response building
 */
@Injectable()
export class RoleTransitionMcpService extends BaseMcpService {
  private readonly logger = new Logger(RoleTransitionMcpService.name);

  constructor(private readonly roleTransitionService: RoleTransitionService) {
    super();
  }

  // ===================================================================
  // ✅ ROLE TRANSITION DISCOVERY - Minimal focused responses
  // ===================================================================

  @Tool({
    name: 'get_role_transitions',
    description: `Gets available role transitions with recommendations, scores, and basic requirements for workflow progression.`,
    parameters:
      GetRoleTransitionsInputSchema as ZodSchema<GetRoleTransitionsInput>,
  })
  async getRoleTransitions(input: GetRoleTransitionsInput) {
    try {
      this.logger.log(
        `Getting role transitions for: ${input.fromRoleName}, task: ${input.taskId}`,
      );

      const context = {
        taskId: input.taskId.toString(),
        roleId: input.roleId,
        projectPath: process.cwd(),
      };

      const [availableTransitions, recommendedTransitions] = await Promise.all([
        this.roleTransitionService.getAvailableTransitions(input.fromRoleName),
        this.roleTransitionService.getRecommendedTransitions(
          input.fromRoleName,
          context,
        ),
      ]);

      // ✅ MINIMAL RESPONSE: Only essential transition data
      return this.buildMinimalResponse({
        fromRole: input.fromRoleName,
        availableTransitions: availableTransitions.map((t) => ({
          transitionId: t.id,
          transitionName: t.transitionName,
          toRole: t.toRole.name,
          toRoleDisplay: t.toRole.displayName,
        })),
        recommendedTransitions: recommendedTransitions.map((t) => ({
          transitionId: t.id,
          transitionName: t.transitionName,
          toRole: t.toRole.name,
          toRoleDisplay: t.toRole.displayName,
          score: (t as any).recommendationScore || 0,
        })),
        // ❌ REMOVED: nextAction (hardcoded flow control)
      });
    } catch (error) {
      return this.buildErrorResponse(
        'Failed to get role transitions',
        getErrorMessage(error),
        'TRANSITION_QUERY_ERROR',
      );
    }
  }

  // ===================================================================
  // ✅ TRANSITION VALIDATION - Focused validation results
  // ===================================================================

  @Tool({
    name: 'validate_transition',
    description: `Validates role transition requirements and provides pass/fail status with actionable feedback.`,
    parameters:
      ValidateTransitionInputSchema as ZodSchema<ValidateTransitionInput>,
  })
  async validateTransition(input: ValidateTransitionInput) {
    try {
      this.logger.log(
        `Validating transition: ${input.transitionId} for task: ${input.taskId}`,
      );

      const context = {
        taskId: input.taskId.toString(),
        roleId: input.roleId,
      };

      const validation = await this.roleTransitionService.validateTransition(
        input.transitionId,
        context,
      );

      // ✅ MINIMAL RESPONSE: Only essential validation data
      return this.buildMinimalResponse({
        transitionId: input.transitionId,
        valid: validation.valid,
        status: validation.valid ? 'passed' : 'failed',
        issues: validation.errors || [],
        warnings: validation.warnings || [],
        // ❌ REMOVED: nextAction (hardcoded flow control)
      });
    } catch (error) {
      return this.buildErrorResponse(
        'Failed to validate transition',
        getErrorMessage(error),
        'VALIDATION_ERROR',
      );
    }
  }

  // ===================================================================
  // ✅ TRANSITION EXECUTION - Focused execution results
  // ===================================================================

  @Tool({
    name: 'execute_transition',
    description: `Executes role transition and returns execution status with essential details for next steps.`,
    parameters:
      ExecuteTransitionInputSchema as ZodSchema<ExecuteTransitionInput>,
  })
  async executeTransition(input: ExecuteTransitionInput) {
    try {
      this.logger.log(
        `Executing transition: ${input.transitionId} for task: ${input.taskId}`,
      );

      const context = {
        taskId: input.taskId.toString(),
        roleId: input.roleId,
      };

      const result = await this.roleTransitionService.executeTransition(
        input.transitionId,
        context,
        input.handoffMessage,
      );

      // ✅ MINIMAL RESPONSE: Only essential execution data
      return this.buildMinimalResponse({
        transitionId: input.transitionId,
        success: result.success,
        status: result.success ? 'completed' : 'failed',
        message: result.message,
        newRole: result.newRoleId,
        handoffMessage: input.handoffMessage,
        // ❌ REMOVED: nextAction (hardcoded flow control)
      });
    } catch (error) {
      return this.buildErrorResponse(
        'Failed to execute transition',
        getErrorMessage(error),
        'TRANSITION_EXECUTION_ERROR',
      );
    }
  }

  // ===================================================================
  // ✅ TRANSITION HISTORY - Focused history summary
  // ===================================================================

  @Tool({
    name: 'get_transition_history',
    description: `Retrieves transition history with timeline overview and basic statistics for task context.`,
    parameters:
      GetTransitionHistoryInputSchema as ZodSchema<GetTransitionHistoryInput>,
  })
  async getTransitionHistory(input: GetTransitionHistoryInput) {
    try {
      this.logger.log(`Getting transition history for task: ${input.taskId}`);

      const history = await this.roleTransitionService.getTransitionHistory(
        input.taskId,
      );

      // ✅ MINIMAL RESPONSE: Only essential history data
      return this.buildMinimalResponse({
        taskId: input.taskId,
        summary: {
          totalTransitions: history.length,
          uniqueRoles: new Set(history.map((h) => h.fromMode)).size,
          latestTransition:
            history[0]?.delegationTimestamp.toISOString() || null,
        },
        recentTransitions: history.slice(0, 3).map((h) => ({
          fromRole: h.fromMode,
          toRole: h.toMode,
          timestamp: h.delegationTimestamp.toISOString(),
          message: h.message,
        })),
        // ❌ REMOVED: nextAction (hardcoded flow control)
      });
    } catch (error) {
      return this.buildErrorResponse(
        'Failed to get transition history',
        getErrorMessage(error),
        'HISTORY_QUERY_ERROR',
      );
    }
  }

  // ===================================================================
  // 🔧 PRIVATE HELPER METHODS - Using inherited response builders
  // ===================================================================
}
