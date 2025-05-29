/**
 * Implementation Plan Analytics Template Interface
 *
 * TypeScript interface for implementation-plan-analytics.hbs template data.
 * This template analyzes implementation plan quality, subtask breakdown,
 * and execution patterns to provide insights into planning effectiveness.
 *
 * Template Analysis: implementation-plan-analytics.hbs
 * Variables extracted: analytics.totalPlans, analytics.qualityMetrics,
 * analytics.executionPatterns, analytics.creatorStats, analytics.recommendations
 */

export interface ImplementationPlanAnalyticsTemplateData {
  analytics: {
    // Executive Summary Metrics
    totalPlans: number;
    avgSubtasksPerPlan: number;
    planQualityScore: number;
    avgExecutionTime: string;

    // Plan Quality Distribution
    qualityMetrics: QualityMetricItem[];
    qualityLabels: string[];
    qualityData: number[];
    qualityColors: string[];

    // Subtask Breakdown Analysis
    optimalRangePlans: number;
    underPlannedPlans: number;
    overPlannedPlans: number;
    avgDependencies: number;
    batchOrganization: number;
    subtaskRangeLabels: string[];
    subtaskRangeData: number[];

    // Execution Patterns
    executionPatterns: ExecutionPatternItem[];
    timelineLabels: string[];
    timelineData: number[];

    // Plan Creator Performance
    creatorStats: PlanCreatorStatsItem[];

    // Strategic Recommendations
    recommendations: PlanRecommendationItem[];
  };
}

export interface QualityMetricItem {
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface ExecutionPatternItem {
  pattern: string;
  description: string;
  frequency: string;
  avgTime: string;
  successRate: number;
  statusClass: string;
}

export interface PlanCreatorStatsItem {
  creator: string;
  initials: string;
  color: string;
  plansCreated: number;
  avgQuality: number;
  qualityColor: string;
  avgSubtasks: number;
  successRate: number;
  successClass: string;
}

export interface PlanRecommendationItem {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  impact: 'High' | 'Medium' | 'Low';
  impactClass: string;
  icon: string;
}

/**
 * Service interface for implementation plan analytics data operations
 */
export interface ImplementationPlanAnalyticsDataService {
  /**
   * Get implementation plan analytics data
   * @param startDate - Start date for analysis period
   * @param endDate - End date for analysis period
   * @param filters - Optional filters for data refinement
   * @returns Promise resolving to implementation plan analytics template data
   */
  getImplementationPlanAnalyticsData(
    startDate: Date,
    endDate: Date,
    filters?: Record<string, string>,
  ): Promise<ImplementationPlanAnalyticsTemplateData>;
}
