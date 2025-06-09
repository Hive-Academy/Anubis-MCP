import { z } from 'zod';

// Query Workflow Status Schema - Pre-configured delegation and workflow queries
export const QueryWorkflowStatusSchema = z.object({
  taskId: z.number().optional(),

  // Query type
  queryType: z
    .enum([
      'task_status',
      'delegation_history',
      'workflow_transitions',
      'current_assignments',
    ])
    .default('task_status'),

  // Filters
  currentRole: z
    .enum([
      'boomerang',
      'researcher',
      'architect',
      'senior-developer',
      'code-review',
    ])
    .optional(),
  status: z
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

  // Date range for history queries
  fromDate: z.string().optional(),
  toDate: z.string().optional(),

  // Include options
  includeTransitions: z.boolean().default(true),
  includeDelegations: z.boolean().default(true),
});

export type QueryWorkflowStatusInput = z.infer<
  typeof QueryWorkflowStatusSchema
>;
