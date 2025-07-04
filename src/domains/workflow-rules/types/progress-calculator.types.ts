export interface ProgressMetrics {
  currentStepProgress?: number;
  roleProgress?: number;
  overallProgress?: number;
  completedSteps?: number;
  totalSteps?: number;
  estimatedTimeRemaining?: string;
  nextMilestone?: string;
  percentage?: number;
  stepsCompleted?: number;
  estimatedCompletion?: string | null;
}

export interface ExecutionHistory {
  stepId: string;
  executionTime: number;
  status: string;
  completionEvidence?: string;
  startedAt?: Date;
  completedAt?: Date;
  executionData?: Record<string, unknown>;
}

export interface RoleStepData {
  id: string;
  name: string;
  sequenceOrder: number;
  estimatedDuration?: string;
  actions?: unknown[];
}

export interface TaskExecutionData {
  id: number;
  status: string;
  executions: WorkflowExecutionData[];
}

export interface WorkflowExecutionData {
  id: string;
  taskId: number;
  currentRole: {
    id: string;
    name: string;
  };
  stepExecutions: StepExecutionData[];
  createdAt: Date;
}

export interface StepExecutionData {
  id: string;
  stepId: string;
  status: string;
  startedAt?: Date;
  completedAt?: Date;
  executionData?: Record<string, unknown>;
  step: {
    id: string;
    name: string;
    estimatedDuration?: string;
    actions?: unknown[];
  };
  execution: {
    currentRole: {
      name: string;
    };
  };
  createdAt: Date;
}

// ===== CALCULATION RESULT TYPES =====
export interface ProgressCalculationResult {
  success: boolean;
  metrics?: ProgressMetrics;
  error?: string;
  context?: {
    taskId: number;
    roleName: string;
    stepId: string | null;
  };
}

export interface MilestoneData {
  id: string;
  name: string;
  description: string;
  targetDate?: Date;
  progress: number;
  roleName: string;
}

export interface TimeEstimation {
  estimatedMinutes: number;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  basedOn: 'HISTORICAL' | 'ESTIMATED' | 'DEFAULT';
}

// ===== TYPE GUARDS =====
export function isProgressMetrics(data: unknown): data is ProgressMetrics {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.currentStepProgress === 'number' &&
    typeof obj.roleProgress === 'number' &&
    typeof obj.overallProgress === 'number' &&
    typeof obj.completedSteps === 'number' &&
    typeof obj.totalSteps === 'number'
  );
}

export function isExecutionHistory(data: unknown): data is ExecutionHistory {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.stepId === 'string' &&
    typeof obj.executionTime === 'number' &&
    typeof obj.status === 'string'
  );
}

export function isStepExecutionData(data: unknown): data is StepExecutionData {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.stepId === 'string' &&
    typeof obj.status === 'string' &&
    !!obj.step &&
    typeof obj.step === 'object' &&
    !!obj.execution &&
    typeof obj.execution === 'object'
  );
}

export function isRoleStepData(data: unknown): data is RoleStepData {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.sequenceOrder === 'number'
  );
}

export function isTaskExecutionData(data: unknown): data is TaskExecutionData {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.id === 'number' &&
    typeof obj.status === 'string' &&
    Array.isArray(obj.executions)
  );
}

export function isStringArray(data: unknown): data is string[] {
  return Array.isArray(data) && data.every((item) => typeof item === 'string');
}

export function isNumberArray(data: unknown): data is number[] {
  return Array.isArray(data) && data.every((item) => typeof item === 'number');
}

// ===== UTILITY TYPES =====
export type ExecutionStatus =
  | 'completed'
  | 'in-progress'
  | 'failed'
  | 'pending'
  | 'cancelled';

export type ProgressCalculationMethod =
  | 'ACTION_BASED'
  | 'TIME_BASED'
  | 'DEFAULT';

export interface ProgressCalculationContext {
  taskId: number;
  roleName: string;
  stepId: string | null;
  calculationMethod: ProgressCalculationMethod;
  timestamp: Date;
}
