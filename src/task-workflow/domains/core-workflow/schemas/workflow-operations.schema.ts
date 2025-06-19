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
      acceptanceCriteriaVerification: z
        .record(AcceptanceCriteriaVerificationSchema)
        .optional(), // ✅ STRUCTURED: Acceptance criteria verification with detailed tracking
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
