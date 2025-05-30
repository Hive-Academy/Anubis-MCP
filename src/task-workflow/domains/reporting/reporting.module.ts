import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';

// === CORE SERVICES (Essential for functionality) ===
import { ReportMcpOperationsService } from './report-mcp-operations.service';
import { HandlebarsTemplateService } from './services/handlebars-template.service';

// === FOUNDATION ANALYTICS SERVICES (Keep essential services only) ===
// TaskHealthAnalysisService is now imported from foundation

// === FOCUSED DATA API SERVICES ===
// Foundation Services
import {
  CoreMetricsService,
  MetricsCalculatorService,
  ReportDataAccessService,
  TaskHealthAnalysisService,
} from './services/data-api/foundation';

// Report-Specific Data API Services
import { TaskSummaryDataApiService } from './services/data-api/task-summary';
import {
  DelegationAnalyticsDataApiService,
  DelegationFlowAnalysisDataApiService,
} from './services/data-api/delegation-analytics';
import { PerformanceDashboardDataApiService } from './services/data-api/performance-dashboard';
import { ComprehensiveDataApiService } from './services/data-api/comprehensive';
import { CodeReviewInsightsDataApiService } from './services/data-api/code-review';
import { CommunicationCollaborationService } from './services/data-api/communication';
import { ImplementationPlanAnalyticsDataApiService } from './services/data-api/implementation-plan';
import { TaskProgressHealthDataApiService } from './services/data-api/task-progress';

// Individual Task Report Services (specialized)
import { CodeReviewQualityDataApiService } from './services/data-api/code-review';
import { ImplementationExecutionDataApiService } from './services/data-api/implementation-plan';
import { ResearchDocumentationDataApiService } from './services/data-api/communication';

// === MINIMAL INFRASTRUCTURE (Only essentials) ===
import { ReportingConfigService } from './services/infrastructure/reporting-config.service';

// === NEW SIMPLIFIED GENERATOR ARCHITECTURE ===
import { ReportGeneratorFactoryService } from './services/generators/report-generator-factory.service';
import { PerformanceDashboardGeneratorService } from './services/generators/performance-dashboard-generator.service';
import { TaskProgressHealthGeneratorService } from './services/generators/task-progress-health-generator.service';
import { TaskSummaryGeneratorService } from './services/generators/task-summary-generator.service';

// === NEW GENERATOR SERVICES ===
import { DelegationAnalyticsGeneratorService } from './services/generators/delegation-analytics-generator.service';
import { ComprehensiveGeneratorService } from './services/generators/comprehensive-generator.service';
import { ImplementationPlanAnalyticsGeneratorService } from './services/generators/implementation-plan-analytics-generator.service';
import { CodeReviewInsightsGeneratorService } from './services/generators/code-review-insights-generator.service';
import { DelegationFlowAnalysisGeneratorService } from './services/generators/delegation-flow-analysis-generator.service';
import { ImplementationExecutionGeneratorService } from './services/generators/implementation-execution-generator.service';
import { CodeReviewQualityGeneratorService } from './services/generators/code-review-quality-generator.service';
import { ResearchDocumentationGeneratorService } from './services/generators/research-documentation-generator.service';
import { CommunicationCollaborationGeneratorService } from './services/generators/communication-collaboration-generator.service';
import { DelegationFlowAnalysisTaskGeneratorService } from './services/generators/delegation-flow-analysis-task-generator.service';

// === RENDERING SERVICE (PDF/PNG generation) ===
import { ReportRenderingService } from './report-rendering.service';
import { TaskSummaryAnalyticsService } from './services/data-api/task-summary/task-summary-analytics.service';
import { TaskMetricsService } from './services/data-api/foundation/task-metrics.service';
import { DelegationMetricsService } from './services/data-api/foundation/delegation-metrics.service';
import { CodeReviewMetricsService } from './services/data-api/foundation/code-review-metrics.service';
import { ImplementationPlanMetricsService } from './services/data-api/foundation/implementation-plan-metrics.service';

// === DELEGATION ANALYTICS HELPER SERVICES ===
import { RoleStatisticsService } from './services/data-api/delegation-analytics/helpers/role-statistics.service';
import { TimingMetricsService } from './services/data-api/delegation-analytics/helpers/timing-metrics.service';
import { WorkflowAnalysisService } from './services/data-api/delegation-analytics/helpers/workflow-analysis.service';
import { DelegationDataQueryService } from './services/data-api/delegation-analytics/helpers/delegation-data-query.service';

