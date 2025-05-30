import { Injectable, LoggerService, Scope } from '@nestjs/common';
import { FileLoggerService } from './file-logger.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable({ scope: Scope.DEFAULT })
export class GlobalFileLoggerService implements LoggerService {
  private fileLogger: FileLoggerService;
  private debugLogPath: string;

  constructor() {
    // Initialize FileLoggerService directly since this will be used globally
    this.fileLogger = new FileLoggerService();

    // Set up debug log file in current project folder
    this.debugLogPath = path.join(
      process.cwd(),
      'logs',
      'delegation-debug.log',
    );

    // Ensure logs directory exists
    const logsDir = path.dirname(this.debugLogPath);
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
  }

  /**
   * Write debug info to project log file for delegation analytics debugging
   */
  private writeDebugLog(level: string, message: any, context?: string): void {
    try {
      const timestamp = new Date().toISOString();
      const logEntry = `[${timestamp}] [${level}] [${context || 'Application'}] ${typeof message === 'string' ? message : JSON.stringify(message)}\n`;
      fs.appendFileSync(this.debugLogPath, logEntry);
    } catch (_error) {
      // Silently fail to avoid breaking the application
    }
  }

  /**
   * Write a 'log' level log.
   */
  log(message: any, context?: string): void {
    this.writeDebugLog('LOG', message, context);
    // Fire and forget - don't await to avoid blocking
    this.fileLogger.info(message, context || 'Application').catch(() => {});
  }

  /**
   * Write an 'error' level log.
   */
  error(message: any, trace?: string, context?: string): void {
    this.writeDebugLog('ERROR', `${message} ${trace || ''}`, context);
    // Fire and forget - don't await to avoid blocking
    this.fileLogger
      .error(message, trace, context || 'Application')
      .catch(() => {});
  }

  /**
   * Write a 'warn' level log.
   */
  warn(message: any, context?: string): void {
    this.writeDebugLog('WARN', message, context);
    // Fire and forget - don't await to avoid blocking
    this.fileLogger.warn(message, context || 'Application').catch(() => {});
  }

  /**
   * Write a 'debug' level log.
   */
  debug(message: any, context?: string): void {
    this.writeDebugLog('DEBUG', message, context);
    // Fire and forget - don't await to avoid blocking
    this.fileLogger.debug(message, context || 'Application').catch(() => {});
  }

  /**
   * Write a 'verbose' level log.
   */
  verbose(message: any, context?: string): void {
    this.writeDebugLog('VERBOSE', message, context);
    // Fire and forget - don't await to avoid blocking
    this.fileLogger.debug(message, context || 'Application').catch(() => {});
  }

  /**
   * Set log levels
   */
  setLogLevels?(_levels: string[]): void {
    // FileLoggerService doesn't support dynamic log levels, so we'll ignore this
    // In a production environment, you might want to implement this
  }
}
