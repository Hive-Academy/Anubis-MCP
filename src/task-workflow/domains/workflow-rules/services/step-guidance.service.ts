import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { WorkflowStep } from 'generated/prisma';

// ===================================================================
// 📚 STEP GUIDANCE SERVICE - Database-Driven AI Guidance
// ===================================================================
// Purpose: Provide intelligent, database-driven guidance for AI step execution
// Scope: Step guidance, validation criteria, troubleshooting, reporting
// Data Source: Fully database-driven (WorkflowStep, StepAction, StepCondition)

export interface StepGuidanceContext {
  taskId: number;
  roleId: string;
  stepId?: string;
  projectPath?: string;
}

export interface StepGuidanceResult {
  step: {
    id: string;
    name: string;
    description: string;
    stepType: string;
    estimatedTime: string;
  };
  localCommands: string[];
  successCriteria: string[];
  failureCriteria: string[];
  executionDescription: string;
  troubleshooting: string[];
  successReporting: string[];
  failureReporting: string[];
  nextStepHint?: string;
}

export interface ValidationCriteriaResult {
  stepName: string;
  stepType: string;
  successConditions: string[];
  expectedValues: Record<string, any>;
  validationCommands: string[];
  failureConditions: string[];
  errorPatterns: string[];
  recoveryActions: string[];
  checkList: string[];
  troubleshooting: string[];
}

