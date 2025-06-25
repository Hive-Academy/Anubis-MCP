import { z } from 'zod';

// ===================================================================
// 🎯 STRUCTURED INTERFACES FOR JSON FIELDS
// ===================================================================
// These interfaces define the expected structure for Prisma JSON fields
// This replaces z.any() with proper validation and AI guidance

// Architecture Findings Structure
export const ArchitectureFindingsSchema = z.object({
  patterns: z
    .array(z.string())
    .optional()
    .describe('Architectural patterns identified'),
  techStack: z
    .record(z.string())
    .optional()
    .describe('Technology stack with versions'),
  fileStructure: z
    .record(z.string())
    .optional()
    .describe('Key file organization patterns'),
  dependencies: z
    .array(z.string())
    .optional()
    .describe('Major dependencies identified'),
  designPrinciples: z
    .array(z.string())
    .optional()
    .describe('Design principles observed'),
});

// Problems Identified Structure
export const ProblemsIdentifiedSchema = z.object({
  issues: z
    .array(
      z.object({
        type: z
          .string()
          .describe(
            'Issue category (performance, security, maintainability, etc.)',
          ),
        description: z.string().describe('Detailed issue description'),
        severity: z
          .enum(['low', 'medium', 'high', 'critical'])
          .describe('Issue severity level'),
        location: z
          .string()
          .optional()
          .describe('File/component where issue exists'),
      }),
    )
    .optional(),
  technicalDebt: z
    .array(z.string())
    .optional()
    .describe('Technical debt items identified'),
  rootCauses: z
    .array(z.string())
    .optional()
    .describe('Root causes of identified problems'),
});

// Implementation Context Structure
export const ImplementationContextSchema = z.object({
  existingPatterns: z
    .array(z.string())
    .optional()
    .describe('Current coding patterns in use'),
  codingStandards: z
    .array(z.string())
    .optional()
    .describe('Coding standards observed'),
  qualityGuidelines: z
    .array(z.string())
    .optional()
    .describe('Quality guidelines in place'),
  testingApproach: z
    .string()
    .optional()
    .describe('Current testing methodology'),
});

// Integration Points Structure
export const IntegrationPointsSchema = z.object({
  apis: z
    .array(
      z.object({
        name: z.string(),
        type: z.string().describe('REST, GraphQL, gRPC, etc.'),
        purpose: z.string().describe('What this API does'),
      }),
    )
    .optional(),
  services: z
    .array(z.string())
    .optional()
    .describe('External services integrated'),
  databases: z.array(z.string()).optional().describe('Database connections'),
  externalDependencies: z
    .array(z.string())
    .optional()
    .describe('External system dependencies'),
});

// Quality Assessment Structure
export const QualityAssessmentSchema = z.object({
  codeQuality: z
    .object({
      score: z
        .number()
        .min(0)
        .max(10)
        .optional()
        .describe('Code quality score 0-10'),
      metrics: z
        .record(z.union([z.string(), z.number()]))
        .optional()
        .describe('Quality metrics'),
    })
    .optional(),
  testCoverage: z
    .object({
      percentage: z
        .number()
        .min(0)
        .max(100)
        .optional()
        .describe('Test coverage percentage'),
      areas: z.array(z.string()).optional().describe('Well-tested areas'),
      gaps: z.array(z.string()).optional().describe('Testing gaps identified'),
    })
    .optional(),
  documentation: z
    .object({
      quality: z.enum(['poor', 'fair', 'good', 'excellent']).optional(),
      coverage: z.array(z.string()).optional().describe('Documented areas'),
      missing: z.array(z.string()).optional().describe('Missing documentation'),
    })
    .optional(),
});

// Technology Stack Structure
export const TechnologyStackSchema = z.object({
  frontend: z
    .record(z.string())
    .optional()
    .describe('Frontend technologies with versions'),
  backend: z
    .record(z.string())
    .optional()
    .describe('Backend technologies with versions'),
  database: z.record(z.string()).optional().describe('Database technologies'),
  infrastructure: z
    .record(z.string())
    .optional()
    .describe('Infrastructure and deployment'),
  tools: z
    .record(z.string())
    .optional()
    .describe('Development tools and utilities'),
});

