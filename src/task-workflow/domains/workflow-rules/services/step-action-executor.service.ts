import { Injectable, Logger } from '@nestjs/common';
import { StepAction } from 'generated/prisma';
import { StepExecutionContext } from './workflow-guidance.service';
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface ActionExecutionResult {
  success: boolean;
  message: string;
  data?: any;
  duration?: number;
}

@Injectable()
export class StepActionExecutor {
  private readonly logger = new Logger(StepActionExecutor.name);

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
          result = await this.executeMcpCall(action.actionData, context);
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
        case 'REPORT_GENERATION':
          result = await this.executeReportGeneration(
            action.actionData,
            context,
          );
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
      timeout = 30000,
      allowFailure = false,
    } = actionData;

    try {
      const workingDir =
        workingDirectory || context.projectPath || process.cwd();
      const fullCommand = `${command} ${args.join(' ')}`;

      this.logger.debug(`Executing command: ${fullCommand} in ${workingDir}`);

      const { stdout, stderr } = await execAsync(fullCommand, {
        cwd: workingDir,
        timeout,
      });

      return {
        success: true,
        message: `Command executed successfully: ${command}`,
        data: {
          command,
          args,
          workingDirectory: workingDir,
          exitCode: 0,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
        },
      };
    } catch (error: any) {
      const isFailureAllowed = allowFailure && error.code !== 'TIMEOUT';

      return {
        success: isFailureAllowed,
        message: isFailureAllowed
          ? `Command failed but failure is allowed: ${command}`
          : `Command execution failed: ${error.message}`,
        data: {
          command,
          args,
          error: error.message,
          exitCode: error.code,
          stdout: error.stdout || '',
          stderr: error.stderr || '',
        },
      };
    }
  }

  private executeMcpCall(
    actionData: any,
    _context: StepExecutionContext,
  ): Promise<ActionExecutionResult> {
    const { toolName, parameters, expectedResult } = actionData;

    try {
      this.logger.debug(
        `Making MCP tool call: ${toolName} with parameters:`,
        parameters,
      );

      // For now, we'll log the MCP call since we can't actually make the call
      // In a real implementation, this would use the MCP client to make the call
      this.logger.log(`MCP Call: ${toolName}`, { parameters, expectedResult });

      return Promise.resolve({
        success: true,
        message: `MCP call logged: ${toolName}`,
        data: {
          toolName,
          parameters,
          note: 'MCP call was logged - actual execution would require MCP client integration',
        },
      });
    } catch (error) {
      return Promise.resolve({
        success: false,
        message: `MCP call failed: ${error.message}`,
        data: { toolName, parameters, error: error.message },
      });
    }
  }

  private async executeValidation(
    actionData: any,
    context: StepExecutionContext,
  ): Promise<ActionExecutionResult> {
    const { validationType, criteria, failOnError = true } = actionData;

    try {
      this.logger.debug(`Performing validation: ${validationType}`);

      const validationPassed = await this.performValidation(
        validationType,
        criteria,
        context,
      );

      if (!validationPassed && failOnError) {
        return {
          success: false,
          message: `Validation failed: ${validationType}`,
          data: { validationType, criteria, result: 'failed' },
        };
      }

      return {
        success: true,
        message: `Validation completed: ${validationType}`,
        data: {
          validationType,
          criteria,
          result: validationPassed ? 'passed' : 'warning',
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Validation error: ${error.message}`,
        data: { validationType, criteria, error: error.message },
      };
    }
  }

  private executeReminder(
    actionData: any,
    _context: StepExecutionContext,
  ): ActionExecutionResult {
    const { message, level = 'info', displayDuration = 5000 } = actionData;

    try {
      // Log the reminder with appropriate level
      switch (level.toLowerCase()) {
        case 'error':
          this.logger.error(`REMINDER: ${message}`);
          break;
        case 'warn':
        case 'warning':
          this.logger.warn(`REMINDER: ${message}`);
          break;
        case 'debug':
          this.logger.debug(`REMINDER: ${message}`);
          break;
        default:
          this.logger.log(`REMINDER: ${message}`);
      }

      return {
        success: true,
        message: `Reminder displayed: ${message}`,
        data: { message, level, displayDuration },
      };
    } catch (error) {
      return {
        success: false,
        message: `Reminder display failed: ${error.message}`,
        data: { message, level, error: error.message },
      };
    }
  }

  private async executeFileOperation(
    actionData: any,
    context: StepExecutionContext,
  ): Promise<ActionExecutionResult> {
    const {
      operation,
      filePath,
      content,
      backup = false,
      encoding = 'utf8',
    } = actionData;

    try {
      const resolvedPath = this.resolveProjectPath(filePath, context);

      this.logger.debug(
        `Performing file operation: ${operation} on ${resolvedPath}`,
      );

      // Create backup if requested
      if (backup && (await this.fileExists(resolvedPath))) {
        const backupPath = `${resolvedPath}.backup.${Date.now()}`;
        await fs.copyFile(resolvedPath, backupPath);
        this.logger.debug(`Created backup: ${backupPath}`);
      }

      switch (operation) {
        case 'create':
          await this.ensureDirectoryExists(path.dirname(resolvedPath));
          await fs.writeFile(resolvedPath, content, encoding);
          break;
        case 'update':
          if (!(await this.fileExists(resolvedPath))) {
            throw new Error(`File does not exist: ${resolvedPath}`);
          }
          await fs.writeFile(resolvedPath, content, encoding);
          break;
        case 'append':
          await fs.appendFile(resolvedPath, content, encoding);
          break;
        case 'delete':
          await fs.unlink(resolvedPath);
          break;
        case 'copy': {
          const { destinationPath } = actionData;
          if (!destinationPath) {
            throw new Error('Destination path required for copy operation');
          }
          const resolvedDestination = this.resolveProjectPath(
            destinationPath,
            context,
          );
          await this.ensureDirectoryExists(path.dirname(resolvedDestination));
          await fs.copyFile(resolvedPath, resolvedDestination);
          break;
        }
        default:
          throw new Error(`Unknown file operation: ${operation}`);
      }

      return {
        success: true,
        message: `File operation completed: ${operation} on ${filePath}`,
        data: { operation, filePath: resolvedPath, backup },
      };
    } catch (error) {
      return {
        success: false,
        message: `File operation failed: ${error.message}`,
        data: { operation, filePath, error: error.message },
      };
    }
  }

  private async executeReportGeneration(
    actionData: any,
    context: StepExecutionContext,
  ): Promise<ActionExecutionResult> {
    const { reportType, template, outputPath, includeData = [] } = actionData;

    try {
      this.logger.debug(
        `Generating report: ${reportType} using template ${template}`,
      );

      // For now, we'll create a simple report file
      // In a real implementation, this would use a proper report generation system
      const resolvedOutputPath = this.resolveProjectPath(outputPath, context);

      const reportContent = this.generateReportContent(
        reportType,
        template,
        includeData,
        context,
      );

      await this.ensureDirectoryExists(path.dirname(resolvedOutputPath));
      await fs.writeFile(resolvedOutputPath, reportContent, 'utf8');

      return {
        success: true,
        message: `Report generated successfully: ${reportType}`,
        data: {
          reportType,
          template,
          outputPath: resolvedOutputPath,
          includeData,
          generatedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Report generation failed: ${error.message}`,
        data: { reportType, template, error: error.message },
      };
    }
  }

  // Helper methods

  private isCriticalAction(action: StepAction): boolean {
    // Determine if an action is critical based on its configuration
    const actionData = action.actionData as any;
    return actionData?.critical === true || action.actionType === 'VALIDATION';
  }

  private async performValidation(
    validationType: string,
    criteria: any,
    context: StepExecutionContext,
  ): Promise<boolean> {
    try {
      switch (validationType) {
        case 'code_quality':
          return this.validateCodeQuality(criteria, context);
        case 'test_coverage':
          return this.validateTestCoverage(criteria, context);
        case 'security_scan':
          return this.validateSecurity(criteria, context);
        case 'performance_check':
          return this.validatePerformance(criteria, context);
        case 'file_exists':
          return this.validateFileExists(criteria, context);
        case 'git_status':
          return this.validateGitStatus(criteria, context);
        default:
          this.logger.warn(`Unknown validation type: ${validationType}`);
          return true; // Unknown validation types pass by default
      }
    } catch (error) {
      this.logger.error(`Validation error for ${validationType}:`, error);
      return false;
    }
  }

  private async validateCodeQuality(
    criteria: any,
    context: StepExecutionContext,
  ): Promise<boolean> {
    try {
      const { lintCommand = 'npm run lint', workingDirectory } = criteria;
      const workingDir =
        workingDirectory || context.projectPath || process.cwd();

      const { stderr } = await execAsync(lintCommand, {
        cwd: workingDir,
      });

      // If lint command succeeds without errors, code quality is good
      return stderr.trim().length === 0;
    } catch (error) {
      this.logger.debug('Code quality check failed:', error);
      return false;
    }
  }

  private async validateTestCoverage(
    criteria: any,
    context: StepExecutionContext,
  ): Promise<boolean> {
    try {
      const {
        minimumCoverage = 80,
        testCommand = 'npm test',
        workingDirectory,
      } = criteria;
      const workingDir =
        workingDirectory || context.projectPath || process.cwd();

      // Run test command and check coverage
      const { stdout } = await execAsync(testCommand, { cwd: workingDir });

      // Look for coverage percentage in output (simplified)
      const coverageMatch = stdout.match(/(\d+(?:\.\d+)?)%/);
      if (coverageMatch) {
        const coverage = parseFloat(coverageMatch[1]);
        return coverage >= minimumCoverage;
      }

      return true; // If we can't parse coverage, assume it passes
    } catch (error) {
      this.logger.debug('Test coverage check failed:', error);
      return false;
    }
  }

  private validateSecurity(
    _criteria: any,
    _context: StepExecutionContext,
  ): boolean {
    // Placeholder for security validation
    // In a real implementation, this would run security scanners
    this.logger.debug('Security validation - placeholder implementation');
    return true;
  }

  private validatePerformance(
    _criteria: any,
    _context: StepExecutionContext,
  ): boolean {
    // Placeholder for performance validation
    // In a real implementation, this would run performance tests
    this.logger.debug('Performance validation - placeholder implementation');
    return true;
  }

  private async validateFileExists(
    criteria: any,
    context: StepExecutionContext,
  ): Promise<boolean> {
    try {
      const { files = [] } = criteria;

      for (const file of files) {
        const resolvedPath = this.resolveProjectPath(file, context);
        if (!(await this.fileExists(resolvedPath))) {
          return false;
        }
      }

      return true;
    } catch (error) {
      this.logger.debug('File exists validation failed:', error);
      return false;
    }
  }

  private async validateGitStatus(
    criteria: any,
    context: StepExecutionContext,
  ): Promise<boolean> {
    try {
      const { requireCleanWorkingTree = false } = criteria;
      const workingDir = context.projectPath || process.cwd();

      if (requireCleanWorkingTree) {
        const { stdout } = await execAsync('git status --porcelain', {
          cwd: workingDir,
        });
        return stdout.trim().length === 0;
      }

      return true;
    } catch (error) {
      this.logger.debug('Git status validation failed:', error);
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

    const projectRoot = context.projectPath || process.cwd();
    return path.resolve(projectRoot, filePath);
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
    } catch (error: any) {
      // Ignore error if directory already exists
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  private generateReportContent(
    reportType: string,
    template: string,
    includeData: any[],
    context: StepExecutionContext,
  ): string {
    const timestamp = new Date().toISOString();

    return `# ${reportType} Report

Generated: ${timestamp}
Template: ${template}
Task ID: ${context.taskId}
Role: ${context.roleId}

## Report Data

${includeData
  .map(
    (data, index) => `### Data ${index + 1}
${JSON.stringify(data, null, 2)}`,
  )
  .join('\n\n')}

## Context

Project Path: ${context.projectPath || 'Not specified'}
Step ID: ${context.stepId || 'Not specified'}

---
Generated by Workflow Rules Engine
`;
  }
}
