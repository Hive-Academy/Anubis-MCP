import { Injectable, Logger } from '@nestjs/common';
import {
  TemplateContractValidator,
  InteractiveDashboardContract,
  TaskDetailContract,
  DelegationFlowContract,
} from './template-contracts';

/**
 * BULLETPROOF TEMPLATE DATA VALIDATOR
 *
 * This service ensures that data passed to templates matches EXACTLY
 * what the templates expect. No more runtime template failures!
 */
@Injectable()
export class TemplateDataValidatorService {
  private readonly logger = new Logger(TemplateDataValidatorService.name);

  /**
   * Validate and transform data for interactive dashboard template
   */
  validateInteractiveDashboardData(data: any): InteractiveDashboardContract {
    try {
      this.logger.log('Validating interactive dashboard data structure');

      // Ensure required structure exists
      const validatedData = {
        // Summary metrics (template expects summary.metrics)
        summary: {
          totalTasks: data.summary?.totalTasks || 0,
          completedTasks: data.summary?.completedTasks || 0,
          inProgressTasks: data.summary?.inProgressTasks || 0,
          completionRate: data.summary?.completionRate || 0,
          averageCompletionTime: data.summary?.averageCompletionTime || 0,
          totalDelegations: data.summary?.totalDelegations || 0,
          delegationSuccessRate: data.summary?.delegationSuccessRate || 0,
        },

        // Task distribution
        taskDistribution: {
          byStatus: data.taskDistribution?.byStatus || {},
          byPriority: data.taskDistribution?.byPriority || {},
          byOwner: data.taskDistribution?.byOwner || {},
        },

        // Workflow metrics
        workflowMetrics: {
          roleEfficiency: data.workflowMetrics?.roleEfficiency || [],
          delegationFlow: data.workflowMetrics?.delegationFlow || [],
          bottlenecks: data.workflowMetrics?.bottlenecks || [],
        },

        // Recent activity
        recentActivity: {
          recentTasks: data.recentActivity?.recentTasks || [],
          recentDelegations: data.recentActivity?.recentDelegations || [],
        },

        // Chart data (template expects specific structure)
        chartData: {
          statusDistribution: this.validateChartData(
            data.charts?.statusDistribution,
          ),
          priorityDistribution: this.validateChartData(
            data.charts?.priorityDistribution,
          ),
          completionTrends: this.validateChartData(
            data.charts?.completionTrend,
          ),
          rolePerformance: this.validateChartData(data.charts?.rolePerformance),
          delegationFlow: this.validateChartData(data.charts?.delegationFlow),
        },

        // Table data (template expects specific structure)
        taskTable: {
          columns: data.taskTable?.columns || this.getDefaultTaskColumns(),
          data: data.taskTable?.data || [],
        },

        delegationTable: {
          columns:
            data.delegationTable?.columns || this.getDefaultDelegationColumns(),
          data: data.delegationTable?.data || [],
        },

        // Metadata
        metadata: {
          generatedAt: data.metadata?.generatedAt || new Date().toISOString(),
          reportType: 'interactive-dashboard' as const,
          version: data.metadata?.version || '2.0.0',
          generatedBy: data.metadata?.generatedBy || 'template-validator',
          refreshInterval: data.metadata?.refreshInterval || 300,
        },

        // Template-specific properties
        title: data.title || 'Interactive Dashboard',
        filters: data.filters || {},
        hasFilters: Boolean(
          data.filters && Object.keys(data.filters).length > 0,
        ),
      };

      // Validate against contract
      return TemplateContractValidator.validateInteractiveDashboard(
        validatedData,
      );
    } catch (error) {
      this.logger.error(
        `Interactive dashboard data validation failed: ${error.message}`,
      );
      this.logger.error(`Data structure: ${JSON.stringify(data, null, 2)}`);
      throw new Error(`Template data validation failed: ${error.message}`);
    }
  }

  /**
   * Validate chart data structure
   */
  private validateChartData(chartData: any) {
    if (!chartData) {
      return {
        labels: [],
        data: [],
        colors: [],
        datasets: [],
      };
    }

    return {
      labels: Array.isArray(chartData.labels) ? chartData.labels : [],
      data: Array.isArray(chartData.data) ? chartData.data : [],
      colors: Array.isArray(chartData.colors) ? chartData.colors : [],
      datasets: Array.isArray(chartData.datasets) ? chartData.datasets : [],
    };
  }

  /**
   * Get default task table columns
   */
  private getDefaultTaskColumns() {
    return [
      { key: 'taskId', label: 'Task ID', sortable: true },
      { key: 'name', label: 'Name', sortable: true },
      { key: 'status', label: 'Status', sortable: true },
      { key: 'priority', label: 'Priority', sortable: true },
      { key: 'owner', label: 'Owner', sortable: true },
      { key: 'creationDate', label: 'Created', sortable: true },
    ];
  }

