/**
 * Service Contracts Interface
 *
 * Shared types and contracts for the reporting domain services
 */

export type ReportType =
  | 'task_summary'
  | 'delegation_analytics'
  | 'performance_dashboard'
  | 'comprehensive'
  | 'implementation_plan_analytics'
  | 'code_review_insights'
  | 'delegation_flow_analysis'
  | 'task_progress_health'
  | 'implementation_execution'
  | 'code_review_quality'
  | 'delegation_flow_analysis_task'
  | 'research_documentation'
  | 'communication_collaboration';

/**
 * Check if a report type is for individual tasks vs aggregate analysis
 */
export function isIndividualTaskReport(reportType: ReportType): boolean {
  const individualTaskReports: ReportType[] = [
    'task_progress_health',
    'implementation_execution',
    'code_review_quality',
    'delegation_flow_analysis_task',
    'research_documentation',
    'communication_collaboration',
  ];

  return individualTaskReports.includes(reportType);
}
