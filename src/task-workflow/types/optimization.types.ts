/**
 * Optimization Types for Anubis
 *
 * Provides configurable optimization levels to balance token efficiency
 * with data completeness based on specific use case requirements.
 */

/**
 * Optimization levels for context retrieval
 */
export enum OptimizationLevel {
  /**
   * NONE: No optimization, raw data from database
   * - Best for: Debugging optimization issues, complete data access
   * - Token savings: 0%
   * - Use case: Fixing workflow breakdowns, complete context access
   */
  NONE = 'NONE',

  /**
   * MINIMAL: Only essential identifiers and status
   * - Best for: Quick status checks, batch operations
   * - Token savings: ~95%
   * - Use case: Automated scripts, status monitoring
   */
  MINIMAL = 'MINIMAL',

  /**
   * SUMMARY: Optimized summaries with key metrics
   * - Best for: Progress tracking, dashboard views
   * - Token savings: ~80-90%
   * - Use case: Regular workflow progress checks
   */
  SUMMARY = 'SUMMARY',

  /**
   * FULL: Complete, unoptimized data
   * - Best for: Detailed analysis, decision making, debugging
   * - Token savings: 0%
   * - Use case: Architecture decisions, detailed reviews
   */
  FULL = 'FULL',
}

/**
 * Context slice types for targeted data retrieval
 */
export enum ContextSliceType {
  STATUS = 'STATUS',
  TD = 'TD', // Task Description
  IP = 'IP', // Implementation Plan
  RR = 'RR', // Research Report
  CRD = 'CRD', // Code Review Data
  CP = 'CP', // Completion Plan
  AC = 'AC', // Acceptance Criteria
  SUBTASKS = 'SUBTASKS',
  COMMENTS = 'COMMENTS',
  DELEGATIONS = 'DELEGATIONS',
  FULL_TASK = 'FULL_TASK',
  WORKFLOW = 'WORKFLOW',
}

/**
 * Optimization configuration for context requests
 */
export interface OptimizationConfig {
  level: OptimizationLevel;
  sliceType?: ContextSliceType;
  maxTokens?: number;
  includeMetrics?: boolean;
}

/**
 * Optimization metrics for tracking efficiency
 */
export interface OptimizationMetrics {
  originalSize: number;
  optimizedSize: number;
  compressionRatio: string;
  tokensSaved: number;
  responseTime: string;
  level: OptimizationLevel;
  sliceType?: ContextSliceType;
}

/**
 * Context response wrapper with optimization information
 */
export interface OptimizedContextResponse<T = any> {
  data: T;
  optimization: OptimizationMetrics;
}

/**
 * Default optimization configurations for common use cases
 */
export const DEFAULT_OPTIMIZATION_CONFIGS: Record<string, OptimizationConfig> =
  {
    // Quick status checks
    STATUS_CHECK: {
      level: OptimizationLevel.MINIMAL,
      sliceType: ContextSliceType.STATUS,
      includeMetrics: false,
    },

    // Progress monitoring
    PROGRESS_TRACKING: {
      level: OptimizationLevel.SUMMARY,
      includeMetrics: true,
    },

    // Detailed analysis
    DETAILED_ANALYSIS: {
      level: OptimizationLevel.FULL,
      includeMetrics: true,
    },

    // Batch operations
    BATCH_OPERATIONS: {
      level: OptimizationLevel.MINIMAL,
      maxTokens: 100,
      includeMetrics: false,
    },
  };

/**
 * Helper function to determine appropriate optimization level
 */
export function getRecommendedOptimizationLevel(
  useCase:
    | 'status-check'
    | 'progress-tracking'
    | 'detailed-analysis'
    | 'batch-operations',
): OptimizationConfig {
  switch (useCase) {
    case 'status-check':
      return DEFAULT_OPTIMIZATION_CONFIGS.STATUS_CHECK;
    case 'progress-tracking':
      return DEFAULT_OPTIMIZATION_CONFIGS.PROGRESS_TRACKING;
    case 'detailed-analysis':
      return DEFAULT_OPTIMIZATION_CONFIGS.DETAILED_ANALYSIS;
    case 'batch-operations':
      return DEFAULT_OPTIMIZATION_CONFIGS.BATCH_OPERATIONS;
    default:
      return DEFAULT_OPTIMIZATION_CONFIGS.PROGRESS_TRACKING;
  }
}

/**
 * Type guard to check if optimization level is valid
 */
export function isValidOptimizationLevel(
  level: string,
): level is OptimizationLevel {
  return Object.values(OptimizationLevel).includes(level as OptimizationLevel);
}

/**
 * Type guard to check if context slice type is valid
 */
export function isValidContextSliceType(
  sliceType: string,
): sliceType is ContextSliceType {
  return Object.values(ContextSliceType).includes(
    sliceType as ContextSliceType,
  );
}
