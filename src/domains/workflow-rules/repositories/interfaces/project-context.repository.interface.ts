import {
  CreateProjectContextDTO,
  UpdateProjectContextDTO,
  CreateProjectBehavioralProfileDTO,
  UpdateProjectBehavioralProfileDTO,
  CreateProjectPatternDTO,
  UpdateProjectPatternDTO,
  ProjectContextEntity,
  ProjectBehavioralProfileEntity,
  ProjectPatternEntity,
  ProjectContextFilters,
  ProjectBehavioralProfileFilters,
  ProjectPatternFilters,
  ProjectContextWithRelations,
  ProjectPatternSummary,
  ProjectContextResult,
  ProjectBehavioralProfileResult,
  ProjectPatternResult,
  ProjectPatternsListResult,
  ProjectContextListResult,
  PrismaTransaction,
} from '../types/project-context.types';

/**
 * Repository interface for Project Context domain operations
 * Handles project context, behavioral profiles, and pattern management
 * Used by workflow-guidance.service.ts for role-specific context retrieval
 */
export interface IProjectContextRepository {
  /**
   * PROJECT CONTEXT OPERATIONS
   */

  /**
   * Find project context by project path
   * @param projectPath - The file system path of the project
   * @param tx - Optional transaction client
   * @returns Promise<ProjectContextEntity | null>
   */
  findProjectByPath(
    projectPath: string,
    tx?: PrismaTransaction,
  ): Promise<ProjectContextEntity | null>;

  /**
   * Find project context by ID with optional relations
   * @param id - Project context ID
   * @param includeRelations - Whether to include behavioral profiles and patterns
   * @param tx - Optional transaction client
   * @returns Promise<ProjectContextWithRelations | null>
   */
  findProjectById(
    id: number,
    includeRelations?: boolean,
    tx?: PrismaTransaction,
  ): Promise<ProjectContextWithRelations | null>;

  /**
   * Create new project context
   * @param data - Project context creation data
   * @param tx - Optional transaction client
   * @returns Promise<ProjectContextResult>
   */
  createProjectContext(
    data: CreateProjectContextDTO,
    tx?: PrismaTransaction,
  ): Promise<ProjectContextResult>;

  /**
   * Update existing project context
   * @param id - Project context ID
   * @param data - Project context update data
   * @param tx - Optional transaction client
   * @returns Promise<ProjectContextResult>
   */
  updateProjectContext(
    id: number,
    data: UpdateProjectContextDTO,
    tx?: PrismaTransaction,
  ): Promise<ProjectContextResult>;

  /**
   * Find project contexts with filters
   * @param filters - Search filters
   * @param tx - Optional transaction client
   * @returns Promise<ProjectContextListResult>
   */
  findProjectContexts(
    filters: ProjectContextFilters,
    tx?: PrismaTransaction,
  ): Promise<ProjectContextListResult>;

  /**
   * PROJECT BEHAVIORAL PROFILE OPERATIONS
   */

  /**
   * Find behavioral profile for project and role
   * @param projectContextId - Project context ID
   * @param roleId - Role ID filter (optional)
   * @param tx - Optional transaction client
   * @returns Promise<ProjectBehavioralProfileEntity | null>
   */
  findBehavioralProfile(
    projectContextId: number,
    roleId?: string,
    tx?: PrismaTransaction,
  ): Promise<ProjectBehavioralProfileEntity | null>;

  /**
   * Create new behavioral profile
   * @param data - Behavioral profile creation data
   * @param tx - Optional transaction client
   * @returns Promise<ProjectBehavioralProfileResult>
   */
  createBehavioralProfile(
    data: CreateProjectBehavioralProfileDTO,
    tx?: PrismaTransaction,
  ): Promise<ProjectBehavioralProfileResult>;

  /**
   * Update existing behavioral profile
   * @param id - Behavioral profile ID
   * @param data - Behavioral profile update data
   * @param tx - Optional transaction client
   * @returns Promise<ProjectBehavioralProfileResult>
   */
  updateBehavioralProfile(
    id: number,
    data: UpdateProjectBehavioralProfileDTO,
    tx?: PrismaTransaction,
  ): Promise<ProjectBehavioralProfileResult>;

