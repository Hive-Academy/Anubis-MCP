import { Injectable, Logger } from '@nestjs/common';
import { InteractiveDashboardData } from '../../shared/types/report-data.types';
import { HtmlHeadGenerator } from './view/html-head.generator';
import { HeaderGenerator } from './view/header.generator';
import { MetricsCardsGenerator } from './view/metrics-cards.generator';
import { ChartsGenerator } from './view/charts.generator';
import { TasksListGenerator } from './view/tasks-list.generator';
import { DelegationsTableGenerator } from './view/delegations-table.generator';
import { QuickActionsGenerator } from './view/quick-actions.generator';
import { FooterGenerator } from './view/footer.generator';
import { ScriptsGenerator } from './view/scripts.generator';

/**
 * Interactive Dashboard Generator Service (Refactored)
 *
 * This service coordinates smaller, focused generators following SRP
 * Each component is now testable and maintainable separately
 */
@Injectable()
export class InteractiveDashboardGeneratorService {
  private readonly logger = new Logger(
    InteractiveDashboardGeneratorService.name,
  );

  constructor(
    private readonly htmlHeadGenerator: HtmlHeadGenerator,
    private readonly headerGenerator: HeaderGenerator,
    private readonly metricsCardsGenerator: MetricsCardsGenerator,
    private readonly chartsGenerator: ChartsGenerator,
    private readonly tasksListGenerator: TasksListGenerator,
    private readonly delegationsTableGenerator: DelegationsTableGenerator,
    private readonly quickActionsGenerator: QuickActionsGenerator,
    private readonly footerGenerator: FooterGenerator,
    private readonly scriptsGenerator: ScriptsGenerator,
  ) {}

  /**
   * Generate complete interactive dashboard HTML using focused generators
   */
  generateInteractiveDashboard(data: InteractiveDashboardData): string {
    this.logger.log(
      'Generating type-safe interactive dashboard HTML using focused generators',
    );
    this.logger.log(
      `Tasks: ${data.tasks.length}, Delegations: ${data.delegations.length}`,
    );

    try {
      return `
<!DOCTYPE html>
<html lang="en" class="h-full">
<head>
    ${this.htmlHeadGenerator.generateHead(data.title)}
</head>
<body class="h-full bg-gray-50 font-sans">
    <div class="min-h-full">
        ${this.headerGenerator.generateHeader(data.title, data.subtitle)}
        
        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div class="space-y-8">
                ${this.metricsCardsGenerator.generateMetricsCards(data.metrics)}
                ${this.chartsGenerator.generateChartsGrid(data.charts)}
                ${this.tasksListGenerator.generateTaskCards(data.tasks)}
                ${this.delegationsTableGenerator.generateDelegationsTable(data.delegations)}
                ${this.quickActionsGenerator.generateQuickActions()}
            </div>
        </main>
        
        ${this.footerGenerator.generateFooter(data.metadata)}
    </div>
    
    ${this.scriptsGenerator.generateScripts(data)}
</body>
</html>`;
    } catch (error) {
      this.logger.error(`Failed to generate dashboard HTML: ${error.message}`);
      this.logger.error(
        `Data received - Tasks: ${data.tasks.length}, Delegations: ${data.delegations.length}`,
      );
      throw error;
    }
  }
}
