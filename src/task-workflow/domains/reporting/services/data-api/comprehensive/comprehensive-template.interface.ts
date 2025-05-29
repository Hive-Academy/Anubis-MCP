/**
 * Comprehensive Template Interface
 *
 * TypeScript interface for comprehensive.hbs template data.
 * This template provides an executive summary combining all analytics
 * with strategic recommendations and comprehensive insights.
 *
 * Template Analysis: comprehensive.hbs
 * Variables extracted: data.summary, data.metrics, data.rolePerformance,
 * data.quality, data.recentActivity, data.issues, data.recommendations, data.charts
 */

export interface ComprehensiveTemplateData {
  data: {
    // Executive Summary Section
    summary: {
      totalTasks: string | number;
      completionRate: string | number;
      averageTime: string;
      keyInsights: string[];
    };

    // Quick Metrics Grid
    metrics: {
      activeTasks: string | number;
      completedTasks: string | number;
      highPriorityTasks: string | number;
      totalDelegations: string | number;
      codeReviews: string | number;
      researchReports: string | number;
    };

    // Role Performance Analysis
    rolePerformance: RolePerformanceItem[];

    // Quality Metrics
    quality: {
      codeScore: number;
      testCoverage: number;
      securityScore: number;
    };

    // Recent Activity Timeline
    recentActivity?: RecentActivityItem[];

    // Critical Issues & Bottlenecks
    issues?: CriticalIssueItem[];

    // Strategic Recommendations
    recommendations?: StrategicRecommendationItem[];

    // Chart Data
    charts: {
      statusDistribution: {
        labels: string[];
        data: number[];
      };
      completionTrend: {
        labels: string[];
        completed: number[];
        created: number[];
      };
    };
  };
}

export interface RolePerformanceItem {
  role: string;
  icon: string;
  efficiency: number;
  tasksHandled: number;
  avgDuration: string;
  colorClass: string;
}

export interface RecentActivityItem {
  title: string;
  description: string;
  timestamp: string;
  icon: string;
  colorClass: string;
  taskId?: string;
}

export interface CriticalIssueItem {
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium';
  impact?: string;
  recommendation?: string;
}

export interface StrategicRecommendationItem {
  category: string;
  description: string;
  icon: string;
  actions: string[];
  priority?: 'high' | 'medium' | 'low';
}

/**
 * Service interface for comprehensive template data operations
 */
export interface ComprehensiveDataService {
  /**
   * Get comprehensive analytics data combining all report types
   * @param startDate - Start date for analysis period
   * @param endDate - End date for analysis period
   * @param filters - Optional filters for data refinement
   * @returns Promise resolving to comprehensive template data
   */
  getComprehensiveData(
    startDate: Date,
    endDate: Date,
    filters?: Record<string, string>,
  ): Promise<ComprehensiveTemplateData>;
}
