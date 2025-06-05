/**
 * TEMPLATE DATA CONTRACTS - The Single Source of Truth
 *
 * This file defines EXACT data structures that templates expect.
 * NO MORE TEMPLATE MISMATCHES - Every template has a strict contract.
 */

import { z } from 'zod';

// ===== CHART DATA CONTRACTS =====
export const ChartDataSchema = z.object({
  labels: z.array(z.string()),
  data: z.array(z.number()),
  colors: z.array(z.string()).optional(),
  datasets: z
    .array(
      z.object({
        label: z.string(),
        data: z.array(z.number()),
        backgroundColor: z.union([z.string(), z.array(z.string())]).optional(),
        borderColor: z.union([z.string(), z.array(z.string())]).optional(),
        borderWidth: z.number().optional(),
      }),
    )
    .optional(),
});

export type ChartDataContract = z.infer<typeof ChartDataSchema>;

// ===== INTERACTIVE DASHBOARD CONTRACT =====
export const InteractiveDashboardContractSchema = z.object({
  // Summary metrics (EXACT structure templates expect)
  summary: z.object({
    totalTasks: z.number(),
    completedTasks: z.number(),
    inProgressTasks: z.number(),
    completionRate: z.number(),
    averageCompletionTime: z.number(),
    totalDelegations: z.number(),
    delegationSuccessRate: z.number(),
  }),

  // Task distribution
  taskDistribution: z.object({
    byStatus: z.record(z.string(), z.number()),
    byPriority: z.record(z.string(), z.number()),
    byOwner: z.record(z.string(), z.number()),
  }),

  // Workflow metrics
  workflowMetrics: z.object({
    roleEfficiency: z.array(
      z.object({
        role: z.string(),
        tasksCompleted: z.number(),
        averageDuration: z.number(),
        successRate: z.number(),
      }),
    ),
    delegationFlow: z.array(
      z.object({
        fromRole: z.string(),
        toRole: z.string(),
        count: z.number(),
        successRate: z.number(),
      }),
    ),
    bottlenecks: z.array(
      z.object({
        stage: z.string(),
        averageWaitTime: z.number(),
        taskCount: z.number(),
      }),
    ),
  }),

  // Recent activity
  recentActivity: z.object({
    recentTasks: z.array(
      z.object({
        taskId: z.string(),
        name: z.string(),
        status: z.string(),
        lastUpdate: z.string(),
        owner: z.string().optional(),
      }),
    ),
    recentDelegations: z.array(
      z.object({
        taskName: z.string(),
        fromRole: z.string(),
        toRole: z.string(),
        timestamp: z.string(),
        success: z.boolean().optional(),
      }),
    ),
  }),

  // Chart data (EXACT structure for Chart.js)
  chartData: z.object({
    statusDistribution: ChartDataSchema,
    priorityDistribution: ChartDataSchema,
    completionTrends: ChartDataSchema,
    rolePerformance: ChartDataSchema,
    delegationFlow: ChartDataSchema,
  }),

  // Table data (EXACT structure for data tables)
  taskTable: z.object({
    columns: z.array(
      z.object({
        key: z.string(),
        label: z.string(),
        sortable: z.boolean(),
      }),
    ),
    data: z.array(
      z.object({
        taskId: z.string(),
        name: z.string(),
        status: z.string(),
        priority: z.string().optional(),
        owner: z.string().optional(),
        creationDate: z.string(),
        completionDate: z.string().optional(),
        duration: z.number(),
      }),
    ),
  }),

  delegationTable: z.object({
    columns: z.array(
      z.object({
        key: z.string(),
        label: z.string(),
        sortable: z.boolean(),
      }),
    ),
    data: z.array(
      z.object({
        id: z.number(),
        fromMode: z.string(),
        toMode: z.string(),
        delegationTimestamp: z.string(),
        completionTimestamp: z.string().optional(),
        success: z.boolean().optional(),
        duration: z.number(),
        taskName: z.string().optional(),
      }),
    ),
  }),

  // Metadata
  metadata: z.object({
    generatedAt: z.string(),
    reportType: z.literal('interactive-dashboard'),
    version: z.string(),
    generatedBy: z.string(),
    refreshInterval: z.number(),
  }),

  // Template-specific properties
  title: z.string(),
  filters: z.record(z.string(), z.unknown()).optional(),
  hasFilters: z.boolean(),
});

