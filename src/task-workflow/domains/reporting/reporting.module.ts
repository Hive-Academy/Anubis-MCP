import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';

// === NEW DOMAIN-BASED REPORTING ARCHITECTURE ===
import { McpOrchestratorService } from './mcp-orchestrator.service';
import { ReportMcpOperationsService } from './report-mcp-operations.service';

// MCP Focused Services
import { McpReportRouterService } from './shared/mcp-report-router.service';
import { McpFileManagerService } from './shared/mcp-file-manager.service';
import { McpResponseBuilderService } from './shared/mcp-response-builder.service';
import { TemplatePathResolverService } from './shared/template-path-resolver.service';

// Shared Services
import { ReportDataService } from './shared/report-data.service';
import { ReportTransformService } from './shared/report-transform.service';
import { ReportRenderService } from './shared/report-render.service';
import { ReportMetadataService } from './shared/report-metadata.service';

// NEW: Domain-specific HTML Generator Services
import { InteractiveDashboardGeneratorService } from './dashboard/interactive-dashboard/interactive-dashboard-generator.service';
import { SimpleReportGeneratorService } from './dashboard/simple-report/simple-report-generator.service';
import { TaskDetailGeneratorService } from './task-management/task-detail/task-detail-generator.service';
import { HtmlGeneratorFactoryService } from './shared/html-generator-factory.service';

// Task Management Domain
import { TaskDetailService } from './task-management/task-detail/task-detail.service';
import { TaskDetailBuilderService } from './task-management/task-detail/task-detail-builder.service';
import { TaskProgressAnalyzerService } from './task-management/task-detail/task-progress-analyzer.service';
import { TaskQualityAnalyzerService } from './task-management/task-detail/task-quality-analyzer.service';

import { ImplementationPlanService } from './task-management/implementation-plan/implementation-plan.service';
import { ImplementationPlanBuilderService } from './task-management/implementation-plan/implementation-plan-builder.service';
import { ImplementationPlanAnalyzerService } from './task-management/implementation-plan/implementation-plan-analyzer.service';

// Workflow Analytics Domain
import { WorkflowAnalyticsService } from './workflow-analytics/workflow-analytics/workflow-analytics.service';
import { WorkflowAnalyticsCalculatorService } from './workflow-analytics/workflow-analytics/workflow-analytics-calculator.service';
import { WorkflowSummaryService } from './workflow-analytics/workflow-analytics/workflow-summary.service';

import { DelegationFlowService } from './workflow-analytics/delegation-flow/delegation-flow.service';
import { DelegationAnalyticsService } from './workflow-analytics/delegation-flow/delegation-analytics.service';
import { DelegationSummaryService } from './workflow-analytics/delegation-flow/delegation-summary.service';

import { RolePerformanceService } from './workflow-analytics/role-performance/role-performance.service';
import { RoleAnalyticsService } from './workflow-analytics/role-performance/role-analytics.service';
import { RoleMetricsCalculatorService } from './workflow-analytics/role-performance/role-metrics-calculator.service';

// Dashboard Domain
import { InteractiveDashboardService } from './dashboard/interactive-dashboard/interactive-dashboard.service';
import { DashboardDataAggregatorService } from './dashboard/interactive-dashboard/dashboard-data-aggregator.service';
import { DashboardChartBuilderService } from './dashboard/interactive-dashboard/dashboard-chart-builder.service';
import { TemplateDataValidatorService } from './shared/template-data-validator.service';

