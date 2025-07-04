import { Module } from '@nestjs/common';
import {
  ChartsGenerator,
  DelegationsTableGenerator,
  FooterGenerator,
  HeaderGenerator,
  HtmlHeadGenerator,
  MetricsCardsGenerator,
  QuickActionsGenerator,
  ScriptsGenerator,
} from './index';
import { TasksListGenerator } from './tasks-list.generator';

/**
 * Interactive Dashboard View Module
 *
 * This module encapsulates all the focused view generators for the interactive dashboard.
 * Each generator follows SRP and is independently testable.
 *
 * Benefits:
 * - Clear separation of concerns
 * - Individual testing capabilities
 * - Maintainable code structure
 * - Follows NestJS modular architecture
 */
@Module({
  providers: [
    HtmlHeadGenerator,
    HeaderGenerator,
    MetricsCardsGenerator,
    ChartsGenerator,
    TasksListGenerator,
    DelegationsTableGenerator,
    QuickActionsGenerator,
    FooterGenerator,
    ScriptsGenerator,
  ],
  exports: [
    HtmlHeadGenerator,
    HeaderGenerator,
    MetricsCardsGenerator,
    ChartsGenerator,
    TasksListGenerator,
    DelegationsTableGenerator,
    QuickActionsGenerator,
    FooterGenerator,
    ScriptsGenerator,
  ],
})
export class InteractiveDashboardViewModule {}
