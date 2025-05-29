/**
 * Implementation Execution Data API Template Interface
 *
 * Focused on individual task execution analysis, implementation quality patterns,
 * and delivery insights for the implementation-execution report.
 */

export interface ImplementationExecutionTemplateData {
  generatedAt: Date;
  dateRange: {
    start: string;
    end: string;
  };
  filters?: Record<string, string>;
  taskId?: string; // For individual task analysis
  reportType: 'implementation_execution';

  // Implementation execution insights
  execution: {
    // Executive Summary
    executionScore: number;
    implementationQuality: number;
    deliveryEfficiency: number;
    codeQualityRating: number;

    // Execution Patterns
    phases: ExecutionPhaseItem[];
    timelineData: number[];
    timelineLabels: string[];

    // Quality Metrics
    qualityMetrics: QualityMetricItem[];
    qualityLabels: string[];
    qualityData: number[];
    qualityColors: string[];

    // Implementation Patterns
    implementationApproach: string;
    technicalDecisions: TechnicalDecisionItem[];
    deliveryMilestones: DeliveryMilestoneItem[];

    // Code Quality Analysis
    codeMetrics: CodeMetricItem[];
    testingCoverage: TestingCoverageItem;
    performanceMetrics: PerformanceMetricItem[];

    // Delivery Analysis
    deliveryTimeline: DeliveryTimelineItem[];
    blockerAnalysis: BlockerAnalysisItem[];
    successFactors: SuccessFactorItem[];

    // Recommendations
    recommendations: ExecutionRecommendationItem[];
    bestPractices: string[];
    lessonsLearned: string[];
  };
}

export interface ExecutionPhaseItem {
  phase: string;
  status: 'completed' | 'in-progress' | 'not-started';
  duration: string;
  quality: number;
  deliverables: string[];
  insights: string[];
}

export interface QualityMetricItem {
  metric: string;
  value: number;
  target: number;
  status: 'excellent' | 'good' | 'fair' | 'poor';
  color: string;
}

export interface TechnicalDecisionItem {
  decision: string;
  rationale: string;
  impact: 'high' | 'medium' | 'low';
  outcome: string;
}

export interface DeliveryMilestoneItem {
  milestone: string;
  plannedDate: string;
  actualDate: string;
  status: 'on-time' | 'delayed' | 'early';
  deliverables: string[];
}

export interface CodeMetricItem {
  metric: string;
  value: string;
  benchmark: string;
  status: 'good' | 'warning' | 'critical';
  recommendation?: string;
}

export interface TestingCoverageItem {
  unitTests: number;
  integrationTests: number;
  e2eTests: number;
  overall: number;
  target: number;
  status: 'passing' | 'failing' | 'partial';
}

export interface PerformanceMetricItem {
  metric: string;
  value: number;
  unit: string;
  benchmark: number;
  status: 'optimal' | 'acceptable' | 'needs-improvement';
}

export interface DeliveryTimelineItem {
  date: string;
  event: string;
  type: 'milestone' | 'blocker' | 'decision' | 'delivery';
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
}

export interface BlockerAnalysisItem {
  blocker: string;
  impact: 'high' | 'medium' | 'low';
  duration: string;
  resolution: string;
  prevention: string;
}

export interface SuccessFactorItem {
  factor: string;
  contribution: number;
  description: string;
  replication: string;
}

export interface ExecutionRecommendationItem {
  category: string;
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  impact: string;
  implementation: string;
}

/**
 * Service interface for Implementation Execution Data API
 */
export interface ImplementationExecutionDataService {
  getImplementationExecutionData(
    startDate: Date,
    endDate: Date,
    filters?: Record<string, string>,
    taskId?: string,
  ): Promise<ImplementationExecutionTemplateData>;
}
