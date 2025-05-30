import { Injectable, Logger } from '@nestjs/common';

/**
 * Workflow Analysis Service
 *
 * Single Responsibility: Analyze workflow patterns and bottlenecks
 * Handles: Transition matrices, bottleneck detection, workflow pattern analysis
 */
@Injectable()
export class WorkflowAnalysisService {
  private readonly logger = new Logger(WorkflowAnalysisService.name);

  /**
   * Build transition matrix from mode transitions
   */
  buildTransitionMatrix(
    modeTransitions: any[],
  ): Record<string, Record<string, number>> {
    const matrix: Record<string, Record<string, number>> = {};
    const roles = [
      'boomerang',
      'researcher',
      'architect',
      'senior-developer',
      'code-review',
    ];

    // Initialize matrix
    roles.forEach((fromRole) => {
      matrix[fromRole] = {};
      roles.forEach((toRole) => {
        matrix[fromRole][toRole] = 0;
      });
    });

    // Populate matrix with actual transition counts
    modeTransitions.forEach((transition) => {
      const fromRole = transition.fromMode;
      const toRole = transition.toMode;
      if (matrix[fromRole] && matrix[fromRole][toRole] !== undefined) {
        matrix[fromRole][toRole] = transition._count;
      }
    });

    this.logger.debug(`Transition matrix built: ${JSON.stringify(matrix)}`);
    return matrix;
  }

  /**
   * Analyze bottlenecks in the workflow
   */
  analyzeBottlenecks(
    delegations: any[],
    roleEfficiency: Record<string, number>,
    avgHandoffTime: number,
    avgRedelegationCount: number,
  ): Array<{
    role: string;
    issue: string;
    impact: 'high' | 'medium' | 'low';
    recommendation?: string;
  }> {
    const bottlenecks: Array<{
      role: string;
      issue: string;
      impact: 'high' | 'medium' | 'low';
      recommendation?: string;
    }> = [];

    // Check for high handoff time
    if (avgHandoffTime > 24) {
      bottlenecks.push({
        role: 'system-wide',
        issue: `High average handoff time: ${avgHandoffTime.toFixed(1)} hours`,
        impact: 'high',
        recommendation:
          'Consider implementing automated notifications and clearer handoff procedures',
      });
    }

    // Check for high redelegation rate
    if (avgRedelegationCount > 1.5) {
      bottlenecks.push({
        role: 'workflow',
        issue: `High redelegation rate: ${avgRedelegationCount.toFixed(1)} per task`,
        impact: 'medium',
        recommendation:
          'Review task requirements clarity and role responsibilities',
      });
    }

    // Check role-specific efficiency issues
    Object.entries(roleEfficiency).forEach(([role, efficiency]) => {
      if (efficiency < 0.5) {
        const impact = efficiency < 0.3 ? 'high' : 'medium';
        const recommendation = this.getRoleSpecificRecommendation(
          role,
          efficiency,
        );

        bottlenecks.push({
          role: role,
          issue: `Low efficiency score: ${(efficiency * 100).toFixed(1)}%`,
          impact,
          recommendation,
        });
      }
    });

    // Analyze delegation patterns for additional insights
    const patternBottlenecks = this.analyzePatternBottlenecks(delegations);
    bottlenecks.push(...patternBottlenecks);

    this.logger.debug(
      `Bottlenecks analyzed: ${bottlenecks.length} issues found`,
    );
    return bottlenecks;
  }

  /**
   * Get role-specific recommendations based on efficiency
   */
  private getRoleSpecificRecommendation(
    role: string,
    efficiency: number,
  ): string {
    const baseRecommendations: Record<string, string> = {
      'senior-developer':
        'Consider code review training, pair programming, or breaking down complex tasks',
      'code-review':
        'Streamline review process, provide clearer review criteria, or add automated checks',
      architect:
        'Improve requirement gathering, provide more detailed technical specifications',
      researcher:
        'Focus research scope, provide better research templates and guidelines',
      boomerang:
        'Clarify task requirements, improve initial task analysis and scoping',
    };

    const severityPrefix =
      efficiency < 0.3 ? 'URGENT: ' : efficiency < 0.4 ? 'Priority: ' : '';

    return (
      severityPrefix +
      (baseRecommendations[role] ||
        'Review role responsibilities and provide additional training')
    );
  }

  /**
   * Analyze delegation patterns for bottlenecks
   */
  private analyzePatternBottlenecks(delegations: any[]): Array<{
    role: string;
    issue: string;
    impact: 'high' | 'medium' | 'low';
    recommendation?: string;
  }> {
    const bottlenecks: Array<{
      role: string;
      issue: string;
      impact: 'high' | 'medium' | 'low';
      recommendation?: string;
    }> = [];

    // Check for excessive back-and-forth patterns
    const taskDelegationCounts = new Map<string, number>();
    delegations.forEach((d) => {
      const count = taskDelegationCounts.get(d.taskId) || 0;
      taskDelegationCounts.set(d.taskId, count + 1);
    });

    const highDelegationTasks = Array.from(
      taskDelegationCounts.entries(),
    ).filter(([, count]) => count > 5);

    if (highDelegationTasks.length > 0) {
      bottlenecks.push({
        role: 'workflow',
        issue: `${highDelegationTasks.length} tasks with excessive delegations (>5 handoffs)`,
        impact: 'medium',
        recommendation:
          'Review task complexity and role clarity for frequently redelegated tasks',
      });
    }

    // Check for role concentration issues
    const roleDistribution = new Map<string, number>();
    delegations.forEach((d) => {
      const count = roleDistribution.get(d.toMode) || 0;
      roleDistribution.set(d.toMode, count + 1);
    });

    const totalDelegations = delegations.length;
    roleDistribution.forEach((count, role) => {
      const percentage = (count / totalDelegations) * 100;
      if (percentage > 60) {
        bottlenecks.push({
          role,
          issue: `Role overload: ${percentage.toFixed(1)}% of all delegations`,
          impact: 'high',
          recommendation:
            'Consider load balancing or adding additional resources to this role',
        });
      }
    });

    return bottlenecks;
  }

  /**
   * Calculate workflow health score
   */
  calculateWorkflowHealthScore(
    successRate: number,
    avgHandoffTime: number,
    avgRedelegationCount: number,
    roleEfficiency: Record<string, number>,
  ): {
    score: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    factors: Record<string, number>;
  } {
    // Calculate individual factor scores (0-100)
    const successScore = Math.min(successRate, 100);
    const handoffScore = Math.max(0, 100 - avgHandoffTime * 2); // Penalty for long handoffs
    const redelegationScore = Math.max(0, 100 - avgRedelegationCount * 20); // Penalty for redelegations
    const avgEfficiency =
      Object.values(roleEfficiency).reduce((sum, eff) => sum + eff, 0) /
      Object.keys(roleEfficiency).length;
    const efficiencyScore = avgEfficiency * 100;

    // Weighted overall score
    const score =
      successScore * 0.3 +
      handoffScore * 0.25 +
      redelegationScore * 0.25 +
      efficiencyScore * 0.2;

    // Determine grade
    let grade: 'A' | 'B' | 'C' | 'D' | 'F';
    if (score >= 90) grade = 'A';
    else if (score >= 80) grade = 'B';
    else if (score >= 70) grade = 'C';
    else if (score >= 60) grade = 'D';
    else grade = 'F';

    return {
      score: Math.round(score),
      grade,
      factors: {
        success: Math.round(successScore),
        handoff: Math.round(handoffScore),
        redelegation: Math.round(redelegationScore),
        efficiency: Math.round(efficiencyScore),
      },
    };
  }
}