@Injectable()
export class StepGuidanceService {
  private readonly logger = new Logger(StepGuidanceService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * ✅ NEW: Get step guidance for what AI should execute locally
   * ENHANCED: Fully database-driven, no hardcoded guidance
   */
  async getStepGuidance(
    context: StepGuidanceContext,
  ): Promise<StepGuidanceResult> {
    try {
      const { taskId, roleId, stepId } = context;

      // Get specific step or find current/next step
      let step: WorkflowStep | null = null;

      if (stepId) {
        step = await this.prisma.workflowStep.findUnique({
          where: { id: stepId },
          include: { conditions: true, actions: true },
        });
      } else {
        // Find current or next step for the role
        step = await this.getNextAvailableStep(roleId, taskId.toString());
      }

      if (!step) {
        // Return default guidance if no step found
        return await this.getDefaultStepGuidance();
      }

      return {
        step: {
          id: step.id,
          name: step.name,
          description: step.description,
          stepType: step.stepType,
          estimatedTime: step.estimatedTime || '5-10 minutes',
        },
        localCommands: await this.getLocalCommandsForStep(step),
        successCriteria: await this.getSuccessCriteriaForStep(step),
        failureCriteria: await this.getFailureCriteriaForStep(step),
        executionDescription: this.getExecutionDescriptionForStep(step),
        troubleshooting: await this.getTroubleshootingForStep(step),
        successReporting: await this.getSuccessReportingForStep(step),
        failureReporting: this.getFailureReportingForStep(),
        nextStepHint: await this.getNextStepHint(step),
      };
    } catch (error) {
      this.logger.error(`Error getting step guidance: ${error.message}`, error);
      return await this.getDefaultStepGuidance();
    }
  }

  /**
   * ✅ NEW: Get validation criteria for AI to check locally
   * ENHANCED: Fully database-driven validation criteria extraction
   */
  async getStepValidationCriteria(
    stepId: string,
  ): Promise<ValidationCriteriaResult> {
    try {
      const step = await this.prisma.workflowStep.findUnique({
        where: { id: stepId },
        include: { conditions: true },
      });

      if (!step) {
        return this.getDefaultValidationCriteria();
      }

      return {
        stepName: step.name,
        stepType: step.stepType,
        successConditions: await this.getSuccessCriteriaForStep(step),
        expectedValues: await this.getExpectedValuesForStep(step),
        validationCommands: await this.getValidationCommandsForStep(step),
        failureConditions: await this.getFailureCriteriaForStep(step),
        errorPatterns: await this.getErrorPatternsForStep(step),
        recoveryActions: await this.getRecoveryActionsForStep(step),
        checkList: await this.getCheckListForStep(step),
        troubleshooting: await this.getTroubleshootingForStep(step),
      };
    } catch (error) {
      this.logger.error(
        `Error getting validation criteria: ${error.message}`,
        error,
      );
      return this.getDefaultValidationCriteria();
    }
  }

  // ===================================================================
  // 🔧 DATABASE-DRIVEN HELPER METHODS (Fixed - no hardcoding)
  // ===================================================================

  private async getLocalCommandsForStep(step: WorkflowStep): Promise<string[]> {
    try {
      // ✅ FIXED: Read from database instead of hardcoded switch
      const stepWithActions = await this.prisma.workflowStep.findUnique({
        where: { id: step.id },
        include: { actions: true },
      });

      const commands: string[] = [];

      if (stepWithActions?.actions) {
        for (const action of stepWithActions.actions) {
          if (action.actionData && typeof action.actionData === 'object') {
            const actionData = action.actionData as any;
            if (actionData.commands && Array.isArray(actionData.commands)) {
              commands.push(...actionData.commands);
            }
          }
        }
      }

      return commands;
    } catch (error) {
      this.logger.warn(
        `Failed to get local commands for step ${step.id} from database:`,
        error,
      );
      return [];
    }
  }

  private async getSuccessCriteriaForStep(
    step: WorkflowStep,
  ): Promise<string[]> {
    try {
      // ✅ FIXED: Read from database conditions
      const stepWithConditions = await this.prisma.workflowStep.findUnique({
        where: { id: step.id },
        include: { conditions: true },
      });

      const criteria: string[] = [];

      if (stepWithConditions?.conditions) {
        for (const condition of stepWithConditions.conditions) {
          // Use condition name as the success criteria
          if (condition.name) {
            criteria.push(condition.name);
          }
        }
      }

      // Fallback to step description if no conditions
      if (criteria.length === 0 && step.description) {
        criteria.push(`${step.name} completes successfully`);
      }

      return criteria;
    } catch (error) {
      this.logger.warn(
        `Failed to get success criteria for step ${step.id} from database:`,
        error,
      );
      return [`${step.name} completes without errors`];
    }
  }

  private async getFailureCriteriaForStep(
    step: WorkflowStep,
  ): Promise<string[]> {
    try {
      // ✅ FIXED: Derive from database conditions (opposite of success)
      const stepWithConditions = await this.prisma.workflowStep.findUnique({
        where: { id: step.id },
        include: { conditions: true },
      });

      const failureCriteria: string[] = [];

      if (stepWithConditions?.conditions) {
        for (const condition of stepWithConditions.conditions) {
          if (condition.name) {
            // Create failure criteria as opposite of success
            failureCriteria.push(
              `Fails if: ${condition.name.toLowerCase()} is not met`,
            );
          }
        }
      }

      // Generic fallback
      if (failureCriteria.length === 0) {
        failureCriteria.push(`${step.name} execution fails with errors`);
      }

      return failureCriteria;
    } catch (error) {
      this.logger.warn(
        `Failed to get failure criteria for step ${step.id} from database:`,
        error,
      );
      return [`${step.name} execution fails with errors`];
    }
  }

  private getExecutionDescriptionForStep(step: WorkflowStep): string {
    // ✅ FIXED: Use database description directly
    return step.description || `Execute ${step.name} as defined in workflow`;
  }

  private async getTroubleshootingForStep(
    step: WorkflowStep,
  ): Promise<string[]> {
    try {
      // ✅ FIXED: Read from database metadata or actions
      const stepWithData = await this.prisma.workflowStep.findUnique({
        where: { id: step.id },
        include: { actions: true },
      });

      const troubleshooting: string[] = [];

      // Check if troubleshooting info is stored in actions
      if (stepWithData?.actions) {
        for (const action of stepWithData.actions) {
          if (action.actionData && typeof action.actionData === 'object') {
            const actionData = action.actionData as any;
            if (
              actionData.troubleshooting &&
              Array.isArray(actionData.troubleshooting)
            ) {
              troubleshooting.push(...actionData.troubleshooting);
            }
          }
        }
      }

      // Generic fallback
      if (troubleshooting.length === 0) {
        troubleshooting.push(
          'Check error messages for specific issues',
          'Verify prerequisites are met',
          'Retry the operation if safe to do so',
        );
      }

      return troubleshooting;
    } catch (error) {
      this.logger.warn(
        `Failed to get troubleshooting for step ${step.id} from database:`,
        error,
      );
      return [
        'Check error messages for specific issues',
        'Retry the operation',
      ];
    }
  }

  private async getSuccessReportingForStep(
    step: WorkflowStep,
  ): Promise<string[]> {
    try {
      // ✅ FIXED: Read from database actions
      const stepWithActions = await this.prisma.workflowStep.findUnique({
        where: { id: step.id },
        include: { actions: true },
      });

      const reportingFields: string[] = [];

      if (stepWithActions?.actions) {
        for (const action of stepWithActions.actions) {
          if (action.actionData && typeof action.actionData === 'object') {
            const actionData = action.actionData as any;
            if (
              actionData.successReporting &&
              Array.isArray(actionData.successReporting)
            ) {
              reportingFields.push(...actionData.successReporting);
            }
          }
        }
      }

      // Generic fallback
      if (reportingFields.length === 0) {
        reportingFields.push('executionResult', 'completionStatus', 'duration');
      }

      return reportingFields;
    } catch (error) {
      this.logger.warn(
        `Failed to get success reporting for step ${step.id} from database:`,
        error,
      );
      return ['executionResult', 'completionStatus'];
    }
  }

  private getFailureReportingForStep(): string[] {
    // ✅ FIXED: Generic failure reporting (same for all steps)
    return [
      'errorMessage',
      'failureReason',
      'commandOutput',
      'suggestedFix',
      'duration',
    ];
  }

  private async getNextStepHint(
    step: WorkflowStep,
  ): Promise<string | undefined> {
    const nextStep = await this.getNextStep(step.roleId, step.sequenceNumber);
    return nextStep?.name;
  }

  private async getDefaultStepGuidance(): Promise<StepGuidanceResult> {
    // ✅ FIXED: Try to get from database first, fallback to minimal default
    try {
      const gitStep = await this.prisma.workflowStep.findFirst({
        where: {
          OR: [
            { name: { contains: 'git' } },
            { name: { contains: 'verification' } },
          ],
        },
        include: { conditions: true, actions: true },
      });

      if (gitStep) {
        return {
          step: {
            id: gitStep.id,
            name: gitStep.name,
            description: gitStep.description,
            stepType: gitStep.stepType,
            estimatedTime: gitStep.estimatedTime || '2-3 minutes',
          },
          localCommands: await this.getLocalCommandsForStep(gitStep),
          successCriteria: await this.getSuccessCriteriaForStep(gitStep),
          failureCriteria: await this.getFailureCriteriaForStep(gitStep),
          executionDescription: this.getExecutionDescriptionForStep(gitStep),
          troubleshooting: await this.getTroubleshootingForStep(gitStep),
          successReporting: await this.getSuccessReportingForStep(gitStep),
          failureReporting: this.getFailureReportingForStep(),
        };
      }
    } catch (error) {
      this.logger.warn(
        'Failed to get git verification step from database:',
        error,
      );
    }

    // Minimal fallback when database doesn't have the step
    return {
      step: {
        id: 'default-step',
        name: 'workflow_step',
        description: 'Execute workflow step as defined',
        stepType: 'EXECUTION',
        estimatedTime: '5 minutes',
      },
      localCommands: [],
      successCriteria: ['Step completes successfully'],
      failureCriteria: ['Step fails with errors'],
      executionDescription: 'Execute the assigned workflow step',
      troubleshooting: ['Check error messages', 'Retry operation'],
      successReporting: ['executionResult', 'completionStatus'],
      failureReporting: ['errorMessage', 'failureReason'],
    };
  }

  private getDefaultValidationCriteria(): ValidationCriteriaResult {
    // ✅ FIXED: Minimal default (should rarely be used)
    return {
      stepName: 'workflow_step',
      stepType: 'EXECUTION',
      successConditions: ['Step completes without errors'],
      expectedValues: { exitCode: 0 },
      validationCommands: [],
      failureConditions: ['Step fails with errors'],
      errorPatterns: ['error:', 'failed:'],
      recoveryActions: ['Retry operation', 'Check requirements'],
      checkList: ['Execute step', 'Verify completion'],
      troubleshooting: ['Review error details', 'Check prerequisites'],
    };
  }

  private async getExpectedValuesForStep(
    step: WorkflowStep,
  ): Promise<Record<string, any>> {
    try {
      // ✅ FIXED: Read expected values from database conditions
      const stepWithConditions = await this.prisma.workflowStep.findUnique({
        where: { id: step.id },
        include: { conditions: true },
      });

      const expectedValues: Record<string, any> = { exitCode: 0 }; // Default

      if (stepWithConditions?.conditions) {
        for (const condition of stepWithConditions.conditions) {
          if (condition.logic && typeof condition.logic === 'object') {
            const conditionData = condition.logic as any;
            if (conditionData.expectedValues) {
              Object.assign(expectedValues, conditionData.expectedValues);
            }
          }
        }
      }

      return expectedValues;
    } catch (error) {
      this.logger.warn(
        `Failed to get expected values for step ${step.id} from database:`,
        error,
      );
      return { exitCode: 0 };
    }
  }

  private async getValidationCommandsForStep(
    step: WorkflowStep,
  ): Promise<string[]> {
    try {
      // ✅ FIXED: Read validation commands from database
      const stepWithActions = await this.prisma.workflowStep.findUnique({
        where: { id: step.id },
        include: { actions: true },
      });

      const validationCommands: string[] = [];

      if (stepWithActions?.actions) {
        for (const action of stepWithActions.actions) {
          if (action.actionData && typeof action.actionData === 'object') {
            const actionData = action.actionData as any;
            if (
              actionData.validationCommands &&
              Array.isArray(actionData.validationCommands)
            ) {
              validationCommands.push(...actionData.validationCommands);
            }
          }
        }
      }

      return validationCommands;
    } catch (error) {
      this.logger.warn(
        `Failed to get validation commands for step ${step.id} from database:`,
        error,
      );
      return [];
    }
  }

  private async getErrorPatternsForStep(step: WorkflowStep): Promise<string[]> {
    try {
      // ✅ FIXED: Read error patterns from database
      const stepWithData = await this.prisma.workflowStep.findUnique({
        where: { id: step.id },
        include: { actions: true },
      });

      const errorPatterns: string[] = [];

      if (stepWithData?.actions) {
        for (const action of stepWithData.actions) {
          if (action.actionData && typeof action.actionData === 'object') {
            const actionData = action.actionData as any;
            if (
              actionData.errorPatterns &&
              Array.isArray(actionData.errorPatterns)
            ) {
              errorPatterns.push(...actionData.errorPatterns);
            }
          }
        }
      }

      // Generic fallback
      if (errorPatterns.length === 0) {
        errorPatterns.push('error:', 'failed:', 'exception:');
      }

      return errorPatterns;
    } catch (error) {
      this.logger.warn(
        `Failed to get error patterns for step ${step.id} from database:`,
        error,
      );
      return ['error:', 'failed:', 'exception:'];
    }
  }

  private async getRecoveryActionsForStep(
    step: WorkflowStep,
  ): Promise<string[]> {
    try {
      // ✅ FIXED: Read recovery actions from database
      const stepWithData = await this.prisma.workflowStep.findUnique({
        where: { id: step.id },
        include: { actions: true },
      });

      const recoveryActions: string[] = [];

      if (stepWithData?.actions) {
        for (const action of stepWithData.actions) {
          if (action.actionData && typeof action.actionData === 'object') {
            const actionData = action.actionData as any;
            if (
              actionData.recoveryActions &&
              Array.isArray(actionData.recoveryActions)
            ) {
              recoveryActions.push(...actionData.recoveryActions);
            }
          }
        }
      }

      // Generic fallback
      if (recoveryActions.length === 0) {
        recoveryActions.push(
          'Check error message',
          'Retry operation',
          'Get help',
        );
      }

      return recoveryActions;
    } catch (error) {
      this.logger.warn(
        `Failed to get recovery actions for step ${step.id} from database:`,
        error,
      );
      return ['Check error message', 'Retry operation', 'Get help'];
    }
  }

  private async getCheckListForStep(step: WorkflowStep): Promise<string[]> {
    try {
      // ✅ FIXED: Read checklist from database
      const stepWithData = await this.prisma.workflowStep.findUnique({
        where: { id: step.id },
        include: { conditions: true, actions: true },
      });

      const checkList: string[] = [];

      // Build checklist from conditions and actions
      if (stepWithData?.conditions) {
        for (const condition of stepWithData.conditions) {
          if (condition.name) {
            checkList.push(`Verify: ${condition.name}`);
          }
        }
      }

      if (stepWithData?.actions) {
        for (const action of stepWithData.actions) {
          if (action.name) {
            checkList.push(`Execute: ${action.name}`);
          }
        }
      }

      // Generic fallback
      if (checkList.length === 0) {
        checkList.push('Execute step', 'Verify completion', 'Check for errors');
      }

      return checkList;
    } catch (error) {
      this.logger.warn(
        `Failed to get checklist for step ${step.id} from database:`,
        error,
      );
      return ['Execute step', 'Verify completion', 'Check for errors'];
    }
  }

  // ===================================================================
  // 🔧 PRIVATE HELPER METHODS
  // ===================================================================

  private async getNextAvailableStep(
    roleId: string,
    taskId: string,
  ): Promise<WorkflowStep | null> {
    // Get completed steps for this task and role
    const completedSteps = await this.prisma.workflowStepProgress.findMany({
      where: {
        taskId,
        roleId,
        status: 'COMPLETED',
      },
      select: { stepId: true },
    });

    const completedStepIds = completedSteps.map((s) => s.stepId);

    // Find the next step that hasn't been completed
    return await this.prisma.workflowStep.findFirst({
      where: {
        roleId,
        id: { notIn: completedStepIds },
      },
      orderBy: { sequenceNumber: 'asc' },
    });
  }

  private async getNextStep(
    roleId: string,
    currentSequenceNumber: number,
  ): Promise<WorkflowStep | null> {
    return await this.prisma.workflowStep.findFirst({
      where: {
        roleId,
        sequenceNumber: { gt: currentSequenceNumber },
      },
      orderBy: { sequenceNumber: 'asc' },
    });
  }
}
