import { Injectable, Logger } from '@nestjs/common';
import { TaskDetailData } from '../../shared/types/report-data.types';

/**
 * Task Quality Analyzer Service
 *
 * Focused service for analyzing task quality metrics and standards.
 * Handles quality assessment, code review analysis, and compliance checking.
 * Follows Single Responsibility Principle by focusing solely on quality analysis.
 */
@Injectable()
export class TaskQualityAnalyzerService {
  private readonly logger = new Logger(TaskQualityAnalyzerService.name);

  /**
   * Analyze overall task quality metrics
   */
  analyzeTaskQuality(data: TaskDetailData): {
    overallQualityScore: number;
    codebaseQuality: number;
    implementationQuality: number;
    documentationQuality: number;
    testingCoverage: number;
    securityCompliance: number;
    performanceMetrics: number;
    qualityGates: {
      passed: number;
      total: number;
      passRate: number;
    };
    recommendations: string[];
  } {
    this.logger.log(`Analyzing quality metrics for task: ${data.task.name}`);

    const codebaseQuality = this.analyzeCodebaseQuality(data.codebaseAnalysis);
    const implementationQuality = this.analyzeImplementationQuality(data);
    const documentationQuality = this.analyzeDocumentationQuality(data);
    const testingCoverage = this.analyzeTestingCoverage(data.codebaseAnalysis);
    const securityCompliance = this.analyzeSecurityCompliance(
      data.codebaseAnalysis,
    );
    const performanceMetrics = this.analyzePerformanceMetrics(
      data.codebaseAnalysis,
    );

    const qualityScores = [
      codebaseQuality,
      implementationQuality,
      documentationQuality,
      testingCoverage,
      securityCompliance,
      performanceMetrics,
    ];

    const overallQualityScore = Math.round(
      qualityScores.reduce((sum, score) => sum + score, 0) /
        qualityScores.length,
    );

    const qualityGates = this.calculateQualityGates(qualityScores);
    const recommendations = this.generateQualityRecommendations(
      data,
      qualityScores,
    );

    return {
      overallQualityScore,
      codebaseQuality,
      implementationQuality,
      documentationQuality,
      testingCoverage,
      securityCompliance,
      performanceMetrics,
      qualityGates,
      recommendations,
    };
  }

  /**
   * Analyze acceptance criteria compliance
   */
  analyzeAcceptanceCriteria(data: TaskDetailData): {
    totalCriteria: number;
    verifiedCriteria: number;
    complianceRate: number;
    unverifiedCriteria: string[];
    criticalGaps: string[];
  } {
    const acceptanceCriteria = data.description?.acceptanceCriteria || [];
    const totalCriteria = acceptanceCriteria.length;

    if (totalCriteria === 0) {
      return {
        totalCriteria: 0,
        verifiedCriteria: 0,
        complianceRate: 0,
        unverifiedCriteria: [],
        criticalGaps: ['No acceptance criteria defined'],
      };
    }

    // For now, assume criteria are verified if task is completed
    // In a real implementation, this would check against verification records
    const isTaskCompleted = data.task.status === 'completed';
    const verifiedCriteria = isTaskCompleted ? totalCriteria : 0;
    const complianceRate = Math.round((verifiedCriteria / totalCriteria) * 100);

    const unverifiedCriteria = isTaskCompleted ? [] : acceptanceCriteria;
    const criticalGaps = this.identifyCriticalGaps(data);

    return {
      totalCriteria,
      verifiedCriteria,
      complianceRate,
      unverifiedCriteria,
      criticalGaps,
    };
  }

