/* eslint-disable @typescript-eslint/no-unsafe-return */

import { Injectable, Logger } from '@nestjs/common';
import {
  ProjectBehavioralProfile,
  ProjectContext,
  WorkflowRole,
  WorkflowStep,
} from 'generated/prisma';
import { PrismaService } from '../../../../prisma/prisma.service';

export interface WorkflowGuidance {
  currentRole: {
    name: string;
    displayName: string;
    description: string;
    capabilities: any;
  };
  currentStep: {
    name: string;
    displayName: string;
    description: string;
    stepType: string;
    estimatedTime?: string;
    behavioralContext?: any;
    approachGuidance?: any;
    qualityChecklist?: any;
    patternEnforcement?: any;
  } | null;
  nextActions: Array<{
    name: string;
    actionType: string;
    actionData: any;
    sequenceOrder: number;
  }>;
  projectContext: {
    projectType?: string;
    behavioralProfile?: any;
    detectedPatterns?: any[];
    qualityStandards?: any;
  };
  qualityReminders: string[];
  ruleEnforcement: {
    requiredPatterns: string[];
    antiPatterns: string[];
    complianceChecks: any[];
  };
  reportingStatus: {
    shouldTriggerReport: boolean;
    reportType?: string;
    reportTemplate?: string;
  };
}

export interface StepExecutionContext {
  taskId: number;
  roleId: string;
  stepId?: string;
  projectPath?: string;
  executionData?: any;
}

