// Workflow Execution State schema and interface with Zod validation
import { z } from 'zod';

// -----------------------------------------------------------------------------
// 1. TypeScript Interface
// -----------------------------------------------------------------------------
export interface WorkflowExecutionState {
  phase: 'initialized' | 'in-progress' | 'role_transitioned' | 'completed';
  currentContext?: Record<string, unknown>;
  currentStep?: {
    id: string;
    name: string;
    sequenceNumber: number;
    assignedAt: string; // ISO-8601
  };
  lastCompletedStep?: {
    id: string;
    completedAt: string;
    result: 'success' | 'failure';
  };
  lastTransition?: {
    newRoleId: string;
    timestamp: string;
    handoffMessage?: string;
  };
  progressMarkers?: string[];
  lastProgressUpdate?: string;
}

// -----------------------------------------------------------------------------
// 2. Zod Schema (runtime validation)
// -----------------------------------------------------------------------------
export const WorkflowExecutionStateSchema = z.object({
  phase: z.string(),
  currentContext: z.record(z.unknown()).optional(),
  currentStep: z
    .object({
      id: z.string(),
      name: z.string(),
      sequenceNumber: z.number().int(),
      assignedAt: z.string(),
    })
    .optional(),
  lastCompletedStep: z
    .object({
      id: z.string(),
      completedAt: z.string(),
      result: z.enum(['success', 'failure']),
    })
    .optional(),
  lastTransition: z
    .object({
      newRoleId: z.string(),
      timestamp: z.string(),
      handoffMessage: z.string().optional(),
    })
    .optional(),
  progressMarkers: z.array(z.string()).optional(),
  lastProgressUpdate: z.string().optional(),
});

// Helper alias for inferred type (ensures consistency if schema changes)
export type WorkflowExecutionStateType = z.infer<
  typeof WorkflowExecutionStateSchema
>;