/**
 * Focused Reporting Module - TSK-010 Refactored Architecture
 *
 * PHILOSOPHY: Focused [report-name]-data-api services pattern
 *
 * ARCHITECTURE:
 * - 3 Foundation services: CoreMetrics, MetricsCalculator, ReportDataAccess
 * - 12 Focused data API services: One per report type, following proven pattern
 * - 1 Essential analytics service: TaskHealthAnalysisService (used by multiple APIs)
 * - 15 Generator services: Thin wrappers for template rendering
 * - 1 Template service: Handlebars rendering
 * - 1 MCP service: External API interface
 * - 1 Rendering service: PDF/PNG generation
 *
 * REMOVED:
 * - 8 Over-engineered analytics services (EnhancedInsights, SchemaDriven, etc.)
 * - Complex template data services replaced by focused APIs
 * - Service pollution and unnecessary abstractions
 *
 * PATTERN: MCP Request → Focused Data API → Foundation Services → Template → Response
 * RESULT: 20+ services reduced to 12 focused services with better insights
 */
@Module({
  imports: [PrismaModule],
  providers: [
    // === CORE SERVICES ===
    ReportMcpOperationsService,
    HandlebarsTemplateService,
    ReportingConfigService,

    // === NEW SIMPLIFIED GENERATOR ARCHITECTURE ===
    ReportGeneratorFactoryService,
    PerformanceDashboardGeneratorService,
    TaskProgressHealthGeneratorService,
    TaskSummaryGeneratorService,

    // === NEW GENERATOR SERVICES ===
    DelegationAnalyticsGeneratorService,
    ComprehensiveGeneratorService,
    ImplementationPlanAnalyticsGeneratorService,
    CodeReviewInsightsGeneratorService,
    DelegationFlowAnalysisGeneratorService,
    ImplementationExecutionGeneratorService,
    CodeReviewQualityGeneratorService,
    ResearchDocumentationGeneratorService,
    CommunicationCollaborationGeneratorService,
    DelegationFlowAnalysisTaskGeneratorService,

    // === ESSENTIAL ANALYTICS SERVICE ===
    TaskHealthAnalysisService,

    // === FOUNDATION DATA SERVICES ===
    CoreMetricsService,
    MetricsCalculatorService,
    ReportDataAccessService,

    // === FOCUSED DATA API SERVICES ===
    TaskSummaryDataApiService,
    DelegationAnalyticsDataApiService,
    DelegationFlowAnalysisDataApiService,
    PerformanceDashboardDataApiService,
    ComprehensiveDataApiService,
    CodeReviewInsightsDataApiService,
    ImplementationPlanAnalyticsDataApiService,
    TaskProgressHealthDataApiService,
    CommunicationCollaborationService,

    // === INDIVIDUAL TASK REPORT SERVICES ===
    CodeReviewQualityDataApiService,
    ImplementationExecutionDataApiService,
    ResearchDocumentationDataApiService,

    // === RENDERING SERVICE (PDF/PNG generation) ===
    ReportRenderingService,
    TaskSummaryAnalyticsService,

    TaskMetricsService,
    DelegationMetricsService,
    CodeReviewMetricsService,
    ImplementationPlanMetricsService,

    // === DELEGATION ANALYTICS HELPER SERVICES ===
    RoleStatisticsService,
    TimingMetricsService,
    WorkflowAnalysisService,
    DelegationDataQueryService,
  ],
  exports: [
    // === PRIMARY EXPORTS ===
    ReportMcpOperationsService,
    HandlebarsTemplateService,

    // === NEW GENERATOR ARCHITECTURE ===
    ReportGeneratorFactoryService,

    // === ESSENTIAL ANALYTICS EXPORT ===
    TaskHealthAnalysisService,

    // === FOUNDATION DATA EXPORTS ===
    CoreMetricsService,
    MetricsCalculatorService,
    ReportDataAccessService,

    // === FOCUSED DATA API EXPORTS ===
    TaskSummaryDataApiService,
    DelegationAnalyticsDataApiService,
    PerformanceDashboardDataApiService,
    ComprehensiveDataApiService,

    // === RENDERING SERVICE (PDF/PNG generation) ===
    ReportRenderingService,
  ],
})
export class ReportingModule {}
