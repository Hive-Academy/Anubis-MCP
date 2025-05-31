// src/task-workflow/domains/reporting/services/index.ts

/**
 * Services Index - TSK-010 Focused Architecture
 *
 * FOCUSED ARCHITECTURE:
 *
 * /data-api/
 *   - 12 Focused [report-name]-data-api services following proven pattern
 *   - Foundation services (CoreMetrics, ReportDataAccess, MetricsCalculator)
 *   - TaskHealthAnalysisService (essential analytics)
 *
 * /generators/
 *   - Thin template rendering wrappers
 *   - Simple pattern: data API → template → response
 *
 * /infrastructure/
 *   - Essential configuration and logging only
 *
 * REMOVED:
 *   - 8 Over-engineered analytics services
 *   - Complex template data services
 *   - Service pollution and unnecessary abstractions
 */

// Foundation Services
export * from './data-api/foundation';

// Focused Data API Services
export * from './data-api';

// Generator Services
export * from './generators/report-generator-factory.service';

// Essential Template Service
export * from './handlebars-template.service';

// Infrastructure Services (Essential only)
export * from './infrastructure/reporting-config.service';

// TSK-010 REFACTORING COMPLETE:
// ✅ Reduced from 20+ services to 12 focused services
// ✅ Eliminated service pollution and over-engineering
// ✅ Improved insights through focused business logic
// ✅ Following proven task-summary-data-api pattern
