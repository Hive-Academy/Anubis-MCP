/**
 * Delegation Flow Analysis Template Interface
 *
 * TypeScript interface for delegation-flow-analysis.hbs template data.
 * This template provides detailed workflow analysis showing delegation paths,
 * bottlenecks, and workflow efficiency metrics.
 *
 * Template Analysis: delegation-flow-analysis.hbs
 * Variables extracted: insights.totalDelegations, insights.roleFlow,
 * insights.bottlenecks, insights.rolePerformance, insights.recommendations
 */

export interface DelegationFlowAnalysisTemplateData {
  insights: {
    // Executive Summary Metrics
    totalDelegations: number;
    avgHandoffTime: string;
    bottleneckCount: number;
    efficiencyScore: number;

    // Workflow Flow Visualization
    roleFlow: RoleFlowItem[];
    flowMetrics: FlowMetricItem[];
    bottlenecks: BottleneckItem[];

    // Delegation Patterns & Trends
    patternLabels: string[];
    patternData: number[];
    patternColors: string[];
    handoffLabels: string[];
    handoffData: number[];

    // Role Performance in Workflow
    rolePerformance: RolePerformanceFlowItem[];

    // Workflow Efficiency Timeline
    timelineLabels: string[];
    efficiencyData: number[];
    bottleneckData: number[];
    handoffSpeedData: number[];
    efficiencyTrends: EfficiencyTrendItem[];
    optimizations: string[];
    bestPractices: string[];

    // Success Factors Analysis
    successFactors: SuccessFactorItem[];
    factorLabels: string[];
    factorCurrentData: number[];
    factorTargetData: number[];

    // Strategic Recommendations
    recommendations: FlowRecommendationItem[];
  };
}

export interface RoleFlowItem {
  role: string;
  taskCount: number;
  color: string;
  isBottleneck: boolean;
  avgTime: string;
  delegationCount: number;
}

export interface FlowMetricItem {
  metric: string;
  value: string;
  valueClass: string;
}

export interface BottleneckItem {
  role: string;
  description: string;
  impact: string;
  severity: 'high' | 'medium' | 'low';
}

export interface RolePerformanceFlowItem {
  role: string;
  description: string;
  initials: string;
  color: string;
  tasksHandled: number;
  avgProcessingTime: string;
  successRate: number;
  successColor: string;
  bottleneckRisk: string;
  riskClass: string;
}

export interface EfficiencyTrendItem {
  trend: string;
  icon: string;
  iconClass: string;
}

export interface SuccessFactorItem {
  factor: string;
  description: string;
  score: number;
  target: number;
  color: string;
  impact: number;
  impactClass: string;
}

export interface FlowRecommendationItem {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  impact: 'High' | 'Medium' | 'Low';
  effort: 'High' | 'Medium' | 'Low';
  impactClass: string;
  effortClass: string;
  icon: string;
}

/**
 * Service interface for delegation flow analysis data operations
 */
export interface DelegationFlowAnalysisDataService {
  /**
   * Get delegation flow analysis data
   * @param startDate - Start date for analysis period
   * @param endDate - End date for analysis period
   * @param filters - Optional filters for data refinement
   * @returns Promise resolving to delegation flow analysis template data
   */
  getDelegationFlowAnalysisData(
    startDate: Date,
    endDate: Date,
    filters?: Record<string, string>,
  ): Promise<DelegationFlowAnalysisTemplateData>;
}
