/**
 * Template Interfaces Index
 *
 * Centralized export of all template-specific TypeScript interfaces.
 * These interfaces ensure type safety between Handlebars templates and service methods.
 */

import {
  DelegationAnalyticsTemplateData,
  DelegationAnalyticsDataService,
} from './delegation-analytics-template.interface';
import {
  PerformanceDashboardTemplateData,
  PerformanceDashboardDataService,
} from './performance-dashboard-template.interface';
import {
  TaskSummaryTemplateData,
  TaskSummaryDataService,
} from './task-summary-template.interface';
import {
  ComprehensiveTemplateData,
  ComprehensiveDataService,
} from './comprehensive-template.interface';
import {
  ImplementationPlanAnalyticsTemplateData,
  ImplementationPlanAnalyticsDataService,
} from './implementation-plan-analytics-template.interface';
import {
  CodeReviewInsightsTemplateData,
  CodeReviewInsightsDataService,
} from './code-review-insights-template.interface';
import {
  DelegationFlowAnalysisTemplateData,
  DelegationFlowAnalysisDataService,
} from './delegation-flow-analysis-template.interface';

// Task Summary Template
export * from './task-summary-template.interface';

// Delegation Analytics Template
export * from './delegation-analytics-template.interface';

// Performance Dashboard Template
export * from './performance-dashboard-template.interface';

// Comprehensive Template
export * from './comprehensive-template.interface';

// Implementation Plan Analytics Template
export * from './implementation-plan-analytics-template.interface';

// Code Review Insights Template
export * from './code-review-insights-template.interface';

// Delegation Flow Analysis Template
export * from './delegation-flow-analysis-template.interface';

/**
 * Union type for all template data types
 */
export type TemplateData =
  | TaskSummaryTemplateData
  | DelegationAnalyticsTemplateData
  | PerformanceDashboardTemplateData
  | ComprehensiveTemplateData
  | ImplementationPlanAnalyticsTemplateData
  | CodeReviewInsightsTemplateData
  | DelegationFlowAnalysisTemplateData;

/**
 * Union type for all template service interfaces
 */
export type TemplateDataServiceInterface =
  | TaskSummaryDataService
  | DelegationAnalyticsDataService
  | PerformanceDashboardDataService
  | ComprehensiveDataService
  | ImplementationPlanAnalyticsDataService
  | CodeReviewInsightsDataService
  | DelegationFlowAnalysisDataService;
