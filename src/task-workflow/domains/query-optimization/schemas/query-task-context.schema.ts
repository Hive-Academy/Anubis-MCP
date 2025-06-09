import { z } from 'zod';

// Query Task Context Schema - Pre-configured comprehensive task queries
export const QueryTaskContextSchema = z.object({
  taskId: z.number(),

  // Pre-configured query options
  includeLevel: z.enum(['basic', 'full', 'comprehensive']).default('full'),

  // Optional filters for related data
  includePlans: z.boolean().default(true),
  includeSubtasks: z.boolean().default(true),
  includeAnalysis: z.boolean().default(false),
  includeComments: z.boolean().default(false),

  // Subtask filtering
  subtaskStatus: z.enum(['not-started', 'in-progress', 'completed']).optional(),
  batchId: z.string().optional(),
});

export type QueryTaskContextInput = z.infer<typeof QueryTaskContextSchema>;
