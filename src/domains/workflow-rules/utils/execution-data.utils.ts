/**
 * Shared utilities for execution data handling
 *
 * Eliminates duplication between ExecutionAnalyticsService and ExecutionDataEnricherService
 * Provides type-safe data access and common calculations
 */
export class ExecutionDataUtils {
  /**
   * Safely get number property from execution object
   */
  static safeGetNumber(obj: any, key: string, fallback: number): number {
    const value = obj?.[key];
    return typeof value === 'number' ? value : fallback;
  }

  /**
   * Safely get string property from execution object
   */
  static safeGetString(obj: any, key: string, fallback: string): string {
    const value = obj?.[key];
    return typeof value === 'string' ? value : fallback;
  }

  /**
   * Safely get date property from execution object
   */
  static safeGetDate(obj: any, key: string, fallback?: Date): Date {
    const value = obj?.[key];
    return value instanceof Date ? value : fallback || new Date();
  }

  /**
   * Safely get boolean property from execution object
   */
  static safeGetBoolean(obj: any, key: string, fallback: boolean): boolean {
    const value = obj?.[key];
    return typeof value === 'boolean' ? value : fallback;
  }

  /**
   * Round progress percentage to specified precision
   */
  static roundProgress(progress: number, precision: number = 0): number {
    return (
      Math.round(progress * Math.pow(10, precision)) / Math.pow(10, precision)
    );
  }

  /**
   * Calculate duration between two dates
   */
  static calculateDuration(
    start: Date,
    end: Date,
    options: {
      showSeconds?: boolean;
      showDays?: boolean;
      fallback?: string;
    } = {},
  ): string {
    try {
      const diff = end.getTime() - start.getTime();

      if (options.showDays) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
        );
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) {
          return `${days}d ${hours}h ${minutes}m`;
        }
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (options.showSeconds) {
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        return `${hours}h ${minutes}m ${seconds}s`;
      }

      return `${hours}h ${minutes}m`;
    } catch (_error) {
      return options.fallback || '0h 0m';
    }
  }

  /**
   * Safely extract nested object property
   */
  static safeGetNestedProperty(
    obj: any,
    path: string,
    fallback: any = null,
  ): any {
    try {
      const keys = path.split('.');
      let current = obj;

      for (const key of keys) {
        if (current == null || typeof current !== 'object') {
          return fallback;
        }
        current = current[key];
      }

      return current !== undefined ? current : fallback;
    } catch (_error) {
      return fallback;
    }
  }

  /**
   * Validate execution object has required properties
   */
  static validateExecutionObject(
    obj: any,
    requiredFields: string[] = ['id'],
  ): boolean {
    if (!obj || typeof obj !== 'object') {
      return false;
    }

    return requiredFields.every((field) => obj[field] !== undefined);
  }

  /**
   * Calculate percentage with bounds checking
   */
  static calculatePercentage(
    completed: number,
    total: number,
    precision: number = 0,
  ): number {
    if (total <= 0) return 0;
    if (completed >= total) return 100;
    if (completed <= 0) return 0;

    const percentage = (completed / total) * 100;
    return this.roundProgress(percentage, precision);
  }

  /**
   * Group array of objects by a property value
   */
  static groupBy<T>(
    array: T[],
    keyExtractor: (item: T) => string,
    fallbackKey: string = 'unknown',
  ): Record<string, number> {
    return array.reduce((acc: Record<string, number>, item: T) => {
      try {
        const key = keyExtractor(item) || fallbackKey;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      } catch (_error) {
        acc[fallbackKey] = (acc[fallbackKey] || 0) + 1;
        return acc;
      }
    }, {});
  }

  /**
   * Calculate average from array of numbers with safe extraction
   */
  static calculateAverage<T>(
    array: T[],
    valueExtractor: (item: T) => number,
    fallback: number = 0,
  ): number {
    if (array.length === 0) return fallback;

    try {
      const sum = array.reduce((total: number, item: T) => {
        const value = valueExtractor(item);
        return total + (typeof value === 'number' ? value : 0);
      }, 0);

      return sum / array.length;
    } catch (_error) {
      return fallback;
    }
  }

  /**
   * Format time estimate for completion
   */
  static formatTimeEstimate(
    totalSteps: number,
    completedSteps: number,
    averageStepDuration?: number,
  ): string | null {
    if (!totalSteps || totalSteps === 0) return null;

    const remaining = totalSteps - completedSteps;
    if (remaining <= 0) return 'Near completion';

    if (averageStepDuration && averageStepDuration > 0) {
      const estimatedMinutes = remaining * averageStepDuration;
      const hours = Math.floor(estimatedMinutes / 60);
      const minutes = Math.round(estimatedMinutes % 60);

      if (hours > 0) {
        return `~${hours}h ${minutes}m remaining`;
      }
      return `~${minutes}m remaining`;
    }

    return `${remaining} steps remaining`;
  }

  /**
   * Calculate overall progress from multiple executions
   *
   * DEPENDENCY REDUCTION: Moved from ExecutionDataEnricherService to eliminate
   * circular dependency with ExecutionAnalyticsService. Both services can now
   * use this utility independently.
   */
  static calculateOverallProgress<T>(
    executions: T[],
    progressExtractor: (execution: T) => number,
    fallbackProgress: number = 0,
  ): { averageProgress: number; totalActive: number } {
    const total = executions.length;
    if (total === 0) {
      return {
        averageProgress: fallbackProgress,
        totalActive: 0,
      };
    }

    const averageProgress = this.calculateAverage(
      executions,
      progressExtractor,
      fallbackProgress,
    );

    return {
      averageProgress: this.roundProgress(averageProgress, 0),
      totalActive: total,
    };
  }
}
