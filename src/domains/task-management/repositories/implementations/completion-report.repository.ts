import { Injectable } from '@nestjs/common';
import { CompletionReport, Prisma } from '../../../../../generated/prisma';
import { PrismaService } from '../../../../prisma/prisma.service';
import {
  CompletionMetrics,
  CompletionReportFindManyOptions,
  CompletionReportIncludeOptions,
  CompletionStatistics,
  CompletionTrend,
  ICompletionReportRepository,
} from '../interfaces/completion-report.repository.interface';
import {
  CompletionReportSummary,
  CompletionReportWithRelations,
  CompletionTimelineEntry,
  PrismaTransaction,
  UpdateCompletionReportData,
} from '../types/completion-report.types';

@Injectable()
export class CompletionReportRepository implements ICompletionReportRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(
    id: number,
    include?: CompletionReportIncludeOptions,
  ): Promise<CompletionReportWithRelations | null> {
    return this.prisma.completionReport.findUnique({
      where: { id },
      include: this.buildInclude(include),
    });
  }

  async findByTaskId(
    taskId: number,
    include?: CompletionReportIncludeOptions,
  ): Promise<CompletionReportWithRelations | null> {
    return this.prisma.completionReport.findFirst({
      where: { taskId },
      include: this.buildInclude(include),
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(
    data: Prisma.CompletionReportCreateInput,
  ): Promise<CompletionReportWithRelations> {
    return this.prisma.completionReport.create({
      data,
      include: { task: true },
    });
  }

  async update(
    id: number,
    data: UpdateCompletionReportData,
  ): Promise<CompletionReportWithRelations> {
    return this.prisma.completionReport.update({
      where: { id },
      data,
      include: { task: true },
    });
  }

  async delete(id: number): Promise<CompletionReport> {
    return this.prisma.completionReport.delete({
      where: { id },
    });
  }

  async findMany(
    options?: CompletionReportFindManyOptions,
  ): Promise<CompletionReportWithRelations[]> {
    return this.prisma.completionReport.findMany({
      where: options?.where,
      include: this.buildInclude(options?.include),
      orderBy: options?.orderBy || { createdAt: 'desc' },
      skip: options?.skip,
      take: options?.take,
    });
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
    taskId?: number,
  ): Promise<CompletionReportWithRelations[]> {
    return this.prisma.completionReport.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        ...(taskId && { taskId }),
      },
      include: { task: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findLatestByTaskId(
    taskId: number,
  ): Promise<CompletionReportWithRelations | null> {
    return this.prisma.completionReport.findFirst({
      where: { taskId },
      include: { task: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findRecentCompletions(
    limit?: number,
  ): Promise<CompletionReportWithRelations[]> {
    return this.prisma.completionReport.findMany({
      include: { task: true },
      orderBy: { createdAt: 'desc' },
      ...(limit && { take: limit }),
    });
  }

  async findCompletionSummary(
    taskId: number,
  ): Promise<CompletionReportSummary> {
    const reports = await this.prisma.completionReport.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
    });

    const totalReports = reports.length;
    const latestCompletionDate =
      reports.length > 0 ? reports[0].createdAt : null;

    // Calculate total files modified
    const totalFilesModified = reports.reduce((total, report) => {
      const filesCount = Array.isArray(report.filesModified)
        ? report.filesModified.length
        : 0;
      return total + filesCount;
    }, 0);

    // Extract key deliverables from summaries
    const keyDeliverables = reports
      .map((report) => report.summary)
      .filter((summary) => summary && summary.trim().length > 0)
      .slice(0, 5); // Top 5 deliverables

    // Extract quality highlights from delegation summary
    const qualityHighlights = reports
      .map((report) => report.delegationSummary)
      .filter((summary) => summary && summary.trim().length > 0)
      .slice(0, 5); // Top 5 quality highlights

    // Build completion timeline
    const completionTimeline: CompletionTimelineEntry[] = reports.map(
      (report) => ({
        date: report.createdAt,
        summary: report.summary,
        filesCount: Array.isArray(report.filesModified)
          ? report.filesModified.length
          : 0,
        qualityScore: this.extractQualityScore(report.delegationSummary),
      }),
    );

    return {
      totalReports,
      latestCompletionDate,
      totalFilesModified,
      keyDeliverables,
      qualityHighlights,
      completionTimeline,
    };
  }

  async findCompletionsByProject(
    projectId?: string,
  ): Promise<CompletionReportWithRelations[]> {
    const whereClause = projectId
      ? {
          task: {
            // Assuming task has a projectId field or similar
            name: { contains: projectId },
          },
        }
      : {};

    return this.prisma.completionReport.findMany({
      where: whereClause,
      include: { task: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findCompletionsWithFiles(
    taskId?: number,
  ): Promise<CompletionReportWithRelations[]> {
    return this.prisma.completionReport.findMany({
      where: {
        filesModified: {
          not: Prisma.JsonNull,
        },
        ...(taskId && { taskId }),
      },
      include: { task: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findCompletionMetrics(taskId?: number): Promise<CompletionMetrics> {
    const where = taskId ? { taskId } : {};

    const reports = await this.prisma.completionReport.findMany({
      where,
      select: {
        createdAt: true,
        filesModified: true,
        delegationSummary: true,
        acceptanceCriteriaVerification: true,
      },
    });

    const totalCompletions = reports.length;

    // Calculate files modified count
    const filesModifiedCount = reports.reduce((total, report) => {
      const filesCount = Array.isArray(report.filesModified)
        ? report.filesModified.length
        : 0;
      return total + filesCount;
    }, 0);

    // Calculate validation success rate
    const reportsWithValidation = reports.filter(
      (report) =>
        report.acceptanceCriteriaVerification &&
        Object.keys(report.acceptanceCriteriaVerification).length > 0,
    ).length;
    const validationSuccessRate =
      totalCompletions > 0
        ? (reportsWithValidation / totalCompletions) * 100
        : 0;

    // Calculate average quality score
    const qualityScores = reports
      .map((report) => this.extractQualityScore(report.delegationSummary))
      .filter((score) => score !== null);
    const qualityScore =
      qualityScores.length > 0
        ? qualityScores.reduce((sum, score) => sum + score, 0) /
          qualityScores.length
        : null;

    return {
      totalCompletions,
      averageCompletionTime: null, // Could be enhanced with task duration tracking
      filesModifiedCount,
      validationSuccessRate,
      qualityScore,
    };
  }

  async findCompletionsWithValidation(
    taskId?: number,
  ): Promise<CompletionReportWithRelations[]> {
    return this.prisma.completionReport.findMany({
      where: {
        acceptanceCriteriaVerification: {
          not: Prisma.JsonNull,
        },
        ...(taskId && { taskId }),
      },
      include: { task: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCompletionStatistics(
    taskId?: number,
  ): Promise<CompletionStatistics> {
    const where = taskId ? { taskId } : {};

    const [totalReports, reportsWithValidation, reportsWithFiles] =
      await Promise.all([
        this.prisma.completionReport.count({ where }),
        this.prisma.completionReport.count({
          where: {
            ...where,
            acceptanceCriteriaVerification: { not: Prisma.JsonNull },
          },
        }),
        this.prisma.completionReport.count({
          where: {
            ...where,
            filesModified: { not: Prisma.JsonNull },
          },
        }),
      ]);

    // Calculate average files modified
    const reports = await this.prisma.completionReport.findMany({
      where,
      select: { filesModified: true, createdAt: true, delegationSummary: true },
    });

    const totalFiles = reports.reduce((total, report) => {
      const filesCount = Array.isArray(report.filesModified)
        ? report.filesModified.length
        : 0;
      return total + filesCount;
    }, 0);
    const averageFilesModified =
      totalReports > 0 ? totalFiles / totalReports : 0;

    // Build completion trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentReports = reports.filter(
      (report) => report.createdAt >= thirtyDaysAgo,
    );
    const completionTrends = this.buildCompletionTrends(recentReports);

    return {
      totalReports,
      reportsWithValidation,
      reportsWithFiles,
      averageFilesModified,
      completionTrends,
    };
  }

  async findIncompleteReports(
    limit?: number,
  ): Promise<CompletionReportWithRelations[]> {
    return this.prisma.completionReport.findMany({
      where: {
        OR: [
          { summary: { equals: '' } },
          { summary: '' },
          { acceptanceCriteriaVerification: { equals: Prisma.JsonNull } },
        ],
      },
      include: { task: true },
      orderBy: { createdAt: 'asc' },
      ...(limit && { take: limit }),
    });
  }

  async count(where?: Prisma.CompletionReportWhereInput): Promise<number> {
    return this.prisma.completionReport.count({ where });
  }

  async hasCompletionReport(taskId: number): Promise<boolean> {
    const report = await this.prisma.completionReport.findFirst({
      where: { taskId },
    });

    return !!report;
  }

  async getAverageCompletionTime(taskId?: number): Promise<number | null> {
    // This would require task duration tracking - simplified implementation
    const where = taskId ? { taskId } : {};

    const reports = await this.prisma.completionReport.findMany({
      where,
      include: { task: true },
    });

    if (reports.length === 0) return null;

    // Simplified calculation based on creation to completion time
    const completionTimes = reports
      .filter((report) => report.task)
      .map((report) => {
        const taskCreated = report.task.createdAt;
        const completed = report.createdAt;
        return completed.getTime() - taskCreated.getTime();
      });

    return completionTimes.length > 0
      ? completionTimes.reduce((sum, time) => sum + time, 0) /
          completionTimes.length
      : null;
  }

  async createWithTransaction(
    data: Prisma.CompletionReportCreateInput,
    tx?: PrismaTransaction,
  ): Promise<CompletionReportWithRelations> {
    const prismaClient = tx || this.prisma;

    return prismaClient.completionReport.create({
      data,
      include: { task: true },
    });
  }

  async updateWithTransaction(
    id: number,
    data: UpdateCompletionReportData,
    tx?: PrismaTransaction,
  ): Promise<CompletionReportWithRelations> {
    const prismaClient = tx || this.prisma;

    return prismaClient.completionReport.update({
      where: { id },
      data,
      include: { task: true },
    });
  }

  private buildInclude(
    include?: CompletionReportIncludeOptions,
  ): Prisma.CompletionReportInclude | undefined {
    if (!include) return undefined;

    return {
      task: include.task,
    };
  }

  private extractQualityScore(
    qualityValidation?: string | null,
  ): number | null {
    if (!qualityValidation) return null;

    // Simple quality score extraction - could be enhanced with more sophisticated parsing
    const scoreMatch = qualityValidation.match(/score:\s*(\d+(?:\.\d+)?)/i);
    return scoreMatch ? parseFloat(scoreMatch[1]) : null;
  }

  private buildCompletionTrends(reports: any[]): CompletionTrend[] {
    // Group reports by date and calculate trends
    const trendMap = new Map<
      string,
      { count: number; qualityScores: number[] }
    >();

    reports.forEach((report) => {
      const dateKey = report.createdAt.toISOString().split('T')[0];
      const existing = trendMap.get(dateKey) || { count: 0, qualityScores: [] };

      existing.count++;
      const qualityScore = this.extractQualityScore(report.qualityValidation);
      if (qualityScore !== null) {
        existing.qualityScores.push(qualityScore);
      }

      trendMap.set(dateKey, existing);
    });

    return Array.from(trendMap.entries()).map(([dateStr, data]) => ({
      date: new Date(dateStr),
      completionCount: data.count,
      averageQuality:
        data.qualityScores.length > 0
          ? data.qualityScores.reduce((sum, score) => sum + score, 0) /
            data.qualityScores.length
          : null,
    }));
  }
}