// ===================================================================
// 🎯 NEW: ENHANCED SUBTASK SCHEMA FOR DIRECT EXECUTION
// ===================================================================
// Subtask Schema with comprehensive implementation context - eliminates implementation plan
export const SubtaskDataSchema = z.object({
  name: z.string().describe('Subtask name'),
  description: z.string().describe('Detailed subtask description'),
  sequenceNumber: z.number().describe('Order within task'),
  batchId: z.string().optional().describe('Batch identifier for grouping'),
  batchTitle: z.string().optional().describe('Batch title'),
  status: z
    .enum(['not-started', 'in-progress', 'completed'])
    .optional()
    .default('not-started'),
  estimatedDuration: z
    .string()
    .optional()
    .describe('Estimated completion time'),

  // Implementation Details
  implementationOverview: z
    .string()
    .optional()
    .describe('Overview of what this subtask accomplishes'),
  implementationApproach: z
    .string()
    .optional()
    .describe('Detailed approach for implementing this specific subtask'),
  technicalDecisions: z
    .record(z.any())
    .optional()
    .describe('Technical decisions specific to this subtask'),
  filesToModify: z
    .array(z.string())
    .optional()
    .describe('Specific files this subtask will modify'),
  codeExamples: z
    .record(z.string())
    .optional()
    .describe('Code examples and patterns to follow'),

  // Strategic Context
  strategicGuidance: z
    .record(z.any())
    .optional()
    .describe('Strategic guidance for this specific subtask'),
  architecturalContext: z
    .string()
    .optional()
    .describe('How this subtask fits into overall architecture'),
  architecturalRationale: z
    .record(z.any())
    .optional()
    .describe('Architectural rationale for this subtask'),

  // Quality and Constraints
  qualityConstraints: z
    .record(z.any())
    .optional()
    .describe('Quality constraints and requirements'),
  qualityGates: z
    .record(z.any())
    .optional()
    .describe('Quality gates specific to this subtask'),
  acceptanceCriteria: z
    .array(z.string())
    .optional()
    .describe('Acceptance criteria for this subtask'),
  successCriteria: z
    .record(z.any())
    .optional()
    .describe('Success criteria for completion validation'),
  testingRequirements: z
    .record(z.any())
    .optional()
    .describe('Specific testing requirements for this subtask'),

  // Implementation Specifications
  technicalSpecifications: z
    .record(z.any())
    .optional()
    .describe('Technical specifications and requirements'),
  performanceTargets: z
    .record(z.any())
    .optional()
    .describe('Performance targets for this subtask'),
  securityConsiderations: z
    .record(z.any())
    .optional()
    .describe('Security considerations for this subtask'),
  errorHandlingStrategy: z
    .string()
    .optional()
    .describe('Error handling approach for this subtask'),

  // Dependencies and Integration
  dependencies: z
    .array(z.string())
    .optional()
    .describe('Dependencies on other subtasks or external factors'),
  integrationPoints: z
    .record(z.any())
    .optional()
    .describe('Integration points with other components'),
  externalDependencies: z
    .record(z.any())
    .optional()
    .describe('External system dependencies'),

  // Evidence and Validation
  validationSteps: z
    .record(z.any())
    .optional()
    .describe('Steps to validate completion'),
});

// ===================================================================
// 🎯 MAIN TASK OPERATIONS SCHEMA WITH STRUCTURED VALIDATION
// ===================================================================

export const TaskOperationsSchema = z
  .object({
    operation: z.enum([
      'create',
      'update',
      'get',
      'list',
      'create_with_subtasks',
    ]), // Added new operation

    // Required for get and update operations
    taskId: z.number().optional(),
    slug: z.string().optional().describe('Human-readable task slug for lookup'),

    // Execution linking - REQUIRED for create operations
    executionId: z
      .string()
      .optional()
      .describe('Workflow execution ID to link task to current execution'),

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

    // For codebase analysis - NOW WITH PROPER STRUCTURE
    codebaseAnalysis: z
      .object({
        architectureFindings: ArchitectureFindingsSchema.optional(),
        problemsIdentified: ProblemsIdentifiedSchema.optional(),
        implementationContext: ImplementationContextSchema.optional(),
        integrationPoints: IntegrationPointsSchema.optional(),
        qualityAssessment: QualityAssessmentSchema.optional(),
        filesCovered: z.array(z.string()).optional(),
        technologyStack: TechnologyStackSchema.optional(),
        analyzedBy: z.string().optional(),
      })
      .optional(),

    // NEW: Direct subtask creation - eliminates implementation plan
    subtasks: z
      .array(SubtaskDataSchema)
      .optional()
      .describe('Subtasks to create directly with task'),

    // For filtering/querying
    status: z.string().optional(),
    priority: z.string().optional(),
    includeDescription: z.boolean().optional(),
    includeAnalysis: z.boolean().optional(),
    includeSubtasks: z
      .boolean()
      .optional()
      .describe('Include subtasks in response'),
  })
  .refine(
    (data) => {
      // For 'get' operations, require either taskId or slug
      if (data.operation === 'get') {
        return data.taskId !== undefined || data.slug !== undefined;
      }
      return true;
    },
    {
      message:
        "For 'get' operations, either 'taskId' or 'slug' must be provided",
    },
  )
  .refine(
    (data) => {
      // For 'create' operations, require taskData with name
      if (
        data.operation === 'create' ||
        data.operation === 'create_with_subtasks'
      ) {
        return data.taskData?.name !== undefined;
      }
      return true;
    },
    {
      message: "For 'create' operations, 'taskData.name' is required",
    },
  )
  .refine(
    (data) => {
      // For 'create' operations, require executionId for workflow linking
      if (
        data.operation === 'create' ||
        data.operation === 'create_with_subtasks'
      ) {
        return data.executionId !== undefined;
      }
      return true;
    },
    {
      message:
        "For 'create' operations, 'executionId' is required to link task to workflow execution",
    },
  )
  .refine(
    (data) => {
      // For 'update' operations, require taskId
      if (data.operation === 'update') {
        return data.taskId !== undefined;
      }
      return true;
    },
    {
      message: "For 'update' operations, 'taskId' is required",
    },
  )
  .refine(
    (data) => {
      // For 'create_with_subtasks' operations, require subtasks array
      if (data.operation === 'create_with_subtasks') {
        return data.subtasks !== undefined && data.subtasks.length > 0;
      }
      return true;
    },
    {
      message:
        "For 'create_with_subtasks' operations, 'subtasks' array is required and must not be empty",
    },
  );

export type TaskOperationsInput = z.infer<typeof TaskOperationsSchema>;

// Export individual schemas for reuse
export type ArchitectureFindings = z.infer<typeof ArchitectureFindingsSchema>;
export type ProblemsIdentified = z.infer<typeof ProblemsIdentifiedSchema>;
export type ImplementationContext = z.infer<typeof ImplementationContextSchema>;
export type IntegrationPoints = z.infer<typeof IntegrationPointsSchema>;
export type QualityAssessment = z.infer<typeof QualityAssessmentSchema>;
export type TechnologyStack = z.infer<typeof TechnologyStackSchema>;

// Export new subtask schema
export type SubtaskData = z.infer<typeof SubtaskDataSchema>;
