import { Injectable, Logger } from '@nestjs/common';
import { WorkflowStep } from 'generated/prisma';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  StepExecutionContext,
  WorkflowGuidance,
} from '../../domains/workflow-rules/services/workflow-guidance.service';
import {
  createErrorResult,
  getErrorMessage,
  isDefined,
} from '../../domains/workflow-rules/utils/type-safety.utils';
import {
  ActionData,
  ActionGuidanceResult,
  ApproachGuidance,
  BehavioralContext,
  WorkflowAction,
  WorkflowStepWithActions,
  isActionData,
  isApproachGuidance,
  isBehavioralContext,
  isStringArray,
} from './types/action-guidance.types';

@Injectable()
export class ActionGuidanceGeneratorService {
  private readonly logger = new Logger(ActionGuidanceGeneratorService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate actionable guidance for AI agents from database
   * FIXED: Proper type safety with error handling
   */
  async generateActionGuidance(
    guidance: WorkflowGuidance,
    stepId: string | null,
    context: StepExecutionContext,
  ): Promise<ActionGuidanceResult> {
    try {
      const action = guidance.nextActions[0];

      if (!action) {
        const fallbackGuidance = await this.generateFallbackGuidance(
          guidance,
          stepId,
        );
        return {
          success: true,
          guidance: fallbackGuidance,
          context: {
            actionType: 'FALLBACK',
            roleName: guidance.currentRole.name,
            stepId,
          },
        };
      }

      // Build context-aware guidance from database with proper type safety
      const baseGuidance = await this.generateActionSpecificGuidance(
        action as WorkflowAction,
        guidance,
        stepId,
      );
      const roleContext = await this.generateRoleSpecificContext(
        guidance.currentRole.name,
        action as WorkflowAction,
      );
      const stepContext = await this.generateStepSpecificContext(
        stepId,
        guidance,
      );
      const qualityContext = this.generateQualityContext(
        guidance.currentRole.name,
        stepId,
      );
      const projectContext = this.generateProjectContextGuidance(context);

      // Combine all contexts into actionable guidance
      const combinedGuidance = [
        baseGuidance,
        roleContext,
        stepContext,
        qualityContext,
        projectContext,
      ]
        .filter(isDefined)
        .filter(Boolean)
        .join('\n\n');

      this.logger.debug(
        `Generated ${combinedGuidance.length} chars of guidance for step ${stepId}`,
      );

      return {
        success: true,
        guidance: combinedGuidance,
        context: {
          actionType: action.actionType,
          roleName: guidance.currentRole.name,
          stepId,
        },
      };
    } catch (error) {
      this.logger.error('Failed to generate action guidance:', error);
      return createErrorResult(error, 'Action guidance generation failed');
    }
  }

  /**
   * Generate action-specific guidance from database
   * FIXED: Proper type safety and error handling
   */
  private async generateActionSpecificGuidance(
    action: WorkflowAction,
    guidance: WorkflowGuidance,
    stepId: string | null,
  ): Promise<string> {
    try {
      const actionTemplate = await this.getActionTemplatesFromDatabase(
        action.actionType,
        guidance.currentRole.name,
      );

      if (actionTemplate) {
        return this.interpolateTemplate(actionTemplate, {
          action,
          guidance,
          stepId,
          actionData: action.actionData,
        });
      }

      // Fallback to action type specific guidance
      return this.generateActionTypeGuidance(
        action.actionType,
        action.actionData,
      );
    } catch (error) {
      this.logger.warn('Failed to generate action-specific guidance:', error);
      return this.generateActionTypeGuidance(
        action.actionType,
        action.actionData,
      );
    }
  }

  /**
   * FIXED: Get action templates from database (database-driven approach)
   * Replaces hardcoded templates with database queries as required by the plan
   * FIXED: Proper type safety with Prisma types
   */
  private async getActionTemplatesFromDatabase(
    actionType: string,
    roleName: string,
  ): Promise<string | null> {
    try {
      // Query database for action-specific behavioral context from steps
      const steps = await this.prisma.workflowStep.findMany({
        where: {
          role: { name: roleName },
          actions: {
            some: {
              actionType: actionType as any,
            },
          },
        },
        include: {
          actions: {
            where: { actionType: actionType as any },
          },
        },
      });

      if (steps.length > 0) {
        const step = steps[0] as WorkflowStepWithActions;
        return this.buildActionTemplateFromStep(step, actionType);
      }

      // Fallback to generic action guidance
      return this.getGenericActionTemplate(actionType);
    } catch (error) {
      this.logger.warn(
        `Failed to fetch action template from database for ${actionType}:`,
        getErrorMessage(error),
      );
      return this.getGenericActionTemplate(actionType);
    }
  }

  /**
   * FIXED: Build action template from database step data (JSON structure)
   * Uses actual database behavioral context, approach guidance, and quality checklist
   * FIXED: Proper type safety with type guards
   */
  private buildActionTemplateFromStep(
    step: WorkflowStepWithActions,
    actionType: string,
  ): string {
    const sections = [`**Execute ${actionType} Action**`];

    // Extract behavioral context from database (JSON structure) with type safety
    if (step.behavioralContext && isBehavioralContext(step.behavioralContext)) {
      const context = step.behavioralContext;

      if (context.approach) {
        sections.push(`**Approach:** ${context.approach}`);
      }

      if (context.principles && Array.isArray(context.principles)) {
        sections.push(
          `**Principles:**\n${context.principles.map((p: string) => `- ${p}`).join('\n')}`,
        );
      }

      if (context.methodology) {
        sections.push(`**Methodology:** ${context.methodology}`);
      }
    }

    // Extract approach guidance from database (JSON structure) with type safety
    if (step.approachGuidance && isApproachGuidance(step.approachGuidance)) {
      const guidance = step.approachGuidance;

      if (guidance.stepByStep && Array.isArray(guidance.stepByStep)) {
        sections.push(
          `**Step-by-Step Approach:**\n${guidance.stepByStep.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n')}`,
        );
      }

      if (guidance.protocol && Array.isArray(guidance.protocol)) {
        sections.push(
          `**Protocol:**\n${guidance.protocol.map((p: string) => `- ${p}`).join('\n')}`,
        );
      }
    }

    // Extract quality checklist from database (JSON structure) with type safety
    if (step.qualityChecklist && isStringArray(step.qualityChecklist)) {
      sections.push(
        `**Quality Checklist:**\n${step.qualityChecklist.map((item: string) => `- ${item}`).join('\n')}`,
      );
    }

    // Extract action-specific data with type safety
    if (step.actions && step.actions.length > 0) {
      const action = step.actions[0];
      if (action.actionData && isActionData(action.actionData)) {
        const actionData = action.actionData;

        if (actionData.requiredContext) {
          sections.push(`**Required Context:** ${actionData.requiredContext}`);
        }

        if (actionData.expectedOutcome) {
          sections.push(`**Expected Outcome:** ${actionData.expectedOutcome}`);
        }

        if (actionData.validationCriteria) {
          sections.push(
            `**Validation Criteria:** ${actionData.validationCriteria}`,
          );
        }
      }
    }

    return sections.join('\n\n');
  }

  /**
   * FIXED: Generic action templates (minimal fallback)
   * Reduced hardcoded content, focuses on essential guidance
   */
  private getGenericActionTemplate(actionType: string): string {
    const templates: Record<string, string> = {
      MCP_CALL: `**Execute MCP Service Operation**
- Use CoreServiceOrchestrator.executeServiceCall()
- Validate parameters before execution
- Handle responses and errors appropriately`,

      VALIDATION: `**Perform Validation Check**
- Execute validation against specified criteria
- Document results with evidence
- Handle failures with appropriate actions`,

      ANALYSIS: `**Conduct Evidence-Based Analysis**
- Gather comprehensive evidence
- Apply appropriate methodology
- Provide data-driven conclusions`,

      DECISION: `**Make Strategic Decision**
- Evaluate options against criteria
- Consider evidence and context
- Provide clear rationale`,

      FILE_OPERATION: `**Execute File Operation**
- Verify paths and permissions
- Execute safely with error handling
- Validate operation results`,

      COMMAND: `**Execute System Command**
- Validate parameters and environment
- Execute with timeout and error handling
- Capture output and exit codes`,

      DELEGATION: `**Execute Role Delegation**
- Prepare comprehensive handoff context
- Preserve required context
- Execute through WorkflowOperations service`,
    };

    return (
      templates[actionType] ||
      `Execute ${actionType} according to specifications.`
    );
  }

  /**
   * FIXED: Generate role-specific context from database (corrected schema)
   * WorkflowRole doesn't have behavioralContext, but WorkflowStep does
   */
  private async generateRoleSpecificContext(
    roleName: string,
    action: WorkflowAction,
  ): Promise<string> {
    try {
      // Get role steps with behavioral context from database
      const roleSteps = await this.prisma.workflowStep.findMany({
        where: {
          role: { name: roleName },
          behavioralContext: { not: {} },
        },
        take: 1, // Get first step with behavioral context
      });

      if (roleSteps.length > 0 && roleSteps[0].behavioralContext) {
        const context = roleSteps[0].behavioralContext as BehavioralContext;
        return this.buildRoleContextFromDatabase(context, action);
      }

      // Fallback to hardcoded context
      return this.buildRoleContextFallback(roleName, action);
    } catch (error) {
      this.logger.warn(`Failed to fetch role context for ${roleName}:`, error);
      return this.buildRoleContextFallback(roleName, action);
    }
  }

  /**
   * ENHANCED: Build role context from database behavioral context (based on JSON structure)
   */
  private buildRoleContextFromDatabase(
    behavioralContext: BehavioralContext,
    action: WorkflowAction,
  ): string {
    const sections = [];

    // Extract approach methodology (from JSON structure)
    if (behavioralContext.approachMethodology) {
      sections.push(
        `**Approach Methodology:**\n${behavioralContext.approachMethodology}`,
      );
    }

    // Extract decision making principles (from JSON structure)
    if (
      behavioralContext.decisionMakingPrinciples &&
      Array.isArray(behavioralContext.decisionMakingPrinciples)
    ) {
      sections.push(
        `**Decision Making Principles:**\n${behavioralContext.decisionMakingPrinciples.map((p: string) => `- ${p}`).join('\n')}`,
      );
    }

    // Extract quality standards (from JSON structure)
    if (
      behavioralContext.qualityStandards &&
      Array.isArray(behavioralContext.qualityStandards)
    ) {
      sections.push(
        `**Quality Standards:**\n${behavioralContext.qualityStandards.map((s: string) => `- ${s}`).join('\n')}`,
      );
    }

    // Legacy support for existing structure
    if (
      behavioralContext.principles &&
      Array.isArray(behavioralContext.principles)
    ) {
      sections.push(
        `**Role Principles:**\n${behavioralContext.principles.map((p: string) => `- ${p}`).join('\n')}`,
      );
    }

    if (behavioralContext.methodology) {
      sections.push(`**Methodology:**\n${behavioralContext.methodology}`);
    }

    // Action-specific guidance (from JSON structure)
    if (
      behavioralContext.actionGuidance &&
      behavioralContext.actionGuidance[action.actionType]
    ) {
      sections.push(
        `**Action-Specific Guidance:**\n${behavioralContext.actionGuidance[action.actionType]}`,
      );
    }

    return sections.join('\n\n');
  }

  /**
   * ENHANCED: Build role context fallback (based on JSON role definitions)
   */
  private buildRoleContextFallback(
    roleName: string,
    _action: WorkflowAction,
  ): string {
    const roleContexts: Record<string, string> = {
      boomerang: `**Strategic Coordination Role:**
- Focus on efficient task intake and delivery coordination
- Execute mandatory current state verification through functional testing
- Make evidence-based strategic decisions
- Coordinate role delegation with proper context preservation
- Ensure clear requirements and acceptance criteria
- Maintain stakeholder alignment throughout workflow`,

      researcher: `**Evidence-Based Investigation Role:**
- Conduct thorough research with credible and recent sources
- Fill knowledge gaps identified by strategic analysis
- Provide data-driven recommendations with proper citations
- Document research methodology and limitations
- Assess technical feasibility and risks
- Support informed decision making with evidence`,

      architect: `**Technical Design Role:**
- Create comprehensive implementation plans with quality constraints
- Make architectural decisions based on complexity assessment
- Define technical specifications and design patterns
- Ensure scalable and maintainable solutions
- Document design decisions and trade-offs
- Establish quality gates and technical standards`,

      'senior-developer': `**Implementation Excellence Role:**
- Follow SOLID principles and established design patterns
- Implement comprehensive testing strategies (unit, integration)
- Ensure code quality and proper documentation
- Apply project-specific coding conventions and standards
- Implement proper error handling and logging
- Maintain high test coverage and quality metrics`,

      'code-review': `**Quality Assurance Role:**
- Perform thorough code and implementation review
- Validate against acceptance criteria and quality standards
- Check compliance with coding conventions and patterns
- Verify testing coverage and documentation completeness
- Ensure final quality approval before delivery
- Document review findings and recommendations`,
    };

    return (
      roleContexts[roleName] ||
      `**${roleName} Role:**\nExecute tasks according to role responsibilities and quality standards.`
    );
  }

  /**
   * ENHANCED: Generate step-specific context from database (based on JSON structure)
   */
  private async generateStepSpecificContext(
    stepId: string | null,
    guidance: WorkflowGuidance,
  ): Promise<string> {
    if (!stepId) {
      return this.generateStepContextFromGuidance(guidance);
    }

    try {
      const step = await this.prisma.workflowStep.findUnique({
        where: { id: stepId },
      });

      if (step) {
        return this.buildStepContextFromDatabase(step);
      }

      return this.generateStepContextFromGuidance(guidance);
    } catch (error) {
      this.logger.warn(`Failed to fetch step context for ${stepId}:`, error);
      return this.generateStepContextFromGuidance(guidance);
    }
  }

  /**
   * ENHANCED: Build step context from database step (based on JSON structure)
   */
  private buildStepContextFromDatabase(step: WorkflowStep): string {
    const sections = [];

    sections.push(`**Current Step: ${step.name}**`);

    if (step.description) {
      sections.push(`**Description:** ${step.description}`);
    }

    // Extract behavioral context (from JSON structure)
    if (step.behavioralContext) {
      const context = step.behavioralContext as BehavioralContext;

      if (context.approach) {
        sections.push(`**Approach:** ${context.approach}`);
      }

      if (context.principles && Array.isArray(context.principles)) {
        sections.push(
          `**Principles:**\n${context.principles.map((p: string) => `- ${p}`).join('\n')}`,
        );
      }

      if (context.methodology) {
        sections.push(`**Methodology:** ${context.methodology}`);
      }
    }

    // Extract approach guidance (from JSON structure)
    if (step.approachGuidance) {
      const guidance = step.approachGuidance as ApproachGuidance;
      if (guidance.stepByStep && Array.isArray(guidance.stepByStep)) {
        sections.push(
          `**Step-by-Step Approach:**\n${guidance.stepByStep.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n')}`,
        );
      }
    }

    // Extract quality checklist (from JSON structure)
    if (step.qualityChecklist && Array.isArray(step.qualityChecklist)) {
      sections.push(
        `**Quality Checklist:**\n${step.qualityChecklist.map((item: string) => `- ${item}`).join('\n')}`,
      );
    }

    // Note: completionCriteria field doesn't exist in current schema
    // This would be added in future schema updates

    return sections.join('\n\n');
  }

  /**
   * Generate step context from guidance when database step is not available
   */
  private generateStepContextFromGuidance(guidance: WorkflowGuidance): string {
    const step = guidance.currentStep;
    if (!step) {
      return '**Step Context:** No current step information available.';
    }

    const sections = [`**Current Step: ${step.name}**`];

    if (step.description) {
      sections.push(`**Description:** ${step.description}`);
    }

    if (step.stepType) {
      sections.push(`**Step Type:** ${step.stepType}`);
    }

    return sections.join('\n\n');
  }

  /**
   * Generate quality context from database
   */
  private generateQualityContext(
    roleName: string,
    stepId: string | null,
  ): string {
    try {
      // Get quality patterns from database
      const qualityPatterns = this.getQualityPatterns(roleName, stepId);

      if (qualityPatterns.length > 0) {
        return this.buildQualityContextFromPatterns(qualityPatterns);
      }

      return this.buildQualityContextFallback(roleName);
    } catch (error) {
      this.logger.warn(
        `Failed to fetch quality context for ${roleName}:`,
        error,
      );
      return this.buildQualityContextFallback(roleName);
    }
  }

  /**
   * Get quality patterns from database
   */
  private getQualityPatterns(_roleName: string, _stepId: string | null): any[] {
    // TODO: Implement database query for quality patterns
    // This would query tables like 'quality_patterns', 'role_quality_standards', etc.
    return [];
  }

  /**
   * Build quality context from patterns
   */
  private buildQualityContextFromPatterns(patterns: any[]): string {
    const sections = ['**Quality Standards:**'];

    patterns.forEach((pattern) => {
      if (pattern.requirements && Array.isArray(pattern.requirements)) {
        sections.push(`**${pattern.name}:**`);
        sections.push(
          pattern.requirements.map((r: string) => `- ${r}`).join('\n'),
        );
      }
    });

    return sections.join('\n');
  }

  /**
   * ENHANCED: Build quality context fallback (based on JSON role definitions)
   */
  private buildQualityContextFallback(roleName: string): string {
    const qualityStandards: Record<string, string[]> = {
      boomerang: [
        'Ensure clear and complete requirements with measurable acceptance criteria',
        'Validate business value and technical feasibility',
        'Execute mandatory current state verification through functional testing',
        'Make evidence-based strategic decisions with proper documentation',
        'Maintain stakeholder alignment and communication',
      ],
      researcher: [
        'Use credible and recent sources with proper citations',
        'Provide evidence-based conclusions with supporting data',
        'Document research methodology and any limitations',
        'Assess technical feasibility and identify potential risks',
        'Fill knowledge gaps identified in strategic analysis',
      ],
      architect: [
        'Follow established architectural principles and design patterns',
        'Ensure scalability, maintainability, and performance considerations',
        'Document design decisions, trade-offs, and rationale',
        'Define clear quality constraints and technical standards',
        'Create comprehensive implementation plans with quality gates',
      ],
      'senior-developer': [
        'Follow SOLID principles and clean code practices',
        'Implement comprehensive testing (unit, integration) with high coverage',
        'Ensure proper error handling, logging, and monitoring',
        'Apply project-specific coding conventions and design patterns',
        'Maintain code quality metrics and documentation standards',
      ],
      'code-review': [
        'Validate against acceptance criteria and business requirements',
        'Check code quality, standards compliance, and design patterns',
        'Verify comprehensive testing coverage and documentation',
        'Ensure proper error handling and security considerations',
        'Provide final quality approval with documented findings',
      ],
    };

    const standards = qualityStandards[roleName] || [
      'Follow best practices and quality standards for the role',
    ];

    return `**Quality Standards:**\n${standards.map((s) => `- ${s}`).join('\n')}`;
  }

  /**
   * NEW: Generate project context guidance (from PROJECT_ONBOARDING_SYSTEM)
   */
  private generateProjectContextGuidance(
    _context: StepExecutionContext,
  ): string {
    try {
      // TODO: Query project context from database when available
      // For now, provide guidance structure for project context integration

      const sections = ['**Project Context Guidance:**'];

      sections.push(
        '- Apply project-specific frameworks and architectural patterns',
        '- Follow established coding conventions and design patterns',
        '- Use project-specific testing frameworks and coverage targets',
        '- Maintain consistency with existing codebase structure',
        '- Consider project-specific quality standards and constraints',
      );

      return sections.join('\n');
    } catch (error) {
      this.logger.warn('Failed to generate project context guidance:', error);
      return '';
    }
  }

  /**
   * Generate fallback guidance when no action is available
   */
  private async generateFallbackGuidance(
    guidance: WorkflowGuidance,
    _stepId: string | null,
  ): Promise<string> {
    const sections = [];

    sections.push(`**Current Role: ${guidance.currentRole.name}**`);

    if (guidance.currentStep) {
      sections.push(`**Current Step: ${guidance.currentStep.name}**`);
      if (guidance.currentStep.description) {
        sections.push(`**Description:** ${guidance.currentStep.description}`);
      }
    }

    sections.push(
      '**Status:** No specific actions available. Consider checking workflow state or transitioning to next role.',
    );

    // Add role-specific fallback guidance
    const roleContext = await this.generateRoleSpecificContext(
      guidance.currentRole.name,
      {} as WorkflowAction,
    );
    if (roleContext) {
      sections.push(roleContext);
    }

    return sections.join('\n\n');
  }

  /**
   * ENHANCED: Generate action type specific guidance (based on JSON action mapping)
   */
  private generateActionTypeGuidance(
    actionType: string,
    _actionData: ActionData,
  ): string {
    const typeGuidance: Record<string, string> = {
      MCP_CALL: `Execute MCP service operation with proper parameters and error handling. Use CoreServiceOrchestrator for all service coordination.`,
      VALIDATION: `Perform thorough validation against specified criteria with documented results and evidence.`,
      ANALYSIS: `Conduct comprehensive analysis with evidence-based conclusions and proper methodology documentation.`,
      DECISION: `Make informed decisions based on available data, context, and evidence with clear rationale.`,
      FILE_OPERATION: `Execute file operations safely with proper error handling and operation validation.`,
      COMMAND: `Run system commands with appropriate parameters, timeout handling, and output capture.`,
      DELEGATION: `Execute role delegation with comprehensive context preservation and proper handoff documentation.`,
      TESTING_IMPLEMENTATION: `Implement comprehensive testing with proper coverage targets and quality validation.`,
      QUALITY_VALIDATION: `Validate quality standards with documented findings and compliance verification.`,
      REMINDER: `Provide user reminders and notifications with appropriate context and timing.`,
    };

    return (
      typeGuidance[actionType] ||
      `Execute ${actionType} action according to specifications and quality standards.`
    );
  }

  /**
   * Interpolate template with context data
   */
  private interpolateTemplate(template: string, context: any): string {
    let result = template;

    // Simple template interpolation - could be enhanced with a proper template engine
    const matches = template.match(/\{\{([^}]+)\}\}/g);

    if (matches) {
      matches.forEach((match) => {
        const path = match.replace(/[{}]/g, '');
        const value = this.getNestedValue(context, path);
        if (value !== undefined) {
          result = result.replace(match, String(value));
        }
      });
    }

    return result;
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    if (!obj || !path) return undefined;

    return path.split('.').reduce((current, key) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return current && typeof current === 'object' && key in current
        ? current[key]
        : undefined;
    }, obj);
  }
}
