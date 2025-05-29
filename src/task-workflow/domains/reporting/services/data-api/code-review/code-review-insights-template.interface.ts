/**
 * Code Review Insights Template Interface
 *
 * TypeScript interface for code-review-insights.hbs template data.
 * This template analyzes code review approval rates, common issues,
 * and quality trends to provide insights into code quality processes.
 *
 * Template Analysis: code-review-insights.hbs
 * Variables extracted: insights.totalReviews, insights.statusMetrics,
 * insights.commonIssues, insights.reviewerStats, insights.recommendations
 */

export interface CodeReviewInsightsTemplateData {
  insights: {
    // Executive Summary Metrics
    totalReviews: number;
    approvalRate: number;
    avgReviewTime: string;
    qualityScore: number;

    // Review Status Distribution
    statusMetrics: ReviewStatusMetricItem[];
    statusLabels: string[];
    statusData: number[];
    statusColors: string[];

    // Common Issues Analysis
    commonIssues: CommonIssueItem[];
    issueLabels: string[];
    issueData: number[];

    // Quality Trends Over Time
    improvements: string[];
    focusAreas: string[];
    criticalIssues: string[];
    trendLabels: string[];
    approvalTrendData: number[];
    qualityTrendData: number[];
    timeTrendData: number[];

    // Reviewer Performance
    reviewerStats: ReviewerStatsItem[];

    // Review Cycle Analysis
    firstPassApproval: number;
    avgReviewCycles: number;
    maxCycles: number;
    quickReviews: number;
    delayedReviews: number;
    cycleLabels: string[];
    cycleData: number[];

    // Strategic Recommendations
    recommendations: ReviewRecommendationItem[];
  };
}

export interface ReviewStatusMetricItem {
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface CommonIssueItem {
  category: string;
  description: string;
  frequency: number;
  impact: string;
  trend: string;
  severityClass: string;
  trendClass: string;
}

export interface ReviewerStatsItem {
  reviewer: string;
  initials: string;
  color: string;
  reviewCount: number;
  avgTime: string;
  approvalRate: number;
  approvalColor: string;
  qualityScore: number;
  qualityClass: string;
}

export interface ReviewRecommendationItem {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  impact: 'High' | 'Medium' | 'Low';
  impactClass: string;
  icon: string;
}

/**
 * Service interface for code review insights data operations
 */
export interface CodeReviewInsightsDataService {
  /**
   * Get code review insights data
   * @param startDate - Start date for analysis period
   * @param endDate - End date for analysis period
   * @param filters - Optional filters for data refinement
   * @returns Promise resolving to code review insights template data
   */
  getCodeReviewInsightsData(
    startDate: Date,
    endDate: Date,
    filters?: Record<string, string>,
  ): Promise<CodeReviewInsightsTemplateData>;
}
