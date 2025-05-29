import { z } from 'zod';

// Batch Status Updates Schema - Cross-entity status synchronization
export const BatchStatusUpdatesSchema = z.object({
  operation: z.enum([
    'sync_task_status',
    'sync_plan_status',
    'sync_batch_progress',
    'update_cross_entity',
    'get_sync_status',
    'validate_consistency',
  ]),

  taskId: z.string(),

  // For status synchronization
  sourceEntity: z.enum(['task', 'plan', 'batch', 'subtask']).optional(),
  targetStatus: z
    .enum([
      'not-started',
      'in-progress',
      'needs-review',
      'completed',
      'needs-changes',
    ])
    .optional(),

  // For batch progress sync
  batchId: z.string().optional(),
  forceSync: z.boolean().default(false),

  // For cross-entity updates
  entityUpdates: z
    .array(
      z.object({
        entity: z.enum(['task', 'implementationPlan', 'subtask']),
        entityId: z.union([z.string(), z.number()]),
        newStatus: z.string(),
        metadata: z.record(z.any()).optional(),
      }),
    )
    .optional(),

  // For validation
  checkConsistency: z.boolean().default(true),
  autoRepair: z.boolean().default(false),

  // For reporting
  includeDetails: z.boolean().default(true),
  includeHistory: z.boolean().default(false),
});

export type BatchStatusUpdatesInput = z.infer<typeof BatchStatusUpdatesSchema>;