/**
 * Domain-Based Reporting Module - Clean Architecture
 *
 * PHILOSOPHY: Domain-driven design with KISS principle (250-line average services)
 *
 * ARCHITECTURE:
 * ┌─────────────────────────────────────────────────────────────┐
 * │                    MCP REQUEST                              │
 * └─────────────────────┬───────────────────────────────────────┘
 *                       │
 * ┌─────────────────────▼───────────────────────────────────────┐
 * │         ReportMcpOperationsService                          │
 * │         (@Tool decorators for MCP interface)               │
 * └─────────────────────┬───────────────────────────────────────┘
 *                       │
 * ┌─────────────────────▼───────────────────────────────────────┐
 * │         ReportGenerationMcpService                          │
 * │         (Orchestration & Business Logic)                   │
 * └─────────────────────┬───────────────────────────────────────┘
 *                       │
 * ┌─────────────────────▼───────────────────────────────────────┐
 * │            DOMAIN SERVICES                                  │
 * │  ┌─────────────────┬─────────────────┬─────────────────┐    │
 * │  │ Task Management │ Workflow        │ Dashboard       │    │
 * │  │ - TaskDetail    │ Analytics       │ - Interactive   │    │
 * │  │ - ImplPlan      │ - Analytics     │ Dashboard       │    │
 * │  │                 │ - DelegFlow     │                 │    │
 * │  │                 │ - RolePerf      │                 │    │
 * │  └─────────────────┴─────────────────┴─────────────────┘    │
 * └─────────────────────┬───────────────────────────────────────┘
 *                       │
 * ┌─────────────────────▼───────────────────────────────────────┐
 * │            SHARED SERVICES                                  │
 * │  ┌─────────────────┬─────────────────┬─────────────────┐    │
 * │  │ Data Access     │ Transformation  │ Rendering       │    │
 * │  │ - ReportData    │ - Transform     │ - Render        │    │
 * │  │ - SimpleReport  │ - Metadata      │ - SimpleRender  │    │
 * │  └─────────────────┴─────────────────┴─────────────────┘    │
 * └─────────────────────┬───────────────────────────────────────┘
 *                       │
 * ┌─────────────────────▼───────────────────────────────────────┐
 * │         Interactive HTML Dashboard                          │
 * │         (Alpine.js + Chart.js + Tailwind)                  │
 * └─────────────────────────────────────────────────────────────┘
 *
 * KEY BENEFITS:
 * ✅ Domain-driven organization (clear separation of concerns)
 * ✅ KISS principle compliance (250-line average services)
 * ✅ Focused, single-responsibility services
 * ✅ Shared services for common functionality
 * ✅ Interactive HTML dashboards with real-time filtering
 * ✅ Alpine.js reactivity for better UX
 * ✅ Chart.js visualizations
 * ✅ Mobile-responsive Tailwind design
 * ✅ Fast generation with direct Prisma queries
 * ✅ MCP integration for AI agent compatibility
 *
 * DOMAINS:
 * 📊 Task Management: Individual task analysis and implementation planning
 * 🔄 Workflow Analytics: Cross-task analytics, delegation flow, role performance
 * 📈 Dashboard: Interactive dashboards with real-time data and filtering
 * 🔧 Shared: Common data access, transformation, and rendering services
 */
@Module({
  imports: [PrismaModule],
  providers: [
    // === SHARED SERVICES ===
    ReportDataService,
    ReportTransformService,
    ReportRenderService,
    ReportMetadataService,
    TemplatePathResolverService,

    // === NEW: TYPE-SAFE HTML GENERATOR SERVICES ===
    InteractiveDashboardGeneratorService,
    SimpleReportGeneratorService,
    TaskDetailGeneratorService,
    HtmlGeneratorFactoryService,

    // === TASK MANAGEMENT DOMAIN ===
    TaskDetailService,
    TaskDetailBuilderService,
    TaskProgressAnalyzerService,
    TaskQualityAnalyzerService,
    ImplementationPlanService,
    ImplementationPlanBuilderService,
    ImplementationPlanAnalyzerService,

    // === WORKFLOW ANALYTICS DOMAIN ===
    WorkflowAnalyticsService,
    WorkflowAnalyticsCalculatorService,
    WorkflowSummaryService,
    DelegationFlowService,
    DelegationAnalyticsService,
    DelegationSummaryService,
    RolePerformanceService,
    RoleAnalyticsService,
    RoleMetricsCalculatorService,

    // === DASHBOARD DOMAIN ===
    InteractiveDashboardService,
    DashboardDataAggregatorService,
    DashboardChartBuilderService,

    // === MCP INTERFACE SERVICES ===
    McpOrchestratorService,
    McpReportRouterService,
    McpFileManagerService,
    McpResponseBuilderService,
    ReportMcpOperationsService,

    TemplateDataValidatorService,
  ],
  exports: [
    // Primary MCP interface for external consumption
    ReportMcpOperationsService,
    McpOrchestratorService,

    // NEW: Type-safe HTML generator services
    HtmlGeneratorFactoryService,
    InteractiveDashboardGeneratorService,
    SimpleReportGeneratorService,
    TaskDetailGeneratorService,

    // Domain services for direct access
    TaskDetailService,
    ImplementationPlanService,
    WorkflowAnalyticsService,
    DelegationFlowService,
    RolePerformanceService,
    InteractiveDashboardService,

    // Shared services
    ReportDataService,
    ReportRenderService,
  ],
})
export class ReportingModule {}
