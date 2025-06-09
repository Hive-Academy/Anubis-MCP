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
      technicalDecisions: z.record(z.any()).optional(),
      filesToModify: z.array(z.string()).optional(),
      createdBy: z.string().optional(),

      // Strategic Architecture Context - NEW FIELDS
      strategicGuidance: z.record(z.any()).optional(),
      strategicContext: z.record(z.any()).optional(),
      verificationEvidence: z.record(z.any()).optional(),
      architecturalRationale: z.string().optional(),

      // Redelegation and Issue Context - NEW FIELDS
      redelegationContext: z.record(z.any()).optional(),
      issueAnalysis: z.record(z.any()).optional(),
      solutionStrategy: z.record(z.any()).optional(),

      // Quality and Compliance - NEW FIELDS
      qualityGates: z.record(z.any()).optional(),
      patternCompliance: z.record(z.any()).optional(),
      antiPatternPrevention: z.record(z.any()).optional(),
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

            // Strategic Implementation Guidance - NEW FIELDS
            strategicGuidance: z.record(z.any()).optional(), // architecturalContext, implementationSpecifics, codeExample
            qualityConstraints: z.record(z.any()).optional(), // patternCompliance, errorHandling, performanceTarget
            successCriteria: z.array(z.string()).optional(), // Specific validation points and completion requirements
            architecturalRationale: z.string().optional(), // Why this subtask is needed and how it fits the solution
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
