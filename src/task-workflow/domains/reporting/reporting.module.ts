import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';

// === NEW SIMPLIFIED REPORTING ARCHITECTURE ===
import { SimpleReportService } from './services/simple-report.service';
import { SimpleReportRenderer } from './services/simple-report-renderer.service';
import { ReportGenerationMcpService } from './report-generation-mcp.service';
import { ReportMcpOperationsService } from './report-mcp-operations.service';

// New Focused Report Services
import { TaskDetailReportService } from './services/task-detail-report.service';
import { DelegationFlowReportService } from './services/delegation-flow-report.service';
import { ImplementationPlanReportService } from './services/implementation-plan-report.service';
import { WorkflowAnalyticsService } from './services/workflow-analytics.service';

/**
 * Clean Reporting Module - Simplified Architecture
 *
 * PHILOSOPHY: Simple, reliable, HTML-first reporting with Alpine.js interactivity
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
 * │            SimpleReportRenderer                             │
 * │         (Template Loading & HTML Generation)               │
 * └─────────────────────┬───────────────────────────────────────┘
 *                       │
 * ┌─────────────────────▼───────────────────────────────────────┐
 * │             SimpleReportService                             │
 * │           (Direct Prisma Queries & Data)                   │
 * └─────────────────────┬───────────────────────────────────────┘
 *                       │
 * ┌─────────────────────▼───────────────────────────────────────┐
 * │         Interactive HTML Dashboard                          │
 * │         (Alpine.js + Chart.js + Tailwind)                  │
 * └─────────────────────────────────────────────────────────────┘
 *
 * KEY BENEFITS:
 * ✅ No Playwright dependencies (removed server bloat)
 * ✅ Direct Prisma queries (reliable data access)
 * ✅ Interactive HTML dashboards (better UX than static PDFs)
 * ✅ Alpine.js reactivity (client-side filtering/actions)
 * ✅ Simple template system (cached Handlebars)
 * ✅ MCP integration (AI agent compatibility)
 * ✅ Fast generation (no browser rendering)
 * ✅ Mobile-friendly responsive design
 *
 * REMOVED COMPLEXITY:
 * ❌ 50+ complex data-api services
 * ❌ 15+ generator services
 * ❌ Playwright browser dependencies
 * ❌ Complex template data transformation
 * ❌ Multiple PDF/PNG/JPEG formats
 * ❌ Infrastructure services
 * ❌ Schema-driven report generation
 *
 * FLOW: MCP → ReportMcpOperationsService → ReportGenerationMcpService → Renderer → HTML
 */
@Module({
  imports: [PrismaModule],
  providers: [
    // Core data service
    SimpleReportService,

    // Template rendering service
    SimpleReportRenderer,

    // Business logic service
    ReportGenerationMcpService,

    // MCP interface service with @Tool decorators
    ReportMcpOperationsService,

    // New Focused Report Services
    TaskDetailReportService,
    DelegationFlowReportService,
    ImplementationPlanReportService,
    WorkflowAnalyticsService,
  ],
  exports: [
    // Primary MCP interface for external consumption
    ReportMcpOperationsService,

    // Secondary services for direct access if needed
    ReportGenerationMcpService,
    SimpleReportService,
    SimpleReportRenderer,

    // New Focused Report Services
    TaskDetailReportService,
    DelegationFlowReportService,
    ImplementationPlanReportService,
    WorkflowAnalyticsService,
  ],
})
export class ReportingModule {}
