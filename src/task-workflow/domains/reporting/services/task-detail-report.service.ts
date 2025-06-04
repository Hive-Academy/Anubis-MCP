import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';

export interface TaskDetailData {
  task: DetailedTask;
  metadata: {
    generatedAt: string;
    reportType: 'task-detail';
  };
}

export interface DetailedTask {
  taskId: string;
  name: string;
  taskSlug?: string;
  status: string;
  priority: string;
  owner: string;
  createdAt: string;
  completedAt?: string;
  duration: number;

  // Rich task context
  description?: TaskDescriptionData;
  codebaseAnalysis?: CodebaseAnalysisData;
  implementationPlans: ImplementationPlanData[];
  researchReports: ResearchReportData[];
  codeReviews: CodeReviewData[];
  completionReports: CompletionReportData[];
  comments: CommentData[];

  // Statistics
  totalSubtasks: number;
  completedSubtasks: number;
  progress: number;
  delegationCount: number;
}

export interface TaskDescriptionData {
  description: string;
  businessRequirements: string;
  technicalRequirements: string;
  acceptanceCriteria: string[];
}

export interface CodebaseAnalysisData {
  architectureFindings: any;
  problemsIdentified: any;
  implementationContext: any;
  integrationPoints: any;
  qualityAssessment: any;
  filesCovered: string[];
  technologyStack: any;
  analyzedBy: string;
  analyzedAt: string;
}

export interface ImplementationPlanData {
  id: number;
  overview: string;
  approach: string;
  technicalDecisions: any;
  filesToModify: string[];
  strategicGuidance?: any;
  architecturalRationale?: string;
  createdBy: string;
  createdAt: string;
  subtasks: SubtaskData[];
}

export interface SubtaskData {
  id: number;
  name: string;
  description: string;
  sequenceNumber: number;
  status: string;
  batchId?: string;
  batchTitle?: string;
  estimatedDuration?: string;
  startedAt?: string;
  completedAt?: string;
  strategicGuidance?: any;
  qualityConstraints?: any;
}

export interface ResearchReportData {
  id: number;
  title: string;
  summary: string;
  findings: string;
  recommendations: string;
  references: string[];
  createdAt: string;
}

export interface CodeReviewData {
  id: number;
  status: string;
  summary: string;
  strengths: string;
  issues: string;
  acceptanceCriteriaVerification: any;
  manualTestingResults: string;
  requiredChanges?: string;
  createdAt: string;
}

export interface CompletionReportData {
  id: number;
  summary: string;
  filesModified: string[];
  delegationSummary: string;
  acceptanceCriteriaVerification: any;
  createdAt: string;
}

export interface CommentData {
  id: number;
  mode: string;
  content: string;
  createdAt: string;
}

