import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';

// === CORE SERVICES (Essential for functionality) ===
import { ReportMcpOperationsService } from './report-mcp-operations.service';
import { HandlebarsTemplateService } from './services/handlebars-template.service';

// === ANALYTICS SERVICES (Keep all - real business value) ===
import { AdvancedAnalyticsService } from './services/analytics/advanced-analytics.service';
import { TaskHealthAnalysisService } from './services/analytics/task-health-analysis.service';
import { TimeSeriesAnalysisService } from './services/analytics/time-series-analysis.service';
import { PerformanceBenchmarkService } from './services/analytics/performance-benchmark.service';
import { RecommendationEngineService } from './services/analytics/recommendation-engine.service';
import { EnhancedInsightsGeneratorService } from './services/analytics/enhanced-insights-generator.service';
import { SmartResponseSummarizationService } from './services/analytics/smart-response-summarization.service';
import { SchemaDrivenIntelligenceService } from './services/analytics/schema-driven-intelligence.service';

// === DATA SERVICES (Keep all - database queries & transformations) ===
import { CoreMetricsService } from './services/data/core-metrics.service';
import { MetricsCalculatorService } from './services/data/metrics-calculator.service';
import { ReportDataAccessService } from './services/data/report-data-access.service';
import { TemplateDataService } from './services/data/template-data.service';
import { SpecializedTemplateDataService } from './services/data/specialized-template-data.service';
import { IndividualTaskTemplateDataService } from './services/data/individual-task-template-data.service';
import { ComprehensiveTemplateDataService } from './services/data/comprehensive-template-data.service';
import { ImplementationPlanTemplateDataService } from './services/data/implementation-plan-template-data.service';
import { CodeReviewDelegationTemplateDataService } from './services/data/code-review-delegation-template-data.service';
import { TaskProgressExecutionService } from './services/data/task-progress-execution.service';
import { CodeReviewResearchService } from './services/data/code-review-research.service';
import { CommunicationCollaborationService } from './services/data/communication-collaboration.service';

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

// === REPORT TEMPLATE DATA API SERVICES ===
import { TaskSummaryDataApiService } from './services/report-templates-data-api/task-summary-data-api.service';

/**
 * Simplified Reporting Module
 *
 * PHILOSOPHY: Keep business value, eliminate architectural complexity
 *
 * KEPT (32 services):
 * - 9 Analytics services: Real business intelligence and insights
 * - 12 Data services: Database queries and data transformation logic
 * - 1 Template service: Simple, effective rendering
 * - 1 Config service: Essential configuration
 * - 1 MCP service: External API interface
 * - 1 Rendering service: PDF/PNG generation with Playwright
 * - 15 Generator services: All report types now supported
 *
 * REMOVED (25+ services):
 * - Strategy pattern services (unnecessary abstraction)
 * - Complex rendering pipeline (over-engineered)
 * - Coordination services (unnecessary orchestration)
 * - Infrastructure bloat (file loggers, path generators, etc.)
 * - Template factories and complex abstractions
 * - ReportGeneratorService (697 lines of complex orchestration)
 * - ChartGenerationModule and related bloat
 *
 * REMOVED INTERFACES (3 files):
 * - chart-generator.interface.ts (unused)
 * - report-service.interface.ts (unused)
 * - core-data-contracts.interface.ts (unused)
 *
 * FLOW: MCP Request → Data Service → Analytics Service → Simple Template → Response
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

    // === ANALYTICS SERVICES (All kept - real business value) ===
    AdvancedAnalyticsService,
    TaskHealthAnalysisService,
    TimeSeriesAnalysisService,
    PerformanceBenchmarkService,
    RecommendationEngineService,
    EnhancedInsightsGeneratorService,
    SmartResponseSummarizationService,
    SchemaDrivenIntelligenceService,

    // === DATA SERVICES (All kept - essential data logic) ===
    CoreMetricsService,
    MetricsCalculatorService,
    ReportDataAccessService,
    TemplateDataService,
    SpecializedTemplateDataService,
    IndividualTaskTemplateDataService,
    ComprehensiveTemplateDataService,
    ImplementationPlanTemplateDataService,
    CodeReviewDelegationTemplateDataService,
    TaskProgressExecutionService,
    CodeReviewResearchService,
    CommunicationCollaborationService,

    // === RENDERING SERVICE (PDF/PNG generation) ===
    ReportRenderingService,

    // === REPORT TEMPLATE DATA API SERVICES ===
    TaskSummaryDataApiService,
  ],
  exports: [
    // === PRIMARY EXPORTS ===
    ReportMcpOperationsService,
    HandlebarsTemplateService,

    // === NEW GENERATOR ARCHITECTURE ===
    ReportGeneratorFactoryService,

    // === ANALYTICS EXPORTS (for external use) ===
    AdvancedAnalyticsService,
    TaskHealthAnalysisService,
    TimeSeriesAnalysisService,
    PerformanceBenchmarkService,
    RecommendationEngineService,
    EnhancedInsightsGeneratorService,
    SmartResponseSummarizationService,
    SchemaDrivenIntelligenceService,

    // === DATA EXPORTS (for external use) ===
    CoreMetricsService,
    TemplateDataService,
    ReportDataAccessService,

    // === RENDERING SERVICE (PDF/PNG generation) ===
    ReportRenderingService,
  ],
})
export class ReportingModule {}
