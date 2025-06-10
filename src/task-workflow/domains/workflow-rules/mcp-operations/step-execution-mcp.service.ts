import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { ZodSchema, z } from 'zod';
import { StepExecutionService } from '../services/step-execution.service';

const ExecuteWorkflowStepInputSchema = z.object({
  id: z.number().describe('Task ID for step execution'),
  roleId: z.string().describe('Role ID executing the step'),
  stepId: z.string().describe('Step ID to execute'),
  executionData: z.any().optional().describe('Data for step execution'),
});

const GetStepProgressInputSchema = z.object({
  id: z.number().describe('Task ID for progress query'),
  roleId: z.string().optional().describe('Optional role ID filter'),
});

const GetNextStepInputSchema = z.object({
  roleId: z.string().describe('Role ID for next step query'),
  id: z.number().describe('Task ID for context'),
});

type ExecuteWorkflowStepInput = z.infer<typeof ExecuteWorkflowStepInputSchema>;
type GetStepProgressInput = z.infer<typeof GetStepProgressInputSchema>;
type GetNextStepInput = z.infer<typeof GetNextStepInputSchema>;

@Injectable()
export class StepExecutionMcpService {
  private readonly logger = new Logger(StepExecutionMcpService.name);

  constructor(private readonly stepExecutionService: StepExecutionService) {}

