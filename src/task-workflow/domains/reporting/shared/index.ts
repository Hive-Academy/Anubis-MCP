/**
 * Shared services and types for the reporting system
 * Clean exports following KISS principle
 */

// Types and interfaces
export * from './types';
export * from './interfaces';

// Services
export { ReportDataService } from './report-data.service';
export { ReportTransformService } from './report-transform.service';
// ReportRenderService removed - using type-safe HTML generators instead
export { ReportMetadataService } from './report-metadata.service';
