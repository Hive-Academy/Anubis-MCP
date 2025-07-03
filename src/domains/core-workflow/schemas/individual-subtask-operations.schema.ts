import { z } from 'zod';

// Individual Subtask Operations Schema - Focused on individual subtask CRUD operations
export const IndividualSubtaskOperationsSchema = z.object({
  operation: z.enum([
    'create_subtask',
    'update_subtask',
    'get_subtask',
    'get_next_subtask',
  ]),

  taskId: z.number(),

  // Individual subtask data for create_subtask operation
  subtaskData: z
    .object({
      name: z.string(), // REQUIRED - subtask name
      description: z.string(), // REQUIRED - detailed description
      batchId: z.string(), // REQUIRED - batch identifier
      batchTitle: z.string().optional(), // Optional - batch title
      sequenceNumber: z.number(), // REQUIRED - order within batch
      acceptanceCriteria: z.array(z.string()).optional(), // Array of specific testable requirements
      strategicGuidance: z
        .object({
          architecturalPattern: z.string().optional(),
          implementationApproach: z.string().optional(),
          qualityRequirements: z.string().optional(),
          performanceConsiderations: z.string().optional(),
        })
        .optional(), // Detailed guidance object
      technicalSpecifications: z
        .object({
          frameworks: z.array(z.string()).optional(),
          patterns: z.array(z.string()).optional(),
          testingRequirements: z.string().optional(),
        })
        .optional(), // Technical specs object
      estimatedDuration: z.string().optional(), // Time estimate
      dependencies: z.array(z.string()).optional(), // Array of prerequisite subtask names
    })
    .optional(),

  // Update data for update_subtask operation
  updateData: z
    .object({
      status: z
        .enum([
          'not-started',
          'in-progress',
          'completed',
          'needs-review',
          'needs-changes',
        ])
        .optional(),
      completionEvidence: z
        .object({
          acceptanceCriteriaVerification: z.record(z.string()).optional(), // Evidence per criteria
          implementationSummary: z.string().optional(),
          filesModified: z.array(z.string()).optional(),
          testingResults: z
            .object({
              unitTests: z.string().optional(),
              integrationTests: z.string().optional(),
              manualTesting: z.string().optional(),
            })
            .optional(),
          qualityAssurance: z
            .object({
              codeQuality: z.string().optional(),
              performance: z.string().optional(),
              security: z.string().optional(),
            })
            .optional(),
          strategicGuidanceFollowed: z.string().optional(),
          duration: z.string().optional(),
        })
        .optional(), // Evidence collection per subtask
    })
    .optional(),

  // For individual subtask operations
  subtaskId: z.number().optional(), // For get_subtask and update_subtask
  includeEvidence: z.boolean().optional(), // For get_subtask
  currentSubtaskId: z.number().optional(), // For get_next_subtask
  status: z
    .enum([
      'not-started',
      'in-progress',
      'completed',
      'needs-review',
      'needs-changes',
    ])
    .optional(), // For filtering
});

export type IndividualSubtaskOperationsInput = z.infer<
  typeof IndividualSubtaskOperationsSchema
>;
