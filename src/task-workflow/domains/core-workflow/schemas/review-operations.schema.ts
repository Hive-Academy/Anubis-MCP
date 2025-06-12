import { z } from 'zod';

// Review Operations Schema - Code review and completion management
export const ReviewOperationsSchema = z.object({
  operation: z.enum([
    'create_review',
    'update_review',
    'get_review',
    'create_completion',
    'get_completion',
  ]),

  taskId: z.number(),

  // For code review operations
  reviewData: z
    .object({
      status: z.enum([
        'APPROVED',
        'APPROVED_WITH_RESERVATIONS',
        'NEEDS_CHANGES',
      ]),
      summary: z.string(),
      strengths: z.string().optional(),
      issues: z.string().optional(),
      acceptanceCriteriaVerification: z.record(z.any()).optional(),
      manualTestingResults: z.string().optional(),
      requiredChanges: z.string().optional(),
    })
    .optional(),

  // For completion report operations
  completionData: z
    .object({
      summary: z.string(),
      filesModified: z.array(z.string()).optional(),
      acceptanceCriteriaVerification: z.record(z.any()).optional(),
      delegationSummary: z.string().optional(),
      qualityValidation: z.string().optional(),
    })
    .optional(),

  // For querying
  includeDetails: z.boolean().default(true),
});

export type ReviewOperationsInput = z.infer<typeof ReviewOperationsSchema>;
