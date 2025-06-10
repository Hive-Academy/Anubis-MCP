import { Injectable, Logger } from '@nestjs/common';
import { StepAction } from 'generated/prisma';
import { StepExecutionContext } from './workflow-guidance.service';
import {
  CoreServiceOrchestrator,
  ServiceCallResult,
} from './core-service-orchestrator.service';
import { PrismaService } from '../../../../prisma/prisma.service';
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Configuration interfaces
export interface ActionExecutorConfig {
  defaultCommandTimeout: number;
  maxCommandTimeout: number;
  defaultFileEncoding: BufferEncoding;
  allowedCommands: string[];
  blockedCommands: string[];
  gitCommands: {
    status: string;
    statusClean: string;
  };
}

export interface ActionExecutionResult {
  success: boolean;
  message: string;
  data?: any;
  duration?: number;
}

/**
 * StepActionExecutor - Clean MCP-Compliant Action Execution Service
 *
 * This service provides action execution capabilities following MCP principles:
 * - Server provides tools and data access
 * - AI agents provide intelligence and decision-making
 * - No hardcoded generation logic (removed ~800 lines of violations)
 * - Simple template substitution for basic variables only
 * - Complex data generation delegated to AI agents
 */
@Injectable()
export class StepActionExecutor {
  private readonly logger = new Logger(StepActionExecutor.name);

  // Configuration with sensible defaults
  private readonly config: ActionExecutorConfig = {
    defaultCommandTimeout: 30000,
    maxCommandTimeout: 300000, // 5 minutes max
    defaultFileEncoding: 'utf8',
    allowedCommands: [
      'npm',
      'yarn',
      'git',
      'node',
      'tsc',
      'eslint',
      'prettier',
      'jest',
      'docker',
      'kubectl',
    ],
    blockedCommands: [
      'rm -rf /',
      'sudo',
      'su',
      'chmod 777',
      'dd',
      'mkfs',
      'fdisk',
      'format',
      'del /f /s /q',
      'rmdir /s /q',
    ],
    gitCommands: {
      status: 'git status --porcelain',
      statusClean: 'git status --porcelain',
    },
  };

