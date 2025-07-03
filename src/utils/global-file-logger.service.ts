import { Injectable, LoggerService, Scope } from '@nestjs/common';
import { FileLoggerService } from './file-logger.service';

@Injectable({ scope: Scope.DEFAULT })
export class GlobalFileLoggerService implements LoggerService {
  private fileLogger: FileLoggerService;

  constructor() {
    // Initialize FileLoggerService directly since this will be used globally
    this.fileLogger = new FileLoggerService();

    // Set up debug log file in current project folder
  }

  /**
   * Write a 'log' level log.
   */
  log(message: any, context?: string): void {
    // Fire and forget - don't await to avoid blocking
    this.fileLogger.info(message, context || 'Application').catch(() => {});
  }

  /**
   * Write an 'error' level log.
   */
  error(message: any, trace?: string, context?: string): void {
    // Fire and forget - don't await to avoid blocking
    this.fileLogger
      .error(message, trace, context || 'Application')
      .catch(() => {});
  }

  /**
   * Write a 'warn' level log.
   */
  warn(message: any, context?: string): void {
    // Fire and forget - don't await to avoid blocking
    this.fileLogger.warn(message, context || 'Application').catch(() => {});
  }

  /**
   * Write a 'debug' level log.
   */
  debug(message: any, context?: string): void {
    // Fire and forget - don't await to avoid blocking
    this.fileLogger.debug(message, context || 'Application').catch(() => {});
  }

  /**
   * Write a 'verbose' level log.
   */
  verbose(message: any, context?: string): void {
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
