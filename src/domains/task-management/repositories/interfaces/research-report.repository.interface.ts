import { Prisma, ResearchReport } from '../../../../../generated/prisma';
import {
  PrismaTransaction,
  ResearchReportOrderByInput,
  ResearchReportSummary,
  ResearchReportWhereInput,
  ResearchReportWithRelations,
  UpdateResearchReportData,
} from '../types/research-report.types';

export interface IResearchReportRepository {
  // Basic CRUD Operations
  findById(
    id: number,
    include?: ResearchReportIncludeOptions,
  ): Promise<ResearchReportWithRelations | null>;
  findByTitle(
    title: string,
    taskId: number,
  ): Promise<ResearchReportWithRelations | null>;
  create(
    data: Prisma.ResearchReportCreateInput,
  ): Promise<ResearchReportWithRelations>;
  update(
    id: number,
    data: UpdateResearchReportData,
  ): Promise<ResearchReportWithRelations>;
  delete(id: number): Promise<ResearchReport>;

  // Query Operations
  findMany(
    options?: ResearchReportFindManyOptions,
  ): Promise<ResearchReportWithRelations[]>;
  findByTaskId(
    taskId: number,
    include?: ResearchReportIncludeOptions,
  ): Promise<ResearchReportWithRelations[]>;
  findByDateRange(
    startDate: Date,
    endDate: Date,
    taskId?: number,
  ): Promise<ResearchReportWithRelations[]>;
  findLatestByTaskId(
    taskId: number,
  ): Promise<ResearchReportWithRelations | null>;

  // Research Management
  findResearchSummary(taskId: number): Promise<ResearchReportSummary>;
  searchByKeywords(
    keywords: string[],
    taskId?: number,
  ): Promise<ResearchReportWithRelations[]>;

  // Utility Operations
  count(where?: ResearchReportWhereInput): Promise<number>;
  getResearchProgress(taskId: number): Promise<ResearchProgressInfo>;

  // Transaction Support
  createWithTransaction(
    data: Prisma.ResearchReportCreateInput,
    tx?: PrismaTransaction,
  ): Promise<ResearchReportWithRelations>;
  updateWithTransaction(
    id: number,
    data: UpdateResearchReportData,
    tx?: PrismaTransaction,
  ): Promise<ResearchReportWithRelations>;
}

export interface ResearchReportIncludeOptions {
  task?: boolean;
}

export interface ResearchReportFindManyOptions {
  where?: ResearchReportWhereInput;
  include?: ResearchReportIncludeOptions;
  orderBy?: ResearchReportOrderByInput;
  skip?: number;
  take?: number;
}

export interface ResearchProgressInfo {
  totalReports: number;
  latestReportDate: Date | null;
  keyFindings: string[];
  totalReferences: number;
}