export type InteractiveDashboardContract = z.infer<
  typeof InteractiveDashboardContractSchema
>;

// ===== TASK DETAIL CONTRACT =====
export const TaskDetailContractSchema = z.object({
  task: z.object({
    taskId: z.string(),
    name: z.string(),
    taskSlug: z.string().optional(),
    status: z.string(),
    priority: z.string().optional(),
    owner: z.string().optional(),
    creationDate: z.string(),
    completionDate: z.string().optional(),
    duration: z.number(),
    description: z
      .object({
        description: z.string(),
        businessRequirements: z.string(),
        technicalRequirements: z.string(),
        acceptanceCriteria: z.array(z.string()),
      })
      .optional(),
    codebaseAnalysis: z
      .object({
        architectureFindings: z.record(z.string(), z.unknown()),
        problemsIdentified: z.record(z.string(), z.unknown()),
        implementationContext: z.record(z.string(), z.unknown()),
        integrationPoints: z.record(z.string(), z.unknown()),
        qualityAssessment: z.record(z.string(), z.unknown()),
        filesCovered: z.array(z.string()),
        technologyStack: z.record(z.string(), z.unknown()),
      })
      .optional(),
  }),

  delegationHistory: z.array(
    z.object({
      id: z.number(),
      fromMode: z.string(),
      toMode: z.string(),
      delegationTimestamp: z.string(),
      completionTimestamp: z.string().optional(),
      duration: z.number(),
      success: z.boolean().optional(),
      rejectionReason: z.string().optional(),
    }),
  ),

  implementationPlans: z.array(
    z.object({
      id: z.number(),
      overview: z.string(),
      approach: z.string(),
      technicalDecisions: z.union([
        z.string(),
        z.record(z.string(), z.unknown()),
      ]),
      filesToModify: z.array(z.string()),
      createdBy: z.string(),
      createdAt: z.string(),
      subtasks: z.array(
        z.object({
          id: z.number(),
          name: z.string(),
          description: z.string(),
          status: z.string(),
          sequenceNumber: z.number(),
          batchId: z.string().optional(),
        }),
      ),
    }),
  ),

  workflowProgress: z.object({
    currentStage: z.string(),
    completionPercentage: z.number(),
    timeInCurrentStage: z.number(),
    estimatedTimeRemaining: z.number(),
    blockers: z.array(
      z.object({
        type: z.string(),
        description: z.string(),
        severity: z.enum(['low', 'medium', 'high']),
        identifiedAt: z.string(),
      }),
    ),
  }),

  qualityMetrics: z.object({
    codeQuality: z.object({
      testCoverage: z.number().optional(),
      codeComplexity: z.number().optional(),
      maintainabilityIndex: z.number().optional(),
    }),
    processQuality: z.object({
      delegationEfficiency: z.number(),
      redelegationCount: z.number(),
      averageStageTime: z.number(),
      qualityGatesPassed: z.number(),
    }),
  }),

  relatedTasks: z.array(
    z.object({
      taskId: z.string(),
      name: z.string(),
      relationship: z.enum(['dependency', 'related', 'blocker']),
      status: z.string(),
    }),
  ),

  metadata: z.object({
    generatedAt: z.string(),
    reportType: z.literal('task-detail'),
    version: z.string(),
    generatedBy: z.string(),
  }),

  title: z.string(),
});

export type TaskDetailContract = z.infer<typeof TaskDetailContractSchema>;

