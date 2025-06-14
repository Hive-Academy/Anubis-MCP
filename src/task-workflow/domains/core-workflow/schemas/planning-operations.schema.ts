import { z } from 'zod';

// 🎯 STRUCTURED SCHEMAS: Proper structure definitions instead of z.any()

// Technical Decisions Schema - For implementation plan technical decisions
const TechnicalDecisionsSchema = z.object({
  architecturalPattern: z.string().optional(), // e.g., "MVC", "Repository Pattern", "Factory Pattern"
  frameworkChoices: z.array(z.string()).optional(), // e.g., ["NestJS", "TypeScript", "Prisma"]
  designPatterns: z.array(z.string()).optional(), // e.g., ["Singleton", "Observer", "Strategy"]
  dataStructures: z.array(z.string()).optional(), // e.g., ["Map", "Set", "Array"]
  performanceConsiderations: z.string().optional(), // Performance optimization decisions
  securityMeasures: z.array(z.string()).optional(), // Security implementation decisions
  testingStrategy: z.string().optional(), // Testing approach and tools
  errorHandlingApproach: z.string().optional(), // Error handling strategy
});

// Strategic Guidance Schema - For architectural context and implementation specifics
const StrategicGuidanceSchema = z.object({
  architecturalContext: z.string().optional(), // How this fits into overall architecture
  implementationSpecifics: z.string().optional(), // Specific implementation details
  codeExample: z.string().optional(), // Example code snippet or pattern
  qualityRequirements: z.string().optional(), // Quality standards to follow
  performanceTargets: z.string().optional(), // Performance expectations
  integrationPoints: z.array(z.string()).optional(), // Integration with other components
});

// Strategic Context Schema - For broader strategic context
const StrategicContextSchema = z.object({
  businessObjective: z.string().optional(), // Business goal this supports
  technicalObjective: z.string().optional(), // Technical goal this achieves
  stakeholderRequirements: z.array(z.string()).optional(), // Stakeholder needs
  constraintsAndLimitations: z.array(z.string()).optional(), // Known constraints
  riskMitigation: z.array(z.string()).optional(), // Risk mitigation strategies
});

// Verification Evidence Schema - For evidence collection
const VerificationEvidenceSchema = z.object({
  testResults: z.string().optional(), // Test execution results
  codeQualityMetrics: z.string().optional(), // Code quality measurements
  performanceMetrics: z.string().optional(), // Performance test results
  securityValidation: z.string().optional(), // Security validation results
  complianceChecks: z.array(z.string()).optional(), // Compliance verification
  peerReviewFeedback: z.string().optional(), // Peer review results
});

// Redelegation Context Schema - For redelegation scenarios
const RedelegationContextSchema = z.object({
  previousRole: z.string().optional(), // Role that previously handled this
  redelegationReason: z.string().optional(), // Why redelegation was needed
  previousAttempts: z.array(z.string()).optional(), // Previous implementation attempts
  lessonsLearned: z.array(z.string()).optional(), // Lessons from previous attempts
  newApproach: z.string().optional(), // New approach being taken
});

// Issue Analysis Schema - For problem analysis
const IssueAnalysisSchema = z.object({
  problemDescription: z.string().optional(), // Clear problem statement
  rootCause: z.string().optional(), // Root cause analysis
  impactAssessment: z.string().optional(), // Impact of the issue
  affectedComponents: z.array(z.string()).optional(), // Components affected
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(), // Issue severity
  urgency: z.enum(['low', 'medium', 'high', 'critical']).optional(), // Issue urgency
});

// Solution Strategy Schema - For solution planning
const SolutionStrategySchema = z.object({
  approachOverview: z.string().optional(), // High-level solution approach
  implementationSteps: z.array(z.string()).optional(), // Step-by-step implementation
  alternativeApproaches: z.array(z.string()).optional(), // Alternative solutions considered
  riskAssessment: z.string().optional(), // Risks associated with solution
  successCriteria: z.array(z.string()).optional(), // How to measure success
  rollbackPlan: z.string().optional(), // Plan if solution fails
});