@Injectable()
export class TaskDetailReportService {
  private readonly logger = new Logger(TaskDetailReportService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate comprehensive task detail report
   */
  async generateTaskDetailReport(taskId: string): Promise<TaskDetailData> {
    try {
      this.logger.log(`Generating task detail report for: ${taskId}`);

      const task = await this.getTaskWithFullContext(taskId);
      if (!task) {
        throw new Error(`Task not found: ${taskId}`);
      }

      const enrichedTask = this.enrichTaskData(task);

      return {
        task: enrichedTask,
        metadata: {
          generatedAt: new Date().toISOString(),
          reportType: 'task-detail',
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to generate task detail report: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Get task with full relational context
   */
  private async getTaskWithFullContext(taskId: string) {
    return await this.prisma.task.findUnique({
      where: { taskId },
      include: {
        taskDescription: true,
        codebaseAnalysis: true,
        implementationPlans: {
          include: {
            subtasks: {
              orderBy: { sequenceNumber: 'asc' },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        researchReports: {
          orderBy: { createdAt: 'desc' },
        },
        codeReviews: {
          orderBy: { createdAt: 'desc' },
        },
        completionReports: {
          orderBy: { createdAt: 'desc' },
        },
        comments: {
          orderBy: { createdAt: 'desc' },
        },
        delegationRecords: true,
      },
    });
  }

  /**
   * Enrich task data with computed fields and formatting
   */
  private enrichTaskData(task: any): DetailedTask {
    const createdAt = new Date(task.creationDate);
    const completedAt = task.completionDate
      ? new Date(task.completionDate)
      : null;
    const duration = completedAt
      ? (completedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
      : (new Date().getTime() - createdAt.getTime()) / (1000 * 60 * 60);

    // Calculate subtask statistics
    const allSubtasks = task.implementationPlans.flatMap(
      (plan: any) => plan.subtasks as SubtaskData[],
    );
    const totalSubtasks = allSubtasks.length;
    const completedSubtasks = allSubtasks.filter(
      (s: SubtaskData) => s.status === 'completed',
    ).length;
    const progress =
      totalSubtasks > 0
        ? Math.round((completedSubtasks / totalSubtasks) * 100)
        : 0;

    return {
      taskId: task.taskId,
      name: task.name,
      taskSlug: task.taskSlug,
      status: task.status,
      priority: task.priority || 'Medium',
      owner: task.owner || 'Unassigned',
      createdAt: task.creationDate.toISOString(),
      completedAt: task.completionDate?.toISOString(),
      duration: Math.round(duration * 10) / 10,

      // Rich context
      description: task.taskDescription
        ? this.formatTaskDescription(task.taskDescription)
        : undefined,
      codebaseAnalysis: task.codebaseAnalysis
        ? this.formatCodebaseAnalysis(task.codebaseAnalysis)
        : undefined,
      implementationPlans: task.implementationPlans.map((plan: any) =>
        this.formatImplementationPlan(plan),
      ),
      researchReports: task.researchReports.map((report: any) =>
        this.formatResearchReport(report),
      ),
      codeReviews: task.codeReviews.map((review: any) =>
        this.formatCodeReview(review),
      ),
      completionReports: task.completionReports.map((report: any) =>
        this.formatCompletionReport(report),
      ),
      comments: task.comments.map((comment: any) =>
        this.formatComment(comment),
      ),

      // Statistics
      totalSubtasks,
      completedSubtasks,
      progress,
      delegationCount: task.delegationRecords?.length || 0,
    };
  }

  private formatTaskDescription(desc: any): TaskDescriptionData {
    return {
      description: desc.description,
      businessRequirements: desc.businessRequirements,
      technicalRequirements: desc.technicalRequirements,
      acceptanceCriteria: Array.isArray(desc.acceptanceCriteria)
        ? desc.acceptanceCriteria
        : [],
    };
  }

  private formatCodebaseAnalysis(analysis: any): CodebaseAnalysisData {
    return {
      architectureFindings: analysis.architectureFindings,
      problemsIdentified: analysis.problemsIdentified,
      implementationContext: analysis.implementationContext,
      integrationPoints: analysis.integrationPoints,
      qualityAssessment: analysis.qualityAssessment,
      filesCovered: Array.isArray(analysis.filesCovered)
        ? analysis.filesCovered
        : [],
      technologyStack: analysis.technologyStack,
      analyzedBy: analysis.analyzedBy,
      analyzedAt: analysis.analyzedAt.toISOString(),
    };
  }

  private formatImplementationPlan(plan: any): ImplementationPlanData {
    return {
      id: plan.id,
      overview: plan.overview,
      approach: plan.approach,
      technicalDecisions: plan.technicalDecisions,
      filesToModify: Array.isArray(plan.filesToModify)
        ? plan.filesToModify
        : [],
      strategicGuidance: plan.strategicGuidance,
      architecturalRationale: plan.architecturalRationale,
      createdBy: plan.createdBy,
      createdAt: plan.createdAt.toISOString(),
      subtasks: plan.subtasks.map((subtask: any) =>
        this.formatSubtask(subtask),
      ),
    };
  }

  private formatSubtask(subtask: any): SubtaskData {
    return {
      id: subtask.id,
      name: subtask.name,
      description: subtask.description,
      sequenceNumber: subtask.sequenceNumber,
      status: subtask.status,
      batchId: subtask.batchId,
      batchTitle: subtask.batchTitle,
      estimatedDuration: subtask.estimatedDuration,
      startedAt: subtask.startedAt?.toISOString(),
      completedAt: subtask.completedAt?.toISOString(),
      strategicGuidance: subtask.strategicGuidance,
      qualityConstraints: subtask.qualityConstraints,
    };
  }

  private formatResearchReport(report: any): ResearchReportData {
    return {
      id: report.id,
      title: report.title,
      summary: report.summary,
      findings: report.findings,
      recommendations: report.recommendations,
      references: Array.isArray(report.references) ? report.references : [],
      createdAt: report.createdAt.toISOString(),
    };
  }

  private formatCodeReview(review: any): CodeReviewData {
    return {
      id: review.id,
      status: review.status,
      summary: review.summary,
      strengths: review.strengths,
      issues: review.issues,
      acceptanceCriteriaVerification: review.acceptanceCriteriaVerification,
      manualTestingResults: review.manualTestingResults,
      requiredChanges: review.requiredChanges,
      createdAt: review.createdAt.toISOString(),
    };
  }

  private formatCompletionReport(report: any): CompletionReportData {
    return {
      id: report.id,
      summary: report.summary,
      filesModified: Array.isArray(report.filesModified)
        ? report.filesModified
        : [],
      delegationSummary: report.delegationSummary,
      acceptanceCriteriaVerification: report.acceptanceCriteriaVerification,
      createdAt: report.createdAt.toISOString(),
    };
  }

  private formatComment(comment: any): CommentData {
    return {
      id: comment.id,
      mode: comment.mode,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
    };
  }
}
