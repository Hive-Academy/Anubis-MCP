export interface WorkflowMode {
  id: string;
  name: string;
  description: string;
}

export type TaskStatus =
  | 'not-started'
  | 'in-progress'
  | 'needs-review'
  | 'needs-changes'
  | 'completed'
  | 'blocked'
  | 'paused';

export interface WorkflowTransitionView {
  from: string;
  to: string;
  timestamp: Date;
}

export interface PrismaErrorHandler {
  handlePrismaError(
    error: unknown,
    taskId: string,
    operationContext?: {
      operation: string;
      service: string;
      sliceType?: string;
      batchId?: string;
      performanceMs?: number;
    },
  ): never;
}