// ===== DELEGATION FLOW CONTRACT =====
export const DelegationFlowContractSchema = z.object({
  task: z.object({
    taskId: z.string(),
    name: z.string(),
    taskSlug: z.string().optional(),
    status: z.string(),
    currentOwner: z.string().optional(),
    totalDelegations: z.number(),
    redelegationCount: z.number(),
  }),

  delegations: z.array(
    z.object({
      id: z.number(),
      fromRole: z.string(),
      toRole: z.string(),
      delegatedAt: z.string(),
      duration: z.number(),
      success: z.boolean().optional(),
    }),
  ),

  uniqueRoles: z.array(z.string()),
  averageDelegationTime: z.number(),
  flowEfficiency: z.number(),

  roleAnalysis: z.array(
    z.object({
      role: z.string(),
      involvement: z.number(),
      delegationsReceived: z.number(),
      delegationsMade: z.number(),
      averageHoldTime: z.number(),
      efficiency: z.number(),
    }),
  ),

  commonPaths: z.array(
    z.object({
      fromRole: z.string(),
      toRole: z.string(),
      count: z.number(),
      percentage: z.number(),
    }),
  ),

  escalationPatterns: z.array(
    z.object({
      fromRole: z.string(),
      toRole: z.string(),
      count: z.number(),
      reason: z.string(),
    }),
  ),

  taskStartDate: z.string(),
  firstDelegation: z.string(),
  lastDelegation: z.string(),
  totalFlowTime: z.number(),

  bottlenecks: z.array(
    z.object({
      role: z.string(),
      averageHoldTime: z.number(),
      delayCount: z.number(),
    }),
  ),

  fastTransitions: z.array(
    z.object({
      fromRole: z.string(),
      toRole: z.string(),
      averageTime: z.number(),
    }),
  ),

  optimizationTips: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      impact: z.string(),
    }),
  ),

  title: z.string(),
  chartData: ChartDataSchema,

  metadata: z.object({
    generatedAt: z.string(),
    reportType: z.literal('delegation-flow'),
    version: z.string(),
    generatedBy: z.string(),
  }),
});

export type DelegationFlowContract = z.infer<
  typeof DelegationFlowContractSchema
>;

// ===== CONTRACT VALIDATION UTILITIES =====
export class TemplateContractValidator {
  static validateInteractiveDashboard(
    data: unknown,
  ): InteractiveDashboardContract {
    try {
      return InteractiveDashboardContractSchema.parse(data);
    } catch (error) {
      throw new Error(
        `Interactive Dashboard template contract violation: ${error.message}`,
      );
    }
  }

  static validateTaskDetail(data: unknown): TaskDetailContract {
    try {
      return TaskDetailContractSchema.parse(data);
    } catch (error) {
      throw new Error(
        `Task Detail template contract violation: ${error.message}`,
      );
    }
  }

  static validateDelegationFlow(data: unknown): DelegationFlowContract {
    try {
      return DelegationFlowContractSchema.parse(data);
    } catch (error) {
      throw new Error(
        `Delegation Flow template contract violation: ${error.message}`,
      );
    }
  }

  static validateChartData(data: unknown): ChartDataContract {
    try {
      return ChartDataSchema.parse(data);
    } catch (error) {
      throw new Error(`Chart data contract violation: ${error.message}`);
    }
  }
}

// ===== TEMPLATE DATA BUILDERS =====
export class TemplateDataBuilder {
  static createEmptyInteractiveDashboard(): InteractiveDashboardContract {
    return {
      summary: {
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        completionRate: 0,
        averageCompletionTime: 0,
        totalDelegations: 0,
        delegationSuccessRate: 0,
      },
      taskDistribution: {
        byStatus: {},
        byPriority: {},
        byOwner: {},
      },
      workflowMetrics: {
        roleEfficiency: [],
        delegationFlow: [],
        bottlenecks: [],
      },
      recentActivity: {
        recentTasks: [],
        recentDelegations: [],
      },
      chartData: {
        statusDistribution: { labels: [], data: [] },
        priorityDistribution: { labels: [], data: [] },
        completionTrends: { labels: [], data: [] },
        rolePerformance: { labels: [], data: [] },
        delegationFlow: { labels: [], data: [] },
      },
      taskTable: {
        columns: [
          { key: 'taskId', label: 'Task ID', sortable: true },
          { key: 'name', label: 'Name', sortable: true },
          { key: 'status', label: 'Status', sortable: true },
          { key: 'priority', label: 'Priority', sortable: true },
          { key: 'owner', label: 'Owner', sortable: true },
          { key: 'creationDate', label: 'Created', sortable: true },
        ],
        data: [],
      },
      delegationTable: {
        columns: [
          { key: 'id', label: 'ID', sortable: true },
          { key: 'fromMode', label: 'From', sortable: true },
          { key: 'toMode', label: 'To', sortable: true },
          { key: 'delegationTimestamp', label: 'Delegated', sortable: true },
          { key: 'success', label: 'Success', sortable: true },
        ],
        data: [],
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        reportType: 'interactive-dashboard',
        version: '1.0.0',
        generatedBy: 'template-builder',
        refreshInterval: 300,
      },
      title: 'Interactive Workflow Dashboard',
      hasFilters: false,
    };
  }
}
