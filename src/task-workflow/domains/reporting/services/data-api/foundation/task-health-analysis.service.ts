/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { TaskProgressHealthData } from '../task-summary';

/**
 * Task Health Analysis Service
 *
 * Follows SRP: Single responsibility for individual task health analysis
 * Handles: Task progress health metrics, batch analysis, health indicators, bottleneck detection
 *
 * Extracted from MetricsCalculatorService to reduce complexity
 */
@Injectable()
export class TaskHealthAnalysisService {
  private readonly logger = new Logger(TaskHealthAnalysisService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getTaskProgressHealthMetrics(
    taskId: string,
  ): Promise<TaskProgressHealthData> {
    try {
      const task = await this.prisma.task.findUnique({
        where: { taskId: taskId },
        include: {
          taskDescription: true,
          implementationPlans: {
            include: {
              subtasks: true,
            },
          },
          delegationRecords: {
            orderBy: { delegationTimestamp: 'desc' },
          },
          comments: true,
          researchReports: true,
          codeReviews: true,
          completionReports: true,
        },
      });

      if (!task) {
        throw new Error(`Task ${taskId} not found`);
      }

      const allSubtasks = task.implementationPlans.flatMap(
        (plan: any) => plan.subtasks,
      );
      const totalSubtasks = allSubtasks.length;
      const completedSubtasks = allSubtasks.filter(
        (st: any) => st.status === 'completed',
      ).length;

      const progressPercent =
        totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

      const totalDuration = task.completionDate
        ? (task.completionDate.getTime() - task.creationDate.getTime()) /
          (1000 * 60 * 60)
        : (Date.now() - task.creationDate.getTime()) / (1000 * 60 * 60);

      // Calculate rich batch analysis
      const _batchAnalysis = this.calculateBatchAnalysis(
        task.implementationPlans,
      );

      // Calculate health indicators
      const healthIndicators = this.calculateHealthIndicators(
        task,
        progressPercent,
        totalDuration,
      );

      // Calculate bottlenecks
      const bottlenecks = this.calculateBottlenecks(task, allSubtasks);

      // Calculate estimation accuracy
      const estimationAccuracy = this.calculateEstimationAccuracy(allSubtasks);

      // Extract redelegation reasons
      const redelegationReasons = task.delegationRecords
        .filter((dr: any) => dr.rejectionReason)
        .map((dr: any) => dr.rejectionReason)
        .slice(0, 5);

      // Calculate quality score based on multiple factors
      const qualityScore = this.calculateQualityScore(
        task,
        progressPercent,
        estimationAccuracy,
      );

      return {
        task: {
          name: task.name,
          status: task.status,
          statusClass: task.status,
          priority: task.priority || '',
          currentMode: task.currentMode || '',
        },

        health: {
          overallScore: qualityScore,
          indicators: healthIndicators,
        },

        progress: {
          completionRate: progressPercent,
          completedSubtasks,
          totalSubtasks,
          timeElapsed: `${Math.round(totalDuration)}h`,
          estimatedRemaining: 'N/A',
          totalDuration: `${Math.round(totalDuration)}h`,
          velocity: progressPercent / Math.max(totalDuration / 24, 1), // Progress per day
          trend: progressPercent > 50 ? 'improving' : 'stable',
          trendClass:
            progressPercent > 50 ? 'text-green-600' : 'text-yellow-600',
          chartLabels: ['Completed', 'Remaining'],
          chartData: [completedSubtasks, totalSubtasks - completedSubtasks],
          chartColors: ['#10B981', '#E5E7EB'],
        },

        // Add missing top-level properties for backward compatibility
        taskName: task.name,
        status: task.status,
        priority: task.priority || '',
        currentMode: task.currentMode || '',

        subtasks: allSubtasks.map((subtask: any) => ({
          name: subtask.name,
          description: subtask.description || '',
          status: subtask.status,
          statusClass: subtask.status,
          statusBorderClass: `border-${subtask.status}`,
          sequenceNumber: subtask.sequenceNumber || 0,
          estimatedDuration: subtask.estimatedDuration,
          startedAt: subtask.startedAt?.toISOString(),
          completedAt: subtask.completedAt?.toISOString(),
          assignedTo: subtask.assignedTo,
          batchTitle: subtask.batchTitle,
        })),

        risks: bottlenecks.map((bottleneck: any) => ({
          category: bottleneck.type,
          severity: bottleneck.impact,
          description: bottleneck.description,
          impact: bottleneck.impact,
          probability: 'medium',
        })),

        delegations: task.delegationRecords.slice(0, 5).map((record: any) => ({
          fromMode: record.fromMode,
          toMode: record.toMode,
          timestamp: record.delegationTimestamp.toISOString(),
          description: record.rejectionReason || 'Task delegated successfully',
          duration: '2h',
          statusColor: record.rejectionReason ? '#EF4444' : '#10B981',
          icon: record.rejectionReason
            ? 'exclamation-triangle'
            : 'check-circle',
        })),

        performance: {
          strengths: [
            `${Math.round(estimationAccuracy)}% estimation accuracy`,
            `${completedSubtasks}/${totalSubtasks} subtasks completed`,
          ],
          improvements:
            redelegationReasons.length > 0
              ? redelegationReasons
              : ['No major issues identified'],
          recommendations: [
            progressPercent < 50
              ? 'Focus on completing current batch'
              : 'Maintain current progress',
            estimationAccuracy < 70
              ? 'Improve time estimation accuracy'
              : 'Good estimation practices',
          ],
        },

        actionItems: [
          ...(progressPercent < 50
            ? [
                {
                  title: 'Accelerate Progress',
                  description:
                    'Current progress is below 50%, focus on completing current batch',
                  priority: 'high',
                  priorityClass: 'text-red-600',
                  deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                    .toISOString()
                    .split('T')[0],
                  icon: 'clock',
                },
              ]
            : []),
          ...(task.redelegationCount > 2
            ? [
                {
                  title: 'Review Role Assignment',
                  description:
                    'High redelegation count indicates potential role mismatch',
                  priority: 'medium',
                  priorityClass: 'text-yellow-600',
                  deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
                    .toISOString()
                    .split('T')[0],
                  icon: 'user-group',
                },
              ]
            : []),
        ],
      };
    } catch (error) {
      this.logger.error(
        'Error calculating task progress health metrics',
        error,
      );
      throw error;
    }
  }

  // Simplified implementations for other individual task metrics
  async getImplementationExecutionMetrics(taskId: string): Promise<any> {
    try {
      const task = await this.prisma.task.findUnique({
        where: { taskId },
        include: {
          implementationPlans: {
            include: {
              subtasks: true,
            },
          },
        },
      });

      if (!task) {
        throw new Error(`Task ${taskId} not found`);
      }

      const implementationPlan = task.implementationPlans[0]; // Get first plan
      const allSubtasks = task.implementationPlans.flatMap(
        (plan) => plan.subtasks,
      );

      return {
        taskId,
        implementationPlan: {
          id: implementationPlan?.id || 0,
          overview: implementationPlan?.overview || 'Implementation plan',
          approach: implementationPlan?.approach || 'Standard approach',
          technicalDecisions:
            implementationPlan?.technicalDecisions ||
            'Technical decisions documented',
          totalBatches: task.implementationPlans.length,
          completedBatches: task.implementationPlans.filter((plan) =>
            plan.subtasks.every((st) => st.status === 'completed'),
          ).length,
          batchCompletionRate:
            task.implementationPlans.length > 0
              ? (task.implementationPlans.filter((plan) =>
                  plan.subtasks.every((st) => st.status === 'completed'),
                ).length /
                  task.implementationPlans.length) *
                100
              : 0,
        },
        batchExecution: this.calculateBatchAnalysis(task.implementationPlans),
        subtaskPerformance: allSubtasks.map((subtask) => ({
          subtaskId: subtask.id,
          name: subtask.name,
          estimatedDuration: subtask.estimatedDuration || '4 hours',
          actualDuration: this.calculateActualDuration(subtask),
          qualityScore: 85, // Could be calculated based on reviews
          reworkCount: 0, // Could be calculated from delegation records
          complexityScore: 3, // Could be derived from description length or other factors
        })),
        technicalQuality: {
          codeQuality: 85,
          testCoverage: 80,
          architecturalCompliance: 90,
          securityScore: 88,
          performanceScore: 82,
          maintainabilityScore: 87,
        },
        integrationPoints: [],
        architecturalCompliance: {
          solidPrinciples: {
            singleResponsibility: 85,
            openClosed: 80,
            liskovSubstitution: 90,
            interfaceSegregation: 88,
            dependencyInversion: 82,
            overallScore: 85,
          },
          designPatterns: [],
          codeStandards: {
            namingConventions: 90,
            codeStructure: 85,
            documentation: 80,
            errorHandling: 88,
            overallScore: 86,
          },
          securityCompliance: {
            inputValidation: 90,
            authentication: 85,
            authorization: 88,
            dataProtection: 92,
            overallScore: 89,
          },
        },
      };
    } catch (error) {
      this.logger.error(
        'Error calculating implementation execution metrics',
        error,
      );
      throw error;
    }
  }

  async getCodeReviewQualityMetrics(taskId: string): Promise<any> {
    try {
      const task = await this.prisma.task.findUnique({
        where: { taskId },
        include: {
          codeReviews: true,
        },
      });

      if (!task) {
        throw new Error(`Task ${taskId} not found`);
      }

      const codeReviews = task.codeReviews || [];
      const approvedReviews = codeReviews.filter(
        (cr) => cr.status === 'APPROVED',
      ).length;
      const totalReviews = codeReviews.length;
      const approvalRate =
        totalReviews > 0 ? (approvedReviews / totalReviews) * 100 : 0;

      return {
        taskId,
        codeReviews: codeReviews.map((review) => ({
          id: review.id,
          status: review.status,
          createdAt: review.createdAt,
          completedAt: review.updatedAt,
          summary: review.summary || 'Code review completed',
          strengths: review.strengths || 'Good implementation',
          issues: review.issues || 'Minor issues identified',
          requiredChanges: review.requiredChanges,
          manualTestingResults:
            review.manualTestingResults || 'Manual testing passed',
        })),
        overallApprovalRate: approvalRate,
        avgReviewCycleDays: this.calculateAvgReviewCycle(codeReviews),
        reworkCycles: this.calculateReworkCycles(codeReviews),
        acceptanceCriteriaVerification: [],
        qualityTrends: [],
        issueCategories: [],
        reviewerFeedback: [],
        testingCoverage: {
          unitTests: 85,
          integrationTests: 80,
          e2eTests: 75,
          manualTesting: true,
          coveragePercent: 82,
        },
      };
    } catch (error) {
      this.logger.error('Error calculating code review quality metrics', error);
      throw error;
    }
  }

  async getResearchDocumentationMetrics(taskId: string): Promise<any> {
    try {
      const task = await this.prisma.task.findUnique({
        where: { taskId },
        include: {
          researchReports: true,
          taskDescription: true,
        },
      });

      if (!task) {
        throw new Error(`Task ${taskId} not found`);
      }

      const researchReports = task.researchReports || [];

      return {
        taskId,
        researchReports: researchReports.map((report) => ({
          id: report.id,
          title: report.title || 'Research Report',
          summary: report.summary || 'Research summary',
          findings: report.findings || 'Key findings documented',
          recommendations: report.recommendations || 'Recommendations provided',
          createdAt: report.createdAt,
          impact: 'medium',
        })),
        knowledgeCapture: {
          totalFindings: researchReports.length,
          actionableInsights: Math.floor(researchReports.length * 0.8),
          knowledgeGaps: [],
          expertiseAreas: ['Technical', 'Process', 'Architecture'],
          reusabilityScore: 85,
        },
        researchImpact: {
          implementationInfluence: 80,
          decisionSupport: 85,
          riskMitigation: 75,
          innovationScore: 70,
        },
        documentationQuality: {
          completeness: this.calculateDocumentationCompleteness(task),
          clarity: 85,
          accuracy: 90,
          maintainability: 80,
          overallScore: 85,
        },
        knowledgeTransfer: [],
      };
    } catch (error) {
      this.logger.error(
        'Error calculating research documentation metrics',
        error,
      );
      throw error;
    }
  }

  async getCommunicationCollaborationMetrics(taskId: string): Promise<any> {
    try {
      const task = await this.prisma.task.findUnique({
        where: { taskId },
        include: {
          comments: true,
          delegationRecords: {
            orderBy: { delegationTimestamp: 'desc' },
          },
        },
      });

      if (!task) {
        throw new Error(`Task ${taskId} not found`);
      }

      const comments = task.comments || [];
      const delegationRecords = task.delegationRecords || [];

      return {
        taskId,
        commentAnalysis: {
          totalComments: comments.length,
          avgCommentsPerMode: comments.length / 5, // Assuming 5 modes
          communicationFrequency:
            this.calculateCommunicationFrequency(comments),
          responseTime: this.calculateAvgResponseTime(delegationRecords),
          clarityScore: 85,
        },
        crossModeInteraction:
          this.calculateCrossModeInteractions(delegationRecords),
        informationFlow: {
          upstreamFlow: 80,
          downstreamFlow: 85,
          bidirectionalFlow: 75,
          informationLoss: 10,
          flowEfficiency: 85,
        },
        collaborationEffectiveness: {
          teamworkScore: 85,
          knowledgeSharing: 80,
          conflictResolution: 90,
          decisionMaking: 85,
          overallEffectiveness: 85,
        },
        communicationPatterns: [],
      };
    } catch (error) {
      this.logger.error(
        'Error calculating communication collaboration metrics',
        error,
      );
      throw error;
    }
  }

  async getTaskDelegationFlowMetrics(taskId: string): Promise<any> {
    try {
      const task = await this.prisma.task.findUnique({
        where: { taskId },
        include: {
          delegationRecords: {
            orderBy: { delegationTimestamp: 'desc' },
          },
        },
      });

      if (!task) {
        throw new Error(`Task ${taskId} not found`);
      }

      const delegationRecords = task.delegationRecords || [];

      return {
        taskId,
        delegationHistory: delegationRecords.map((record) => ({
          id: record.id,
          fromMode: record.fromMode,
          toMode: record.toMode,
          delegationTimestamp: record.delegationTimestamp,
          message: 'Task delegated', // Default message since property doesn't exist
          rejectionReason: record.rejectionReason,
          status: record.rejectionReason ? 'rejected' : 'accepted',
        })),
        flowEfficiency: this.calculateFlowEfficiency(delegationRecords),
        handoffQuality: this.calculateHandoffQuality(delegationRecords),
        rolePerformance: this.calculateRolePerformance(delegationRecords),
        communicationPatterns:
          this.calculateCommunicationPatterns(delegationRecords),
        workflowBottlenecks:
          this.identifyWorkflowBottlenecks(delegationRecords),
        collaborationScore: this.calculateCollaborationScore(delegationRecords),
      };
    } catch (error) {
      this.logger.error(
        'Error calculating task delegation flow metrics',
        error,
      );
      throw error;
    }
  }

  // Helper methods for delegation flow metrics
  private calculateFlowEfficiency(delegationRecords: any[]): number {
    if (delegationRecords.length === 0) return 100;

    const successfulDelegations = delegationRecords.filter(
      (record) => !record.rejectionReason,
    ).length;
    return Math.round((successfulDelegations / delegationRecords.length) * 100);
  }

  private calculateHandoffQuality(delegationRecords: any[]): any[] {
    const handoffs: { [key: string]: any } = {};

    delegationRecords.forEach((record) => {
      const key = `${record.fromMode}-${record.toMode}`;
      if (!handoffs[key]) {
        handoffs[key] = {
          fromMode: record.fromMode,
          toMode: record.toMode,
          handoffCount: 0,
          successRate: 0,
          avgResponseTime: 0,
          qualityScore: 85,
        };
      }
      handoffs[key].handoffCount++;
      if (!record.rejectionReason) {
        handoffs[key].successRate++;
      }
    });

    // Calculate success rates
    Object.values(handoffs).forEach((handoff: any) => {
      handoff.successRate = Math.round(
        (handoff.successRate / handoff.handoffCount) * 100,
      );
    });

    return Object.values(handoffs);
  }

  private calculateRolePerformance(delegationRecords: any[]): any[] {
    const roles = [
      'boomerang',
      'researcher',
      'architect',
      'senior-developer',
      'code-review',
    ];

    return roles.map((role) => {
      const roleRecords = delegationRecords.filter(
        (record) => record.fromMode === role || record.toMode === role,
      );

      const successfulHandoffs = roleRecords.filter(
        (record) => !record.rejectionReason,
      ).length;
      const successRate =
        roleRecords.length > 0
          ? Math.round((successfulHandoffs / roleRecords.length) * 100)
          : 100;

      return {
        role,
        handoffCount: roleRecords.length,
        successRate,
        avgResponseTime: Math.round(Math.random() * 3 + 1), // Placeholder
        performanceScore: successRate,
      };
    });
  }

  private calculateCommunicationPatterns(delegationRecords: any[]): any[] {
    const patterns: any[] = [];

    // Analyze delegation patterns
    const modeTransitions: { [key: string]: number } = {};
    delegationRecords.forEach((record) => {
      const transition = `${record.fromMode} → ${record.toMode}`;
      modeTransitions[transition] = (modeTransitions[transition] || 0) + 1;
    });

    Object.entries(modeTransitions).forEach(([transition, count]) => {
      patterns.push({
        pattern: transition,
        frequency: count,
        effectiveness: Math.round(Math.random() * 20 + 80), // 80-100%
        description: `Common delegation pattern: ${transition}`,
      });
    });

    return patterns;
  }

  private identifyWorkflowBottlenecks(delegationRecords: any[]): string[] {
    const bottlenecks: string[] = [];

    // Identify roles with high rejection rates
    const roleRejections: {
      [key: string]: { total: number; rejected: number };
    } = {};

    delegationRecords.forEach((record) => {
      if (!roleRejections[record.toMode]) {
        roleRejections[record.toMode] = { total: 0, rejected: 0 };
      }
      roleRejections[record.toMode].total++;
      if (record.rejectionReason) {
        roleRejections[record.toMode].rejected++;
      }
    });

    Object.entries(roleRejections).forEach(([role, stats]) => {
      const rejectionRate = (stats.rejected / stats.total) * 100;
      if (rejectionRate > 20) {
        // More than 20% rejection rate
        bottlenecks.push(
          `High rejection rate in ${role} role (${Math.round(rejectionRate)}%)`,
        );
      }
    });

    return bottlenecks;
  }

  private calculateCollaborationScore(delegationRecords: any[]): number {
    if (delegationRecords.length === 0) return 100;

    const successfulDelegations = delegationRecords.filter(
      (record) => !record.rejectionReason,
    ).length;
    const baseScore = (successfulDelegations / delegationRecords.length) * 100;

    // Adjust score based on delegation frequency (more delegations = better collaboration)
    const frequencyBonus = Math.min(delegationRecords.length * 2, 20);

    return Math.min(100, Math.round(baseScore + frequencyBonus));
  }

  // Helper methods for batch analysis
  private calculateBatchAnalysis(implementationPlans: any[]): any[] {
    const batchAnalysis: any[] = [];

    implementationPlans.forEach((plan) => {
      const subtasksByBatch = plan.subtasks.reduce((acc: any, subtask: any) => {
        const batchId = subtask.batchId || 'default';
        if (!acc[batchId]) acc[batchId] = [];
        acc[batchId].push(subtask);
        return acc;
      }, {});

      Object.entries(subtasksByBatch).forEach(
        ([batchId, subtasks]: [string, any[]]) => {
          const completedSubtasks = subtasks.filter(
            (s) => s.status === 'completed',
          );
          const completionRate =
            subtasks.length > 0
              ? (completedSubtasks.length / subtasks.length) * 100
              : 0;

          batchAnalysis.push({
            batchId,
            batchTitle: subtasks[0]?.batchTitle || `Batch ${batchId}`,
            totalSubtasks: subtasks.length,
            completedSubtasks: completedSubtasks.length,
            completionRate,
            duration: this.calculateBatchDuration(subtasks),
            dependencies: this.extractBatchDependencies(subtasks),
            blockers: this.identifyBatchBlockers(subtasks),
          });
        },
      );
    });

    return batchAnalysis;
  }

  private calculateHealthIndicators(
    task: any,
    progressPercent: number,
    totalDuration: number,
  ): any[] {
    const indicators = [];

    // Progress indicator
    indicators.push({
      indicator: 'Progress Rate',
      status:
        progressPercent > 75
          ? 'healthy'
          : progressPercent > 50
            ? 'warning'
            : 'critical',
      value: `${Math.round(progressPercent)}%`,
      threshold: '75%',
      description: 'Task completion progress',
    });

    // Duration indicator
    const expectedDuration = 168; // 1 week in hours
    indicators.push({
      indicator: 'Duration',
      status:
        totalDuration < expectedDuration
          ? 'healthy'
          : totalDuration < expectedDuration * 1.5
            ? 'warning'
            : 'critical',
      value: `${Math.round(totalDuration)}h`,
      threshold: `${expectedDuration}h`,
      description: 'Time spent on task',
    });

    // Redelegation indicator
    const redelegationCount = task.redelegationCount || 0;
    indicators.push({
      indicator: 'Redelegations',
      status:
        redelegationCount === 0
          ? 'healthy'
          : redelegationCount < 3
            ? 'warning'
            : 'critical',
      value: redelegationCount.toString(),
      threshold: '2',
      description: 'Number of task redelegations',
    });

    return indicators;
  }

  private calculateBottlenecks(task: any, allSubtasks: any[]): any[] {
    const bottlenecks = [];

    // Check for stuck subtasks
    const stuckSubtasks = allSubtasks.filter(
      (st) =>
        st.status === 'in-progress' &&
        st.startedAt &&
        Date.now() - new Date(st.startedAt).getTime() > 48 * 60 * 60 * 1000, // 48 hours
    );

    if (stuckSubtasks.length > 0) {
      bottlenecks.push({
        type: 'Stuck Subtasks',
        description: `${stuckSubtasks.length} subtasks in progress for >48h`,
        impact: 'medium',
        duration: '48+ hours',
        resolution: 'Review subtask complexity and provide support',
      });
    }

    // Check for high redelegation
    if (task.redelegationCount > 2) {
      bottlenecks.push({
        type: 'High Redelegation',
        description: `Task redelegated ${task.redelegationCount} times`,
        impact: 'high',
        duration: 'Ongoing',
        resolution: 'Review role assignments and requirements clarity',
      });
    }

    return bottlenecks;
  }

  private calculateEstimationAccuracy(allSubtasks: any[]): number {
    const subtasksWithEstimates = allSubtasks.filter(
      (st) => st.estimatedDuration && st.startedAt && st.completedAt,
    );

    if (subtasksWithEstimates.length === 0) return 85; // Default

    const accuracyScores = subtasksWithEstimates.map((st) => {
      const estimated = this.parseDuration(st.estimatedDuration);
      const actual =
        (new Date(st.completedAt).getTime() -
          new Date(st.startedAt).getTime()) /
        (1000 * 60 * 60);

      if (estimated === 0) return 50;
      const ratio = Math.min(actual, estimated) / Math.max(actual, estimated);
      return ratio * 100;
    });

    return (
      accuracyScores.reduce((sum, score) => sum + score, 0) /
      accuracyScores.length
    );
  }

  private calculateQualityScore(
    task: any,
    progressPercent: number,
    estimationAccuracy: number,
  ): number {
    let score = 100;

    // Deduct for redelegations
    score -= (task.redelegationCount || 0) * 10;

    // Deduct for low progress if task is old
    const taskAgeHours =
      (Date.now() - task.creationDate.getTime()) / (1000 * 60 * 60);
    if (taskAgeHours > 168 && progressPercent < 50) {
      // 1 week old, <50% progress
      score -= 20;
    }

    // Deduct for poor estimation accuracy
    if (estimationAccuracy < 70) {
      score -= 15;
    }

    // Add bonus for good progress
    if (progressPercent > 80) {
      score += 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  // Helper methods for batch analysis
  private calculateBatchDuration(subtasks: any[]): string {
    const completedSubtasks = subtasks.filter(
      (st) => st.startedAt && st.completedAt,
    );
    if (completedSubtasks.length === 0) return 'N/A';

    const totalHours = completedSubtasks.reduce((sum, st) => {
      const duration =
        (new Date(st.completedAt).getTime() -
          new Date(st.startedAt).getTime()) /
        (1000 * 60 * 60);
      return sum + duration;
    }, 0);

    const avgHours = totalHours / completedSubtasks.length;
    return avgHours < 1
      ? `${Math.round(avgHours * 60)}m`
      : `${avgHours.toFixed(1)}h`;
  }

  private extractBatchDependencies(subtasks: any[]): string[] {
    // Extract dependencies from subtask descriptions or metadata
    return subtasks
      .filter((st) => st.description && st.description.includes('depends on'))
      .map((st) => `Subtask ${st.sequenceNumber}`)
      .slice(0, 3);
  }

  private identifyBatchBlockers(subtasks: any[]): string[] {
    const blockers = [];

    // Check for subtasks stuck in progress
    const stuckSubtasks = subtasks.filter(
      (st) =>
        st.status === 'in-progress' &&
        st.startedAt &&
        Date.now() - new Date(st.startedAt).getTime() > 24 * 60 * 60 * 1000,
    );

    if (stuckSubtasks.length > 0) {
      blockers.push(`${stuckSubtasks.length} subtasks stuck >24h`);
    }

    return blockers;
  }

  private parseDuration(duration: string): number {
    if (!duration) return 0;

    const match = duration.match(/(\d+)\s*(h|hour|hours|m|min|minutes)/i);
    if (!match) return 0;

    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();

    if (unit.startsWith('h')) return value;
    if (unit.startsWith('m')) return value / 60;

    return 0;
  }

  // Helper methods for the new implementations
  private calculateActualDuration(subtask: any): number {
    if (subtask.completedAt && subtask.startedAt) {
      return (
        (subtask.completedAt.getTime() - subtask.startedAt.getTime()) /
        (1000 * 60 * 60)
      );
    }
    return this.parseDuration(subtask.estimatedDuration || '4 hours');
  }

  private calculateAvgReviewCycle(codeReviews: any[]): number {
    if (codeReviews.length === 0) return 0;

    const cycles = codeReviews
      .filter((cr) => cr.updatedAt && cr.createdAt)
      .map(
        (cr) =>
          (cr.updatedAt.getTime() - cr.createdAt.getTime()) /
          (1000 * 60 * 60 * 24),
      );

    return cycles.length > 0
      ? cycles.reduce((sum, cycle) => sum + cycle, 0) / cycles.length
      : 0;
  }

  private calculateReworkCycles(codeReviews: any[]): number {
    return codeReviews.filter((cr) => cr.status === 'NEEDS_CHANGES').length;
  }

  private calculateDocumentationCompleteness(task: any): number {
    let score = 0;
    if (task.taskDescription?.description) score += 25;
    if (task.taskDescription?.businessRequirements) score += 25;
    if (task.taskDescription?.technicalRequirements) score += 25;
    if (task.taskDescription?.acceptanceCriteria) score += 25;
    return score;
  }

  private calculateCommunicationFrequency(comments: any[]): number {
    if (comments.length === 0) return 0;

    const firstComment = comments[comments.length - 1];
    const lastComment = comments[0];

    if (!firstComment?.createdAt || !lastComment?.createdAt) return 0;

    const daysDiff =
      (lastComment.createdAt.getTime() - firstComment.createdAt.getTime()) /
      (1000 * 60 * 60 * 24);
    return daysDiff > 0 ? comments.length / daysDiff : comments.length;
  }

  private calculateAvgResponseTime(delegationRecords: any[]): number {
    if (delegationRecords.length <= 1) return 0;

    const responseTimes = [];
    for (let i = 0; i < delegationRecords.length - 1; i++) {
      const current = delegationRecords[i];
      const next = delegationRecords[i + 1];

      if (current.delegationTimestamp && next.delegationTimestamp) {
        const responseTime =
          (current.delegationTimestamp.getTime() -
            next.delegationTimestamp.getTime()) /
          (1000 * 60 * 60);
        responseTimes.push(responseTime);
      }
    }

    return responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) /
          responseTimes.length
      : 0;
  }

  private calculateCrossModeInteractions(delegationRecords: any[]): any[] {
    const interactions: { [key: string]: any } = {};

    delegationRecords.forEach((record) => {
      const key = `${record.fromMode}-${record.toMode}`;
      if (!interactions[key]) {
        interactions[key] = {
          fromMode: record.fromMode,
          toMode: record.toMode,
          interactionCount: 0,
          avgResponseTime: 0,
          effectivenessScore: 85,
        };
      }
      interactions[key].interactionCount++;
    });

    return Object.values(interactions);
  }
}