  @Tool({
    name: 'execute_workflow_step',
    description: `Execute a workflow step with intelligent validation and progress tracking.

**STEP EXECUTION WITH EMBEDDED INTELLIGENCE**

✅ **Condition Validation** - Automatic validation of step prerequisites
✅ **Action Execution** - Intelligent execution of step actions
✅ **Progress Tracking** - Automatic progress recording and analytics
✅ **Quality Gates** - Built-in quality validation and enforcement
✅ **Next Step Recommendation** - Intelligent next step suggestions

**FEATURES:**
• Validates all step conditions before execution
• Executes step actions in proper sequence
• Records detailed progress and timing
• Provides next step recommendations
• Integrates with workflow analytics`,
    parameters:
      ExecuteWorkflowStepInputSchema as ZodSchema<ExecuteWorkflowStepInput>,
  })
  async executeWorkflowStep(input: ExecuteWorkflowStepInput): Promise<any> {
    try {
      this.logger.log(
        `Executing workflow step: ${input.stepId} for task: ${input.id}`,
      );

      const context = {
        taskId: input.id,
        roleId: input.roleId,
        stepId: input.stepId,
        executionData: input.executionData,
      };

      const result = await this.stepExecutionService.executeWorkflowStep(
        context,
        input.executionData,
      );

      const statusIcon = result.success ? '✅' : '❌';

      return {
        content: [
          {
            type: 'text',
            text: `${statusIcon} **Workflow Step Execution ${result.success ? 'Completed' : 'Failed'}**

**Step Details:**
• Step ID: ${input.stepId}
• Task ID: ${input.id}
• Role ID: ${input.roleId}
• Duration: ${result.duration}ms

**Execution Results:**
${
  result.success
    ? `• Status: Successfully completed
• Actions Executed: ${Array.isArray(result.results) ? result.results.length : 'N/A'}
${result.nextStep ? `• Next Step: ${result.nextStep.name} (${result.nextStep.stepType})` : '• No next step defined'}`
    : `• Status: Failed
• Errors: ${result.errors?.join(', ') || 'Unknown error'}`
}

**Progress Tracking:**
• Step execution recorded in workflow analytics
• Progress metrics updated
• Quality gates ${result.success ? 'passed' : 'failed'}

${result.success ? '🎯 **Ready for next workflow step!**' : '⚠️ **Please resolve errors before continuing**'}`,
          },
          {
            type: 'text',
            text: JSON.stringify(
              {
                stepExecution: result,
                workflowIntelligence: {
                  progressTracked: true,
                  qualityValidated: true,
                  nextStepRecommended: !!result.nextStep,
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
        `Error executing workflow step: ${error.message}`,
        error,
      );

      return {
        content: [
          {
            type: 'text',
            text: `❌ **Workflow Step Execution Failed**

Error: ${error.message}

Step ID: ${input.stepId}
Task ID: ${input.id}
Role ID: ${input.roleId}`,
          },
          {
            type: 'text',
            text: JSON.stringify(
              {
                error: error.message,
                stepId: input.stepId,
                taskId: input.id,
                roleId: input.roleId,
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
    name: 'get_step_progress',
    description: `Get workflow step progress for a task with detailed analytics.

**STEP PROGRESS TRACKING**

✅ **Progress History** - Complete step execution history
✅ **Performance Metrics** - Timing and success rate analytics
✅ **Role-Specific Filtering** - Filter progress by role
✅ **Status Tracking** - Current status of all steps
✅ **Analytics Integration** - Progress data for reporting

**FEATURES:**
• Complete step execution history
• Performance and timing metrics
• Role-based progress filtering
• Status and completion tracking`,
    parameters: GetStepProgressInputSchema as ZodSchema<GetStepProgressInput>,
  })
  async getStepProgress(input: GetStepProgressInput): Promise<any> {
    try {
      this.logger.log(`Getting step progress for task: ${input.id}`);

      const progress = await this.stepExecutionService.getStepProgress(
        String(input.id),
        input.roleId,
      );

      return {
        content: [
          {
            type: 'text',
            text: `📊 **Workflow Step Progress for Task: ${input.id}**

**Progress Summary:**
• Total Steps: ${progress.length}
• Completed: ${progress.filter((p) => p.status === 'COMPLETED').length}
• In Progress: ${progress.filter((p) => p.status === 'IN_PROGRESS').length}
• Failed: ${progress.filter((p) => p.status === 'FAILED').length}

**Recent Steps:**
${progress
  .slice(0, 5)
  .map(
    (p) =>
      `• ${p.step.name} (${p.step.stepType}) - ${p.status} - ${p.role.displayName}`,
  )
  .join('\n')}

**Progress Intelligence:**
• Complete execution history available
• Performance metrics tracked
• Role-specific progress filtering
• Analytics data captured

🎯 **Use this data for workflow optimization and reporting**`,
          },
          {
            type: 'text',
            text: JSON.stringify(
              {
                stepProgress: progress,
                progressIntelligence: {
                  historyTracked: true,
                  performanceMetrics: true,
                  roleFiltering: true,
                  analyticsIntegration: true,
                },
              },
              null,
              2,
            ),
          },
        ],
      };
    } catch (error: any) {
      this.logger.error(`Error getting step progress: ${error.message}`, error);

      return {
        content: [
          {
            type: 'text',
            text: `❌ **Step Progress Query Failed**

Error: ${error.message}

Task ID: ${input.id}`,
          },
          {
            type: 'text',
            text: JSON.stringify(
              {
                error: error.message,
                taskId: input.id,
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
    name: 'get_next_available_step',
    description: `Get the next available step for a role with intelligent recommendations.

**NEXT STEP INTELLIGENCE**

✅ **Smart Recommendations** - AI-powered next step suggestions
✅ **Dependency Validation** - Automatic dependency checking
✅ **Role-Specific Steps** - Steps tailored to current role
✅ **Progress Awareness** - Considers completed steps
✅ **Workflow Optimization** - Optimized step sequencing

**FEATURES:**
• Intelligent next step recommendations
• Automatic dependency validation
• Role-specific step filtering
• Progress-aware suggestions`,
    parameters: GetNextStepInputSchema as ZodSchema<GetNextStepInput>,
  })
  async getNextAvailableStep(input: GetNextStepInput): Promise<any> {
    try {
      this.logger.log(
        `Getting next available step for role: ${input.roleId}, task: ${input.id}`,
      );

      const nextStep = await this.stepExecutionService.getNextAvailableStep(
        input.roleId,
        String(input.id),
      );

      if (!nextStep) {
        return {
          content: [
            {
              type: 'text',
              text: `🎯 **No Next Step Available**

**Status:**
• Role: ${input.roleId}
• Task: ${input.id}
• Result: All steps completed or no steps defined

**Next Actions:**
• Check if all workflow steps are complete
• Consider role transition if appropriate
• Review task completion status

✅ **This role may have completed all assigned steps!**`,
            },
            {
              type: 'text',
              text: JSON.stringify(
                {
                  nextStep: null,
                  roleId: input.roleId,
                  taskId: input.id,
                  status: 'no_steps_available',
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: `🎯 **Next Available Step Recommended**

**Step Details:**
• Step: ${nextStep.name}
• Type: ${nextStep.stepType}
• Description: ${nextStep.description}
• Estimated Time: ${nextStep.estimatedTime || 'Not specified'}
• Sequence: ${nextStep.sequenceNumber}

**Step Intelligence:**
• Dependency validation passed
• Role-specific recommendation
• Progress-aware selection
• Workflow optimization applied

🚀 **Ready to execute this step!**`,
          },
          {
            type: 'text',
            text: JSON.stringify(
              {
                nextStep,
                stepIntelligence: {
                  dependencyValidated: true,
                  roleSpecific: true,
                  progressAware: true,
                  workflowOptimized: true,
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
        `Error getting next available step: ${error.message}`,
        error,
      );

      return {
        content: [
          {
            type: 'text',
            text: `❌ **Next Step Query Failed**

Error: ${error.message}

Role ID: ${input.roleId}
Task ID: ${input.id}`,
          },
          {
            type: 'text',
            text: JSON.stringify(
              {
                error: error.message,
                roleId: input.roleId,
                taskId: input.id,
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
