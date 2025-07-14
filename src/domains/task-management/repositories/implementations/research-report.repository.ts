import { Injectable } from '@nestjs/common';
import { Prisma, ResearchReport } from '../../../../../generated/prisma';
import { PrismaService } from '../../../../prisma/prisma.service';
import {
  IResearchReportRepository,
  ResearchProgressInfo,
  ResearchReportFindManyOptions,
  ResearchReportIncludeOptions,
} from '../interfaces/research-report.repository.interface';
import {
  PrismaTransaction,
  ResearchReportSummary,
  ResearchReportWithRelations,
  UpdateResearchReportData,
} from '../types/research-report.types';

@Injectable()
export class ResearchReportRepository implements IResearchReportRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(
    id: number,
    include?: ResearchReportIncludeOptions,
  ): Promise<ResearchReportWithRelations | null> {
    return this.prisma.researchReport.findUnique({
      where: { id },
      include: this.buildInclude(include),
    });
  }

  async findByTitle(
    title: string,
    taskId: number,
  ): Promise<ResearchReportWithRelations | null> {
    return this.prisma.researchReport.findFirst({
      where: { title, taskId },
      include: { task: true },
    });
  }

  async create(
    data: Prisma.ResearchReportCreateInput,
  ): Promise<ResearchReportWithRelations> {
    return this.prisma.researchReport.create({
      data,
      include: { task: true },
    });
  }

  async update(
    id: number,
    data: UpdateResearchReportData,
  ): Promise<ResearchReportWithRelations> {
    return this.prisma.researchReport.update({
      where: { id },
      data,
      include: { task: true },
    });
  }

  async delete(id: number): Promise<ResearchReport> {
    return this.prisma.researchReport.delete({
      where: { id },
    });
  }

  async findMany(
    options?: ResearchReportFindManyOptions,
  ): Promise<ResearchReportWithRelations[]> {
    return this.prisma.researchReport.findMany({
      where: options?.where,
      include: this.buildInclude(options?.include),
      orderBy: options?.orderBy || { createdAt: 'desc' },
      skip: options?.skip,
      take: options?.take,
    });
  }

  async findByTaskId(
    taskId: number,
    include?: ResearchReportIncludeOptions,
  ): Promise<ResearchReportWithRelations[]> {
    return this.prisma.researchReport.findMany({
      where: { taskId },
      include: this.buildInclude(include),
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
    taskId?: number,
  ): Promise<ResearchReportWithRelations[]> {
    return this.prisma.researchReport.findMany({
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
  ): Promise<ResearchReportWithRelations | null> {
    return this.prisma.researchReport.findFirst({
      where: { taskId },
      include: { task: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findResearchSummary(taskId: number): Promise<ResearchReportSummary> {
    const reports = await this.findByTaskId(taskId);
    const totalReports = reports.length;

    // Extract key findings from all reports
    const keyFindings = reports
      .map((report) => report.findings)
      .filter((findings) => findings && findings.trim().length > 0)
      .slice(0, 10); // Limit to top 10 findings

    // Extract main recommendations
    const mainRecommendations = reports
      .map((report) => report.recommendations)
      .filter((rec) => rec && rec.trim().length > 0)
      .slice(0, 10); // Limit to top 10 recommendations

    // Count total references
    const referenceCount = reports.reduce((count, report) => {
      return (
        count +
        (Array.isArray(report.references) ? report.references.length : 0)
      );
    }, 0);

    // Get latest update date
    const latestUpdate = reports.length > 0 ? reports[0].updatedAt : null;

    return {
      totalReports,
      keyFindings,
      mainRecommendations,
      referenceCount,
      latestUpdate,
    };
  }

  async searchByKeywords(
    keywords: string[],
    taskId?: number,
  ): Promise<ResearchReportWithRelations[]> {
    const searchConditions = keywords.map((keyword) => ({
      OR: [
        { title: { contains: keyword, mode: 'insensitive' as const } },
        { summary: { contains: keyword, mode: 'insensitive' as const } },
        { findings: { contains: keyword, mode: 'insensitive' as const } },
        {
          recommendations: { contains: keyword, mode: 'insensitive' as const },
        },
      ],
    }));

    return this.prisma.researchReport.findMany({
      where: {
        AND: [
          ...(taskId ? [{ taskId }] : []),
          {
            OR: searchConditions,
          },
        ],
      },
      include: { task: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async count(where?: Prisma.ResearchReportWhereInput): Promise<number> {
    return this.prisma.researchReport.count({ where });
  }

  async getResearchProgress(taskId: number): Promise<ResearchProgressInfo> {
    const reports = await this.findByTaskId(taskId);
    const totalReports = reports.length;

    const latestReportDate = reports.length > 0 ? reports[0].createdAt : null;

    // Extract key findings (first sentence of each finding)
    const keyFindings = reports
      .map((report) => {
        const findings = report.findings;
        if (!findings) return null;
        const firstSentence = findings.split('.')[0];
        return firstSentence ? firstSentence.trim() + '.' : null;
      })
      .filter((finding) => finding !== null)
      .slice(0, 5); // Top 5 key findings

    // Count total references
    const totalReferences = reports.reduce((count, report) => {
      return (
        count +
        (Array.isArray(report.references) ? report.references.length : 0)
      );
    }, 0);

    return {
      totalReports,
      latestReportDate,
      keyFindings,
      totalReferences,
    };
  }

  async createWithTransaction(
    data: Prisma.ResearchReportCreateInput,
    tx?: PrismaTransaction,
  ): Promise<ResearchReportWithRelations> {
    const prismaClient = tx || this.prisma;

    return prismaClient.researchReport.create({
      data,
      include: { task: true },
    });
  }

  async updateWithTransaction(
    id: number,
    data: UpdateResearchReportData,
    tx?: PrismaTransaction,
  ): Promise<ResearchReportWithRelations> {
    const prismaClient = tx || this.prisma;

    return prismaClient.researchReport.update({
      where: { id },
      data,
      include: { task: true },
    });
  }

  private buildInclude(
    include?: ResearchReportIncludeOptions,
  ): Prisma.ResearchReportInclude | undefined {
    if (!include) return undefined;

    return {
      task: include.task,
    };
  }
}