  /**
   * Get default delegation table columns
   */
  private getDefaultDelegationColumns() {
    return [
      { key: 'id', label: 'ID', sortable: true },
      { key: 'fromMode', label: 'From', sortable: true },
      { key: 'toMode', label: 'To', sortable: true },
      { key: 'delegationTimestamp', label: 'When', sortable: true },
      { key: 'success', label: 'Status', sortable: true },
    ];
  }

  /**
   * Validate task detail data
   */
  validateTaskDetailData(data: any): TaskDetailContract {
    try {
      this.logger.log('Validating task detail data structure');

      const validatedData = {
        task: {
          taskId: data.task?.taskId || '',
          name: data.task?.name || '',
          taskSlug: data.task?.taskSlug,
          status: data.task?.status || '',
          priority: data.task?.priority,
          owner: data.task?.owner,
          creationDate: data.task?.creationDate || new Date().toISOString(),
          completionDate: data.task?.completionDate,
          duration: data.task?.duration || 0,
          description: data.task?.description,
          codebaseAnalysis: data.task?.codebaseAnalysis,
        },
        implementation: data.implementation || { batches: [] },
        workflow: data.workflow || { delegations: [], currentOwner: '' },
        reports: data.reports || {},
        metadata: {
          generatedAt: data.metadata?.generatedAt || new Date().toISOString(),
          reportType: 'task-detail' as const,
          version: data.metadata?.version || '2.0.0',
          generatedBy: data.metadata?.generatedBy || 'template-validator',
        },
        title: data.title || 'Task Detail Report',
      };

      return TemplateContractValidator.validateTaskDetail(validatedData);
    } catch (error) {
      this.logger.error(`Task detail data validation failed: ${error.message}`);
      throw new Error(`Template data validation failed: ${error.message}`);
    }
  }

  /**
   * Validate delegation flow data
   */
  validateDelegationFlowData(data: any): DelegationFlowContract {
    try {
      this.logger.log('Validating delegation flow data structure');

      const validatedData = {
        task: {
          taskId: data.task?.taskId || '',
          name: data.task?.name || '',
          status: data.task?.status || '',
        },
        flow: {
          nodes: data.flow?.nodes || [],
          edges: data.flow?.edges || [],
        },
        timeline: data.timeline || [],
        metrics: {
          totalDelegations: data.metrics?.totalDelegations || 0,
          totalEscalations: data.metrics?.totalEscalations || 0,
          averageRoleTime: data.metrics?.averageRoleTime || '0 days',
          bottlenecks: data.metrics?.bottlenecks || [],
        },
        metadata: {
          generatedAt: data.metadata?.generatedAt || new Date().toISOString(),
          reportType: 'delegation-flow' as const,
          version: data.metadata?.version || '2.0.0',
          generatedBy: data.metadata?.generatedBy || 'template-validator',
        },
        title: data.title || 'Delegation Flow Report',
      };

      return TemplateContractValidator.validateDelegationFlow(validatedData);
    } catch (error) {
      this.logger.error(
        `Delegation flow data validation failed: ${error.message}`,
      );
      throw new Error(`Template data validation failed: ${error.message}`);
    }
  }

  /**
   * Generic validation with detailed error reporting
   */
  validateWithDetailedErrors(data: any, reportType: string): any {
    try {
      switch (reportType) {
        case 'interactive-dashboard':
        case 'dashboard':
          return this.validateInteractiveDashboardData(data);
        case 'task-detail':
          return this.validateTaskDetailData(data);
        case 'delegation-flow':
          return this.validateDelegationFlowData(data);
        default:
          throw new Error(`Unsupported report type: ${reportType}`);
      }
    } catch (error) {
      this.logger.error(`Validation failed for ${reportType}:`);
      this.logger.error(`Error: ${error.message}`);
      this.logger.error(`Data keys: ${Object.keys(data || {}).join(', ')}`);

      // Log specific missing fields
      if (reportType === 'interactive-dashboard') {
        this.logMissingDashboardFields(data);
      }

      throw error;
    }
  }

  /**
   * Log missing dashboard fields for debugging
   */
  private logMissingDashboardFields(data: any) {
    const requiredFields = [
      'summary.metrics',
      'charts.statusDistribution',
      'charts.priorityDistribution',
      'taskTable.columns',
      'taskTable.data',
      'delegationTable.columns',
      'delegationTable.data',
    ];

    requiredFields.forEach((field) => {
      const fieldPath = field.split('.');
      let current = data;
      for (const part of fieldPath) {
        if (!current || !current[part]) {
          this.logger.warn(`Missing required field: ${field}`);
          break;
        }
        current = current[part];
      }
    });
  }
}