@Injectable()
export class WorkflowGuidanceService {
  private readonly logger = new Logger(WorkflowGuidanceService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get comprehensive workflow guidance for a role in a specific context
   * This is the core method that provides intelligent, embedded guidance
   */
  async getWorkflowGuidance(
    roleName: string,
    context: StepExecutionContext,
  ): Promise<WorkflowGuidance> {
    try {
      // Get role information
      const role = await this.getWorkflowRole(roleName);
      if (!role) {
        throw new Error(`Workflow role '${roleName}' not found`);
      }

      // Get project context if available
      const projectContext = await this.getProjectContext(context.projectPath);

      // Get current step based on context
      const currentStep = await this.getCurrentStep(role.id, context);

      // Get next actions for the current step
      const nextActions = currentStep
        ? await this.getStepActions(currentStep.id)
        : [];

      // Get project-specific behavioral profile
      const behavioralProfile = await this.getProjectBehavioralProfile(
        projectContext?.id,
        roleName,
      );

      // Get quality reminders and rule enforcement
      const qualityReminders = await this.getQualityReminders(
        role.id,
        projectContext?.id,
      );
      const ruleEnforcement = await this.getRuleEnforcement(
        role.id,
        projectContext?.id,
      );

      // Check if current step should trigger a report
      const reportingStatus = {
        shouldTriggerReport: currentStep?.triggerReport || false,
        reportType: currentStep?.reportType || undefined,
        reportTemplate: currentStep?.reportTemplate || undefined,
      };

      return {
        currentRole: {
          name: role.name,
          displayName: role.displayName,
          description: role.description,
          capabilities: role.capabilities,
        },
        currentStep: currentStep
          ? {
              name: currentStep.name,
              displayName: currentStep.displayName,
              description: currentStep.description,
              stepType: currentStep.stepType,
              estimatedTime: currentStep.estimatedTime ?? '',
              behavioralContext: currentStep.behavioralContext,
              approachGuidance: currentStep.approachGuidance,
              qualityChecklist: currentStep.qualityChecklist,
              patternEnforcement: currentStep.patternEnforcement,
            }
          : null,
        nextActions: nextActions.map((action) => ({
          name: action.name,
          actionType: action.actionType,
          actionData: action.actionData,
          sequenceOrder: action.sequenceOrder,
        })),
        projectContext: {
          projectType: projectContext?.projectType,
          behavioralProfile: behavioralProfile,
          detectedPatterns: projectContext
            ? await this.getProjectPatterns(projectContext.id)
            : [],
          qualityStandards: behavioralProfile?.qualityStandards,
        },
        qualityReminders,
        ruleEnforcement,
        reportingStatus,
      };
    } catch (error) {
      this.logger.error(
        `Error getting workflow guidance for role ${roleName}:`,
        error,
      );
      throw error;
    }
  }

  // Private helper methods focused on guidance generation

  private async getWorkflowRole(
    roleName: string,
  ): Promise<WorkflowRole | null> {
    return await this.prisma.workflowRole.findUnique({
      where: { name: roleName },
    });
  }

  private getProjectContext(
    projectPath?: string,
  ): Promise<ProjectContext | null> {
    if (!projectPath) return Promise.resolve(null);

    return this.prisma.projectContext.findFirst({
      where: { projectPath },
    });
  }

  private getCurrentStep(
    roleId: string,
    context: StepExecutionContext,
  ): Promise<WorkflowStep | null> {
    // If stepId is provided, get that specific step
    if (context.stepId) {
      return this.prisma.workflowStep.findUnique({
        where: { id: context.stepId },
      });
    }

    // Otherwise, get the next step in sequence for this role
    return this.prisma.workflowStep.findFirst({
      where: { roleId },
      orderBy: { sequenceNumber: 'asc' },
    });
  }

  private getStepActions(stepId: string) {
    return this.prisma.stepAction.findMany({
      where: { stepId },
      orderBy: { sequenceOrder: 'asc' },
    });
  }

  private getProjectBehavioralProfile(
    projectContextId?: number,
    roleName?: string,
  ): Promise<ProjectBehavioralProfile | null> {
    if (!projectContextId || !roleName) return Promise.resolve(null);

    return this.prisma.projectBehavioralProfile.findFirst({
      where: {
        projectContextId,
      },
    });
  }

  private async getQualityReminders(
    roleId: string,
    projectContextId?: number,
  ): Promise<string[]> {
    const reminders: string[] = [];

    // Add role-specific quality reminders
    const role = await this.prisma.workflowRole.findUnique({
      where: { id: roleId },
    });

    // Type cast JSON field to access properties
    const capabilities = role?.capabilities as any;
    if (
      capabilities?.qualityReminders &&
      Array.isArray(capabilities.qualityReminders)
    ) {
      reminders.push(...capabilities.qualityReminders);
    }

    // Add project-specific quality reminders
    if (projectContextId) {
      const projectProfile =
        await this.prisma.projectBehavioralProfile.findFirst({
          where: { projectContextId },
        });

      // Type cast JSON field to access properties
      const qualityStandards = projectProfile?.qualityStandards as any;
      if (
        qualityStandards?.reminders &&
        Array.isArray(qualityStandards.reminders)
      ) {
        reminders.push(...qualityStandards.reminders);
      }
    }

    return reminders;
  }

  private async getRuleEnforcement(
    _roleId: string,
    projectContextId?: number,
  ): Promise<{
    requiredPatterns: string[];
    antiPatterns: string[];
    complianceChecks: any[];
  }> {
    const enforcement: {
      requiredPatterns: string[];
      antiPatterns: string[];
      complianceChecks: any[];
    } = {
      requiredPatterns: [],
      antiPatterns: [],
      complianceChecks: [],
    };

    // Get patterns from project context
    if (projectContextId) {
      const patterns = await this.prisma.projectPattern.findMany({
        where: { projectContextId },
      });

      // Use description field instead of missing fields
      enforcement.requiredPatterns = patterns
        .filter((p) => p.description.includes('required'))
        .map((p) => p.patternName);

      // Use implementation field for anti-patterns
      enforcement.antiPatterns = patterns.flatMap((p) => {
        const impl = p.implementation as any;
        return impl?.antiPatterns || [];
      });

      // Use implementation field for compliance checks
      enforcement.complianceChecks = patterns
        .map((p) => {
          const impl = p.implementation as any;
          return impl?.complianceChecks;
        })
        .filter(Boolean);
    }

    return enforcement;
  }

  private async getProjectPatterns(projectContextId: number): Promise<any[]> {
    const patterns = await this.prisma.projectPattern.findMany({
      where: { projectContextId },
    });

    return patterns.map((pattern) => ({
      name: pattern.patternName,
      type: pattern.patternType,
      description: pattern.description, // Use existing field
      usage: 'general', // Default value since field doesn't exist
      confidence: 0.8, // Default value since field doesn't exist
    }));
  }
}
