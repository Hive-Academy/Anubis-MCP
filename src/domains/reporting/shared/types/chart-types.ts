/**
 * Enhanced Chart Type Definitions with Type Safety
 *
 * This file provides strict typing and type guards to prevent undefined
 * property access issues in chart data throughout the reporting system.
 *
 * ARCHITECTURAL CONTEXT: Type-safe chart data management
 * PATTERN FOLLOWED: TypeScript strict typing with runtime validation
 * STRATEGIC PURPOSE: Prevent undefined property access at compile-time and runtime
 */

import { Role } from './report-data.types';

// ============================================================================
// CORE CHART TYPES WITH STRICT VALIDATION
// ============================================================================

/**
 * Base chart configuration with required properties to prevent undefined access
 */
export interface StrictChartConfiguration {
  readonly id: string;
  readonly title: string;
  readonly type: ChartType;
  readonly labels: readonly string[];
  readonly data: readonly number[];
  readonly colors: readonly string[];
  readonly options?: Readonly<Record<string, unknown>>;
}

/**
 * Chart types with specific validation requirements
 */
export type ChartType = 'pie' | 'doughnut' | 'line' | 'bar' | 'area' | 'radar';

/**
 * Role-specific chart data with color mapping validation
 */
export interface RolePerformanceChartData extends StrictChartConfiguration {
  readonly type: 'radar';
  readonly labels: readonly Role[];
  readonly colors: readonly [string, string, string, string, string]; // Exactly 5 colors for 5 roles
  readonly roleMetrics: readonly RoleMetric[];
}

/**
 * Role performance metric with strict typing
 */
export interface RoleMetric {
  readonly role: Role;
  readonly successRate: number;
  readonly tasksCompleted: number;
  readonly averageDuration: number;
  readonly efficiency: number;
}

/**
 * Status distribution chart with known status values
 */
export interface StatusDistributionChartData extends StrictChartConfiguration {
  readonly type: 'doughnut' | 'pie';
  readonly labels: readonly StatusLabel[];
  readonly colors: readonly StatusColor[];
}

/**
 * Priority distribution chart with known priority values
 */
export interface PriorityDistributionChartData
  extends StrictChartConfiguration {
  readonly type: 'bar';
  readonly labels: readonly PriorityLabel[];
  readonly colors: readonly PriorityColor[];
}

/**
 * Completion trend chart with time-series data
 */
export interface CompletionTrendChartData extends StrictChartConfiguration {
  readonly type: 'line';
  readonly labels: readonly string[]; // Date labels
  readonly trendData: readonly TrendDataPoint[];
}

// ============================================================================
// SPECIFIC TYPE DEFINITIONS FOR VALIDATION
// ============================================================================

export type StatusLabel =
  | 'not-started'
  | 'in-progress'
  | 'needs-review'
  | 'completed'
  | 'needs-changes'
  | 'paused'
  | 'cancelled';

export type StatusColor =
  | '#6b7280' // not-started (gray)
  | '#3b82f6' // in-progress (blue)
  | '#f59e0b' // needs-review (orange)
  | '#10b981' // completed (green)
  | '#ef4444' // needs-changes (red)
  | '#8b5cf6' // paused (purple)
  | '#374151'; // cancelled (dark gray)

export type PriorityLabel = 'Low' | 'Medium' | 'High' | 'Critical';

export type PriorityColor =
  | '#10b981' // Low (green)
  | '#3b82f6' // Medium (blue)
  | '#f59e0b' // High (orange)
  | '#ef4444'; // Critical (red)

export type RoleColor =
  | '#8b5cf6' // boomerang (purple)
  | '#3b82f6' // researcher (blue)
  | '#10b981' // architect (green)
  | '#f59e0b' // senior-developer (orange)
  | '#ef4444'; // code-review (red)

export interface TrendDataPoint {
  readonly period: string;
  readonly completed: number;
  readonly started: number;
  readonly timestamp: string;
}

// ============================================================================
// TYPE GUARDS FOR RUNTIME VALIDATION
// ============================================================================

/**
 * Type guard to validate chart configuration has all required properties
 */
export function isValidChartConfiguration(
  chart: unknown,
): chart is StrictChartConfiguration {
  if (!chart || typeof chart !== 'object') {
    return false;
  }

  const c = chart as Record<string, unknown>;

  return (
    typeof c.id === 'string' &&
    typeof c.title === 'string' &&
    typeof c.type === 'string' &&
    Array.isArray(c.labels) &&
    Array.isArray(c.data) &&
    Array.isArray(c.colors) &&
    c.labels.length === c.data.length &&
    c.labels.length === c.colors.length &&
    c.labels.length > 0
  );
}

