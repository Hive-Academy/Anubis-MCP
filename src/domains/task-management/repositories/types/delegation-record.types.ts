import {
  Prisma,
  DelegationRecord,
  Task,
} from '../../../../../generated/prisma';
import { PrismaTransaction } from './task.types';

// Re-export PrismaTransaction for use in other files
export { PrismaTransaction };

// Input types
export type DelegationRecordWhereInput = Prisma.DelegationRecordWhereInput;
export type DelegationRecordOrderByInput =
  Prisma.DelegationRecordOrderByWithRelationInput;

// DelegationRecord with relations
export type DelegationRecordWithRelations = DelegationRecord & {
  task?: Task;
};

// Create and Update data types
export interface CreateDelegationRecordData {
  taskId: number;
  fromMode: string;
  toMode: string;
  message?: string;
  delegationTimestamp?: Date;
}

export interface UpdateDelegationRecordData {
  fromMode?: string;
  toMode?: string;
  message?: string;
  delegationTimestamp?: Date;
}

// Delegation summary and analysis types
export interface DelegationSummary {
  totalDelegations: number;
  uniqueTransitions: number;
  averageProcessingTime: number | null;
  mostCommonTransition: string;
  delegationFrequency: number;
}

export interface DelegationAnalysis {
  patterns: DelegationPattern[];
  bottlenecks: BottleneckAnalysis[];
  efficiency: DelegationEfficiency;
  trends: DelegationTrend[];
}

export interface DelegationChainEntry {
  sequence: number;
  fromMode: string;
  toMode: string;
  handoffDate: Date;
  duration: number | null;
  handoffMessage: string | null;
  success: boolean;
}

// Role transition and workflow types
export interface RoleTransition {
  fromMode: string;
  toMode: string;
  transitionDate: Date;
  duration: number | null;
  handoffMessage: string | null;
  success: boolean;
}

export interface RolePerformanceMetrics {
  mode: string;
  totalDelegations: number;
  averageHandoffTime: number | null;
  successRate: number;
  commonTransitions: string[];
  performanceScore: number | null;
}

export interface DelegationPattern {
  fromMode: string;
  toMode: string;
  frequency: number;
  averageDuration: number | null;
  successRate: number;
  commonReasons: string[];
}

// Analytics and metrics types
export interface DelegationStatistics {
  totalDelegations: number;
  uniqueRoles: number;
  averageChainLength: number;
  mostActiveRole: string | null;
  delegationTrends: DelegationTrend[];
}

export interface DelegationTrend {
  date: Date;
  delegationCount: number;
  uniqueRoles: number;
  averageHandoffTime: number | null;
}

export interface DelegationEfficiency {
  totalHandoffs: number;
  averageHandoffTime: number | null;
  fastestHandoff: number | null;
  slowestHandoff: number | null;
  efficiencyScore: number;
  bottlenecks: string[];
}

export interface BottleneckAnalysis {
  mode: string;
  averageProcessingTime: number;
  queueLength: number;
  delayFactor: number;
  recommendations: string[];
}

// Validation and quality types
export interface DelegationValidationResult {
  isValid: boolean;
  chainLength: number;
  missingHandoffs: string[];
  duplicateRoles: string[];
  recommendations: string[];
}

export interface DelegationConflict {
  taskId: number;
  conflictType: string;
  description: string;
  affectedModes: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolution: string | null;
}

// Workflow context types
export interface WorkflowContext {
  executionId: string;
  currentPhase: string;
  stepHistory: WorkflowStep[];
  modeCapabilities: Record<string, string[]>;
  transitionRules: TransitionRule[];
}

export interface WorkflowStep {
  stepId: string;
  stepName: string;
  modeId: string;
  startTime: Date;
  endTime: Date | null;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  output: Record<string, any> | null;
}

export interface TransitionRule {
  fromMode: string;
  toMode: string;
  conditions: string[];
  requirements: string[];
  autoTransition: boolean;
}
