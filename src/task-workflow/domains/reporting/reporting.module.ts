import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';

// === NEW DOMAIN-BASED REPORTING ARCHITECTURE ===
import { McpOrchestratorService } from './mcp-orchestrator.service';
import { ReportMcpOperationsService } from './report-mcp-operations.service';

// MCP Focused Services
import { McpFileManagerService } from './shared/mcp-file-manager.service';
import { McpReportRouterService } from './shared/mcp-report-router.service';
import { McpResponseBuilderService } from './shared/mcp-response-builder.service';

// Shared Services
import { ReportDataService } from './shared/report-data.service';
import { ReportMetadataService } from './shared/report-metadata.service';
import { ReportTransformService } from './shared/report-transform.service';

// NEW: Domain-specific HTML Generator Services
import { InteractiveDashboardModule } from './dashboard/interactive-dashboard/interactive-dashboard.module';
import { SimpleReportGeneratorService } from './dashboard/simple-report/simple-report-generator.service';
import { HtmlGeneratorFactoryService } from './shared/html-generator-factory.service';
import { TaskDetailViewModule } from './task-management/task-detail/view/task-detail-view.module';

// Task Management Domain
import { TaskDetailBuilderService } from './task-management/task-detail/task-detail-builder.service';
import { TaskDetailService } from './task-management/task-detail/task-detail.service';
import { TaskProgressAnalyzerService } from './task-management/task-detail/task-progress-analyzer.service';
import { TaskQualityAnalyzerService } from './task-management/task-detail/task-quality-analyzer.service';

// Workflow Analytics Domain
import { WorkflowAnalyticsCalculatorService } from './workflow-analytics/workflow-analytics/workflow-analytics-calculator.service';
import { WorkflowAnalyticsService } from './workflow-analytics/workflow-analytics/workflow-analytics.service';
import { WorkflowSummaryService } from './workflow-analytics/workflow-analytics/workflow-summary.service';

import { DelegationAnalyticsService } from './workflow-analytics/delegation-flow/delegation-analytics.service';
import { DelegationFlowService } from './workflow-analytics/delegation-flow/delegation-flow.service';
import { DelegationSummaryService } from './workflow-analytics/delegation-flow/delegation-summary.service';

import { RoleAnalyticsService } from './workflow-analytics/role-performance/role-analytics.service';
import { RoleMetricsCalculatorService } from './workflow-analytics/role-performance/role-metrics-calculator.service';
import { RolePerformanceService } from './workflow-analytics/role-performance/role-performance.service';

// Dashboard Domain - Now using InteractiveDashboardModule
import { DelegationFlowGeneratorService } from './workflow-analytics/delegation-flow/delegation-flow-generator.service';
import { RolePerformanceGeneratorService } from './workflow-analytics/role-performance/role-performance-generator.service';
import { WorkflowAnalyticsGeneratorService } from './workflow-analytics/workflow-analytics/workflow-analytics-generator.service';

@Module({
  imports: [PrismaModule, InteractiveDashboardModule, TaskDetailViewModule],
  providers: [
    // === SHARED SERVICES ===
    ReportDataService,
    ReportTransformService,
    ReportMetadataService,

    // === NEW: TYPE-SAFE HTML GENERATOR SERVICES ===
    SimpleReportGeneratorService,
    HtmlGeneratorFactoryService,

    // === TASK MANAGEMENT DOMAIN ===
    TaskDetailService,
    TaskDetailBuilderService,
    TaskProgressAnalyzerService,
    TaskQualityAnalyzerService,

    // === WORKFLOW ANALYTICS DOMAIN ===
    WorkflowAnalyticsService,
    WorkflowAnalyticsCalculatorService,
    WorkflowSummaryService,
    WorkflowAnalyticsGeneratorService,
    DelegationFlowService,
    DelegationAnalyticsService,
    DelegationSummaryService,
    DelegationFlowGeneratorService,
    RolePerformanceService,
    RolePerformanceGeneratorService,
    RoleAnalyticsService,
    RoleMetricsCalculatorService,

    // === MCP INTERFACE SERVICES ===
    McpOrchestratorService,
    McpReportRouterService,
    McpFileManagerService,
    McpResponseBuilderService,
    ReportMcpOperationsService,
  ],
  exports: [
    // Primary MCP interface for external consumption
    ReportMcpOperationsService,
    McpOrchestratorService,

    // NEW: Type-safe HTML generator services
    HtmlGeneratorFactoryService,
    SimpleReportGeneratorService,

    // Domain services for direct access
    TaskDetailService,

    WorkflowAnalyticsService,
    DelegationFlowService,
    RolePerformanceService,

    // Shared services
    ReportDataService,
  ],
})
export class ReportingModule {}
