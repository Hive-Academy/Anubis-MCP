/**
 * Task Summary Template Data Interface
 *
 * Defines the exact data structure expected by task-summary.hbs template.
 * This interface ensures type safety between the template variables and service methods.
 *
 * Template Variables Analyzed:
 * - {{generatedAt}}, {{dateRange.start}}, {{dateRange.end}}, {{filters}}
 * - {{metrics.*}} - comprehensive metrics object
 * - {{tasks}} - array of task objects with specific properties
 * - {{chartData.*}} - chart data for status and priority visualizations
 * - {{insights}} - array of insight objects with recommendations
 */

export interface TaskSummaryTemplateData {
  /** Report generation timestamp */
  generatedAt: Date;

  /** Date range for the report */
  dateRange: {
    start: string;
    end: string;
  };

  /** Applied filters for the report */
  filters?: Record<string, string>;

  /** Core metrics displayed in the dashboard cards */
  metrics: {
    /** Total number of tasks in the period */
    totalTasks: number;
    /** Change percentage vs previous period */
    totalTasksChange?: number;

    /** Number of completed tasks */
    completedTasks: number;
    /** Completion rate percentage */
    completionRate: number;

    /** Number of in-progress tasks */
    inProgressTasks: number;
    /** Average time tasks spend in progress */
    avgTimeInProgress?: string;

    /** Number of high priority tasks */
    highPriorityTasks: number;
    /** Number of overdue high priority tasks */
    overdueHighPriority?: number;
  };

  /** Task list for the table display */
  tasks?: TaskSummaryItem[];

  /** Status distribution chart data matching template expectations */
  statusDistribution: {
    /** Labels for status distribution chart */
    labels: string[];
    /** Data values for status distribution */
    data: number[];
  };

  /** Priority distribution chart data matching template expectations */
  priorityDistribution: {
    /** Labels for priority breakdown chart */
    labels: string[];
    /** Data values for priority breakdown */
    data: number[];
  };

  /** Performance insights as string array for template {{#each insights}} */
  insights?: string[];

  /** Recommended actions as string array for template {{#each recommendations}} */
  recommendations?: string[];
}

/**
 * Individual task item for the task list table
 */
export interface TaskSummaryItem {
  /** Task identifier */
  taskId: string;
  /** Task name/title */
  name: string;
  /** Current task status */
  status:
    | 'completed'
    | 'in-progress'
    | 'not-started'
    | 'needs-review'
    | 'needs-changes';
  /** Task priority level */
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  /** Task owner */
  owner: string;
  /** Task creation date */
  creationDate: Date;
}

/**
 * Insight object for the insights section
 */
export interface TaskSummaryInsight {
  /** Insight title */
  title: string;
  /** Insight description */
  description: string;
  /** Optional recommendation */
  recommendation?: string;
}

/**
 * Service method interface for task summary data retrieval
 */
export interface TaskSummaryDataService {
  /**
   * Retrieves task summary data for the specified date range and filters
   * @param startDate Start date for the report
   * @param endDate End date for the report
   * @param filters Optional filters to apply
   * @returns Promise resolving to TaskSummaryTemplateData
   */
  getTaskSummaryData(
    startDate: Date,
    endDate: Date,
    filters?: Record<string, string>,
  ): Promise<TaskSummaryTemplateData>;
}
