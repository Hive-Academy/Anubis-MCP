import { Injectable, Logger } from '@nestjs/common';
import { ImplementationPlanReportData } from '../../../shared/types/report-data.types';
import { ImplementationPlanHeaderViewService } from './implementation-plan-header-view.service';
import { ImplementationPlanContentViewService } from './implementation-plan-content-view.service';
import { ImplementationPlanStylesViewService } from './implementation-plan-styles-view.service';
import { ImplementationPlanScriptsViewService } from './implementation-plan-scripts-view.service';

/**
 * Implementation Plan Generator Service
 *
 * Main orchestrator for implementation plan HTML generation using focused view services.
 * Follows Single Responsibility Principle by delegating specific sections to specialized services.
 * Takes preprocessed ImplementationPlanReportData and generates HTML synchronously.
 */
@Injectable()
export class ImplementationPlanGeneratorService {
  private readonly logger = new Logger(ImplementationPlanGeneratorService.name);

  constructor(
    private readonly headerViewService: ImplementationPlanHeaderViewService,
    private readonly contentViewService: ImplementationPlanContentViewService,
    private readonly stylesViewService: ImplementationPlanStylesViewService,
    private readonly scriptsViewService: ImplementationPlanScriptsViewService,
  ) {}

  /**
   * Generate complete implementation plan HTML using type-safe data and focused view services
   */
  generateImplementationPlan(data: ImplementationPlanReportData): string {
    this.logger.log(
      'Generating type-safe implementation plan HTML using focused view services',
    );
    this.logger.log(`Task: ${data.task.name}`);

    // Calculate real metrics for the implementation plan
    const planMetrics = this.calculatePlanMetrics(data);

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    ${this.headerViewService.generateHead(data.task.name)}
    ${this.stylesViewService.generateStyles()}
</head>
<body class="bg-gray-50 font-sans">
    <div class="max-w-6xl mx-auto py-8 px-4">
        ${this.headerViewService.generateHeader(data.task)}
        ${this.headerViewService.generatePlanOverview(data.task, planMetrics)}
        ${data.implementationPlan ? this.contentViewService.generatePlanOverview(data.implementationPlan) : ''}
        ${data.implementationPlan ? this.contentViewService.generateTechnicalDecisions(data.implementationPlan) : ''}
        ${data.implementationPlan ? this.contentViewService.generateStrategicGuidance(data.implementationPlan) : ''}
        ${this.generateAdditionalPlanSections(data.implementationPlan)}
        ${this.contentViewService.generateSubtaskBatches(data.subtaskBatches)}
        ${this.generateExecutionAnalysisSection(data.executionAnalysis)}
        ${this.generateExecutionGuidanceSection(data.executionGuidance)}
        ${this.headerViewService.generateFooter(data.metadata)}
    </div>
    ${this.scriptsViewService.generateScripts()}
</body>
</html>`;
  }

  /**
   * Calculate real metrics from implementation plan data
   */
  private calculatePlanMetrics(data: ImplementationPlanReportData): any {
    const totalBatches = data.subtaskBatches.length;
    const totalSubtasks = data.progress.totalSubtasks;
    const completedSubtasks = data.progress.completedSubtasks;
    const completionRate = Math.round(
      (completedSubtasks / totalSubtasks) * 100,
    );

    // Calculate batch completion
    const completedBatches = data.subtaskBatches.filter((batch) => {
      const batchTotal = batch.subtasks.length;
      const batchCompleted = batch.subtasks.filter(
        (s) => s.status === 'completed',
      ).length;
      return batchCompleted === batchTotal && batchTotal > 0;
    }).length;

    // Additional metrics from execution analysis if available
    const executionMetrics = data.executionAnalysis || null;
    const estimatedTime =
      data.progress.estimatedTimeRemaining || 'Not estimated';

    return {
      totalBatches,
      totalSubtasks,
      completedSubtasks,
      completionRate: `${completionRate}%`,
      completedBatches,
      batchCompletionRate:
        totalBatches > 0
          ? Math.round((completedBatches / totalBatches) * 100)
          : 0,
      estimatedTimeRemaining: estimatedTime,
      complexityScore: data.complexityScore || 'Not calculated',
      executionAnalysis: executionMetrics,
    };
  }

  /**
   * Generate additional plan sections (quality gates, pattern compliance, etc.)
   */
  private generateAdditionalPlanSections(
    plan: ImplementationPlanReportData['implementationPlan'],
  ): string {
    if (!plan) return '';

    let sections = '';

    // Quality Gates section
    if (plan.qualityGates) {
      sections += `
       <div class="bg-white rounded-xl card-shadow card-hover p-6 mb-8">
         <div class="flex items-center mb-6">
           <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
             <i class="fas fa-shield-alt text-green-600"></i>
           </div>
           <h2 class="text-xl font-semibold text-gray-900">Quality Gates</h2>
         </div>
         <div class="bg-green-50 rounded-lg p-4">
           <pre class="text-sm text-gray-900 whitespace-pre-wrap overflow-x-auto">${JSON.stringify(plan.qualityGates, null, 2)}</pre>
         </div>
       </div>`;
    }

    // Solution Strategy section
    if (plan.solutionStrategy) {
      sections += `
       <div class="bg-white rounded-xl card-shadow card-hover p-6 mb-8">
         <div class="flex items-center mb-6">
           <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
             <i class="fas fa-lightbulb text-purple-600"></i>
           </div>
           <h2 class="text-xl font-semibold text-gray-900">Solution Strategy</h2>
         </div>
         <div class="bg-purple-50 rounded-lg p-4">
           <pre class="text-sm text-gray-900 whitespace-pre-wrap overflow-x-auto">${JSON.stringify(plan.solutionStrategy, null, 2)}</pre>
         </div>
       </div>`;
    }

    return sections;
  }

  /**
   * Generate execution analysis section if available
   */
  private generateExecutionAnalysisSection(
    executionAnalysis: ImplementationPlanReportData['executionAnalysis'],
  ): string {
    if (!executionAnalysis) return '';

    return `
     <div class="bg-white rounded-xl card-shadow card-hover p-6 mb-8">
       <div class="flex items-center mb-6">
         <div class="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
           <i class="fas fa-analytics text-yellow-600"></i>
         </div>
         <h2 class="text-xl font-semibold text-gray-900">Execution Analysis</h2>
       </div>
       <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div class="bg-gray-50 rounded-lg p-4">
           <h3 class="text-sm font-semibold text-gray-700 mb-3">Completion Summary</h3>
           <div class="space-y-2">
             <div class="flex justify-between text-sm">
               <span>Total Subtasks:</span>
               <span class="font-medium">${executionAnalysis.totalSubtasks}</span>
             </div>
             <div class="flex justify-between text-sm">
               <span>Completed:</span>
               <span class="font-medium text-green-600">${executionAnalysis.completedSubtasks}</span>
             </div>
             <div class="flex justify-between text-sm">
               <span>Progress:</span>
               <span class="font-medium">${executionAnalysis.completionPercentage}%</span>
             </div>
           </div>
         </div>
         
         ${
           executionAnalysis.estimatedEffort
             ? `
         <div class="bg-gray-50 rounded-lg p-4">
           <h3 class="text-sm font-semibold text-gray-700 mb-3">Effort Estimation</h3>
           <div class="space-y-2">
             <div class="flex justify-between text-sm">
               <span>Total Hours:</span>
               <span class="font-medium">${executionAnalysis.estimatedEffort.totalHours}h</span>
             </div>
             <div class="flex justify-between text-sm">
               <span>Remaining:</span>
               <span class="font-medium text-orange-600">${executionAnalysis.estimatedEffort.remainingHours}h</span>
             </div>
             <div class="flex justify-between text-sm">
               <span>Complexity:</span>
               <span class="font-medium">${executionAnalysis.estimatedEffort.complexityScore}</span>
             </div>
           </div>
         </div>
         `
             : ''
         }
       </div>
     </div>`;
  }

  /**
   * Generate execution guidance section if available
   */
  private generateExecutionGuidanceSection(
    executionGuidance: ImplementationPlanReportData['executionGuidance'],
  ): string {
    if (!executionGuidance) return '';

    return `
     <div class="bg-white rounded-xl card-shadow card-hover p-6 mb-8">
       <div class="flex items-center mb-6">
         <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
           <i class="fas fa-route text-blue-600"></i>
         </div>
         <h2 class="text-xl font-semibold text-gray-900">Execution Guidance</h2>
       </div>
       
       ${
         executionGuidance.nextSteps && executionGuidance.nextSteps.length > 0
           ? `
       <div class="mb-6">
         <h3 class="text-lg font-semibold text-gray-900 mb-3">Next Steps</h3>
         <div class="space-y-2">
           ${executionGuidance.nextSteps
             .map(
               (step, index) => `
           <div class="flex items-start space-x-3">
             <div class="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
               <span class="text-white text-xs font-bold">${index + 1}</span>
             </div>
             <p class="text-sm text-gray-700">${step}</p>
           </div>
           `,
             )
             .join('')}
         </div>
       </div>
       `
           : ''
       }
       
       ${
         executionGuidance.riskFactors &&
         executionGuidance.riskFactors.length > 0
           ? `
       <div class="mb-6">
         <h3 class="text-lg font-semibold text-gray-900 mb-3">Risk Factors</h3>
         <div class="space-y-3">
           ${executionGuidance.riskFactors
             .map(
               (risk) => `
           <div class="border-l-4 ${risk.impact === 'high' ? 'border-red-500 bg-red-50' : risk.impact === 'medium' ? 'border-yellow-500 bg-yellow-50' : 'border-blue-500 bg-blue-50'} p-4 rounded-r-lg">
             <div class="flex items-center mb-2">
               <span class="text-sm font-semibold">${risk.risk}</span>
               <span class="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${risk.impact === 'high' ? 'bg-red-100 text-red-800' : risk.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}">
                 ${risk.impact.toUpperCase()} IMPACT
               </span>
             </div>
             <p class="text-sm text-gray-700"><strong>Mitigation:</strong> ${risk.mitigation}</p>
           </div>
           `,
             )
             .join('')}
         </div>
       </div>
       `
           : ''
       }
       
       ${
         executionGuidance.qualityChecks &&
         executionGuidance.qualityChecks.length > 0
           ? `
       <div>
         <h3 class="text-lg font-semibold text-gray-900 mb-3">Quality Checks</h3>
         <div class="bg-green-50 rounded-lg p-4">
           <div class="space-y-2">
             ${executionGuidance.qualityChecks
               .map(
                 (check) => `
             <div class="flex items-center space-x-2">
               <i class="fas fa-check-circle text-green-500"></i>
               <span class="text-sm text-gray-700">${check}</span>
             </div>
             `,
               )
               .join('')}
           </div>
         </div>
       </div>
       `
           : ''
       }
     </div>`;
  }
}
