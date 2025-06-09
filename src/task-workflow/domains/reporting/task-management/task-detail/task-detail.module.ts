import { Module } from '@nestjs/common';
import { TaskDetailService } from './task-detail.service';
import { TaskDetailBuilderService } from './task-detail-builder.service';
import { TaskProgressAnalyzerService } from './task-progress-analyzer.service';
import { TaskQualityAnalyzerService } from './task-quality-analyzer.service';
import { TaskDetailViewModule } from './view/task-detail-view.module';

// Import shared services and PrismaModule directly
import { ReportDataService } from '../../shared/report-data.service';
import { ReportTransformService } from '../../shared/report-transform.service';
import { ReportMetadataService } from '../../shared/report-metadata.service';
import { PrismaModule } from '../../../../../prisma/prisma.module';

/**
 * Task Detail Module
 *
 * This module encapsulates the task detail reporting functionality including:
 * - Data aggregation and transformation services
 * - HTML generation services (through TaskDetailViewModule)
 * - Progress and quality analysis services
 *
 * Architecture:
 * - TaskDetailService: Orchestrates report generation
 * - TaskDetailBuilderService: Builds structured data from database entities
 * - Analysis services: Handle specific calculations (SRP)
 * - View generators: Handle specific HTML sections (through TaskDetailViewModule)
 *
 * Dependency Strategy:
 * - Imports shared services directly to maintain clean dependencies
 * - Each module is self-contained with its required dependencies
 */
@Module({
  imports: [PrismaModule, TaskDetailViewModule],
  providers: [
    // Shared services needed by this module
    ReportDataService,
    ReportTransformService,
    ReportMetadataService,
    // Task detail specific services
    TaskDetailService,
    TaskDetailBuilderService,
    TaskProgressAnalyzerService,
    TaskQualityAnalyzerService,
  ],
  exports: [
    TaskDetailService,
    TaskDetailBuilderService,
    TaskProgressAnalyzerService,
    TaskQualityAnalyzerService,
    // Also export shared services for potential reuse
    ReportDataService,
    ReportTransformService,
    ReportMetadataService,
  ],
})
export class TaskDetailModule {}
