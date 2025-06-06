import { Module } from '@nestjs/common';
import { DashboardChartBuilderService } from './dashboard-chart-builder.service';
import { DashboardDataAggregatorService } from './dashboard-data-aggregator.service';
import { InteractiveDashboardGeneratorService } from './interactive-dashboard-generator.service';
import { InteractiveDashboardService } from './interactive-dashboard.service';
import { InteractiveDashboardViewModule } from './view/interactive-dashboard-view.module';

// Import shared services and PrismaModule directly
import { ReportDataService } from '../../shared/report-data.service';
import { ReportTransformService } from '../../shared/report-transform.service';
import { ReportMetadataService } from '../../shared/report-metadata.service';
import { PrismaModule } from '../../../../../prisma/prisma.module';

/**
 * Interactive Dashboard Module
 *
 * This module encapsulates the interactive dashboard functionality including:
 * - Data aggregation services
 * - HTML generation services
 * - Focused view generators (through InteractiveDashboardViewModule)
 *
 * Architecture:
 * - DashboardDataAggregatorService: Aggregates and transforms data
 * - InteractiveDashboardService: Orchestrates dashboard generation
 * - InteractiveDashboardGeneratorService: Coordinates view generators
 * - View generators: Handle specific HTML sections (SRP)
 *
 * Dependency Strategy:
 * - Imports shared services directly to maintain clean dependencies
 * - Each module is self-contained with its required dependencies
 */
@Module({
  imports: [PrismaModule, InteractiveDashboardViewModule],
  providers: [
    // Shared services needed by this module
    ReportDataService,
    ReportTransformService,
    ReportMetadataService,
    // Dashboard-specific services
    DashboardDataAggregatorService,
    InteractiveDashboardService,
    InteractiveDashboardGeneratorService,
    DashboardChartBuilderService,
  ],
  exports: [
    InteractiveDashboardService,
    InteractiveDashboardGeneratorService,
    DashboardDataAggregatorService,
    DashboardChartBuilderService,
    // Also export shared services for potential reuse
    ReportDataService,
    ReportTransformService,
    ReportMetadataService,
  ],
})
export class InteractiveDashboardModule {}
