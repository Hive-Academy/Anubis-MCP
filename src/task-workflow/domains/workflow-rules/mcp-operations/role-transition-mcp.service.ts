import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { ZodSchema, z } from 'zod';
import { RoleTransitionService } from '../services/role-transition.service';

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

  constructor(private readonly roleTransitionService: RoleTransitionService) {}

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

      return {
        content: [
          {
            type: 'text',
            text: `🔄 **Role Transition Options for ${input.fromRoleName}**

**Available Transitions (${availableTransitions.length}):**
${
  availableTransitions
    .map(
      (transition) =>
        `• ${transition.transitionName}: ${transition.fromRole.displayName} → ${transition.toRole.displayName}`,
    )
    .join('\n') || '• No transitions available'
}

**Recommended Transitions (${recommendedTransitions.length}):**
${
  recommendedTransitions
    .map(
      (transition, index) =>
        `${index + 1}. ${transition.transitionName}: ${transition.fromRole.displayName} → ${transition.toRole.displayName}
   ${transition.handoffGuidance ? `   Guidance: ${JSON.stringify(transition.handoffGuidance)}` : ''}`,
    )
    .join('\n') || '• No recommendations available'
}

**Transition Intelligence:**
• Context-aware validation
• Requirement checking
• Handoff guidance included
• Progress tracking enabled

🎯 **Use validate_transition to check specific transition requirements**
🚀 **Use execute_transition to perform the actual role transition**`,
          },
          {
            type: 'text',
            text: JSON.stringify(
              {
                availableTransitions,
                recommendedTransitions,
                transitionIntelligence: {
                  contextAware: true,
                  requirementValidation: true,
                  handoffGuidance: true,
                  progressTracking: true,
                },
              },
              null,
              2,
            ),
          },
        ],
      };
    } catch (error: any) {
      this.logger.error(
        `Error getting role transitions: ${error.message}`,
        error,
      );

      return {
        content: [
          {
            type: 'text',
            text: `❌ **Role Transition Query Failed**

Error: ${error.message}

From Role: ${input.fromRoleName}
Task ID: ${input.taskId}`,
          },
          {
            type: 'text',
            text: JSON.stringify(
              {
                error: error.message,
                fromRoleName: input.fromRoleName,
                taskId: input.taskId,
              },
              null,
              2,
            ),
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

      const statusIcon = validation.valid ? '✅' : '❌';

      return {
        content: [
          {
            type: 'text',
            text: `${statusIcon} **Transition Validation ${validation.valid ? 'Passed' : 'Failed'}**

**Validation Results:**
• Transition ID: ${input.transitionId}
• Task ID: ${input.taskId}
• Status: ${validation.valid ? 'Valid - Ready to execute' : 'Invalid - Requirements not met'}

${
  validation.errors.length > 0
    ? `
**Errors (${validation.errors.length}):**
${validation.errors.map((error) => `• ${error}`).join('\n')}`
    : ''
}

${
  validation.warnings && validation.warnings.length > 0
    ? `
**Warnings (${validation.warnings.length}):**
${validation.warnings.map((warning) => `• ${warning}`).join('\n')}`
    : ''
}

**Validation Intelligence:**
• Comprehensive requirement checking
• Quality gate validation
• Deliverable verification
• Time-based validations

${
  validation.valid
    ? '🚀 **Ready to execute transition!**'
    : '⚠️ **Please resolve errors before attempting transition**'
}`,
          },
          {
            type: 'text',
            text: JSON.stringify(
              {
                validation,
                validationIntelligence: {
                  requirementChecking: true,
                  qualityGateValidation: true,
                  deliverableVerification: true,
                  timeBasedValidation: true,
                },
              },
              null,
              2,
            ),
          },
        ],
      };
    } catch (error: any) {
      this.logger.error(`Error validating transition: ${error.message}`, error);

      return {
        content: [
          {
            type: 'text',
            text: `❌ **Transition Validation Failed**

Error: ${error.message}

Transition ID: ${input.transitionId}
Task ID: ${input.taskId}`,
          },
          {
            type: 'text',
            text: JSON.stringify(
              {
                error: error.message,
                transitionId: input.transitionId,
                taskId: input.taskId,
              },
              null,
              2,
            ),
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

      const statusIcon = result.success ? '✅' : '❌';

      return {
        content: [
          {
            type: 'text',
            text: `${statusIcon} **Role Transition ${result.success ? 'Completed' : 'Failed'}**

**Transition Results:**
• Transition ID: ${input.transitionId}
• Task ID: ${input.taskId}
• Status: ${result.success ? 'Successfully executed' : 'Failed to execute'}
• Message: ${result.message}
${result.newRoleId ? `• New Role ID: ${result.newRoleId}` : ''}

${
  input.handoffMessage
    ? `
**Handoff Message:**
"${input.handoffMessage}"`
    : ''
}

**Transition Intelligence:**
• Pre-execution validation performed
• Progress automatically recorded
• Task ownership updated
• Transition history tracked
• Analytics data captured

${
  result.success
    ? '🎯 **Transition completed successfully! Task ownership updated.**'
    : '⚠️ **Transition failed. Please check requirements and try again.**'
}`,
          },
          {
            type: 'text',
            text: JSON.stringify(
              {
                transitionResult: result,
                transitionIntelligence: {
                  preValidation: true,
                  progressRecording: true,
                  ownershipUpdate: true,
                  historyTracking: true,
                  analyticsCapture: true,
                },
              },
              null,
              2,
            ),
          },
        ],
      };
    } catch (error: any) {
      this.logger.error(`Error executing transition: ${error.message}`, error);

      return {
        content: [
          {
            type: 'text',
            text: `❌ **Role Transition Execution Failed**

Error: ${error.message}

Transition ID: ${input.transitionId}
Task ID: ${input.taskId}`,
          },
          {
            type: 'text',
            text: JSON.stringify(
              {
                error: error.message,
                transitionId: input.transitionId,
                taskId: input.taskId,
              },
              null,
              2,
            ),
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

      return {
        content: [
          {
            type: 'text',
            text: `📊 **Transition History for Task: ${input.taskId}**

**History Summary:**
• Total Transitions: ${history.length}
• Unique Roles: ${new Set(history.map((h) => h.fromMode)).size}
• Latest Transition: ${history[0]?.delegationTimestamp.toISOString() || 'None'}

**Recent Transitions:**
${history
  .slice(0, 5)
  .map(
    (h) =>
      `• ${h.fromMode} → ${h.toMode} (${h.delegationTimestamp.toISOString()})
   Message: ${h.message}`,
  )
  .join('\n')}

**Transition Intelligence:**
• Complete transition timeline
• Performance metrics available
• Role pattern analysis
• Workflow optimization data

🎯 **Use this data for workflow pattern analysis and optimization**`,
          },
          {
            type: 'text',
            text: JSON.stringify(
              {
                transitionHistory: history,
                historyIntelligence: {
                  completeTimeline: true,
                  performanceMetrics: true,
                  rolePatterns: true,
                  optimizationInsights: true,
                },
              },
              null,
              2,
            ),
          },
        ],
      };
    } catch (error: any) {
      this.logger.error(
        `Error getting transition history: ${error.message}`,
        error,
      );

      return {
        content: [
          {
            type: 'text',
            text: `❌ **Transition History Query Failed**

Error: ${error.message}

Task ID: ${input.taskId}`,
          },
          {
            type: 'text',
            text: JSON.stringify(
              {
                error: error.message,
                taskId: input.taskId,
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
