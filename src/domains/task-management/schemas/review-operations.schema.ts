import { z } from 'zod';

// 🎯 STRUCTURED SCHEMAS: Proper structure definitions instead of z.any()

// Acceptance Criteria Verification Schema - For tracking acceptance criteria validation
const AcceptanceCriteriaVerificationSchema = z.object({
  criteriaId: z.string().optional(), // Unique identifier for the criteria
  criteriaDescription: z.string().optional(), // Description of the acceptance criteria
  verificationStatus: z
    .enum(['passed', 'failed', 'partial', 'not-tested'])
    .optional(), // Verification result
  verificationMethod: z.string().optional(), // How the criteria was verified (manual, automated, etc.)
  evidence: z.string().optional(), // Evidence supporting the verification
  testResults: z.string().optional(), // Specific test results
  notes: z.string().optional(), // Additional notes about verification
  verifiedBy: z.string().optional(), // Who performed the verification
  verificationDate: z.string().optional(), // When verification was performed
});

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
      acceptanceCriteriaVerification: z
        .record(AcceptanceCriteriaVerificationSchema)
        .optional(), // ✅ STRUCTURED: Acceptance criteria verification with detailed tracking
      manualTestingResults: z.string().optional(),
      requiredChanges: z.string().optional(),
    })
    .optional(),

  // For completion report operations
  completionData: z
    .object({
      summary: z.string(),
      filesModified: z.array(z.string()).optional(),
      acceptanceCriteriaVerification: z
        .record(AcceptanceCriteriaVerificationSchema)
        .optional(), // ✅ STRUCTURED: Acceptance criteria verification with detailed tracking
      delegationSummary: z.string().optional(),
      qualityValidation: z.string().optional(),
    })
    .optional(),

  // For querying
  includeDetails: z.boolean().default(true),
});

export type ReviewOperationsInput = z.infer<typeof ReviewOperationsSchema>;

// Export schema for MCP tool usage
export const ReviewOperationsInputSchema = ReviewOperationsSchema;
