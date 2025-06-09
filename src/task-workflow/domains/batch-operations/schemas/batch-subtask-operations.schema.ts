import { z } from 'zod';

// Batch Subtask Operations Schema - Bulk subtask management by batchId
export const BatchSubtaskOperationsSchema = z.object({
  operation: z.enum([
    'get_batch_subtasks',
    'update_batch_status',
    'create_batch_subtasks',
    'delete_batch_subtasks',
    'get_batch_summary',
    'complete_batch',
  ]),

  taskId: z.number(),
  batchId: z.string(),

  // For status updates
  newStatus: z
    .enum(['not-started', 'in-progress', 'completed', 'needs-changes'])
    .optional(),

  // For creating new batch subtasks
  subtasks: z
    .array(
      z.object({
        name: z.string(),
        description: z.string(),
        sequenceNumber: z.number(),
        status: z
          .enum(['not-started', 'in-progress', 'completed', 'needs-changes'])
          .optional(),
        estimatedDuration: z.string().optional(),
      }),
    )
    .optional(),

  // For bulk completion
  completionData: z
    .object({
      summary: z.string(),
      filesModified: z.array(z.string()).optional(),
      implementationNotes: z.string().optional(),
    })
    .optional(),

  // For filtering and querying
  statusFilter: z
    .enum(['not-started', 'in-progress', 'completed', 'needs-changes'])
    .optional(),
  includeCompleted: z.boolean().optional(),
});

export type BatchSubtaskOperationsInput = z.infer<
  typeof BatchSubtaskOperationsSchema
>;
