/**
 * Implementation Execution Template Interface
 * Defines the data structure for task implementation execution analysis
 */

export interface ImplementationExecutionData {
  execution: {
    completionRate: number;
    qualityScore: number;
    velocity: number;
    blockerCount: number;
    batches: BatchProgress[];
    batchLabels: string[];
    batchData: number[];
    batchColors: string[];
    batchBorderColors: string[];
  };

  quality: {
    metrics: QualityMetric[];
  };

  files: {
    modified: number;
    created: number;
    linesAdded: number;
    linesRemoved: number;
    impactAreas: ImpactArea[];
    chartLabels: string[];
    chartData: number[];
    chartColors: string[];
  };

  testing: {
    categories: TestingCategory[];
    chartLabels: string[];
    chartData: number[];
  };

  performance: {
    metrics: PerformanceCategory[];
    chartLabels: string[];
    responseTimeData: number[];
    memoryData: number[];
    cpuData: number[];
  };

  timeline: TimelineEvent[];

  blockers: {
    active: BlockerIssue[];
    resolved: ResolvedIssue[];
  };

  recommendations: ExecutionRecommendation[];
}

export interface BatchProgress {
  title: string;
  status: string;
  statusClass: string;
  statusBorderClass: string;
  progress: number;
  color: string;
  progressClass: string;
  completedTasks: number;
  totalTasks: number;
}

export interface QualityMetric {
  name: string;
  value: string | number;
  description: string;
  color: string;
  icon: string;
  percentage: number;
}

export interface ImpactArea {
  area: string;
  impact: string;
  impactClass: string;
}

export interface TestingCategory {
  name: string;
  status: string;
  statusClass: string;
  coverage: number;
  color: string;
  testsRun: number;
  totalTests: number;
}

export interface PerformanceCategory {
  category: string;
  color: string;
  items: PerformanceItem[];
}

export interface PerformanceItem {
  metric: string;
  value: string;
  valueClass: string;
}

export interface TimelineEvent {
  milestone: string;
  timestamp: string;
  description: string;
  statusColor: string;
  icon: string;
  metrics?: TimelineMetric[];
}

export interface TimelineMetric {
  label: string;
  value: string;
}

export interface BlockerIssue {
  title: string;
  description: string;
  severity: string;
  impact: string;
  duration: string;
}

export interface ResolvedIssue {
  title: string;
  resolution: string;
  resolutionTime: string;
}

export interface ExecutionRecommendation {
  title: string;
  description: string;
  priority: string;
  impact: string;
  impactClass: string;
  effort: string;
  effortClass: string;
  icon: string;
}
