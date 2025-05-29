/**
 * Task Progress Health Template Interface
 * Defines the data structure for individual task progress and health analysis
 */

export interface TaskProgressHealthData {
  task: {
    name: string;
    status: string;
    statusClass: string;
    priority: string;
    currentMode: string;
  };

  health: {
    overallScore: number;
    indicators: HealthIndicator[];
  };

  progress: {
    completionRate: number;
    completedSubtasks: number;
    totalSubtasks: number;
    timeElapsed: string;
    estimatedRemaining: string;
    velocity: number;
    trend: string;
    trendClass: string;
    chartLabels: string[];
    chartData: number[];
    chartColors: string[];
  };

  subtasks: SubtaskProgress[];

  risks: RiskAssessment[];

  delegations: DelegationEvent[];

  performance: {
    strengths: string[];
    improvements: string[];
    recommendations: string[];
  };

  actionItems: ActionItem[];
}

export interface HealthIndicator {
  name: string;
  status: string;
  statusClass: string;
  score: number;
  color: string;
  description: string;
}

export interface SubtaskProgress {
  name: string;
  description: string;
  status: string;
  statusClass: string;
  statusBorderClass: string;
  sequenceNumber: number;
  estimatedDuration?: string;
  startedAt?: string;
  completedAt?: string;
  assignedTo?: string;
  batchTitle?: string;
}

export interface RiskAssessment {
  category: string;
  severity: string;
  description: string;
  impact: string;
  probability: string;
  chartLabels?: string[];
  chartData?: number[];
}

export interface DelegationEvent {
  fromMode: string;
  toMode: string;
  timestamp: string;
  description: string;
  duration?: string;
  statusColor: string;
  icon: string;
}

export interface ActionItem {
  title: string;
  description: string;
  priority: string;
  priorityClass: string;
  deadline?: string;
  icon: string;
}
