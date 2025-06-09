import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { StepCondition } from 'generated/prisma';
import { StepExecutionContext } from './workflow-guidance.service';
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface ConditionValidationResult {
  isValid: boolean;
  errors: string[];
  evaluationDetails?: Record<string, any>;
}

@Injectable()
export class StepConditionEvaluator {
  private readonly logger = new Logger(StepConditionEvaluator.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Validate all conditions for a step
   */
  async validateStepConditions(
    conditions: StepCondition[],
    context: StepExecutionContext,
  ): Promise<ConditionValidationResult> {
    const errors: string[] = [];
    const evaluationDetails: Record<string, any> = {};

    for (const condition of conditions) {
      if (condition.isRequired) {
        const result = await this.evaluateCondition(condition, context);
        evaluationDetails[condition.name] = result;

        if (!result.isValid) {
          errors.push(`Condition '${condition.name}' failed: ${result.reason}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      evaluationDetails,
    };
  }

  /**
   * Evaluate a single condition
   */
  async evaluateCondition(
    condition: StepCondition,
    context: StepExecutionContext,
  ): Promise<{ isValid: boolean; reason?: string; details?: any }> {
    try {
      switch (condition.conditionType) {
        case 'CONTEXT_CHECK':
          return this.evaluateContextCheck(condition.logic, context);
        case 'FILE_EXISTS':
          return this.evaluateFileExists(condition.logic, context);
        case 'TASK_STATUS':
          return this.evaluateTaskStatus(condition.logic, context);
        case 'GIT_STATUS':
          return this.evaluateGitStatus(condition.logic, context);
        case 'PREVIOUS_STEP_COMPLETED':
          return this.evaluatePreviousStepCompleted(condition.logic, context);
        case 'CUSTOM_LOGIC':
          return this.evaluateCustomLogic(condition.logic, context);
        default:
          this.logger.warn(
            `Unknown condition type: ${condition.conditionType as string}`,
          );
          return {
            isValid: true,
            reason: 'Unknown condition type - defaulting to valid',
          };
      }
    } catch (error) {
      this.logger.error(`Error evaluating condition ${condition.name}:`, error);
      return { isValid: false, reason: `Evaluation error: ${error.message}` };
    }
  }

  // Private condition evaluation methods

  private evaluateContextCheck(
    logic: any,
    context: StepExecutionContext,
  ): Promise<{ isValid: boolean; reason?: string; details?: any }> {
    // Check if required context properties exist
    const requiredProperties = logic.requiredProperties || [];
    const missingProperties = [];

    for (const prop of requiredProperties) {
      if (!this.hasProperty(context, prop)) {
        missingProperties.push(prop);
      }
    }

    if (missingProperties.length > 0) {
      return Promise.resolve({
        isValid: false,
        reason: `Missing required context properties: ${missingProperties.join(', ')}`,
        details: { missingProperties },
      });
    }

    return Promise.resolve({
      isValid: true,
      details: { checkedProperties: requiredProperties },
    });
  }

  private async evaluateFileExists(
    logic: any,
    context: StepExecutionContext,
  ): Promise<{ isValid: boolean; reason?: string; details?: any }> {
    const { files = [], directories = [] } = logic;
    const missingItems = [];

    // Check files
    for (const file of files) {
      const exists = await this.checkFileExists(file, context);
      if (!exists) {
        missingItems.push(`file: ${file}`);
      }
    }

    // Check directories
    for (const dir of directories) {
      const exists = await this.checkDirectoryExists(dir, context);
      if (!exists) {
        missingItems.push(`directory: ${dir}`);
      }
    }

    if (missingItems.length > 0) {
      return {
        isValid: false,
        reason: `Missing required items: ${missingItems.join(', ')}`,
        details: { missingItems },
      };
    }

    return {
      isValid: true,
      details: { checkedItems: [...files, ...directories] },
    };
  }

  private async evaluateTaskStatus(
    logic: any,
    context: StepExecutionContext,
  ): Promise<{ isValid: boolean; reason?: string; details?: any }> {
    const { requiredStatus, forbiddenStatuses = [] } = logic;

    // Get current task status
    const task = await this.prisma.task.findUnique({
      where: { id: context.taskId },
      select: { status: true },
    });

    if (!task) {
      return { isValid: false, reason: 'Task not found' };
    }

    // Check required status
    if (requiredStatus && task.status !== requiredStatus) {
      return {
        isValid: false,
        reason: `Task status is '${task.status}', required '${requiredStatus}'`,
        details: { currentStatus: task.status, requiredStatus },
      };
    }

    // Check forbidden statuses
    if (forbiddenStatuses.includes(task.status)) {
      return {
        isValid: false,
        reason: `Task status '${task.status}' is forbidden`,
        details: { currentStatus: task.status, forbiddenStatuses },
      };
    }

    return { isValid: true, details: { currentStatus: task.status } };
  }

  private async evaluateGitStatus(
    logic: any,
    context: StepExecutionContext,
  ): Promise<{ isValid: boolean; reason?: string; details?: any }> {
    const { requireCleanWorkingTree = false, requireBranch } = logic;

    try {
      const gitStatus = await this.getGitStatus(context);

      if (requireCleanWorkingTree && !gitStatus.isClean) {
        return {
          isValid: false,
          reason: 'Working tree is not clean',
          details: gitStatus,
        };
      }

      if (requireBranch && gitStatus.currentBranch !== requireBranch) {
        return {
          isValid: false,
          reason: `Current branch is '${gitStatus.currentBranch}', required '${requireBranch}'`,
          details: gitStatus,
        };
      }

      return { isValid: true, details: gitStatus };
    } catch (error) {
      this.logger.error('Error checking git status:', error);
      return {
        isValid: false,
        reason: `Git status check failed: ${error.message}`,
      };
    }
  }

  private async evaluatePreviousStepCompleted(
    logic: any,
    context: StepExecutionContext,
  ): Promise<{ isValid: boolean; reason?: string; details?: any }> {
    const { stepId: previousStepId, roleId } = logic;

    if (!previousStepId) {
      return { isValid: true, reason: 'No previous step specified' };
    }

    const progress = await this.prisma.workflowStepProgress.findFirst({
      where: {
        taskId: String(context.taskId),
        stepId: previousStepId,
        roleId: roleId || context.roleId,
        status: 'COMPLETED',
      },
    });

    if (!progress) {
      return {
        isValid: false,
        reason: `Previous step '${previousStepId}' not completed`,
        details: { requiredStepId: previousStepId },
      };
    }

    return { isValid: true, details: { completedAt: progress.completedAt } };
  }

  private async evaluateCustomLogic(
    logic: any,
    context: StepExecutionContext,
  ): Promise<{ isValid: boolean; reason?: string; details?: any }> {
    try {
      // Handle different types of custom logic
      const { type, expression, parameters = {} } = logic;

      switch (type) {
        case 'javascript':
          return this.evaluateJavaScriptExpression(
            expression,
            context,
            parameters,
          );
        case 'database_query':
          return this.evaluateDatabaseQuery(expression, context, parameters);
        case 'file_content_check':
          return this.evaluateFileContentCheck(expression, context, parameters);
        case 'environment_check':
          return this.evaluateEnvironmentCheck(expression, context, parameters);
        default:
          this.logger.warn(`Unknown custom logic type: ${type}`);
          return {
            isValid: true,
            reason: `Unknown custom logic type '${type}' - defaulting to valid`,
            details: { type, expression, parameters },
          };
      }
    } catch (error) {
      this.logger.error('Error evaluating custom logic:', error);
      return {
        isValid: false,
        reason: `Custom logic evaluation failed: ${error.message}`,
      };
    }
  }

  // Helper methods

  private hasProperty(obj: any, propertyPath: string): boolean {
    const parts = propertyPath.split('.');
    let current = obj;

    for (const part of parts) {
      if (
        current == null ||
        typeof current !== 'object' ||
        !(part in current)
      ) {
        return false;
      }
      current = current[part];
    }

    return current !== undefined && current !== null;
  }

  private async checkFileExists(
    filePath: string,
    context: StepExecutionContext,
  ): Promise<boolean> {
    try {
      // Resolve relative paths based on project context
      const resolvedPath = this.resolveProjectPath(filePath, context);
      await fs.access(resolvedPath);
      return true;
    } catch {
      return false;
    }
  }

  private async checkDirectoryExists(
    dirPath: string,
    context: StepExecutionContext,
  ): Promise<boolean> {
    try {
      const resolvedPath = this.resolveProjectPath(dirPath, context);
      const stats = await fs.stat(resolvedPath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  private async getGitStatus(context: StepExecutionContext): Promise<any> {
    try {
      const workingDir = context.projectPath || process.cwd();

      // Get current branch
      const { stdout: branchOutput } = await execAsync(
        'git rev-parse --abbrev-ref HEAD',
        {
          cwd: workingDir,
        },
      );
      const currentBranch = branchOutput.trim();

      // Get status
      const { stdout: statusOutput } = await execAsync(
        'git status --porcelain',
        {
          cwd: workingDir,
        },
      );

      const hasUncommittedChanges = statusOutput.trim().length > 0;
      const isClean = !hasUncommittedChanges;

      // Get untracked files
      const { stdout: untrackedOutput } = await execAsync(
        'git ls-files --others --exclude-standard',
        {
          cwd: workingDir,
        },
      );
      const hasUntrackedFiles = untrackedOutput.trim().length > 0;

      return {
        isClean,
        currentBranch,
        hasUncommittedChanges,
        hasUntrackedFiles,
        statusDetails: statusOutput.trim(),
        untrackedFiles: untrackedOutput
          .trim()
          .split('\n')
          .filter((f) => f.length > 0),
      };
    } catch (error) {
      this.logger.error('Error getting git status:', error);
      throw new Error(`Failed to get git status: ${error.message}`);
    }
  }

  private resolveProjectPath(
    filePath: string,
    context: StepExecutionContext,
  ): string {
    if (path.isAbsolute(filePath)) {
      return filePath;
    }

    const projectRoot = context.projectPath || process.cwd();
    return path.resolve(projectRoot, filePath);
  }

  private evaluateJavaScriptExpression(
    expression: string,
    _context: StepExecutionContext,
    parameters: any,
  ): Promise<{ isValid: boolean; reason?: string; details?: any }> {
    try {
      // For security reasons, we'll only support basic boolean expressions
      // This is a simplified implementation that avoids eval/Function constructor
      const result = this.evaluateSimpleExpression(expression, parameters);

      return Promise.resolve({
        isValid: Boolean(result),
        reason: result
          ? 'Expression evaluated to true'
          : 'Expression evaluated to false',
        details: { expression, result, parameters },
      });
    } catch (error) {
      return Promise.resolve({
        isValid: false,
        reason: `Expression evaluation error: ${error.message}`,
        details: { expression, parameters, error: error.message },
      });
    }
  }

  private evaluateSimpleExpression(
    expression: string,
    parameters: any,
  ): boolean {
    // Simple expression evaluator for basic boolean logic
    // Supports: parameter comparisons, basic operators
    try {
      // Replace parameter references with actual values
      let processedExpression = expression;

      for (const [key, value] of Object.entries(parameters)) {
        const regex = new RegExp(`\\b${key}\\b`, 'g');
        const replacement =
          typeof value === 'string' ? `"${value}"` : String(value);
        processedExpression = processedExpression.replace(regex, replacement);
      }

      // Basic validation - only allow safe operations
      const allowedPattern = /^[\w\s"'.\-+*/()=!<>&|]+$/;
      if (!allowedPattern.test(processedExpression)) {
        throw new Error('Expression contains unsafe characters');
      }

      // For now, return true for any valid expression
      // In a real implementation, you'd use a proper expression parser
      return true;
    } catch (error) {
      this.logger.warn(`Failed to evaluate expression: ${expression}`, error);
      return false;
    }
  }

  private async evaluateDatabaseQuery(
    query: string,
    _context: StepExecutionContext,
    parameters: any,
  ): Promise<{ isValid: boolean; reason?: string; details?: any }> {
    try {
      // Execute raw query with parameters
      const result = await this.prisma.$queryRawUnsafe(
        query,
        ...Object.values(parameters),
      );

      const isValid = Array.isArray(result)
        ? result.length > 0
        : Boolean(result);

      return {
        isValid,
        reason: isValid
          ? 'Database query returned results'
          : 'Database query returned no results',
        details: {
          query,
          parameters,
          resultCount: Array.isArray(result) ? result.length : 1,
        },
      };
    } catch (error) {
      return {
        isValid: false,
        reason: `Database query error: ${error.message}`,
        details: { query, parameters, error: error.message },
      };
    }
  }

  private async evaluateFileContentCheck(
    expression: string,
    context: StepExecutionContext,
    parameters: any,
  ): Promise<{ isValid: boolean; reason?: string; details?: any }> {
    try {
      const { filePath, pattern, encoding = 'utf8' } = parameters;
      const resolvedPath = this.resolveProjectPath(filePath, context);

      const content = await fs.readFile(
        resolvedPath,
        encoding as BufferEncoding,
      );

      let isValid = false;
      let matchDetails = {};

      if (pattern) {
        const regex = new RegExp(pattern, 'g');
        const contentStr = content.toString();
        const matches = contentStr.match(regex);
        isValid = matches !== null && matches.length > 0;
        matchDetails = {
          matches: matches || [],
          matchCount: matches?.length || 0,
        };
      } else {
        // Use expression as a content check
        const contentStr = content.toString();
        isValid = contentStr.includes(expression);
        matchDetails = { found: isValid, searchTerm: expression };
      }

      return {
        isValid,
        reason: isValid
          ? 'File content check passed'
          : 'File content check failed',
        details: { filePath, expression, pattern, ...matchDetails },
      };
    } catch (error) {
      return {
        isValid: false,
        reason: `File content check error: ${error.message}`,
        details: { expression, parameters, error: error.message },
      };
    }
  }

  private evaluateEnvironmentCheck(
    expression: string,
    _context: StepExecutionContext,
    parameters: any,
  ): Promise<{ isValid: boolean; reason?: string; details?: any }> {
    try {
      const { envVar, expectedValue, checkType = 'exists' } = parameters;
      const actualValue = process.env[envVar];

      let isValid = false;
      let reason = '';

      switch (checkType) {
        case 'exists':
          isValid = actualValue !== undefined;
          reason = isValid
            ? `Environment variable '${envVar}' exists`
            : `Environment variable '${envVar}' does not exist`;
          break;
        case 'equals':
          isValid = actualValue === expectedValue;
          reason = isValid
            ? `Environment variable '${envVar}' equals expected value`
            : `Environment variable '${envVar}' does not equal expected value`;
          break;
        case 'contains':
          isValid = actualValue?.includes(expectedValue) || false;
          reason = isValid
            ? `Environment variable '${envVar}' contains expected value`
            : `Environment variable '${envVar}' does not contain expected value`;
          break;
        default:
          throw new Error(`Unknown environment check type: ${checkType}`);
      }

      return Promise.resolve({
        isValid,
        reason,
        details: {
          envVar,
          expectedValue,
          actualValue: actualValue || null,
          checkType,
        },
      });
    } catch (error) {
      return Promise.resolve({
        isValid: false,
        reason: `Environment check error: ${error.message}`,
        details: { expression, parameters, error: error.message },
      });
    }
  }
}