/**
 * Type guard specifically for role performance chart data
 */
export function isValidRolePerformanceChart(
  chart: unknown,
): chart is RolePerformanceChartData {
  if (!isValidChartConfiguration(chart)) {
    return false;
  }

  const c = chart;

  return (
    c.type === 'radar' &&
    c.labels.every((label): label is Role =>
      [
        'boomerang',
        'researcher',
        'architect',
        'senior-developer',
        'code-review',
      ].includes(label),
    ) &&
    c.colors.length === c.labels.length
  );
}

/**
 * Type guard for status distribution chart
 */
export function isValidStatusChart(
  chart: unknown,
): chart is StatusDistributionChartData {
  if (!isValidChartConfiguration(chart)) {
    return false;
  }

  const c = chart;

  return (
    (c.type === 'doughnut' || c.type === 'pie') &&
    c.labels.every((label): label is StatusLabel =>
      [
        'not-started',
        'in-progress',
        'needs-review',
        'completed',
        'needs-changes',
        'paused',
        'cancelled',
      ].includes(label),
    )
  );
}

// ============================================================================
// CHART BUILDER RETURN TYPES WITH STRICT VALIDATION
// ============================================================================

/**
 * Strict chart collection interface that prevents undefined access
 */
export interface ValidatedChartCollection {
  readonly statusDistribution: StatusDistributionChartData;
  readonly priorityDistribution: PriorityDistributionChartData;
  readonly completionTrend: CompletionTrendChartData;
  readonly rolePerformance: RolePerformanceChartData;
}

/**
 * Chart validation result for error handling
 */
export interface ChartValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly string[];
  readonly chartName: string;
}

/**
 * Chart builder result with validation status
 */
export interface ChartBuilderResult {
  readonly success: boolean;
  readonly charts?: ValidatedChartCollection;
  readonly validationResults: readonly ChartValidationResult[];
  readonly errors: readonly string[];
}

// ============================================================================
// COLOR MAPPING UTILITIES WITH TYPE SAFETY
// ============================================================================

/**
 * Type-safe color mappings to prevent undefined color access
 */
export const COLOR_MAPPINGS = {
  status: {
    'not-started': '#6b7280',
    'in-progress': '#3b82f6',
    'needs-review': '#f59e0b',
    completed: '#10b981',
    'needs-changes': '#ef4444',
    paused: '#8b5cf6',
    cancelled: '#374151',
  } as const,

  priority: {
    Low: '#10b981',
    Medium: '#3b82f6',
    High: '#f59e0b',
    Critical: '#ef4444',
  } as const,

  role: {
    boomerang: '#8b5cf6',
    researcher: '#3b82f6',
    architect: '#10b981',
    'senior-developer': '#f59e0b',
    'code-review': '#ef4444',
  } as const,
} as const;

/**
 * Type-safe color getter with fallback
 */
export function getStatusColor(status: string): StatusColor {
  return (
    COLOR_MAPPINGS.status[status as keyof typeof COLOR_MAPPINGS.status] ??
    '#6b7280'
  );
}

export function getPriorityColor(priority: string): PriorityColor {
  return (
    COLOR_MAPPINGS.priority[priority as keyof typeof COLOR_MAPPINGS.priority] ??
    '#6b7280'
  );
}

export function getRoleColor(role: string): RoleColor {
  return (
    COLOR_MAPPINGS.role[role as keyof typeof COLOR_MAPPINGS.role] ?? '#6b7280'
  );
}

// ============================================================================
// CHART VALIDATION ERROR TYPES
// ============================================================================

/**
 * Custom error for chart validation failures
 */
export class ChartValidationError extends Error {
  constructor(
    message: string,
    public readonly chartName: string,
    public readonly validationErrors: readonly string[],
  ) {
    super(message);
    this.name = 'ChartValidationError';
  }
}

/**
 * Custom error for missing chart properties
 */
export class MissingChartPropertyError extends Error {
  constructor(
    public readonly chartName: string,
    public readonly missingProperty: string,
    public readonly expectedType: string,
  ) {
    super(
      `Chart '${chartName}' is missing required property '${missingProperty}' of type '${expectedType}'`,
    );
    this.name = 'MissingChartPropertyError';
  }
}
