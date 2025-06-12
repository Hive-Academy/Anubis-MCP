import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { ZodSchema, z } from 'zod';
import { RoleTransitionService } from '../services/role-transition.service';
import { EnvelopeBuilderService } from '../../../utils/envelope-builder';
import { shouldIncludeDebugInfo } from '../../../config/mcp-response.config';

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

@Injectable()
export class RoleTransitionMcpService {
  private readonly logger = new Logger(RoleTransitionMcpService.name);

  constructor(
    private readonly roleTransitionService: RoleTransitionService,
    private readonly envelopeBuilder: EnvelopeBuilderService,
  ) {}

  @Tool({
    name: 'get_role_transitions',
    description: `Get available role transitions with intelligent recommendations.

**INTELLIGENT ROLE TRANSITION MANAGEMENT**

✅ **Available Transitions** - Context-aware transition options
✅ **Validation Rules** - Automatic validation of transition requirements
✅ **Recommendation Engine** - AI-powered transition recommendations
✅ **Handoff Guidance** - Intelligent handoff instructions
✅ **Progress Tracking** - Transition history and analytics

**FEATURES:**
• Lists all valid transitions for current role
• Validates transition requirements
• Provides recommendation scores
• Includes handoff guidance
• Tracks transition patterns`,
    parameters:
      GetRoleTransitionsInputSchema as ZodSchema<GetRoleTransitionsInput>,
  })
  async getRoleTransitions(input: GetRoleTransitionsInput): Promise<any> {
    try {
      this.logger.log(
        `Getting role transitions for: ${input.fromRoleName}, task: ${input.taskId}`,
      );

      const context = {
        taskId: input.taskId,
        roleId: input.roleId,
      };

      const [availableTransitions, recommendedTransitions] = await Promise.all([
        this.roleTransitionService.getAvailableTransitions(
          input.fromRoleName,
          context,
        ),
        this.roleTransitionService.getRecommendedTransitions(
          input.fromRoleName,
          context,
        ),
      ]);

      // 🎯 BUILD TRANSITION ENVELOPE (FIXED: Eliminated duplication)
      const transitionResult = {
        availableTransitions,
        recommendedTransitions,
        // REMOVED: transitions array (eliminates duplication)
        totalCount: availableTransitions.length + recommendedTransitions.length,
      };

      const envelopeContext = {
        taskId: input.taskId,
        roleId: input.roleId,
      };

      const envelope = this.envelopeBuilder.buildTransitionEnvelope(
        transitionResult,
        envelopeContext,
      );

      const response = {
        content: [
          {
            type: 'text',
            text: JSON.stringify(envelope, null, 2),
          },
        ],
      };

      // Add verbose data if requested (FIXED: Eliminated duplication)
      if (shouldIncludeDebugInfo()) {
        response.content.push({
          type: 'text',
          text: JSON.stringify(
            {
              debug: {
                // ONLY include data NOT in main response
                processingTime: Date.now(),
                totalTransitions: transitionResult.totalCount,
                // REMOVED: availableTransitions, recommendedTransitions (already in main response)
              },
            },
            null,
            2,
          ),
        });
      }

      return response;
    } catch (error: any) {
      this.logger.error(
        `Error getting role transitions: ${error.message}`,
        error,
      );

      const errorEnvelope = {
        taskId: input.taskId,
        fromRoleName: input.fromRoleName,
        success: false,
        error: {
          message: error.message,
          code: 'TRANSITION_QUERY_ERROR',
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      };

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(errorEnvelope, null, 2),
          },
        ],
      };
    }
  }

  @Tool({
    name: 'validate_transition',
    description: `Validate if a role transition can be performed with detailed requirement checking.

**INTELLIGENT TRANSITION VALIDATION**

✅ **Requirement Checking** - Validates all transition prerequisites
✅ **Condition Evaluation** - Checks step completion and task status
✅ **Quality Gates** - Validates quality requirements
✅ **Deliverable Verification** - Checks required deliverables
✅ **Warning System** - Provides warnings for potential issues

**FEATURES:**
• Comprehensive requirement validation
• Detailed error and warning reporting
• Quality gate verification
• Deliverable checking
• Time-based validations`,
    parameters:
      ValidateTransitionInputSchema as ZodSchema<ValidateTransitionInput>,
  })
  async validateTransition(input: ValidateTransitionInput): Promise<any> {
    try {
      this.logger.log(
        `Validating transition: ${input.transitionId} for task: ${input.taskId}`,
      );

      const context = {
        taskId: input.taskId,
        roleId: input.roleId,
      };

      const validation = await this.roleTransitionService.validateTransition(
        input.transitionId,
        context,
      );

      // 🎯 BUILD VALIDATION ENVELOPE
      const validationResult = {
        valid: validation.valid,
        validation: {
          status: validation.valid ? 'passed' : 'failed',
          errors: validation.errors,
          warnings: validation.warnings || [],
        },
        transitionId: input.transitionId,
      };

      const envelopeContext = {
        taskId: input.taskId,
        roleId: input.roleId,
      };

      const envelope = this.envelopeBuilder.buildTransitionEnvelope(
        validationResult,
        envelopeContext,
      );

      const response: {
        content: Array<{ type: 'text'; text: string }>;
      } = {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(envelope, null, 2),
          },
        ],
      };

      // Add verbose data if requested (FIXED: Eliminated duplication)
      if (shouldIncludeDebugInfo()) {
        response.content.push({
          type: 'text' as const,
          text: JSON.stringify(
            {
              debug: {
                // ONLY include data NOT in main response
                processingTime: Date.now(),
                validationChecks: validation.errors?.length || 0,
                // REMOVED: rawValidation (already in main response)
              },
            },
            null,
            2,
          ),
        });
      }

      return response;
    } catch (error: any) {
      this.logger.error(`Error validating transition: ${error.message}`, error);

      const errorEnvelope = {
        taskId: input.taskId,
        transitionId: input.transitionId,
        valid: false,
        error: {
          message: error.message,
          code: 'VALIDATION_ERROR',
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      };

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(errorEnvelope, null, 2),
          },
        ],
      };
    }
  }

  @Tool({
    name: 'execute_transition',
    description: `Execute a role transition with intelligent handoff and progress tracking.

**INTELLIGENT ROLE TRANSITION EXECUTION**

✅ **Validation First** - Automatic validation before execution
✅ **Handoff Management** - Intelligent handoff message handling
✅ **Progress Recording** - Automatic transition recording
✅ **Ownership Update** - Task ownership management
✅ **Analytics Integration** - Transition analytics and insights

**FEATURES:**
• Pre-execution validation
• Intelligent handoff processing
• Automatic progress recording
• Task ownership updates
• Transition history tracking`,
    parameters:
      ExecuteTransitionInputSchema as ZodSchema<ExecuteTransitionInput>,
  })
  async executeTransition(input: ExecuteTransitionInput): Promise<any> {
    try {
      this.logger.log(
        `Executing transition: ${input.transitionId} for task: ${input.taskId}`,
      );

      const context = {
        taskId: input.taskId,
        roleId: input.roleId,
      };

      const result = await this.roleTransitionService.executeTransition(
        input.transitionId,
        context,
        input.handoffMessage,
      );

      // 🎯 BUILD EXECUTION ENVELOPE
      const executionResult = {
        success: result.success,
        transitionResult: {
          status: result.success ? 'completed' : 'failed',
          message: result.message,
          newRoleId: result.newRoleId,
          handoffMessage: input.handoffMessage,
        },
        transitionId: input.transitionId,
      };

      const envelopeContext = {
        taskId: input.taskId,
        roleId: input.roleId,
      };

      const envelope = this.envelopeBuilder.buildTransitionEnvelope(
        executionResult,
        envelopeContext,
      );

      const response: {
        content: Array<{ type: 'text'; text: string }>;
      } = {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(envelope, null, 2),
          },
        ],
      };

      // Add verbose data if requested
      if (shouldIncludeDebugInfo()) {
        response.content.push({
          type: 'text' as const,
          text: JSON.stringify({ debug: { rawResult: result } }, null, 2),
        });
      }

      return response;
    } catch (error: any) {
      this.logger.error(`Error executing transition: ${error.message}`, error);

      const errorEnvelope = {
        taskId: input.taskId,
        transitionId: input.transitionId,
        success: false,
        error: {
          message: error.message,
          code: 'TRANSITION_EXECUTION_ERROR',
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      };

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(errorEnvelope, null, 2),
          },
        ],
      };
    }
  }

  @Tool({
    name: 'get_transition_history',
    description: `Get transition history for a task with detailed analytics.

**TRANSITION HISTORY ANALYTICS**

✅ **Complete History** - Full transition timeline
✅ **Performance Metrics** - Transition timing and patterns
✅ **Role Analytics** - Role-specific transition data
✅ **Pattern Detection** - Workflow pattern analysis
✅ **Optimization Insights** - Recommendations for improvement

**FEATURES:**
• Complete transition timeline
• Performance and timing analytics
• Role-specific transition patterns
• Workflow optimization insights`,
    parameters:
      GetTransitionHistoryInputSchema as ZodSchema<GetTransitionHistoryInput>,
  })
  async getTransitionHistory(input: GetTransitionHistoryInput): Promise<any> {
    try {
      this.logger.log(`Getting transition history for task: ${input.taskId}`);

      const history = await this.roleTransitionService.getTransitionHistory(
        input.taskId,
      );

      // 🎯 BUILD HISTORY ENVELOPE
      const historyResult = {
        historySummary: {
          totalTransitions: history.length,
          uniqueRoles: new Set(history.map((h) => h.fromMode)).size,
          latestTransition:
            history[0]?.delegationTimestamp.toISOString() || null,
        },
        recentTransitions: history.slice(0, 5).map((h) => ({
          fromRole: h.fromMode,
          toRole: h.toMode,
          timestamp: h.delegationTimestamp.toISOString(),
          message: h.message,
        })),
      };

      const envelopeContext = {
        taskId: input.taskId,
        roleId: 'system', // No specific role for history queries
      };

      const envelope = this.envelopeBuilder.buildTransitionEnvelope(
        historyResult,
        envelopeContext,
      );

      const response: {
        content: Array<{ type: 'text'; text: string }>;
      } = {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(envelope, null, 2),
          },
        ],
      };

      // Add verbose data if requested
      if (shouldIncludeDebugInfo()) {
        response.content.push({
          type: 'text' as const,
          text: JSON.stringify({ debug: { rawHistory: history } }, null, 2),
        });
      }

      return response;
    } catch (error: any) {
      this.logger.error(
        `Error getting transition history: ${error.message}`,
        error,
      );

      const errorEnvelope = {
        taskId: input.taskId,
        success: false,
        error: {
          message: error.message,
          code: 'HISTORY_QUERY_ERROR',
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      };

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(errorEnvelope, null, 2),
          },
        ],
      };
    }
  }
}
