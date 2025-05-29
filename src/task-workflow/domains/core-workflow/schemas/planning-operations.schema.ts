import { z } from 'zod';

// Planning Operations Schema - Implementation plans and batch subtask operations
export const PlanningOperationsSchema = z.object({
  operation: z.enum([
    'create_plan',
    'update_plan',
    'get_plan',
    'create_subtasks',
    'update_batch',
    'get_batch',
  ]),

  taskId: z.string(),

  // For implementation plan operations
  planData: z
    .object({
      overview: z.string().optional(),
      approach: z.string().optional(),
      technicalDecisions: z.string().optional(),
      filesToModify: z.array(z.string()).optional(),
      createdBy: z.string().optional(),
    })
    .optional(),

  // For batch subtask operations
  batchData: z
    .object({
      batchId: z.string(), // REQUIRED - unique batch identifier
      batchTitle: z.string().optional(), // Optional - defaults to "Untitled Batch"
      subtasks: z
        .array(
          z.object({
            name: z.string(), // REQUIRED - subtask name
            description: z.string(), // REQUIRED - detailed description
            sequenceNumber: z.number(), // REQUIRED - order within batch
            status: z
              .enum(['not-started', 'in-progress', 'completed'])
              .optional() // ✅ OPTIONAL - defaults to 'not-started' if not provided
              .default('not-started'),
          }),
        )
        .optional(),
    })
    .optional(),

  // For batch updates
  batchId: z.string().optional(),
  newStatus: z.enum(['not-started', 'in-progress', 'completed']).optional(),

  // For querying
  planId: z.number().optional(),
  includeBatches: z.boolean().default(true),
});

export type PlanningOperationsInput = z.infer<typeof PlanningOperationsSchema>;
