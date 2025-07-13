import {
  ProjectContext,
  ProjectBehavioralProfile,
  ProjectPattern,
  ProjectType,
  PatternType,
  Prisma,
} from '../../../../../generated/prisma';

/**
 * Core entity types for Project Context domain
 */
export type ProjectContextEntity = ProjectContext;
export type ProjectBehavioralProfileEntity = ProjectBehavioralProfile;
export type ProjectPatternEntity = ProjectPattern;

/**
 * Data Transfer Objects for Project Context operations
 */
export interface CreateProjectContextDTO {
  projectPath: string;
  projectName: string;
  projectType: ProjectType;
  complexity?: string;
  teamSize?: string;
  developmentStage?: string;
  primaryLanguage?: string;
  frameworkStack?: any;
  architecturalStyle?: string;
}

export interface UpdateProjectContextDTO {
  projectPath?: string;
  projectName?: string;
  projectType?: ProjectType;
  complexity?: string;
  teamSize?: string;
  developmentStage?: string;
  primaryLanguage?: string;
  frameworkStack?: any;
  architecturalStyle?: string;
}

export interface CreateProjectBehavioralProfileDTO {
  projectContextId: number;
  roleId: string;
  approachMethodology?: any;
  qualityStandards?: any;
  toolingPreferences?: any;
  communicationStyle?: any;
  workflowAdaptations?: any;
  priorityMatrix?: any;
  riskConsiderations?: any;
  deliveryExpectations?: any;
  qualityGates?: any;
}

export interface UpdateProjectBehavioralProfileDTO {
  approachMethodology?: any;
  qualityStandards?: any;
  toolingPreferences?: any;
  communicationStyle?: any;
  workflowAdaptations?: any;
  priorityMatrix?: any;
  riskConsiderations?: any;
  deliveryExpectations?: any;
  qualityGates?: any;
}

export interface CreateProjectPatternDTO {
  projectContextId: number;
  patternName: string;
  patternType: PatternType;
  description: string;
  implementation?: any;
  examples?: any;
  enforcementLevel?: string;
  validationRules?: any;
  antiPatterns?: any;
  applicableRoles?: any;
  applicableScenarios?: any;
}

export interface UpdateProjectPatternDTO {
  patternName?: string;
  patternType?: PatternType;
  description?: string;
  implementation?: any;
  examples?: any;
  enforcementLevel?: string;
  validationRules?: any;
  antiPatterns?: any;
  applicableRoles?: any;
  applicableScenarios?: any;
}

/**
 * Query options and filters
 */
export interface ProjectContextFilters {
  projectPath?: string;
  projectType?: string;
  projectName?: string;
}

export interface ProjectBehavioralProfileFilters {
  projectContextId?: number;
  roleId?: string;
}

export interface ProjectPatternFilters {
  projectContextId?: number;
  patternName?: string;
  patternType?: PatternType;
  maxPatternsReturned?: number;
}

/**
 * Enhanced query results for complex operations
 */
export interface ProjectContextWithRelations extends ProjectContext {
  behavioralProfiles?: ProjectBehavioralProfile[];
  patterns?: ProjectPattern[];
}

export interface ProjectPatternSummary {
  name: string;
  type: string;
  description: string;
  usage: string;
  confidence: number;
}

/**
 * Repository operation results
 */
export interface ProjectContextResult {
  success: boolean;
  data?: ProjectContextEntity;
  error?: string;
}

export interface ProjectBehavioralProfileResult {
  success: boolean;
  data?: ProjectBehavioralProfileEntity;
  error?: string;
}

export interface ProjectPatternResult {
  success: boolean;
  data?: ProjectPatternEntity;
  error?: string;
}

export interface ProjectPatternsListResult {
  success: boolean;
  data?: ProjectPatternSummary[];
  error?: string;
}

export interface ProjectContextListResult {
  success: boolean;
  data?: ProjectContextEntity[];
  error?: string;
}

/**
 * Prisma transaction type for repository operations
 */
export type PrismaTransactionClient = Prisma.TransactionClient;
export type PrismaTransaction = Prisma.TransactionClient;