// Quality Gates Schema - For quality assurance
const QualityGatesSchema = z.object({
  codeQualityStandards: z.array(z.string()).optional(), // Code quality requirements
  testCoverage: z.string().optional(), // Required test coverage
  performanceThresholds: z.string().optional(), // Performance requirements
  securityRequirements: z.array(z.string()).optional(), // Security standards
  documentationRequirements: z.array(z.string()).optional(), // Documentation needs
  reviewRequirements: z.string().optional(), // Review process requirements
});

// Pattern Compliance Schema - For pattern adherence
const PatternComplianceSchema = z.object({
  requiredPatterns: z.array(z.string()).optional(), // Patterns that must be followed
  forbiddenPatterns: z.array(z.string()).optional(), // Patterns to avoid
  styleGuideCompliance: z.string().optional(), // Style guide requirements
  architecturalCompliance: z.string().optional(), // Architectural pattern compliance
  bestPractices: z.array(z.string()).optional(), // Best practices to follow
});

// Anti-Pattern Prevention Schema - For preventing bad practices
const AntiPatternPreventionSchema = z.object({
  commonAntiPatterns: z.array(z.string()).optional(), // Anti-patterns to avoid
  preventionStrategies: z.array(z.string()).optional(), // How to prevent anti-patterns
  detectionMethods: z.array(z.string()).optional(), // How to detect anti-patterns
  remediationSteps: z.array(z.string()).optional(), // How to fix anti-patterns
  monitoringApproach: z.string().optional(), // How to monitor for anti-patterns
});

// Quality Constraints Schema - For subtask quality requirements
const QualityConstraintsSchema = z.object({
  patternCompliance: z.array(z.string()).optional(), // Patterns to follow
  errorHandling: z.string().optional(), // Error handling requirements
  performanceTarget: z.string().optional(), // Performance expectations
  testingRequirements: z.array(z.string()).optional(), // Testing standards
  codeQualityMetrics: z.string().optional(), // Quality metrics to achieve
  securityConsiderations: z.array(z.string()).optional(), // Security requirements
});

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

  taskId: z.number(),

  // For implementation plan operations
  planData: z
    .object({
      overview: z.string().optional(),
      approach: z.string().optional(),
      technicalDecisions: TechnicalDecisionsSchema.optional(), // ✅ STRUCTURED: Technical implementation decisions
      filesToModify: z.array(z.string()).optional(),
      createdBy: z.string().optional(),

      // Strategic Architecture Context - STRUCTURED FIELDS
      strategicGuidance: StrategicGuidanceSchema.optional(), // ✅ STRUCTURED: Architectural context and implementation specifics
      strategicContext: StrategicContextSchema.optional(), // ✅ STRUCTURED: Broader strategic context
      verificationEvidence: VerificationEvidenceSchema.optional(), // ✅ STRUCTURED: Evidence collection
      architecturalRationale: z.string().optional(),

      // Redelegation and Issue Context - STRUCTURED FIELDS
      redelegationContext: RedelegationContextSchema.optional(), // ✅ STRUCTURED: Redelegation scenarios
      issueAnalysis: IssueAnalysisSchema.optional(), // ✅ STRUCTURED: Problem analysis
      solutionStrategy: SolutionStrategySchema.optional(), // ✅ STRUCTURED: Solution planning

      // Quality and Compliance - STRUCTURED FIELDS
      qualityGates: QualityGatesSchema.optional(), // ✅ STRUCTURED: Quality assurance
      patternCompliance: PatternComplianceSchema.optional(), // ✅ STRUCTURED: Pattern adherence
      antiPatternPrevention: AntiPatternPreventionSchema.optional(), // ✅ STRUCTURED: Anti-pattern prevention
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

            // Strategic Implementation Guidance - STRUCTURED FIELDS
            strategicGuidance: StrategicGuidanceSchema.optional(), // ✅ STRUCTURED: Architectural context, implementation specifics, code examples
            qualityConstraints: QualityConstraintsSchema.optional(), // ✅ STRUCTURED: Pattern compliance, error handling, performance targets
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