  constructor(
    private readonly coreOrchestrator: CoreServiceOrchestrator,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Update action executor configuration
   */
  updateConfig(config: Partial<ActionExecutorConfig>): void {
    Object.assign(this.config, config);
    this.logger.log('Action executor configuration updated');
  }

  /**
   * Get current configuration
   */
  getConfig(): ActionExecutorConfig {
    return { ...this.config };
  }

  /**
   * Execute all actions for a step in sequence
   */
  async executeStepActions(
    actions: StepAction[],
    context: StepExecutionContext,
  ): Promise<ActionExecutionResult[]> {
    const results: ActionExecutionResult[] = [];

    // Sort actions by sequence order
    const sortedActions = actions.sort(
      (a, b) => a.sequenceOrder - b.sequenceOrder,
    );

    for (const action of sortedActions) {
      const result = await this.executeAction(action, context);
      results.push(result);

      // If an action fails and it's critical, stop execution
      if (!result.success && this.isCriticalAction(action)) {
        this.logger.error(
          `Critical action '${action.name}' failed, stopping execution`,
        );
        break;
      }
    }

    return results;
  }

  /**
   * Execute a single action
   */
  async executeAction(
    action: StepAction,
    context: StepExecutionContext,
  ): Promise<ActionExecutionResult> {
    const startTime = Date.now();

    try {
      this.logger.debug(
        `Executing action: ${action.name} (${action.actionType})`,
      );

      let result: ActionExecutionResult;

      switch (action.actionType) {
        case 'COMMAND':
          result = await this.executeCommand(action.actionData, context);
          break;
        case 'MCP_CALL':
          result = await this.executeServiceCall(action.actionData, context);
          break;
        case 'VALIDATION':
          result = await this.executeValidation(action.actionData, context);
          break;
        case 'REMINDER':
          result = this.executeReminder(action.actionData, context);
          break;
        case 'FILE_OPERATION':
          result = await this.executeFileOperation(action.actionData, context);
          break;
        default:
          this.logger.warn(
            `Unknown action type: ${action.actionType as string}`,
          );
          result = {
            success: false,
            message: `Unknown action type: ${action.actionType as string}`,
          };
      }

      result.duration = Date.now() - startTime;
      return result;
    } catch (error) {
      this.logger.error(`Error executing action ${action.name}:`, error);
      return {
        success: false,
        message: `Execution error: ${error.message}`,
        duration: Date.now() - startTime,
      };
    }
  }

  // Private action execution methods

  private async executeCommand(
    actionData: any,
    context: StepExecutionContext,
  ): Promise<ActionExecutionResult> {
    const {
      command,
      args = [],
      workingDirectory,
      timeout = this.config.defaultCommandTimeout,
      allowFailure = false,
    } = actionData;

    try {
      // Security validation
      const securityCheck = this.validateCommandSecurity(command, args);
      if (!securityCheck.isValid) {
        return {
          success: false,
          message: `Command blocked for security reasons: ${securityCheck.reason}`,
          data: { command, args, securityReason: securityCheck.reason },
        };
      }

      // Build full command
      const fullCommand = [command, ...args].join(' ');

      // Execute command
      const options = {
        timeout: Math.min(timeout, this.config.maxCommandTimeout),
        cwd: workingDirectory || context.projectPath || process.cwd(),
        encoding: this.config.defaultFileEncoding,
      };

      const { stdout, stderr } = await execAsync(fullCommand, options);

      const isSuccess = allowFailure || stderr.length === 0;

      return {
        success: isSuccess,
        message: isSuccess
          ? 'Command executed successfully'
          : `Command failed: ${stderr}`,
        data: {
          stdout: stdout?.toString() || '',
          stderr: stderr?.toString() || '',
          command: fullCommand,
          workingDirectory: options.cwd,
        },
      };
    } catch (error) {
      const errorMessage = `Command execution failed: ${error.message}`;
      this.logger.error(errorMessage, { command, args, error });

      if (allowFailure) {
        return {
          success: true,
          message: 'Command failed but failure is allowed',
          data: { error: error.message, command, args },
        };
      }

      return {
        success: false,
        message: errorMessage,
        data: { error: error.message, command, args },
      };
    }
  }

  private async executeServiceCall(
    actionData: any,
    context: StepExecutionContext,
  ): Promise<ActionExecutionResult> {
    try {
      const { serviceName, operation, parameters = {} } = actionData;

      if (!serviceName || !operation) {
        return {
          success: false,
          message: 'Service call requires serviceName and operation',
          data: { actionData },
        };
      }

      // Simple template variable substitution for basic variables only
      const substitutedParams = await this.substituteBasicVariables(
        parameters,
        context,
      );

      this.logger.debug(
        `Calling service: ${serviceName}.${operation}`,
        substitutedParams,
      );

      const result: ServiceCallResult =
        await this.coreOrchestrator.executeServiceCall(
          serviceName,
          operation,
          substitutedParams,
        );

      return {
        success: result.success,
        message:
          result.error ||
          (result.success ? 'Service call successful' : 'Service call failed'),
        data: result.data,
      };
    } catch (error) {
      this.logger.error('Service call execution failed:', error);
      return {
        success: false,
        message: `Service call failed: ${error.message}`,
        data: { error: error.message, actionData },
      };
    }
  }

  /**
   * Basic template variable substitution - only handles simple variables, not complex generation
   * Complex data generation should be handled by AI agent, not MCP server
   *
   * MCP PRINCIPLE: Server provides tools/context, AI agent provides intelligence
   */
  private async substituteBasicVariables(
    parameters: any,
    context: StepExecutionContext,
  ): Promise<any> {
    if (!parameters || typeof parameters !== 'object') {
      return parameters;
    }

    const substituted = JSON.parse(JSON.stringify(parameters));
    await this.recursiveBasicSubstitution(substituted, context);
    return substituted;
  }

  private async recursiveBasicSubstitution(
    obj: any,
    context: StepExecutionContext,
  ): Promise<void> {
    if (obj === null || obj === undefined) return;

    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        if (typeof obj[i] === 'string') {
          obj[i] = this.substituteBasicString(obj[i], context);
        } else if (typeof obj[i] === 'object') {
          await this.recursiveBasicSubstitution(obj[i], context);
        }
      }
    } else if (typeof obj === 'object') {
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
          obj[key] = this.substituteBasicString(value, context);
        } else if (typeof value === 'object') {
          await this.recursiveBasicSubstitution(value, context);
        }
      }
    }
  }

  /**
   * Substitute only basic template variables and provide guidance for complex data
   * This follows MCP principles: server provides tools/context, AI agent provides intelligence
   *
   * REMOVED: ~800 lines of hardcoded generation logic that violated MCP principles
   * ADDED: Simple guidance placeholders that instruct AI agents on what to do
   */
  private substituteBasicString(
    str: string,
    context: StepExecutionContext,
  ): string {
    if (typeof str !== 'string') return str;

    let result = str;

    // Basic variables that can be substituted directly
    const basicVariables: Record<string, string | number> = {
      '{{taskId}}': context.taskId?.toString() || 'TASK_ID_NOT_AVAILABLE',
      '{{roleId}}': context.roleId || 'ROLE_ID_NOT_AVAILABLE',
      '{{stepId}}': context.stepId || 'STEP_ID_NOT_AVAILABLE',
      '{{projectPath}}': context.projectPath || process.cwd(),
      '{{timestamp}}': new Date().toISOString(),
    };

    // Replace basic variables
    for (const [placeholder, value] of Object.entries(basicVariables)) {
      result = result.replace(
        new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'),
        value.toString(),
      );
    }

    // Handle complex data placeholders - provide guidance instead of generation
    // This is the correct MCP approach: server guides, AI agent generates
    const complexDataGuidance = {
      '{{implementationPlanData}}': {
        instruction:
          'AI_AGENT_INSTRUCTION: Use MCP tools to analyze codebase, gather requirements, and generate implementation plan. Then store the plan using task-manager tools.',
        suggestedTools: ['codebase_search', 'read_file', 'task_operations'],
        context: {
          taskId: context.taskId,
          currentRoleId: context.roleId,
          step: 'implementation-plan-creation',
        },
        example:
          'Use codebase_search to understand architecture, read_file for specific components, then create plan with your AI intelligence',
      },
      '{{strategicBatchData}}': {
        instruction:
          'AI_AGENT_INSTRUCTION: Analyze task requirements and create strategic subtask batches. Use your intelligence to break down the work logically.',
        suggestedTools: ['query_task_context', 'batch_subtask_operations'],
        context: {
          taskId: context.taskId,
          currentRoleId: context.roleId,
          step: 'strategic-batch-creation',
        },
        example:
          'Query task context, analyze requirements, then use batch_subtask_operations to create logical work batches',
      },
      '{{planApproach}}': {
        instruction:
          'AI_AGENT_INSTRUCTION: Analyze task and generate implementation approach based on codebase analysis and requirements.',
        example:
          'Provide high-level implementation strategy considering architecture patterns and constraints',
      },
      '{{technicalDecisions}}': {
        instruction:
          'AI_AGENT_INSTRUCTION: Make technical decisions based on codebase architecture and task requirements.',
        example:
          'Decide on technologies, patterns, and approaches based on analysis',
      },
      '{{filesToModify}}': {
        instruction:
          'AI_AGENT_INSTRUCTION: Use codebase analysis to identify files that need modification.',
        example:
          'List specific files that will be created or modified for this implementation',
      },
      '{{strategicGuidance}}': {
        instruction:
          'AI_AGENT_INSTRUCTION: Provide strategic guidance based on project context and requirements.',
        example:
          'High-level strategy and considerations for the implementation',
      },
    };

    // Replace complex data placeholders with AI agent guidance
    for (const [placeholder, guidance] of Object.entries(complexDataGuidance)) {
      if (result.includes(placeholder)) {
        result = result.replace(
          new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'),
          JSON.stringify(guidance, null, 2),
        );
      }
    }

    return result;
  }

  private async executeValidation(
    actionData: any,
    context: StepExecutionContext,
  ): Promise<ActionExecutionResult> {
    try {
      const {
        validationType,
        criteria,
        continueOnFailure = false,
      } = actionData;

      if (!validationType) {
        return {
          success: false,
          message: 'Validation requires validationType',
          data: { actionData },
        };
      }

      const isValid = await this.performValidation(
        validationType,
        criteria,
        context,
      );

      if (!isValid && !continueOnFailure) {
        return {
          success: false,
          message: `Validation failed: ${validationType}`,
          data: { validationType, criteria, result: isValid },
        };
      }

      return {
        success: true,
        message: isValid
          ? 'Validation passed'
          : 'Validation failed but continuing',
        data: { validationType, criteria, result: isValid },
      };
    } catch (error) {
      this.logger.error('Validation execution failed:', error);
      return {
        success: false,
        message: `Validation error: ${error.message}`,
        data: { error: error.message, actionData },
      };
    }
  }

  private executeReminder(
    actionData: any,
    _context: StepExecutionContext,
  ): ActionExecutionResult {
    const { message, level = 'info', data } = actionData;

    if (!message) {
      return {
        success: false,
        message: 'Reminder requires a message',
        data: { actionData },
      };
    }

    // Log the reminder based on level
    switch (level) {
      case 'error':
        this.logger.error(`REMINDER: ${message}`, data);
        break;
      case 'warn':
        this.logger.warn(`REMINDER: ${message}`, data);
        break;
      case 'debug':
        this.logger.debug(`REMINDER: ${message}`, data);
        break;
      default:
        this.logger.log(`REMINDER: ${message}`, data);
    }

    return {
      success: true,
      message: `Reminder logged: ${message}`,
      data: { level, message, data },
    };
  }

  private async executeFileOperation(
    actionData: any,
    context: StepExecutionContext,
  ): Promise<ActionExecutionResult> {
    try {
      const {
        operation,
        filePath,
        content,
        createDirectories = true,
      } = actionData;

      if (!operation || !filePath) {
        return {
          success: false,
          message: 'File operation requires operation and filePath',
          data: { actionData },
        };
      }

      const resolvedPath = this.resolveProjectPath(filePath, context);

      switch (operation) {
        case 'create':
        case 'write':
          if (createDirectories) {
            await this.ensureDirectoryExists(path.dirname(resolvedPath));
          }
          await fs.writeFile(
            resolvedPath,
            content || '',
            this.config.defaultFileEncoding,
          );
          return {
            success: true,
            message: `File ${operation}d successfully`,
            data: { filePath: resolvedPath, operation, content },
          };

        case 'read': {
          const fileContent = await fs.readFile(
            resolvedPath,
            this.config.defaultFileEncoding,
          );
          return {
            success: true,
            message: 'File read successfully',
            data: { filePath: resolvedPath, content: fileContent },
          };
        }

        case 'delete':
          await fs.unlink(resolvedPath);
          return {
            success: true,
            message: 'File deleted successfully',
            data: { filePath: resolvedPath },
          };

        case 'exists': {
          const exists = await this.fileExists(resolvedPath);
          return {
            success: true,
            message: `File ${exists ? 'exists' : 'does not exist'}`,
            data: { filePath: resolvedPath, exists },
          };
        }

        default:
          return {
            success: false,
            message: `Unknown file operation: ${operation}`,
            data: { operation, filePath: resolvedPath },
          };
      }
    } catch (error) {
      this.logger.error('File operation failed:', error);
      return {
        success: false,
        message: `File operation failed: ${error.message}`,
        data: { error: error.message, actionData },
      };
    }
  }

  private isCriticalAction(action: StepAction): boolean {
    // Consider an action critical if it has specific markers or is a validation
    return (
      action.actionType === 'VALIDATION' ||
      action.name.toLowerCase().includes('critical') ||
      action.name.toLowerCase().includes('required')
    );
  }

  private validateCommandSecurity(
    command: string,
    args: string[],
  ): { isValid: boolean; reason?: string } {
    // Check if command is in blocked list
    const fullCommand = [command, ...args].join(' ').toLowerCase();
    for (const blockedCmd of this.config.blockedCommands) {
      if (fullCommand.includes(blockedCmd.toLowerCase())) {
        return {
          isValid: false,
          reason: `Command contains blocked pattern: ${blockedCmd}`,
        };
      }
    }

    // Check if command is in allowed list (if not empty)
    if (this.config.allowedCommands.length > 0) {
      const isAllowed = this.config.allowedCommands.some((allowedCmd) =>
        command.toLowerCase().startsWith(allowedCmd.toLowerCase()),
      );
      if (!isAllowed) {
        return {
          isValid: false,
          reason: `Command not in allowed list: ${command}`,
        };
      }
    }

    // Additional security checks
    const dangerousPatterns = [
      />\s*\/dev\/null/,
      /&\s*$/,
      /;\s*rm/,
      /\|\s*sh/,
      /\|\s*bash/,
      /`.*`/,
      /\$\(.*\)/,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(fullCommand)) {
        return {
          isValid: false,
          reason: `Command contains dangerous pattern: ${pattern.source}`,
        };
      }
    }

    return { isValid: true };
  }

  private async performValidation(
    validationType: string,
    criteria: any,
    context: StepExecutionContext,
  ): Promise<boolean> {
    switch (validationType) {
      case 'file_exists':
        return await this.validateFileExists(criteria, context);
      case 'git_status':
        return await this.validateGitStatus(criteria, context);
      default:
        this.logger.warn(`Unknown validation type: ${validationType}`);
        return false;
    }
  }

  private async validateFileExists(
    criteria: any,
    context: StepExecutionContext,
  ): Promise<boolean> {
    const { filePath } = criteria;
    const resolvedPath = this.resolveProjectPath(filePath, context);
    return await this.fileExists(resolvedPath);
  }

  private async validateGitStatus(
    criteria: any,
    context: StepExecutionContext,
  ): Promise<boolean> {
    try {
      const { expectedStatus = 'clean' } = criteria;
      const { stdout } = await execAsync(this.config.gitCommands.status, {
        cwd: context.projectPath || process.cwd(),
      });

      switch (expectedStatus) {
        case 'clean':
          return stdout.trim() === '';
        case 'dirty':
          return stdout.trim() !== '';
        default:
          return stdout.includes(expectedStatus);
      }
    } catch (error) {
      this.logger.error('Git status validation failed:', error);
      return false;
    }
  }

  private resolveProjectPath(
    filePath: string,
    context: StepExecutionContext,
  ): string {
    if (path.isAbsolute(filePath)) {
      return filePath;
    }
    return path.join(context.projectPath || process.cwd(), filePath);
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      // Directory might already exist, which is fine
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }
}
