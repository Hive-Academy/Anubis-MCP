import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { WorkflowGuidance } from '../../domains/workflow-rules/services/workflow-guidance.service';
import {
  ValidationContext,
  ValidationContextResult,
  QualityPattern,
  ValidationCheck,
  AntiPattern,
} from './types/validation-context.types';
import {
  getErrorMessage,
  createErrorResult,
} from '../../domains/workflow-rules/utils/type-safety.utils';

@Injectable()
export class ValidationContextBuilderService {
  private readonly logger = new Logger(ValidationContextBuilderService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Build comprehensive validation context from database with type safety
   */
  async buildValidationContext(
    guidance: WorkflowGuidance,
    stepId: string | null,
    taskId: number,
  ): Promise<ValidationContextResult> {
    try {
      // Get validation data from database with type safety
      const [
        qualityPatterns,
        validationChecks,
        antiPatterns,
        roleStandards,
        stepCriteria,
        projectStandards,
      ] = await Promise.all([
        this.getQualityPatterns(guidance.currentRole.name, stepId),
        this.getValidationChecks(guidance.currentRole.name, stepId),
        this.getAntiPatterns(guidance.currentRole.name, stepId),
        this.getRoleSpecificStandards(guidance.currentRole.name),
        this.getStepSpecificCriteria(stepId),
        this.getProjectStandards(taskId),
      ]);

      const context: ValidationContext = {
        qualityPatterns,
        validationChecks,
        antiPatterns,
        roleSpecificStandards: roleStandards,
        stepSpecificCriteria: stepCriteria,
        projectStandards,
      };

      this.logger.debug(
        `Built validation context with ${qualityPatterns.length} patterns, ${validationChecks.length} checks, ${antiPatterns.length} anti-patterns`,
      );

      return {
        success: true,
        context,
        metadata: {
          taskId,
          roleName: guidance.currentRole.name,
          stepId,
          patternsCount: qualityPatterns.length,
          checksCount: validationChecks.length,
          antiPatternsCount: antiPatterns.length,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to build validation context:`,
        getErrorMessage(error),
      );
      return createErrorResult(error, 'Validation context building failed');
    }
  }

  /**
   * Get quality patterns from database using WorkflowStep behavioral context
   */
  private async getQualityPatterns(
    roleName: string,
    stepId: string | null,
  ): Promise<QualityPattern[]> {
    try {
      // Query WorkflowStep for behavioral context and pattern enforcement
      const steps = await this.prisma.workflowStep.findMany({
        where: {
          role: { name: roleName },
          ...(stepId ? { id: stepId } : {}),
        },
        select: {
          id: true,
          name: true,
          behavioralContext: true,
          patternEnforcement: true,
          qualityChecklist: true,
        },
      });

      const patterns: QualityPattern[] = [];

      for (const step of steps) {
        // Extract patterns from behavioral context
        if (step.behavioralContext) {
          const context = step.behavioralContext as Record<string, unknown>;
          if (context.principles && Array.isArray(context.principles)) {
            patterns.push({
              id: `${step.id}-principles`,
              name: `${step.name} Principles`,
              description: `Quality principles for ${step.name}`,
              category: 'BEHAVIORAL',
              requirements: context.principles,
              examples: [],
              priority: 'HIGH',
            });
          }
        }

        // Extract patterns from pattern enforcement
        if (step.patternEnforcement) {
          const enforcement = step.patternEnforcement as Record<
            string,
            unknown
          >;
          if (
            enforcement.requiredPatterns &&
            Array.isArray(enforcement.requiredPatterns)
          ) {
            patterns.push({
              id: `${step.id}-patterns`,
              name: `${step.name} Required Patterns`,
              description: `Required patterns for ${step.name}`,
              category: 'ARCHITECTURAL',
              requirements: enforcement.requiredPatterns,
              examples: [],
              priority: 'HIGH',
            });
          }
        }

        // Extract patterns from quality checklist
        if (step.qualityChecklist) {
          const checklist = step.qualityChecklist as Record<string, unknown>;
          if (checklist.qualityGates && Array.isArray(checklist.qualityGates)) {
            patterns.push({
              id: `${step.id}-quality`,
              name: `${step.name} Quality Gates`,
              description: `Quality requirements for ${step.name}`,
              category: 'QUALITY',
              requirements: checklist.qualityGates,
              examples: [],
              priority: 'MEDIUM',
            });
          }
        }
      }

      // If no database patterns found, use fallback
      if (patterns.length === 0) {
        return this.getQualityPatternsFallback(roleName, stepId);
      }

      this.logger.debug(
        `Found ${patterns.length} quality patterns for ${roleName}`,
      );
      return patterns;
    } catch (error) {
      this.logger.warn(
        `Failed to fetch quality patterns for ${roleName}:`,
        getErrorMessage(error),
      );
      return this.getQualityPatternsFallback(roleName, stepId);
    }
  }

  /**
   * Get validation checks from database using StepAction data
   */
  private async getValidationChecks(
    roleName: string,
    stepId: string | null,
  ): Promise<ValidationCheck[]> {
    try {
      // Query StepAction for validation-type actions
      const actions = await this.prisma.stepAction.findMany({
        where: {
          step: {
            role: { name: roleName },
            ...(stepId ? { id: stepId } : {}),
          },
          actionType: 'VALIDATION',
        },
        include: {
          step: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      const checks: ValidationCheck[] = [];

      for (const action of actions) {
        const actionData = action.actionData as Record<string, unknown>;

        // Extract validation criteria from action data
        const criteria = Array.isArray(actionData.criteria)
          ? actionData.criteria
          : ['Validation criteria not specified'];

        const expectedOutcome =
          typeof actionData.expectedOutcome === 'string'
            ? actionData.expectedOutcome
            : 'Validation should pass';

        const failureActions = Array.isArray(actionData.failureActions)
          ? actionData.failureActions
          : ['Review and fix validation errors'];

        checks.push({
          id: action.id,
          name: action.name,
          description: `Validation check for ${action.step.name}`,
          checkType: 'AUTOMATED', // Default to automated for database-driven checks
          criteria,
          expectedOutcome,
          failureActions,
        });
      }

      // If no database checks found, use fallback
      if (checks.length === 0) {
        return this.getValidationChecksFallback(roleName, stepId);
      }

      this.logger.debug(
        `Found ${checks.length} validation checks for ${roleName}`,
      );
      return checks;
    } catch (error) {
      this.logger.warn(
        `Failed to fetch validation checks for ${roleName}:`,
        getErrorMessage(error),
      );
      return this.getValidationChecksFallback(roleName, stepId);
    }
  }

  /**
   * Get anti-patterns from database using WorkflowStep pattern enforcement
   */
  private async getAntiPatterns(
    roleName: string,
    stepId: string | null,
  ): Promise<AntiPattern[]> {
    try {
      // Query WorkflowStep for pattern enforcement with anti-patterns
      const steps = await this.prisma.workflowStep.findMany({
        where: {
          role: { name: roleName },
          ...(stepId ? { id: stepId } : {}),
        },
        select: {
          id: true,
          name: true,
          patternEnforcement: true,
          contextValidation: true,
        },
      });

      const antiPatterns: AntiPattern[] = [];

      for (const step of steps) {
        // Extract anti-patterns from pattern enforcement
        if (step.patternEnforcement) {
          const enforcement = step.patternEnforcement as Record<
            string,
            unknown
          >;
          if (
            enforcement.antiPatterns &&
            Array.isArray(enforcement.antiPatterns)
          ) {
            for (const pattern of enforcement.antiPatterns) {
              if (typeof pattern === 'object' && pattern !== null) {
                const patternObj = pattern as Record<string, unknown>;
                const patternName =
                  typeof patternObj.name === 'string'
                    ? patternObj.name
                    : 'unknown';
                antiPatterns.push({
                  id: `${step.id}-${patternName}`,
                  name:
                    typeof patternObj.name === 'string'
                      ? patternObj.name
                      : 'Unknown Anti-Pattern',
                  description:
                    typeof patternObj.description === 'string'
                      ? patternObj.description
                      : 'Anti-pattern to avoid',
                  category: 'PATTERN_VIOLATION',
                  indicators: Array.isArray(patternObj.indicators)
                    ? patternObj.indicators
                    : [],
                  consequences: Array.isArray(patternObj.consequences)
                    ? patternObj.consequences
                    : [],
                  remediation: Array.isArray(patternObj.remediation)
                    ? patternObj.remediation
                    : [],
                });
              }
            }
          }
        }

        // Extract validation rules that indicate anti-patterns
        if (step.contextValidation) {
          const validation = step.contextValidation as Record<string, unknown>;
          if (
            validation.antiPatternChecks &&
            Array.isArray(validation.antiPatternChecks)
          ) {
            for (const check of validation.antiPatternChecks) {
              if (typeof check === 'string') {
                antiPatterns.push({
                  id: `${step.id}-validation-${check}`,
                  name: `Avoid ${check}`,
                  description: `Anti-pattern check: ${check}`,
                  category: 'VALIDATION',
                  indicators: [check],
                  consequences: ['Code quality degradation'],
                  remediation: ['Follow established patterns'],
                });
              }
            }
          }
        }
      }

      // If no database anti-patterns found, use fallback
      if (antiPatterns.length === 0) {
        return this.getAntiPatternsFallback(roleName, stepId);
      }

      this.logger.debug(
        `Found ${antiPatterns.length} anti-patterns for ${roleName}`,
      );
      return antiPatterns;
    } catch (error) {
      this.logger.warn(
        `Failed to fetch anti-patterns for ${roleName}:`,
        getErrorMessage(error),
      );
      return this.getAntiPatternsFallback(roleName, stepId);
    }
  }

  /**
   * Get role-specific standards from database with type safety
   */
  private async getRoleSpecificStandards(roleName: string): Promise<string[]> {
    try {
      const role = await this.prisma.workflowRole.findUnique({
        where: { name: roleName },
        select: {
          id: true,
          name: true,
          description: true,
        },
      });

      if (role) {
        // For now, use fallback until database schema is enhanced
        return this.getRoleStandardsFallback(roleName);
      }

      return this.getRoleStandardsFallback(roleName);
    } catch (error) {
      this.logger.warn(
        `Failed to fetch role standards for ${roleName}:`,
        getErrorMessage(error),
      );
      return this.getRoleStandardsFallback(roleName);
    }
  }

  /**
   * Get step-specific criteria from database
   */
  private async getStepSpecificCriteria(
    stepId: string | null,
  ): Promise<string[]> {
    if (!stepId) {
      return [];
    }

    try {
      const step = await this.prisma.workflowStep.findUnique({
        where: { id: stepId },
      });

      if (step) {
        // For now, return empty array until database schema is enhanced
        return [];
      }

      return [];
    } catch (error) {
      this.logger.warn(`Failed to fetch step criteria for ${stepId}:`, error);
      return [];
    }
  }

  /**
   * Get project-specific standards from database
   */
  private async getProjectStandards(taskId: number): Promise<string[]> {
    try {
      const task = await this.prisma.task.findUnique({
        where: { id: taskId },
      });

      if (task) {
        // For now, use fallback until database schema is enhanced
        return this.getProjectStandardsFallback();
      }

      return this.getProjectStandardsFallback();
    } catch (error) {
      this.logger.warn(
        `Failed to fetch project standards for task ${taskId}:`,
        error,
      );
      return this.getProjectStandardsFallback();
    }
  }

  /**
   * Fallback quality patterns when database is not available
   */
  private getQualityPatternsFallback(
    roleName: string,
    _stepId: string | null,
  ): QualityPattern[] {
    const commonPatterns: QualityPattern[] = [
      {
        id: 'solid-principles',
        name: 'SOLID Principles',
        description: 'Follow SOLID design principles for maintainable code',
        category: 'DESIGN',
        requirements: [
          'Single Responsibility Principle - One reason to change',
          'Open/Closed Principle - Open for extension, closed for modification',
          'Liskov Substitution Principle - Subtypes must be substitutable',
          'Interface Segregation Principle - Client-specific interfaces',
          'Dependency Inversion Principle - Depend on abstractions',
        ],
        examples: [
          'Separate concerns into different classes',
          'Use interfaces for extensibility',
          'Inject dependencies rather than creating them',
        ],
        priority: 'HIGH',
      },
    ];

    const roleSpecificPatterns: Record<string, QualityPattern[]> = {
      boomerang: [
        {
          id: 'requirements-clarity',
          name: 'Requirements Clarity',
          description: 'Ensure clear and complete requirements definition',
          category: 'ANALYSIS',
          requirements: [
            'All requirements are clearly defined',
            'Acceptance criteria are specific and measurable',
            'Business value is articulated',
          ],
          examples: [
            'User stories with clear acceptance criteria',
            'Business value statements',
          ],
          priority: 'HIGH',
        },
      ],
      'senior-developer': [
        {
          id: 'testing-strategy',
          name: 'Comprehensive Testing',
          description: 'Implement thorough testing at all levels',
          category: 'TESTING',
          requirements: [
            'Unit tests with high coverage',
            'Integration tests for critical paths',
          ],
          examples: ['Jest/Vitest unit tests', 'Supertest integration tests'],
          priority: 'HIGH',
        },
      ],
    };

    return [...commonPatterns, ...(roleSpecificPatterns[roleName] || [])];
  }

  /**
   * Fallback validation checks when database is not available
   */
  private getValidationChecksFallback(
    roleName: string,
    _stepId: string | null,
  ): ValidationCheck[] {
    const commonChecks: ValidationCheck[] = [
      {
        id: 'code-compilation',
        name: 'Code Compilation',
        description: 'Verify code compiles without errors',
        checkType: 'AUTOMATED',
        criteria: ['No compilation errors', 'No type errors'],
        expectedOutcome: 'Clean compilation with no errors',
        failureActions: ['Fix compilation errors', 'Resolve dependencies'],
      },
    ];

    const roleSpecificChecks: Record<string, ValidationCheck[]> = {
      'senior-developer': [
        {
          id: 'test-coverage',
          name: 'Test Coverage',
          description: 'Adequate test coverage for new code',
          checkType: 'AUTOMATED',
          criteria: ['Unit test coverage > 80%', 'Critical paths tested'],
          expectedOutcome: 'High test coverage with meaningful tests',
          failureActions: ['Add missing unit tests', 'Test edge cases'],
        },
      ],
    };

    return [...commonChecks, ...(roleSpecificChecks[roleName] || [])];
  }

  /**
   * Fallback anti-patterns when database is not available
   */
  private getAntiPatternsFallback(
    _roleName: string,
    _stepId: string | null,
  ): AntiPattern[] {
    const commonAntiPatterns: AntiPattern[] = [
      {
        id: 'god-object',
        name: 'God Object',
        description: 'Classes or functions that do too much',
        category: 'DESIGN',
        indicators: [
          'Classes with too many responsibilities',
          'Functions longer than 50 lines',
        ],
        consequences: ['Difficult to maintain', 'Hard to test'],
        remediation: ['Break into smaller classes', 'Extract methods'],
      },
    ];

    return commonAntiPatterns;
  }

  /**
   * Fallback role standards when database is not available
   */
  private getRoleStandardsFallback(roleName: string): string[] {
    const roleStandards: Record<string, string[]> = {
      boomerang: ['Ensure clear requirements', 'Validate business value'],
      researcher: [
        'Use credible sources',
        'Provide evidence-based conclusions',
      ],
      architect: ['Follow architectural principles', 'Ensure scalability'],
      'senior-developer': [
        'Follow SOLID principles',
        'Implement comprehensive testing',
      ],
      'code-review': ['Validate acceptance criteria', 'Check code quality'],
    };

    return roleStandards[roleName] || ['Follow best practices'];
  }

  /**
   * Fallback project standards when database is not available
   */
  private getProjectStandardsFallback(): string[] {
    return [
      'Follow TypeScript best practices',
      'Maintain consistent code style',
      'Implement proper error handling',
      'Write comprehensive tests',
    ];
  }

  /**
   * Get default validation context when building fails
   */
  private getDefaultValidationContext(): ValidationContext {
    return {
      qualityPatterns: [],
      validationChecks: [],
      antiPatterns: [],
      roleSpecificStandards: [],
      stepSpecificCriteria: [],
      projectStandards: [],
    };
  }
}
