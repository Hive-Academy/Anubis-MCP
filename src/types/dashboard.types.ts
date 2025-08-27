export interface ExecutionOverview {
  id: string;
  taskId: number;
  currentRole: string;
  currentStep: string;
  progress: number;
  elapsedTime: string;
  nextSteps: string[];
  status: string;
  taskName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskDetail {
  id: number;
  name: string;
  description: string;
  businessRequirements: string;
  technicalRequirements: string;
  acceptanceCriteria: string[];
  status: string;
  priority: string;
  subtasks: SubtaskDetail[];
  totalSubtasks: number;
  completedSubtasks: number;
  progress: number;
}

export interface SubtaskDetail {
  id: number;
  name: string;
  description: string;
  status: string;
  batchId: string;
  batchTitle: string;
  sequenceNumber: number;
  dependencies: string[];
  acceptanceCriteria: string[];
}

export interface TimelineEvent {
  id: string;
  type:
    | 'role.transition'
    | 'step.started'
    | 'step.completed'
    | 'validation'
    | 'error';
  message: string;
  role: string;
  timestamp: Date;
  metadata?: {
    stepId?: string;
    executionId?: string;
    details?: any;
  };
}

export interface WebSocketMessage {
  type: 'execution.updated' | 'task.updated' | 'timeline.event';
  data: ExecutionOverview | TaskDetail | TimelineEvent;
  timestamp: Date;
}
