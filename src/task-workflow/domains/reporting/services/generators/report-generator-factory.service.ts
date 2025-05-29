import { Injectable, Logger } from '@nestjs/common';
import { ReportType } from '../../interfaces/service-contracts.interface';
import {
  IBaseReportGenerator,
  ReportFilters,
  ReportGenerationResult,
} from './base-report-generator.interface';

// Import all simplified generators (using data services as glue layer)
import { PerformanceDashboardGeneratorService } from './performance-dashboard-generator.service';
import { TaskProgressHealthGeneratorService } from './task-progress-health-generator.service';
import { TaskSummaryGeneratorService } from './task-summary-generator.service';

// Import new generators
import { DelegationAnalyticsGeneratorService } from './delegation-analytics-generator.service';
import { ComprehensiveGeneratorService } from './comprehensive-generator.service';
import { ImplementationPlanAnalyticsGeneratorService } from './implementation-plan-analytics-generator.service';
import { CodeReviewInsightsGeneratorService } from './code-review-insights-generator.service';
import { DelegationFlowAnalysisGeneratorService } from './delegation-flow-analysis-generator.service';
import { ImplementationExecutionGeneratorService } from './implementation-execution-generator.service';
import { CodeReviewQualityGeneratorService } from './code-review-quality-generator.service';
import { ResearchDocumentationGeneratorService } from './research-documentation-generator.service';
import { CommunicationCollaborationGeneratorService } from './communication-collaboration-generator.service';
import { DelegationFlowAnalysisTaskGeneratorService } from './delegation-flow-analysis-task-generator.service';

/**
 * Report Generator Factory
 *
 * Routes report generation requests to the appropriate focused generator.
 * Each generator knows exactly which data and analytics services to combine
 * for its specific report type.
 *
 * This follows the Factory Pattern and Single Responsibility Principle:
 * - Each generator has one job: generate one specific report type
 * - Factory has one job: route to the right generator
 * - No complex orchestration or bloated services
 */
@Injectable()
export class ReportGeneratorFactoryService {
  private readonly logger = new Logger(ReportGeneratorFactoryService.name);
  private readonly generators = new Map<ReportType, IBaseReportGenerator>();

  constructor(
    // Existing generators
    private readonly performanceDashboardGenerator: PerformanceDashboardGeneratorService,
    private readonly taskProgressHealthGenerator: TaskProgressHealthGeneratorService,
    private readonly taskSummaryGenerator: TaskSummaryGeneratorService,

    // New aggregate generators
    private readonly delegationAnalyticsGenerator: DelegationAnalyticsGeneratorService,
    private readonly comprehensiveGenerator: ComprehensiveGeneratorService,
    private readonly implementationPlanAnalyticsGenerator: ImplementationPlanAnalyticsGeneratorService,
    private readonly codeReviewInsightsGenerator: CodeReviewInsightsGeneratorService,
    private readonly delegationFlowAnalysisGenerator: DelegationFlowAnalysisGeneratorService,

    // New individual task generators
    private readonly implementationExecutionGenerator: ImplementationExecutionGeneratorService,
    private readonly codeReviewQualityGenerator: CodeReviewQualityGeneratorService,
    private readonly researchDocumentationGenerator: ResearchDocumentationGeneratorService,
    private readonly communicationCollaborationGenerator: CommunicationCollaborationGeneratorService,
    private readonly delegationFlowAnalysisTaskGenerator: DelegationFlowAnalysisTaskGeneratorService,
  ) {
    this.registerGenerators();
  }

  private registerGenerators(): void {
    // Register existing generators
    this.generators.set(
      'performance_dashboard',
      this.performanceDashboardGenerator,
    );
    this.generators.set(
      'task_progress_health',
      this.taskProgressHealthGenerator,
    );
    this.generators.set('task_summary', this.taskSummaryGenerator);

    // Register new aggregate generators
    this.generators.set(
      'delegation_analytics',
      this.delegationAnalyticsGenerator,
    );
    this.generators.set('comprehensive', this.comprehensiveGenerator);
    this.generators.set(
      'implementation_plan_analytics',
      this.implementationPlanAnalyticsGenerator,
    );
    this.generators.set(
      'code_review_insights',
      this.codeReviewInsightsGenerator,
    );
    this.generators.set(
      'delegation_flow_analysis',
      this.delegationFlowAnalysisGenerator,
    );

    // Register new individual task generators
    this.generators.set(
      'implementation_execution',
      this.implementationExecutionGenerator,
    );
    this.generators.set('code_review_quality', this.codeReviewQualityGenerator);
    this.generators.set(
      'research_documentation',
      this.researchDocumentationGenerator,
    );
    this.generators.set(
      'communication_collaboration',
      this.communicationCollaborationGenerator,
    );
    this.generators.set(
      'delegation_flow_analysis_task',
      this.delegationFlowAnalysisTaskGenerator,
    );

    this.logger.log(`Registered ${this.generators.size} report generators`);
  }

  /**
   * Generate a report using the appropriate focused generator
   */
  async generateReport(
    reportType: ReportType,
    filters: ReportFilters,
  ): Promise<ReportGenerationResult> {
    this.logger.log(`Generating report: ${reportType}`);

    const generator = this.generators.get(reportType);
    if (!generator) {
      throw new Error(`No generator found for report type: ${reportType}`);
    }

    try {
      return await generator.generateReport(filters);
    } catch (error) {
      this.logger.error(`Failed to generate ${reportType} report`, error);
      throw error;
    }
  }

  /**
   * Get all supported report types
   */
  getSupportedReportTypes(): ReportType[] {
    return Array.from(this.generators.keys());
  }

  /**
   * Check if a report type is supported
   */
  isReportTypeSupported(reportType: ReportType): boolean {
    return this.generators.has(reportType);
  }

  /**
   * Get generator for a specific report type (for testing/debugging)
   */
  getGenerator(reportType: ReportType): IBaseReportGenerator | undefined {
    return this.generators.get(reportType);
  }
}
