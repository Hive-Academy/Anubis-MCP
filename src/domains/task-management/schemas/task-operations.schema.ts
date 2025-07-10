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

// Research Findings Structure
export const ResearchFindingsSchema = z.object({
  researchQuestions: z
    .array(
      z.object({
        question: z.string().describe('Research question addressed'),
        priority: z
          .enum(['low', 'medium', 'high', 'critical'])
          .describe('Question priority'),
        methodology: z.string().describe('Research methodology used'),
        findings: z.string().describe('Key findings and insights'),
        recommendations: z
          .array(z.string())
          .describe('Actionable recommendations'),
        sources: z
          .array(z.string())
          .optional()
          .describe('Research sources used'),
        riskAssessment: z
          .string()
          .optional()
          .describe('Risk assessment and mitigation'),
      }),
    )
    .optional()
    .describe('Research questions and findings'),
  technicalInsights: z
    .array(z.string())
    .optional()
    .describe('Technical insights discovered'),
  implementationImplications: z
    .array(z.string())
    .optional()
    .describe('Implementation implications from research'),
  alternativeApproaches: z
    .array(
      z.object({
        approach: z.string().describe('Alternative approach identified'),
        pros: z.array(z.string()).describe('Advantages'),
        cons: z.array(z.string()).describe('Disadvantages'),
        feasibility: z
          .enum(['low', 'medium', 'high'])
          .describe('Feasibility assessment'),
      }),
    )
    .optional()
    .describe('Alternative implementation approaches'),
  researchedBy: z.string().optional().describe('Who conducted the research'),
  researchDate: z.string().optional().describe('When research was conducted'),
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

  // Implementation guidance - consolidated
  implementationApproach: z
    .string()
    .optional()
    .describe('Detailed approach and technical specifications'),

  // Quality validation
  acceptanceCriteria: z
    .array(z.string())
    .optional()
    .describe('Acceptance criteria for validation'),

  // Dependencies (used by dependency system)
  dependencies: z
    .array(z.string())
    .optional()
    .describe('Dependencies on other subtasks'),
});

// ===================================================================
// 🎯 MAIN TASK OPERATIONS SCHEMA WITH STRUCTURED VALIDATION
// ===================================================================

export const TaskOperationsSchema = z
  .object({
    operation: z.enum(['create_task', 'update_task', 'get_task', 'list_task']), // Added new operation

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
        qualityAssessment: QualityAssessmentSchema.optional(),
        filesCovered: z.array(z.string()).optional(),
        technologyStack: TechnologyStackSchema.optional(),
        analyzedBy: z.string().optional(),
      })
      .optional(),

    // For research findings - INTEGRATED WITH TASK CREATION
    researchFindings: ResearchFindingsSchema.optional(),

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
    includeResearch: z
      .boolean()
      .optional()
      .describe('Include research findings in response'),
    includeSubtasks: z
      .boolean()
      .optional()
      .describe('Include subtasks in response'),
  })
  .refine(
    (data) => {
      // For 'get' operations, require either taskId or slug
      if (data.operation === 'get_task') {
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
      if (data.operation === 'create_task') {
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
      if (data.operation === 'create_task') {
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
      if (data.operation === 'update_task') {
        return data.taskId !== undefined;
      }
      return true;
    },
    {
      message: "For 'update' operations, 'taskId' is required",
    },
  );

export type TaskOperationsInput = z.infer<typeof TaskOperationsSchema>;
export const TaskOperationsInputSchema = TaskOperationsSchema;

// Export individual schemas for reuse
export type ArchitectureFindings = z.infer<typeof ArchitectureFindingsSchema>;
export type ProblemsIdentified = z.infer<typeof ProblemsIdentifiedSchema>;
export type ImplementationContext = z.infer<typeof ImplementationContextSchema>;

export type QualityAssessment = z.infer<typeof QualityAssessmentSchema>;
export type TechnologyStack = z.infer<typeof TechnologyStackSchema>;
export type ResearchFindings = z.infer<typeof ResearchFindingsSchema>;

// Export new subtask schema
export type SubtaskData = z.infer<typeof SubtaskDataSchema>;