  /**
   * Analyze implementation plan quality
   */
  analyzePlanQuality(data: TaskDetailData): {
    planCompleteness: number;
    technicalDecisionQuality: number;
    architecturalConsistency: number;
    riskAssessment: number;
    planMaturity: 'draft' | 'review' | 'approved' | 'implemented';
    gaps: string[];
  } {
    const plans = data.implementationPlans || [];

    if (plans.length === 0) {
      return {
        planCompleteness: 0,
        technicalDecisionQuality: 0,
        architecturalConsistency: 0,
        riskAssessment: 0,
        planMaturity: 'draft',
        gaps: ['No implementation plans defined'],
      };
    }

    const planCompleteness = this.assessPlanCompleteness(plans);
    const technicalDecisionQuality = this.assessTechnicalDecisions(plans);
    const architecturalConsistency = this.assessArchitecturalConsistency(data);
    const riskAssessment = this.assessRiskCoverage(plans);
    const planMaturity = this.determinePlanMaturity(data);
    const gaps = this.identifyPlanGaps(plans);

    return {
      planCompleteness,
      technicalDecisionQuality,
      architecturalConsistency,
      riskAssessment,
      planMaturity,
      gaps,
    };
  }

  /**
   * Analyze workflow efficiency and quality
   */
  analyzeWorkflowQuality(data: TaskDetailData): {
    delegationEfficiency: number;
    roleTransitionQuality: number;
    communicationQuality: number;
    timeToCompletion: number;
    workflowMaturity: 'ad-hoc' | 'defined' | 'managed' | 'optimized';
    bottlenecks: string[];
    improvements: string[];
  } {
    const delegations = data.delegationHistory || [];

    const delegationEfficiency =
      this.calculateDelegationEfficiency(delegations);
    const roleTransitionQuality = this.assessRoleTransitions(delegations);
    const communicationQuality = this.assessCommunicationQuality(data);
    const timeToCompletion = this.calculateTimeEfficiency(data);
    const workflowMaturity = this.assessWorkflowMaturity(data);
    const bottlenecks = this.identifyWorkflowBottlenecks(delegations);
    const improvements = this.suggestWorkflowImprovements(data);

    return {
      delegationEfficiency,
      roleTransitionQuality,
      communicationQuality,
      timeToCompletion,
      workflowMaturity,
      bottlenecks,
      improvements,
    };
  }

