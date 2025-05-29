/**
 * Research Documentation Template Interface
 * Defines the data structure for task research and documentation quality analysis
 */

export interface ResearchDocumentationData {
  research: {
    completionRate: number; // Added this property that the service expects
    completeness: number;
    sourceCount: number;
    depth: string;
    totalFindings: number; // Added this property
    criticalFindings: number; // Added this property
    findings: ResearchFinding[];
    findingsLabels: string[];
    findingsData: number[];
    findingsColors: string[];
  };

  documentation: {
    sections: DocumentationSection[]; // Added this property that the service expects
    overallCompleteness: number; // Added this property
    chartLabels: string[]; // Added this property
    chartData: number[]; // Added this property
    chartColors: string[]; // Added this property
    quality: number;
    metrics: DocumentationMetric[];
    qualityLabels: string[];
    qualityData: number[];
  };

  sources?: {
    categories: SourceCategory[];
  };

  methodology?: {
    approach: string[];
    validation: string[];
    timeline: MethodologyPhase[];
  };

  gaps: {
    identified: KnowledgeGap[];
    totalGaps: number; // Added this property that the service expects
    criticalGaps: number; // Added this property
    chartLabels: string[]; // Added this property
    chartData: number[]; // Added this property
    chartColors: string[]; // Added this property
    mitigations: MitigationStrategy[];
  };

  impact?: {
    areas: ImpactArea[];
    chartLabels: string[];
    confidenceData: number[];
    riskData: number[];
    coverageData: number[];
  };

  recommendations: ResearchRecommendation[];

  futureResearch?: FutureResearchArea[];
}

export interface ResearchFinding {
  title: string; // Added this property that the service expects
  description: string; // Added this property
  category: string;
  categoryBorderClass?: string;
  priority: string; // Added this property that the service expects
  source: string; // Added this property
  confidence: string;
  confidenceClass?: string;
  sourceCount?: number;
  validation?: string;
  impact: string; // Added this property
  actionRequired: boolean; // Added this property
  summary?: string;
}

// Added this interface that the service expects
export interface DocumentationSection {
  name: string;
  completeness: number;
  status: string;
  statusClass: string;
  lastUpdated: string;
  wordCount: number;
  issues: string[];
}

export interface DocumentationMetric {
  aspect: string;
  score: number;
  scoreClass: string;
  percentage: number;
  color: string;
  feedback: string;
}

export interface SourceCategory {
  type: string;
  count: number;
  description: string;
  reliability: number;
  color: string;
  icon: string;
}

export interface MethodologyPhase {
  phase: string;
  duration: string;
  status: string;
  statusColor: string;
  icon: string;
}

export interface KnowledgeGap {
  area: string;
  description: string;
  severity: string;
  impact: string;
  priority: string;
  researchRequired: boolean; // Added this property that the service expects
  estimatedEffort: string; // Added this property
}

export interface MitigationStrategy {
  strategy: string;
  description: string;
  feasibility: string;
  effort: string;
  timeline: string;
}

export interface ImpactArea {
  category: string;
  color: string;
  metrics: ImpactMetric[];
}

export interface ImpactMetric {
  metric: string;
  value: string;
  valueClass: string;
}

export interface ResearchRecommendation {
  title: string;
  description: string;
  priority: string;
  effort: string; // Added this property that the service expects
  impact: string; // Added this property
  category: string; // Added this property
  deadline: string; // Added this property
  icon: string; // Added this property
  confidence?: number;
  confidenceClass?: string;
  evidenceLevel?: string;
  evidenceClass?: string;
  supportingFindings?: string;
}

export interface FutureResearchArea {
  area: string;
  description: string;
  priority: string;
  priorityClass: string;
  complexity: string;
  complexityClass: string;
  estimatedEffort: string;
  expectedValue: string;
  icon: string;
}
