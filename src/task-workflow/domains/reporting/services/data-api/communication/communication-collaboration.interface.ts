/**
 * Communication Collaboration Template Interface
 * Defines the data structure for team dynamics and workflow efficiency analysis
 */

export interface CommunicationCollaborationData {
  generatedAt?: string;
  dateRange?: string;

  // Main communication section that the service expects
  communication: {
    overallScore: number;
    metrics: CommunicationMetric[];
    chartLabels: string[];
    chartData: number[];
    chartColors: string[];
  };

  // Collaboration section that the service expects
  collaboration: {
    events: CollaborationEvent[];
    effectiveness: number;
    totalEvents: number;
    activeParticipants: number;
  };

  // Team interaction section that the service expects
  teamInteraction: {
    interactions: TeamInteraction[];
    networkStrength: number;
    communicationFlow: string;
    chartLabels: string[];
    chartData: number[];
    chartColors: string[];
  };

  // Workflow coordination section that the service expects
  workflow: {
    coordination: WorkflowCoordination[];
    efficiency: number;
    bottlenecks: string[];
    recommendations: string[];
  };

  // Legacy fields for backward compatibility
  collaborationStats?: {
    totalInteractions: number;
    roleTransitions: number;
    avgResponseTime: string;
    collaborationScore: number;
  };

  communicationMetrics?: {
    clarity: MetricScore;
    responsiveness: MetricScore;
    collaboration: MetricScore;
    knowledgeSharing: MetricScore;
    conflictResolution: MetricScore;
    teamAlignment: MetricScore;
  };

  workflowSteps?: WorkflowStep[];

  channels?: CommunicationChannel[];

  issues?: CollaborationIssue[];

  rolePerformance?: {
    boomerang: RoleMetrics;
    researcher: RoleMetrics;
    architect: RoleMetrics;
    'senior-developer': RoleMetrics;
    'code-review': RoleMetrics;
  };

  recommendations?: CollaborationRecommendation[];

  task?: {
    comments?: any[];
  };
}

// New exports that the service needs
export interface CommunicationMetric {
  name: string;
  value: string;
  target: string;
  status: 'good' | 'warning' | 'error';
  statusClass: string;
  description: string;
  icon: string;
  trend: 'improving' | 'stable' | 'declining';
  trendClass: string;
}

export interface CollaborationEvent {
  type: 'delegation' | 'review' | 'status_update' | 'feedback';
  timestamp: string;
  participants: string[];
  description: string;
  outcome: 'successful' | 'failed' | 'pending';
  outcomeClass: string;
  duration: string;
  impact: 'high' | 'medium' | 'low';
  impactClass: string;
}

export interface TeamInteraction {
  role: string;
  interactionCount: number;
  averageResponseTime: string;
  communicationQuality: number;
  collaborationScore: number;
  lastInteraction: string;
  status: 'active' | 'limited' | 'inactive';
  statusClass: string;
}

export interface WorkflowCoordination {
  phase: string;
  efficiency: number;
  bottlenecks: number;
  averageHandoffTime: string;
  coordinationScore: number;
  status: 'good' | 'needs-improvement' | 'poor';
  statusClass: string;
  lastUpdate: string;
  participants: string[];
}

// Legacy interfaces for backward compatibility
export interface MetricScore {
  score: number;
  icon: string;
}

export interface WorkflowStep {
  step: number;
  title: string;
  role: string;
  status: 'completed' | 'in-progress' | 'blocked' | 'pending';
  description: string;
  duration: string;
  interactions: number;
  efficiency: string;
  quality: string;
}

export interface CommunicationChannel {
  name: string;
  icon: string;
  usage: number;
  level: 'high' | 'medium' | 'low';
}

export interface CollaborationIssue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
}

export interface RoleMetrics {
  [key: string]: number;
}

export interface CollaborationRecommendation {
  type: 'communication' | 'process' | 'tooling' | 'training';
  text: string;
}
