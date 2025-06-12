import { z } from 'zod';

// Workflow Operations Schema - Role transitions and delegation management
export const WorkflowOperationsSchema = z.object({
  operation: z.enum(['delegate', 'complete', 'escalate', 'transition']),

  taskId: z.number(),
  fromRole: z.enum([
    'boomerang',
    'researcher',
    'architect',
    'senior-developer',
    'code-review',
  ]),
  toRole: z
    .enum([
      'boomerang',
      'researcher',
      'architect',
      'senior-developer',
      'code-review',
    ])
    .optional(),

  message: z.string().optional(),

  // For completion operations
  completionData: z
    .object({
      summary: z.string(),
      filesModified: z.array(z.string()).optional(),
      acceptanceCriteriaVerification: z.record(z.any()).optional(),
    })
    .optional(),

  // For escalation operations
  escalationData: z
    .object({
      reason: z.string(),
      severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
      blockers: z.array(z.string()).optional(),
    })
    .optional(),

  // For status transitions
  newStatus: z
    .enum([
      'not-started',
      'in-progress',
      'needs-review',
      'completed',
      'needs-changes',
      'paused',
      'cancelled',
    ])
    .optional(),
});

export type WorkflowOperationsInput = z.infer<typeof WorkflowOperationsSchema>;
