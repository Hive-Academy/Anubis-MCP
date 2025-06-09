import { Module } from '@nestjs/common';
import { ImplementationPlanService } from './implementation-plan.service';
import { ImplementationPlanBuilderService } from './implementation-plan-builder.service';
import { ImplementationPlanAnalyzerService } from './implementation-plan-analyzer.service';
import { ImplementationPlanViewModule } from './view/implementation-plan-view.module';

// Import shared services and PrismaModule directly
import { ReportDataService } from '../../shared/report-data.service';
import { ReportTransformService } from '../../shared/report-transform.service';
import { ReportMetadataService } from '../../shared/report-metadata.service';
import { PrismaModule } from '../../../../../prisma/prisma.module';

/**
 * Implementation Plan Module
 *
 * This module encapsulates the implementation plan reporting functionality including:
 * - Data aggregation and transformation services
 * - HTML generation services (through ImplementationPlanViewModule)
 * - Plan analysis and execution guidance services
 *
 * Architecture:
 * - ImplementationPlanService: Orchestrates report generation
 * - ImplementationPlanBuilderService: Builds structured data from database entities
 * - ImplementationPlanAnalyzerService: Handles plan analysis and execution guidance (SRP)
 * - View generators: Handle specific HTML sections (through ImplementationPlanViewModule)
 *
 * Dependency Strategy:
 * - Imports shared services directly to maintain clean dependencies
 * - Each module is self-contained with its required dependencies
 * - Follows enhanced architecture pattern established by task-detail module
 */
@Module({
  imports: [PrismaModule, ImplementationPlanViewModule],
  providers: [
    // Shared services needed by this module
    ReportDataService,
    ReportTransformService,
    ReportMetadataService,
    // Implementation plan specific services
    ImplementationPlanService,
    ImplementationPlanBuilderService,
    ImplementationPlanAnalyzerService,
  ],
  exports: [
    ImplementationPlanService,
    ImplementationPlanBuilderService,
    ImplementationPlanAnalyzerService,
    // Also export shared services for potential reuse
    ReportDataService,
    ReportTransformService,
    ReportMetadataService,
  ],
})
export class ImplementationPlanModule {}
