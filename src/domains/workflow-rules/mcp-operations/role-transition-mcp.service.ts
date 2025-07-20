import { Injectable } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { ZodSchema, z } from 'zod';
import { RoleTransitionService } from '../services/role-transition.service';
import { WorkflowContextCacheService } from '../services/workflow-context-cache.service';
import { BaseMcpService } from '../utils/mcp-response.utils';
import { getErrorMessage } from '../utils/type-safety.utils';
import { AutoWorkflowValidation } from '../utils/dynamic-workflow-validation.util';

// ===================================================================
// 🔥 ROLE TRANSITION MCP SERVICE - COMPLETE REVAMP FOR MINIMAL RESPONSES
// ===================================================================
// Purpose: Clean role transition interface with minimal responses
// Scope: Role transitions + validation + execution + history
// ZERO Envelope Usage: Eliminated EnvelopeBuilderService dependency
// Pattern: Apply minimal response building like our other fixed tools

const GetRoleTransitionsInputSchema = z.object({
  fromRoleName: z
    .enum(['product-manager', 'architect', 'senior-developer', 'code-review'])
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
type GetRoleTransitionsInput = z.infer<typeof GetRoleTransitionsInputSchema>;
type ValidateTransitionInput = z.infer<typeof ValidateTransitionInputSchema>;
type ExecuteTransitionInput = z.infer<typeof ExecuteTransitionInputSchema>;

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
  constructor(
    private readonly roleTransitionService: RoleTransitionService,
    private readonly workflowContextCache: WorkflowContextCacheService,
  ) {
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
  @AutoWorkflowValidation(GetRoleTransitionsInputSchema, 'get_role_transitions')
  async getRoleTransitions(input: GetRoleTransitionsInput) {
    try {
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

      // Combine and prioritize transitions to eliminate redundancy
      const recommendedIds = new Set(recommendedTransitions.map((t) => t.id));
      const transitions = [
        ...recommendedTransitions.map((t) => ({
          transitionId: t.id,
          transitionName: t.transitionName,
          toRole: t.toRole.name,
          recommended: true,
          score: (t as any).recommendationScore || 0.95,
        })),
        ...availableTransitions
          .filter((t) => !recommendedIds.has(t.id))
          .map((t) => ({
            transitionId: t.id,
            transitionName: t.transitionName,
            toRole: t.toRole.name,
            recommended: false,
            score: 0.5,
          })),
      ];

      return this.buildResponse({
        transitions,
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
  @AutoWorkflowValidation(ValidateTransitionInputSchema, 'validate_transition')
  async validateTransition(input: ValidateTransitionInput) {
    try {
      const context = {
        taskId: input.taskId.toString(),
        roleId: input.roleId,
      };

      const validation = await this.roleTransitionService.validateTransition(
        input.transitionId,
        context,
      );

      // ✅ MINIMAL RESPONSE: Only essential validation data
      return this.buildResponse({
        transitionId: input.transitionId,
        valid: validation.valid,
        status: validation.valid ? 'passed' : 'failed',
        issues: validation.errors || [],
        warnings: validation.warnings || [],
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
  @AutoWorkflowValidation(ExecuteTransitionInputSchema, 'execute_transition')
  async executeTransition(input: ExecuteTransitionInput) {
    try {
      const context = {
        taskId: input.taskId.toString(),
        roleId: input.roleId,
      };

      const result = await this.roleTransitionService.executeTransition(
        input.transitionId,
        context,
        input.handoffMessage,
      );

      // 🧠 UPDATE WORKFLOW CONTEXT CACHE
      // Store latest workflow state after successful transition
      if (result.success && result.newRoleId) {
        try {
          // Try to find existing cache entry to update
          const existingContext = this.workflowContextCache.findContextByTaskId(
            input.taskId,
          );

          const cacheKey = existingContext
            ? WorkflowContextCacheService.generateKey(
                existingContext.executionId,
                'transition',
              )
            : WorkflowContextCacheService.generateKey(
                `task-${input.taskId}`,
                'transition',
              );

          this.workflowContextCache.updateContext(cacheKey, {
            currentRoleId: result.newRoleId,
          });
        } catch (_cacheError) {
          // Don't fail transition if cache update fails
        }
      }

      // ✅ MINIMAL RESPONSE: Only essential execution data
      return this.buildResponse({
        transitionId: input.transitionId,
        success: result.success,
        status: result.success ? 'completed' : 'failed',
        message: result.message,
        newRoleId: result.newRoleId,
      });
    } catch (error) {
      return this.buildErrorResponse(
        'Failed to execute transition',
        getErrorMessage(error),
        'TRANSITION_EXECUTION_ERROR',
      );
    }
  }
}
