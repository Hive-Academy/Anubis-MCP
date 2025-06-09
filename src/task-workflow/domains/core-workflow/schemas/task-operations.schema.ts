import { z } from 'zod';

// Task Operations Schema - Task lifecycle management with clear operations
export const TaskOperationsSchema = z
  .object({
    operation: z.enum(['create', 'update', 'get', 'list']),

    // Required for get and update operations
    id: z.number().optional(),
    slug: z.string().optional().describe('Human-readable task slug for lookup'),

    // For create/update operations
    taskData: z
      .object({
        id: z.number().optional(),
        name: z.string().optional(),
        status: z
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
        priority: z.enum(['Low', 'Medium', 'High', 'Critical']).optional(),
        dependencies: z.array(z.string()).optional(),
        gitBranch: z.string().optional(),
      })
      .optional(),

    // For task description
    description: z
      .object({
        description: z.string().optional(),
        businessRequirements: z.string().optional(),
        technicalRequirements: z.string().optional(),
        acceptanceCriteria: z.array(z.string()).optional(),
      })
      .optional(),

    // For codebase analysis
    codebaseAnalysis: z
      .object({
        architectureFindings: z.any().optional(),
        problemsIdentified: z.any().optional(),
        implementationContext: z.any().optional(),
        integrationPoints: z.any().optional(),
        qualityAssessment: z.any().optional(),
        filesCovered: z.array(z.string()).optional(),
        technologyStack: z.any().optional(),
        analyzedBy: z.string().optional(),
      })
      .optional(),

    // For filtering/querying
    status: z.string().optional(),
    priority: z.string().optional(),
    includeDescription: z.boolean().optional(),
    includeAnalysis: z.boolean().optional(),
  })
  .refine(
    (data) => {
      // Validate that get operations have either taskId or slug
      if (data.operation === 'get' && !data.id && !data.slug) {
        return false;
      }
      // Validate that update operations have taskId (require explicit taskId for updates)
      if (data.operation === 'update' && !data.id) {
        return false;
      }
      return true;
    },
    {
      message:
        "Get operations require either 'taskId' or 'slug'; Update operations require 'taskId'",
      path: ['id'],
    },
  );

export type TaskOperationsInput = z.infer<typeof TaskOperationsSchema>;
