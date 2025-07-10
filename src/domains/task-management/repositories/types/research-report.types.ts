import { Prisma, ResearchReport, Task } from '../../../../../generated/prisma';
import { PrismaTransaction } from './task.types';

// Input types
export type ResearchReportWhereInput = Prisma.ResearchReportWhereInput;
export type ResearchReportOrderByInput =
  Prisma.ResearchReportOrderByWithRelationInput;

// ResearchReport with relations
export type ResearchReportWithRelations = ResearchReport & {
  task?: Task;
};

// Create and Update data types
export interface CreateResearchReportData {
  taskId: number;
  title: string;
  summary: string;
  findings: string;
  recommendations: string;
  references?: string[];
}

export interface UpdateResearchReportData {
  title?: string;
  summary?: string;
  findings?: string;
  recommendations?: string;
  references?: string[];
}

// Research summary and analysis types
export interface ResearchReportSummary {
  totalReports: number;
  keyFindings: string[];
  mainRecommendations: string[];
  referenceCount: number;
  latestUpdate: Date | null;
}

// Re-export PrismaTransaction for convenience
export { PrismaTransaction };
