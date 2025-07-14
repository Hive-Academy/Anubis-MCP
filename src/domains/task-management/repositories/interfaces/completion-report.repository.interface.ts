import { CompletionReport, Prisma } from '../../../../../generated/prisma';
import {
  CompletionReportOrderByInput,
  CompletionReportSummary,
  CompletionReportWhereInput,
  CompletionReportWithRelations,
  PrismaTransaction,
  UpdateCompletionReportData,
} from '../types/completion-report.types';

export interface ICompletionReportRepository {
  // Basic CRUD Operations
  findById(
    id: number,
    include?: CompletionReportIncludeOptions,
  ): Promise<CompletionReportWithRelations | null>;
  findByTaskId(
    taskId: number,
    include?: CompletionReportIncludeOptions,
  ): Promise<CompletionReportWithRelations | null>;
  create(
    data: Prisma.CompletionReportCreateInput,
  ): Promise<CompletionReportWithRelations>;
  update(
    id: number,
    data: UpdateCompletionReportData,
  ): Promise<CompletionReportWithRelations>;
  delete(id: number): Promise<CompletionReport>;

  // Query Operations
  findMany(
    options?: CompletionReportFindManyOptions,
  ): Promise<CompletionReportWithRelations[]>;
  findByDateRange(
    startDate: Date,
    endDate: Date,
    taskId?: number,
  ): Promise<CompletionReportWithRelations[]>;
  findLatestByTaskId(
    taskId: number,
  ): Promise<CompletionReportWithRelations | null>;
  findRecentCompletions(
    limit?: number,
  ): Promise<CompletionReportWithRelations[]>;

  // Completion Management
  findCompletionSummary(taskId: number): Promise<CompletionReportSummary>;
  findCompletionsByProject(
    projectId?: string,
  ): Promise<CompletionReportWithRelations[]>;
  findCompletionsWithFiles(
    taskId?: number,
  ): Promise<CompletionReportWithRelations[]>;
  findCompletionMetrics(taskId?: number): Promise<CompletionMetrics>;

  // Validation and Quality
  findCompletionsWithValidation(
    taskId?: number,
  ): Promise<CompletionReportWithRelations[]>;
  getCompletionStatistics(taskId?: number): Promise<CompletionStatistics>;
  findIncompleteReports(
    limit?: number,
  ): Promise<CompletionReportWithRelations[]>;

  // Utility Operations
  count(where?: CompletionReportWhereInput): Promise<number>;
  hasCompletionReport(taskId: number): Promise<boolean>;
  getAverageCompletionTime(taskId?: number): Promise<number | null>;

  // Transaction Support
  createWithTransaction(
    data: Prisma.CompletionReportCreateInput,
    tx?: PrismaTransaction,
  ): Promise<CompletionReportWithRelations>;
  updateWithTransaction(
    id: number,
    data: UpdateCompletionReportData,
    tx?: PrismaTransaction,
  ): Promise<CompletionReportWithRelations>;
}

export interface CompletionReportIncludeOptions {
  task?: boolean;
}

export interface CompletionReportFindManyOptions {
  where?: CompletionReportWhereInput;
  include?: CompletionReportIncludeOptions;
  orderBy?: CompletionReportOrderByInput;
  skip?: number;
  take?: number;
}

export interface CompletionMetrics {
  totalCompletions: number;
  averageCompletionTime: number | null;
  filesModifiedCount: number;
  validationSuccessRate: number;
  qualityScore: number | null;
}

export interface CompletionStatistics {
  totalReports: number;
  reportsWithValidation: number;
  reportsWithFiles: number;
  averageFilesModified: number;
  completionTrends: CompletionTrend[];
}

export interface CompletionTrend {
  date: Date;
  completionCount: number;
  averageQuality: number | null;
}
