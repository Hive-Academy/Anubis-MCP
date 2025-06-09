import { z } from 'zod';

// Query Reports Schema - Pre-configured report queries with relationships
export const QueryReportsSchema = z.object({
  taskId: z.number(),

  // Report types to include
  reportTypes: z
    .array(z.enum(['research', 'code_review', 'completion']))
    .default(['research', 'code_review', 'completion']),

  // Query mode
  mode: z.enum(['summary', 'detailed', 'evidence_focused']).default('detailed'),

  // Include options
  includeComments: z.boolean().default(false),
  includeEvidence: z.boolean().default(true),

  // Filters
  reviewStatus: z
    .enum(['APPROVED', 'APPROVED_WITH_RESERVATIONS', 'NEEDS_CHANGES'])
    .optional(),
  researchedBy: z.string().optional(),
  reviewedBy: z.string().optional(),
});

export type QueryReportsInput = z.infer<typeof QueryReportsSchema>;
