import { z } from 'zod';

// Individual Subtask Operations Schema - Enhanced with bulk creation
export const IndividualSubtaskOperationsSchema = z.object({
  operation: z.enum([
    'create_subtask',
    'create_subtasks_batch', // NEW: Bulk creation operation
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
      implementationApproach: z.string().optional(), // Detailed approach and technical specifications
      // Dependencies
      dependencies: z.array(z.string()).optional(), // Array of prerequisite subtask names
    })
    .optional(),

  // NEW: Bulk subtask data for create_subtasks_batch operation
  subtasksBatchData: z
    .object({
      batches: z.array(
        z.object({
          batchId: z.string(), // REQUIRED - unique batch identifier
          batchTitle: z.string(), // REQUIRED - descriptive batch title
          batchDescription: z.string().optional(), // Optional batch description
          subtasks: z.array(
            z.object({
              name: z.string(), // REQUIRED - subtask name
              description: z.string(), // REQUIRED - detailed description
              sequenceNumber: z.number(), // REQUIRED - order within batch
              acceptanceCriteria: z.array(z.string()).optional(),
              implementationApproach: z.string().optional(), // Detailed approach and technical specifications
              // Dependencies
              dependencies: z.array(z.string()).optional(), // Dependencies within this batch or across batches
            }),
          ),
        }),
      ),
      // Global dependency configuration across batches
      batchDependencies: z
        .array(
          z.object({
            batchId: z.string(), // Dependent batch
            dependsOnBatches: z.array(z.string()), // Required predecessor batches
          }),
        )
        .optional(),
      // Validation and optimization settings
      validationOptions: z
        .object({
          validateDependencies: z.boolean().default(true),
          optimizeSequencing: z.boolean().default(true),
          allowParallelExecution: z.boolean().default(true),
        })
        .optional(),
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
          acceptanceCriteriaVerification: z.record(z.string()).optional(),
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

          duration: z.string().optional(),
        })
        .optional(),
    })
    .optional(),

  // For individual subtask operations
  subtaskId: z.number().optional(),
  includeEvidence: z.boolean().optional(),
  currentSubtaskId: z.number().optional(),
  status: z
    .enum([
      'not-started',
      'in-progress',
      'completed',
      'needs-review',
      'needs-changes',
    ])
    .optional(),
});

export type IndividualSubtaskOperationsInput = z.infer<
  typeof IndividualSubtaskOperationsSchema
>;

// NEW: Type definitions for bulk creation results
export interface BulkSubtaskCreationResult {
  subtasks: Array<{
    id: number;
    name: string;
    batchId: string;
    sequenceNumber: number;
    status: string;
  }>;
  batches: Array<{
    batchId: string;
    batchTitle: string;
    subtaskCount: number;
  }>;
  dependencyGraph: Array<{
    subtaskId: number;
    dependsOn: number[];
  }>;
  message: string;
  validationResults: {
    totalSubtasks: number;
    totalBatches: number;
    dependenciesResolved: number;
    optimizationApplied: boolean;
  };
}