  /**
   * Analyze codebase quality from analysis data
   */
  private analyzeCodebaseQuality(
    analysis?: TaskDetailData['codebaseAnalysis'],
  ): number {
    if (!analysis) return 0;

    let score = 50; // Base score

    // Architecture findings contribute positively
    if (
      analysis.architectureFindings &&
      Object.keys(analysis.architectureFindings).length > 0
    ) {
      score += 15;
    }

    // Problems identified reduce score but show awareness
    if (analysis.problemsIdentified) {
      const problems = Object.keys(analysis.problemsIdentified).length;
      score -= Math.min(problems * 5, 20); // Cap reduction at 20 points
    }

    // Implementation context adds to score
    if (
      analysis.implementationContext &&
      Object.keys(analysis.implementationContext).length > 0
    ) {
      score += 10;
    }

    // Quality assessment boosts score
    if (
      analysis.qualityAssessment &&
      Object.keys(analysis.qualityAssessment).length > 0
    ) {
      score += 15;
    }

    // Technology stack documentation adds points
    if (
      analysis.technologyStack &&
      Object.keys(analysis.technologyStack).length > 0
    ) {
      score += 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Analyze implementation quality based on subtasks and progress
   */
  private analyzeImplementationQuality(data: TaskDetailData): number {
    const subtasks = data.subtasks || [];
    if (subtasks.length === 0) return 0;

    let score = 60; // Base score

    // Completion rate affects quality
    const completedSubtasks = subtasks.filter(
      (s) => s.status === 'completed',
    ).length;
    const completionRate = (completedSubtasks / subtasks.length) * 100;
    score += Math.round(completionRate * 0.3); // Up to 30 points for completion

    // Batch organization adds to quality
    const batches = new Set(subtasks.map((s) => s.batchId)).size;
    if (batches > 1) score += 10; // Organized in batches

    // Strategic guidance presence
    const guidedSubtasks = subtasks.filter((s) => s.strategicGuidance).length;
    if (guidedSubtasks > 0) score += 10;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Analyze documentation quality
   */
  private analyzeDocumentationQuality(data: TaskDetailData): number {
    let score = 30; // Base score

    // Task description completeness
    if (data.description) {
      if (data.description.description) score += 15;
      if (data.description.businessRequirements) score += 10;
      if (data.description.technicalRequirements) score += 10;
      if (
        data.description.acceptanceCriteria &&
        data.description.acceptanceCriteria.length > 0
      ) {
        score += 15;
      }
    }

    // Implementation plans documentation
    const plans = data.implementationPlans || [];
    if (plans.length > 0) {
      score += 10;
      if (plans.some((p) => p.overview && p.approach)) score += 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Analyze testing coverage from codebase analysis
   */
  private analyzeTestingCoverage(
    analysis?: TaskDetailData['codebaseAnalysis'],
  ): number {
    if (!analysis?.qualityAssessment) return 0;

    const qa = analysis.qualityAssessment;

    // Look for testing-related keywords in quality assessment
    const testingKeywords = ['test', 'coverage', 'unit', 'integration', 'e2e'];
    const hasTestingInfo = testingKeywords.some((keyword) =>
      JSON.stringify(qa).toLowerCase().includes(keyword),
    );

    return hasTestingInfo ? 75 : 25; // Basic scoring based on presence
  }

  /**
   * Analyze security compliance
   */
  private analyzeSecurityCompliance(
    analysis?: TaskDetailData['codebaseAnalysis'],
  ): number {
    if (!analysis?.qualityAssessment) return 50; // Default neutral score

    const qa = analysis.qualityAssessment;

    // Look for security-related keywords
    const securityKeywords = [
      'security',
      'auth',
      'validation',
      'sanitiz',
      'encrypt',
    ];
    const hasSecurityInfo = securityKeywords.some((keyword) =>
      JSON.stringify(qa).toLowerCase().includes(keyword),
    );

    return hasSecurityInfo ? 80 : 50;
  }

  /**
   * Analyze performance metrics
   */
  private analyzePerformanceMetrics(
    analysis?: TaskDetailData['codebaseAnalysis'],
  ): number {
    if (!analysis?.qualityAssessment) return 50;

    const qa = analysis.qualityAssessment;

    // Look for performance-related keywords
    const performanceKeywords = [
      'performance',
      'speed',
      'optimization',
      'cache',
      'latency',
    ];
    const hasPerformanceInfo = performanceKeywords.some((keyword) =>
      JSON.stringify(qa).toLowerCase().includes(keyword),
    );

    return hasPerformanceInfo ? 75 : 50;
  }

  /**
   * Calculate quality gates pass/fail status
   */
  private calculateQualityGates(scores: number[]): {
    passed: number;
    total: number;
    passRate: number;
  } {
    const threshold = 70; // Quality gate threshold
    const passed = scores.filter((score) => score >= threshold).length;
    const total = scores.length;
    const passRate = Math.round((passed / total) * 100);

    return { passed, total, passRate };
  }

  /**
   * Generate quality improvement recommendations
   */
  private generateQualityRecommendations(
    _data: TaskDetailData,
    scores: number[],
  ): string[] {
    const recommendations: string[] = [];
    const [
      codebase,
      implementation,
      documentation,
      testing,
      security,
      performance,
    ] = scores;

    if (codebase < 70) {
      recommendations.push(
        'Improve codebase analysis documentation and architecture findings',
      );
    }
    if (implementation < 70) {
      recommendations.push(
        'Enhance implementation planning and subtask organization',
      );
    }
    if (documentation < 70) {
      recommendations.push(
        'Complete task description and acceptance criteria documentation',
      );
    }
    if (testing < 70) {
      recommendations.push(
        'Add comprehensive testing strategy and coverage metrics',
      );
    }
    if (security < 70) {
      recommendations.push(
        'Include security considerations and validation requirements',
      );
    }
    if (performance < 70) {
      recommendations.push(
        'Document performance requirements and optimization strategies',
      );
    }

    return recommendations;
  }

  /**
   * Identify critical gaps in acceptance criteria
   */
  private identifyCriticalGaps(data: TaskDetailData): string[] {
    const gaps: string[] = [];

    if (
      !data.description?.acceptanceCriteria ||
      data.description.acceptanceCriteria.length === 0
    ) {
      gaps.push('No acceptance criteria defined');
    }

    if (!data.implementationPlans || data.implementationPlans.length === 0) {
      gaps.push('No implementation plans available');
    }

    if (!data.codebaseAnalysis) {
      gaps.push('No codebase analysis performed');
    }

    return gaps;
  }

  // Additional helper methods for plan quality analysis
  private assessPlanCompleteness(
    plans: TaskDetailData['implementationPlans'],
  ): number {
    if (!plans || plans.length === 0) return 0;

    let score = 0;
    plans.forEach((plan) => {
      if (plan.overview) score += 20;
      if (plan.approach) score += 20;
      if (plan.technicalDecisions) score += 20;
      if (plan.filesToModify && plan.filesToModify.length > 0) score += 20;
      if (plan.createdBy) score += 20;
    });

    return Math.min(100, score / plans.length);
  }

  private assessTechnicalDecisions(
    plans: TaskDetailData['implementationPlans'],
  ): number {
    if (!plans || plans.length === 0) return 0;

    const hasDecisions = plans.some(
      (plan) =>
        plan.technicalDecisions &&
        Object.keys(plan.technicalDecisions).length > 0,
    );

    return hasDecisions ? 80 : 30;
  }

  private assessArchitecturalConsistency(data: TaskDetailData): number {
    // Basic assessment based on presence of architectural analysis
    return data.codebaseAnalysis?.architectureFindings ? 75 : 40;
  }

  private assessRiskCoverage(
    plans: TaskDetailData['implementationPlans'],
  ): number {
    // Basic risk assessment - could be enhanced with specific risk analysis
    return plans && plans.length > 0 ? 60 : 20;
  }

  private determinePlanMaturity(
    data: TaskDetailData,
  ): 'draft' | 'review' | 'approved' | 'implemented' {
    const subtasks = data.subtasks || [];
    const completedSubtasks = subtasks.filter(
      (s) => s.status === 'completed',
    ).length;

    if (completedSubtasks === subtasks.length && subtasks.length > 0)
      return 'implemented';
    if (completedSubtasks > 0) return 'approved';
    if (data.implementationPlans && data.implementationPlans.length > 0)
      return 'review';
    return 'draft';
  }

  private identifyPlanGaps(
    plans: TaskDetailData['implementationPlans'],
  ): string[] {
    const gaps: string[] = [];

    if (!plans || plans.length === 0) {
      gaps.push('No implementation plans defined');
      return gaps;
    }

    plans.forEach((plan, index) => {
      if (!plan.overview) gaps.push(`Plan ${index + 1}: Missing overview`);
      if (!plan.approach) gaps.push(`Plan ${index + 1}: Missing approach`);
      if (!plan.technicalDecisions)
        gaps.push(`Plan ${index + 1}: Missing technical decisions`);
    });

    return gaps;
  }

  // Workflow quality helper methods
  private calculateDelegationEfficiency(
    delegations: TaskDetailData['delegationHistory'],
  ): number {
    if (!delegations || delegations.length === 0) return 0;

    const successfulDelegations = delegations.filter(
      (d) => d.success === true,
    ).length;
    return Math.round((successfulDelegations / delegations.length) * 100);
  }

  private assessRoleTransitions(
    delegations: TaskDetailData['delegationHistory'],
  ): number {
    if (!delegations || delegations.length === 0) return 0;

    // Assess if transitions follow logical workflow patterns
    const validTransitions = delegations.filter((d) =>
      this.isValidRoleTransition(d.fromMode, d.toMode),
    ).length;

    return Math.round((validTransitions / delegations.length) * 100);
  }

  private isValidRoleTransition(from: string, to: string): boolean {
    // Define valid role transition patterns
    const validPatterns = [
      ['boomerang', 'researcher'],
      ['researcher', 'architect'],
      ['architect', 'senior-developer'],
      ['senior-developer', 'code-review'],
      ['code-review', 'boomerang'],
    ];

    return validPatterns.some(
      ([fromRole, toRole]) => from === fromRole && to === toRole,
    );
  }

  private assessCommunicationQuality(data: TaskDetailData): number {
    // Basic assessment based on documentation completeness
    let score = 50;

    if (data.description?.description) score += 15;
    if (data.implementationPlans && data.implementationPlans.length > 0)
      score += 15;
    if (data.codebaseAnalysis) score += 20;

    return Math.min(100, score);
  }

  private calculateTimeEfficiency(data: TaskDetailData): number {
    const delegations = data.delegationHistory || [];
    if (delegations.length === 0) return 50;

    const totalDuration = delegations.reduce(
      (sum, d) => sum + (d.duration || 0),
      0,
    );
    const averageDuration = totalDuration / delegations.length;

    // Score based on average duration (lower is better)
    if (averageDuration <= 8) return 90; // <= 8 hours
    if (averageDuration <= 24) return 75; // <= 1 day
    if (averageDuration <= 72) return 60; // <= 3 days
    return 40; // > 3 days
  }

  private assessWorkflowMaturity(
    data: TaskDetailData,
  ): 'ad-hoc' | 'defined' | 'managed' | 'optimized' {
    const hasPlans =
      data.implementationPlans && data.implementationPlans.length > 0;
    const hasAnalysis = !!data.codebaseAnalysis;
    const hasStructuredSubtasks = data.subtasks && data.subtasks.length > 0;
    const hasDelegations =
      data.delegationHistory && data.delegationHistory.length > 0;

    const maturityScore = [
      hasPlans,
      hasAnalysis,
      hasStructuredSubtasks,
      hasDelegations,
    ].filter(Boolean).length;

    if (maturityScore >= 4) return 'optimized';
    if (maturityScore >= 3) return 'managed';
    if (maturityScore >= 2) return 'defined';
    return 'ad-hoc';
  }

  private identifyWorkflowBottlenecks(
    delegations: TaskDetailData['delegationHistory'],
  ): string[] {
    const bottlenecks: string[] = [];
    const roleDurations: Record<string, number[]> = {};

    delegations.forEach((delegation) => {
      if (delegation.duration && delegation.duration > 0) {
        if (!roleDurations[delegation.toMode]) {
          roleDurations[delegation.toMode] = [];
        }
        roleDurations[delegation.toMode].push(delegation.duration);
      }
    });

    Object.entries(roleDurations).forEach(([role, durations]) => {
      const avgDuration =
        durations.reduce((sum, d) => sum + d, 0) / durations.length;
      if (avgDuration > 48) {
        // More than 2 days average
        bottlenecks.push(
          `${role} role has high average duration (${Math.round(avgDuration)}h)`,
        );
      }
    });

    return bottlenecks;
  }

  private suggestWorkflowImprovements(data: TaskDetailData): string[] {
    const improvements: string[] = [];

    if (!data.implementationPlans || data.implementationPlans.length === 0) {
      improvements.push('Add detailed implementation plans before development');
    }

    if (!data.codebaseAnalysis) {
      improvements.push('Perform comprehensive codebase analysis');
    }

    const subtasks = data.subtasks || [];
    if (subtasks.length === 0) {
      improvements.push('Break down work into manageable subtasks');
    }

    const delegations = data.delegationHistory || [];
    if (delegations.length === 0) {
      improvements.push('Implement proper role-based workflow delegation');
    }

    return improvements;
  }
}
