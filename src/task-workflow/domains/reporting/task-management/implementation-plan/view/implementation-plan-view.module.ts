import { Module } from '@nestjs/common';
import { ImplementationPlanHeaderViewService } from './implementation-plan-header-view.service';
import { ImplementationPlanContentViewService } from './implementation-plan-content-view.service';
import { ImplementationPlanStylesViewService } from './implementation-plan-styles-view.service';
import { ImplementationPlanScriptsViewService } from './implementation-plan-scripts-view.service';
import { ImplementationPlanGeneratorService } from './implementation-plan-generator.service';

/**
 * Implementation Plan View Module
 *
 * This module contains focused view generators for implementation plan reports,
 * following the Single Responsibility Principle by separating HTML generation
 * into specific, focused services.
 *
 * Services:
 * - ImplementationPlanGeneratorService: Main orchestrator for HTML generation
 * - ImplementationPlanHeaderViewService: Generates header and overview sections
 * - ImplementationPlanContentViewService: Generates main content sections
 * - ImplementationPlanStylesViewService: Generates styles and CSS
 * - ImplementationPlanScriptsViewService: Generates JavaScript and interactivity
 *
 * Architecture:
 * - NO data access services - all data comes from parent services
 * - Pure presentation logic - follows clean architecture principles
 * - Each service has a single responsibility for specific HTML sections
 */
@Module({
  providers: [
    ImplementationPlanGeneratorService,
    ImplementationPlanHeaderViewService,
    ImplementationPlanContentViewService,
    ImplementationPlanStylesViewService,
    ImplementationPlanScriptsViewService,
  ],
  exports: [
    ImplementationPlanGeneratorService,
    ImplementationPlanHeaderViewService,
    ImplementationPlanContentViewService,
    ImplementationPlanStylesViewService,
    ImplementationPlanScriptsViewService,
  ],
})
export class ImplementationPlanViewModule {}
