/**
 * Performance Dashboard Template Data Interface
 *
 * Defines the exact data structure expected by performance-dashboard.hbs template.
 * This interface ensures type safety for real-time performance metrics and trending data.
 *
 * Template Variables Analyzed:
 * - {{data.metrics.*}} - core performance metrics with trends
 * - {{data.rolePerformance}} - role-specific performance data
 * - {{data.benchmarks.*}} - performance benchmarks and comparisons
 * - {{data.bottlenecks}} - performance bottleneck analysis
 * - {{data.systemHealth.*}} - real-time system health indicators
 * - {{data.velocity.*}}, {{data.goalProgress.*}} - velocity and goal tracking
 * - Chart data for trends, velocity, and goal progress
 */

export interface PerformanceDashboardTemplateData {
  /** Core performance data structure */
  data: PerformanceDashboardData;
}

/**
 * Main performance dashboard data structure
 */
export interface PerformanceDashboardData {
  /** Core performance metrics */
  metrics: PerformanceMetrics;

  /** Role-specific performance data */
  rolePerformance: RolePerformanceData[];

  /** Performance benchmarks and comparisons */
  benchmarks: PerformanceBenchmarks;

  /** Performance bottlenecks analysis */
  bottlenecks: PerformanceBottleneck[];

  /** Real-time system health indicators */
  systemHealth: SystemHealthData;

  /** Workflow velocity metrics */
  velocity: VelocityData;

  /** Goal progress tracking */
  goalProgress: GoalProgressData;

  /** Chart data for trend visualization */
  trendLabels: string[];
  completionTimeData: number[];
  throughputData: number[];
  qualityData: number[];

  /** AI-powered insights and recommendations */
  insights: string[];
  recommendations: string[];
}

/**
 * Core performance metrics with trends
 */
export interface PerformanceMetrics {
  /** Average completion time (formatted string like "2.5h") */
  averageCompletionTime: string;
  /** Completion time trend percentage */
  completionTimeTrend: number;

  /** Task throughput rate per day */
  throughputRate: number;
  /** Throughput trend percentage */
  throughputTrend: number;

  /** Redelegation rate percentage */
  redelegationRate: number;
  /** Redelegation trend percentage */
  redelegationTrend: number;

  /** Overall quality score percentage */
  qualityScore: number;
  /** Quality trend percentage */
  qualityTrend: number;
}

/**
 * Role-specific performance data
 */
export interface RolePerformanceData {
  /** Role name */
  name: string;
  /** Efficiency percentage (0-100) */
  efficiency: number;
  /** Quality percentage (0-100) */
  quality: number;
  /** Speed percentage (0-100) */
  speed: number;
}

/**
 * Performance benchmarks and comparisons
 */
export interface PerformanceBenchmarks {
  /** Industry standard benchmark */
  industryStandard: string;
  /** Comparison vs industry (percentage) */
  vsIndustry: number;

  /** Team average benchmark */
  teamAverage: string;
  /** Comparison vs team (percentage) */
  vsTeam: number;

  /** Previous period benchmark */
  previousPeriod: string;
  /** Comparison vs previous period (percentage) */
  vsPrevious: number;

  /** Target goal benchmark */
  targetGoal: string;
  /** Comparison vs target (percentage) */
  vsTarget: number;
}

/**
 * Performance bottleneck analysis
 */
export interface PerformanceBottleneck {
  /** Bottleneck area/component */
  area: string;
  /** Severity level */
  severity: 'high' | 'medium' | 'low';
  /** Impact level */
  impact: string;
  /** Detailed description */
  description: string;
  /** Average delay caused */
  averageDelay: string;
  /** Frequency of occurrence */
  frequency: string;
  /** Estimated cost impact */
  estimatedCost: string;
  /** Optimization recommendations */
  recommendations?: string[];
}

/**
 * Real-time system health data
 */
export interface SystemHealthData {
  /** Overall system status (template expects 'overall') */
  overall: string;
  /** System uptime percentage (template expects 'uptime') */
  uptime: number;
  /** System performance percentage (template expects 'performance') */
  performance: number;

  /** Additional system health properties */
  status?: 'healthy' | 'warning' | 'critical';
  message?: string;
  cpuUsage?: number;
  memoryUsage?: number;
  responseTime?: number;
}

/**
 * Workflow velocity metrics
 */
export interface VelocityData {
  /** Current velocity (tasks/day) */
  current: number;
  /** Completed tasks count */
  completed: number;
  /** Remaining tasks count */
  remaining: number;
}

/**
 * Goal progress tracking data
 */
export interface GoalProgressData {
  /** Progress percentage */
  percentage: number;
  /** Completed portion */
  completed: number;
  /** Remaining portion */
  remaining: number;
}

/**
 * Service method interface for performance dashboard data retrieval
 */
export interface PerformanceDashboardDataService {
  /**
   * Retrieves comprehensive performance dashboard data
   * @param startDate Start date for the report
   * @param endDate End date for the report
   * @param filters Optional filters to apply
   * @returns Promise resolving to PerformanceDashboardTemplateData
   */
  getPerformanceDashboardData(
    startDate: Date,
    endDate: Date,
    filters?: Record<string, string>,
  ): Promise<PerformanceDashboardTemplateData>;

  /**
   * Calculates real-time performance metrics
   * @returns Promise resolving to current performance metrics
   */
  calculateRealTimeMetrics(): Promise<PerformanceMetrics>;

  /**
   * Analyzes performance bottlenecks
   * @param startDate Start date for analysis
   * @param endDate End date for analysis
   * @returns Promise resolving to bottleneck analysis
   */
  analyzePerformanceBottlenecks(
    startDate: Date,
    endDate: Date,
  ): Promise<PerformanceBottleneck[]>;

  /**
   * Retrieves role performance data
   * @param startDate Start date for analysis
   * @param endDate End date for analysis
   * @returns Promise resolving to role performance data
   */
  getRolePerformanceData(
    startDate: Date,
    endDate: Date,
  ): Promise<RolePerformanceData[]>;

  /**
   * Calculates performance benchmarks
   * @param currentPeriodStart Start of current period
   * @param currentPeriodEnd End of current period
   * @returns Promise resolving to benchmark data
   */
  calculateBenchmarks(
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
  ): Promise<PerformanceBenchmarks>;

  /**
   * Gets real-time system health status
   * @returns Promise resolving to system health data
   */
  getSystemHealth(): Promise<SystemHealthData>;
}
