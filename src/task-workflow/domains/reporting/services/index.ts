// src/task-workflow/domains/reporting/services/index.ts

/**
 * Services Index - Centralized Export for Reporting Services
 *
 * ARCHITECTURE OVERVIEW:
 *
 * /core/
 *   - Core business logic services
 *   - High-level orchestration
 *
 * /rendering/
 *   - Template rendering and output generation
 *   - Chart generation and visualization
 *
 * /data/
 *   - Data aggregation and processing
 *   - Database queries and caching
 *
 * /analytics/
 *   - Advanced analytics and insights
 *   - Performance benchmarking
 *
 * /infrastructure/
 *   - Configuration and utilities
 *   - Logging and monitoring
 */

// Core Services
export * from './infrastructure/global-file-logger.service';

// Analytics Services
export * from './analytics/time-series-analysis.service';
export * from './analytics/performance-benchmark.service';
export * from './analytics/recommendation-engine.service';
export * from './analytics/enhanced-insights-generator.service';
export * from './analytics/smart-response-summarization.service';
export * from './analytics/schema-driven-intelligence.service';

// Infrastructure Services
export * from './infrastructure/reporting-config.service';
export * from './infrastructure/file-logger.service';
export * from './infrastructure/global-file-logger.service';

// Legacy Services (for backward compatibility)
// chart-generation.service - REMOVED (deprecated, replaced by chart-generation-refactored.service)
// handlebars-template.service - REMOVED (replaced by template-rendering.service)
// generators folder - REMOVED (moved to rendering folder)
