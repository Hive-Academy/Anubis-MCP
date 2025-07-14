import {
  Prisma,
  CompletionReport,
  Task,
} from '../../../../../generated/prisma';
import { PrismaTransaction } from './task.types';

// Input types
export type CompletionReportWhereInput = Prisma.CompletionReportWhereInput;
export type CompletionReportOrderByInput =
  Prisma.CompletionReportOrderByWithRelationInput;

// CompletionReport with relations
export type CompletionReportWithRelations = CompletionReport & {
  task?: Task;
};

// Create and Update data types
export interface CreateCompletionReportData {
  taskId: number;
  summary: string;
  filesModified?: string[];
  acceptanceCriteriaVerification?: Record<string, any>;
  delegationSummary?: string;
  qualityValidation?: string;
}

export interface UpdateCompletionReportData {
  summary?: string;
  filesModified?: string[];
  acceptanceCriteriaVerification?: Record<string, any>;
  delegationSummary?: string;
  qualityValidation?: string;
}

// Completion summary and analysis types
export interface CompletionReportSummary {
  totalReports: number;
  latestCompletionDate: Date | null;
  totalFilesModified: number;
  keyDeliverables: string[];
  qualityHighlights: string[];
  completionTimeline: CompletionTimelineEntry[];
}

export interface CompletionTimelineEntry {
  date: Date;
  summary: string;
  filesCount: number;
  qualityScore: number | null;
}

// Metrics and analytics types
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

// Validation and quality types
export interface CompletionValidationResult {
  isValid: boolean;
  validationScore: number;
  missingElements: string[];
  qualityIssues: string[];
  recommendations: string[];
}

// Re-export PrismaTransaction for convenience
export { PrismaTransaction };
