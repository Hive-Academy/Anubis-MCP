// src/task-workflow/domains/reporting/services/file-logger.service.ts

import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * File Logger Service
 *
 * Provides file-based logging to avoid interfering with MCP STDIO protocol
 * Logs are written to the filesystem for debugging purposes
 */
@Injectable()
export class FileLoggerService {
  private readonly logDir: string;
  private readonly logFile: string;

  constructor() {
    this.logDir = path.join(process.cwd(), 'logs');
    this.logFile = path.join(this.logDir, 'reporting-debug.log');
    this.ensureLogDirectory();
  }

  /**
   * Log an info message
   */
  async info(message: string, context?: string): Promise<void> {
    await this.writeLog('INFO', message, context);
  }

  /**
   * Log a warning message
   */
  async warn(message: string, context?: string): Promise<void> {
    await this.writeLog('WARN', message, context);
  }

  /**
   * Log an error message
   */
  async error(message: string, error?: any, context?: string): Promise<void> {
    const errorDetails = error ? ` | Error: ${error.message || error}` : '';
    await this.writeLog('ERROR', `${message}${errorDetails}`, context);
  }

  /**
   * Log a debug message
   */
  async debug(message: string, data?: any, context?: string): Promise<void> {
    const dataDetails = data ? ` | Data: ${JSON.stringify(data, null, 2)}` : '';
    await this.writeLog('DEBUG', `${message}${dataDetails}`, context);
  }

  /**
   * Write log entry to file
   */
  private async writeLog(
    level: string,
    message: string,
    context?: string,
  ): Promise<void> {
    try {
      const timestamp = new Date().toISOString();
      const contextStr = context ? `[${context}] ` : '';
      const logEntry = `${timestamp} [${level}] ${contextStr}${message}\n`;

      await fs.appendFile(this.logFile, logEntry, 'utf-8');
    } catch (_error) {
      // Fallback to console only if file logging fails
      // This should be rare and won't interfere with normal operation
      console.error('Failed to write to log file:', _error);
    }
  }

  /**
   * Ensure log directory exists
   */
  private async ensureLogDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.logDir, { recursive: true });
    } catch (_error) {
      // Directory might already exist, ignore error
    }
  }

  /**
   * Clear log file (useful for testing)
   */
  async clearLogs(): Promise<void> {
    try {
      await fs.writeFile(this.logFile, '', 'utf-8');
    } catch (_error) {
      // Ignore if file doesn't exist
    }
  }

  /**
   * Get log file path for external access
   */
  getLogFilePath(): string {
    return this.logFile;
  }
}
