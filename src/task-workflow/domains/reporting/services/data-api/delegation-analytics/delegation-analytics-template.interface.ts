/**
 * Delegation Analytics Template Data Interface
 *
 * Defines the exact data structure expected by delegation-analytics.hbs template.
 * This interface ensures type safety for delegation patterns and role efficiency analysis.
 *
 * Template Variables Analyzed:
 * - {{generatedAt}}, {{dateRange}}, {{reportType}}
 * - {{metrics.delegations.*}} - comprehensive delegation metrics
 * - Role-specific data: boomerang, researcher, architect, senior-developer, code-review
 * - Chart data for delegation flow trends and role efficiency
 * - Bottleneck analysis and transition matrix data
 */

export interface DelegationAnalyticsTemplateData {
  /** Report generation timestamp */
  generatedAt: Date;

  /** Date range for the report */
  dateRange: {
    start: string;
    end: string;
  };

  /** Report type identifier */
  reportType: 'delegation_analytics';

  /** Comprehensive delegation metrics */
  metrics: {
    delegations: DelegationMetrics;
  };
}

/**
 * Core delegation metrics structure
 */
export interface DelegationMetrics {
  /** Role-specific statistics */
  roleStats: {
    boomerang: number;
    researcher: number;
    architect: number;
    'senior-developer': number;
    'code-review': number;
  };

  /** Role efficiency percentages (0-1 scale) */
  roleEfficiency: {
    boomerang: number;
    researcher: number;
    architect: number;
    'senior-developer': number;
    'code-review': number;
  };

  /** Overall delegation success rate (0-100) */
  successRate: number;

  /** Average handoff time in hours */
  avgHandoffTime: number;

  /** Average number of redelegations per task */
  avgRedelegationCount: number;

  /** Total number of delegations in period */
  totalDelegations: number;

  /** Average completion time per role in hours */
  avgCompletionTime: number;

  /** Most efficient role identifier */
  mostEfficientRole: string;

  /** Workflow bottlenecks analysis */
  bottlenecks?: DelegationBottleneck[];

  /** Role transition matrix data */
  transitionMatrix: {
    [fromRole: string]: {
      [toRole: string]: number;
    };
  };

  /** Weekly trend data for charts */
  weeklyTrends: {
    successful: number[];
    failed: number[];
  };
}

/**
 * Bottleneck analysis item
 */
export interface DelegationBottleneck {
  /** Role experiencing the bottleneck */
  role: string;
  /** Description of the issue */
  issue: string;
  /** Impact level */
  impact: 'high' | 'medium' | 'low';
}

/**
 * Service method interface for delegation analytics data retrieval
 */
export interface DelegationAnalyticsDataService {
  /**
   * Retrieves delegation analytics data for the specified date range
   * @param startDate Start date for the report
   * @param endDate End date for the report
   * @param filters Optional filters to apply
   * @returns Promise resolving to DelegationAnalyticsTemplateData
   */
  getDelegationAnalyticsData(
    startDate: Date,
    endDate: Date,
    filters?: Record<string, string>,
  ): Promise<DelegationAnalyticsTemplateData>;

  /**
   * Calculates role efficiency metrics
   * @param startDate Start date for calculation
   * @param endDate End date for calculation
   * @returns Promise resolving to role efficiency data
   */
  calculateRoleEfficiency(
    startDate: Date,
    endDate: Date,
  ): Promise<DelegationMetrics['roleEfficiency']>;

  /**
   * Analyzes workflow bottlenecks
   * @param startDate Start date for analysis
   * @param endDate End date for analysis
   * @returns Promise resolving to bottleneck analysis
   */
  analyzeWorkflowBottlenecks(
    startDate: Date,
    endDate: Date,
  ): Promise<DelegationBottleneck[]>;

  /**
   * Generates role transition matrix
   * @param startDate Start date for matrix
   * @param endDate End date for matrix
   * @returns Promise resolving to transition matrix
   */
  generateTransitionMatrix(
    startDate: Date,
    endDate: Date,
  ): Promise<DelegationMetrics['transitionMatrix']>;
}