  /**
   * Find behavioral profiles with filters
   * @param filters - Search filters
   * @param tx - Optional transaction client
   * @returns Promise<ProjectBehavioralProfileEntity[]>
   */
  findBehavioralProfiles(
    filters: ProjectBehavioralProfileFilters,
    tx?: PrismaTransaction,
  ): Promise<ProjectBehavioralProfileEntity[]>;

  /**
   * PROJECT PATTERN OPERATIONS
   */

  /**
   * Find project patterns with optional filtering and transformation
   * @param projectContextId - Project context ID
   * @param filters - Pattern filters including maxPatternsReturned
   * @param tx - Optional transaction client
   * @returns Promise<ProjectPatternSummary[]>
   */
  findProjectPatterns(
    projectContextId: number,
    filters?: ProjectPatternFilters,
    tx?: PrismaTransaction,
  ): Promise<ProjectPatternSummary[]>;

  /**
   * Find single project pattern by ID
   * @param id - Pattern ID
   * @param tx - Optional transaction client
   * @returns Promise<ProjectPatternEntity | null>
   */
  findProjectPatternById(
    id: number,
    tx?: PrismaTransaction,
  ): Promise<ProjectPatternEntity | null>;

  /**
   * Create new project pattern
   * @param data - Pattern creation data
   * @param tx - Optional transaction client
   * @returns Promise<ProjectPatternResult>
   */
  createProjectPattern(
    data: CreateProjectPatternDTO,
    tx?: PrismaTransaction,
  ): Promise<ProjectPatternResult>;

  /**
   * Update existing project pattern
   * @param id - Pattern ID
   * @param data - Pattern update data
   * @param tx - Optional transaction client
   * @returns Promise<ProjectPatternResult>
   */
  updateProjectPattern(
    id: number,
    data: UpdateProjectPatternDTO,
    tx?: PrismaTransaction,
  ): Promise<ProjectPatternResult>;

  /**
   * Find project patterns by name and type
   * @param projectContextId - Project context ID
   * @param patternName - Pattern name
   * @param patternType - Pattern type
   * @param tx - Optional transaction client
   * @returns Promise<ProjectPatternEntity | null>
   */
  findProjectPatternByNameAndType(
    projectContextId: number,
    patternName: string,
    patternType: string,
    tx?: PrismaTransaction,
  ): Promise<ProjectPatternEntity | null>;

  /**
   * UTILITY OPERATIONS
   */

  /**
   * Get role-specific project context including behavioral profile and patterns
   * @param projectPath - Project file system path
   * @param roleId - Role ID for behavioral profile lookup
   * @param maxPatterns - Maximum number of patterns to return
   * @param tx - Optional transaction client
   * @returns Promise<any> - Complex result with project context, behavioral profile, and patterns
   */
  getRoleProjectContext(
    projectPath: string,
    roleId: string,
    maxPatterns?: number,
    tx?: PrismaTransaction,
  ): Promise<{
    projectContext: ProjectContextEntity | null;
    behavioralProfile: ProjectBehavioralProfileEntity | null;
    patterns: ProjectPatternSummary[];
  }>;

  /**
   * Delete project context and all related data
   * @param id - Project context ID
   * @param tx - Optional transaction client
   * @returns Promise<boolean>
   */
  deleteProjectContext(id: number, tx?: PrismaTransaction): Promise<boolean>;

  /**
   * Delete behavioral profile
   * @param id - Behavioral profile ID
   * @param tx - Optional transaction client
   * @returns Promise<boolean>
   */
  deleteBehavioralProfile(id: number, tx?: PrismaTransaction): Promise<boolean>;

  /**
   * Delete project pattern
   * @param id - Pattern ID
   * @param tx - Optional transaction client
   * @returns Promise<boolean>
   */
  deleteProjectPattern(id: number, tx?: PrismaTransaction): Promise<boolean>;
}
