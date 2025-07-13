import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { IProjectContextRepository } from '../interfaces/project-context.repository.interface';
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
  ProjectContextListResult,
  PrismaTransaction,
} from '../types/project-context.types';

/**
 * ProjectContextRepository implementation
 * Handles project context, behavioral profiles, and pattern management
 * Used by workflow-guidance.service.ts for role-specific context retrieval
 */
@Injectable()
export class ProjectContextRepository implements IProjectContextRepository {
  private readonly logger = new Logger(ProjectContextRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * PROJECT CONTEXT OPERATIONS
   */

  async findProjectByPath(
    projectPath: string,
    tx?: PrismaTransaction,
  ): Promise<ProjectContextEntity | null> {
    try {
      this.logger.debug(`Finding project by path: ${projectPath}`);
      const client = tx || this.prisma;

      const project = await client.projectContext.findFirst({
        where: { projectPath },
      });

      this.logger.debug(`Found project: ${project ? project.id : 'null'}`);
      return project;
    } catch (error) {
      this.logger.error(
        `Error finding project by path: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to find project by path: ${error.message}`);
    }
  }

  async findProjectById(
    id: number,
    includeRelations: boolean = false,
    tx?: PrismaTransaction,
  ): Promise<ProjectContextWithRelations | null> {
    try {
      this.logger.debug(
        `Finding project by ID: ${id}, includeRelations: ${includeRelations}`,
      );
      const client = tx || this.prisma;

      const project = await client.projectContext.findUnique({
        where: { id },
        include: includeRelations
          ? {
              behavioralProfiles: true,
              patterns: true,
            }
          : undefined,
      });

      this.logger.debug(`Found project: ${project ? project.id : 'null'}`);
      return project;
    } catch (error) {
      this.logger.error(
        `Error finding project by ID: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to find project by ID: ${error.message}`);
    }
  }

  async createProjectContext(
    data: CreateProjectContextDTO,
    tx?: PrismaTransaction,
  ): Promise<ProjectContextResult> {
    try {
      this.logger.debug(`Creating project context: ${data.projectPath}`);
      const client = tx || this.prisma;

      const project = await client.projectContext.create({
        data: {
          projectPath: data.projectPath,
          projectName: data.projectName,
          projectType: data.projectType,
          complexity: data.complexity,
          teamSize: data.teamSize,
          developmentStage: data.developmentStage,
          primaryLanguage: data.primaryLanguage,
          frameworkStack: data.frameworkStack || {},
          architecturalStyle: data.architecturalStyle,
        },
      });

      this.logger.debug(`Created project context: ${project.id}`);
      return { success: true, data: project };
    } catch (error) {
      this.logger.error(
        `Error creating project context: ${error.message}`,
        error.stack,
      );
      return {
        success: false,
        error: `Failed to create project context: ${error.message}`,
      };
    }
  }

  async updateProjectContext(
    id: number,
    data: UpdateProjectContextDTO,
    tx?: PrismaTransaction,
  ): Promise<ProjectContextResult> {
    try {
      this.logger.debug(`Updating project context: ${id}`);
      const client = tx || this.prisma;

      const project = await client.projectContext.update({
        where: { id },
        data: {
          projectPath: data.projectPath,
          projectName: data.projectName,
          projectType: data.projectType,
          complexity: data.complexity,
          teamSize: data.teamSize,
          developmentStage: data.developmentStage,
          primaryLanguage: data.primaryLanguage,
          frameworkStack: data.frameworkStack,
          architecturalStyle: data.architecturalStyle,
        },
      });

      this.logger.debug(`Updated project context: ${project.id}`);
      return { success: true, data: project };
    } catch (error) {
      this.logger.error(
        `Error updating project context: ${error.message}`,
        error.stack,
      );
      return {
        success: false,
        error: `Failed to update project context: ${error.message}`,
      };
    }
  }

  async findProjectContexts(
    filters: ProjectContextFilters,
    tx?: PrismaTransaction,
  ): Promise<ProjectContextListResult> {
    try {
      this.logger.debug(`Finding project contexts with filters:`, filters);
      const client = tx || this.prisma;

      const where: any = {};
      if (filters.projectPath) where.projectPath = filters.projectPath;
      if (filters.projectType) where.projectType = filters.projectType;
      if (filters.projectName)
        where.projectName = { contains: filters.projectName };

      const projects = await client.projectContext.findMany({ where });

      this.logger.debug(`Found ${projects.length} project contexts`);
      return { success: true, data: projects };
    } catch (error) {
      this.logger.error(
        `Error finding project contexts: ${error.message}`,
        error.stack,
      );
      return {
        success: false,
        error: `Failed to find project contexts: ${error.message}`,
      };
    }
  }

  /**
   * PROJECT BEHAVIORAL PROFILE OPERATIONS
   */

  async findBehavioralProfile(
    projectContextId: number,
    roleId?: string,
    tx?: PrismaTransaction,
  ): Promise<ProjectBehavioralProfileEntity | null> {
    try {
      this.logger.debug(
        `Finding behavioral profile for project: ${projectContextId}, role: ${roleId}`,
      );
      const client = tx || this.prisma;

      const where: any = { projectContextId };
      if (roleId) {
        where.roleId = roleId;
      }

      const profile = await client.projectBehavioralProfile.findFirst({
        where,
      });

      this.logger.debug(
        `Found behavioral profile: ${profile ? profile.id : 'null'}`,
      );
      return profile;
    } catch (error) {
      this.logger.error(
        `Error finding behavioral profile: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to find behavioral profile: ${error.message}`);
    }
  }

  async createBehavioralProfile(
    data: CreateProjectBehavioralProfileDTO,
    tx?: PrismaTransaction,
  ): Promise<ProjectBehavioralProfileResult> {
    try {
      this.logger.debug(
        `Creating behavioral profile for project: ${data.projectContextId}`,
      );
      const client = tx || this.prisma;

      const profile = await client.projectBehavioralProfile.create({
        data: {
          projectContextId: data.projectContextId,
          roleId: data.roleId,
          approachMethodology: data.approachMethodology || {},
          qualityStandards: data.qualityStandards || {},
          toolingPreferences: data.toolingPreferences || {},
          communicationStyle: data.communicationStyle || {},
          workflowAdaptations: data.workflowAdaptations || {},
          priorityMatrix: data.priorityMatrix || {},
          riskConsiderations: data.riskConsiderations || {},
          deliveryExpectations: data.deliveryExpectations || {},
          qualityGates: data.qualityGates || {},
        },
      });

      this.logger.debug(`Created behavioral profile: ${profile.id}`);
      return { success: true, data: profile };
    } catch (error) {
      this.logger.error(
        `Error creating behavioral profile: ${error.message}`,
        error.stack,
      );
      return {
        success: false,
        error: `Failed to create behavioral profile: ${error.message}`,
      };
    }
  }

  async updateBehavioralProfile(
    id: number,
    data: UpdateProjectBehavioralProfileDTO,
    tx?: PrismaTransaction,
  ): Promise<ProjectBehavioralProfileResult> {
    try {
      this.logger.debug(`Updating behavioral profile: ${id}`);
      const client = tx || this.prisma;

      const profile = await client.projectBehavioralProfile.update({
        where: { id },
        data: {
          approachMethodology: data.approachMethodology,
          qualityStandards: data.qualityStandards,
          toolingPreferences: data.toolingPreferences,
          communicationStyle: data.communicationStyle,
          workflowAdaptations: data.workflowAdaptations,
          priorityMatrix: data.priorityMatrix,
          riskConsiderations: data.riskConsiderations,
          deliveryExpectations: data.deliveryExpectations,
          qualityGates: data.qualityGates,
        },
      });

      this.logger.debug(`Updated behavioral profile: ${profile.id}`);
      return { success: true, data: profile };
    } catch (error) {
      this.logger.error(
        `Error updating behavioral profile: ${error.message}`,
        error.stack,
      );
      return {
        success: false,
        error: `Failed to update behavioral profile: ${error.message}`,
      };
    }
  }

  async findBehavioralProfiles(
    filters: ProjectBehavioralProfileFilters,
    tx?: PrismaTransaction,
  ): Promise<ProjectBehavioralProfileEntity[]> {
    try {
      this.logger.debug(`Finding behavioral profiles with filters:`, filters);
      const client = tx || this.prisma;

      const where: any = {};
      if (filters.projectContextId)
        where.projectContextId = filters.projectContextId;
      if (filters.roleId) where.roleId = filters.roleId;

      const profiles = await client.projectBehavioralProfile.findMany({
        where,
      });

      this.logger.debug(`Found ${profiles.length} behavioral profiles`);
      return profiles;
    } catch (error) {
      this.logger.error(
        `Error finding behavioral profiles: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to find behavioral profiles: ${error.message}`);
    }
  }

  /**
   * PROJECT PATTERN OPERATIONS
   */

  async findProjectPatterns(
    projectContextId: number,
    filters?: ProjectPatternFilters,
    tx?: PrismaTransaction,
  ): Promise<ProjectPatternSummary[]> {
    try {
      this.logger.debug(
        `Finding project patterns for project: ${projectContextId}`,
      );
      const client = tx || this.prisma;

      const where: any = { projectContextId };
      if (filters?.patternName)
        where.patternName = { contains: filters.patternName };
      if (filters?.patternType) where.patternType = filters.patternType;

      const patterns = await client.projectPattern.findMany({
        where,
        take: filters?.maxPatternsReturned || 50,
      });

      // Transform to summary format as expected by workflow-guidance.service.ts
      const patternSummaries = patterns.map((pattern) => ({
        name: pattern.patternName,
        type: pattern.patternType,
        description: pattern.description,
        usage: 'general', // Default usage value
        confidence: 0.8, // Default confidence value
      }));

      this.logger.debug(
        `Found ${patternSummaries.length} project pattern summaries`,
      );
      return patternSummaries;
    } catch (error) {
      this.logger.error(
        `Error finding project patterns: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to find project patterns: ${error.message}`);
    }
  }

  async findProjectPatternById(
    id: number,
    tx?: PrismaTransaction,
  ): Promise<ProjectPatternEntity | null> {
    try {
      this.logger.debug(`Finding project pattern by ID: ${id}`);
      const client = tx || this.prisma;

      const pattern = await client.projectPattern.findUnique({
        where: { id },
      });

      this.logger.debug(
        `Found project pattern: ${pattern ? pattern.id : 'null'}`,
      );
      return pattern;
    } catch (error) {
      this.logger.error(
        `Error finding project pattern by ID: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to find project pattern by ID: ${error.message}`);
    }
  }

  async createProjectPattern(
    data: CreateProjectPatternDTO,
    tx?: PrismaTransaction,
  ): Promise<ProjectPatternResult> {
    try {
      this.logger.debug(`Creating project pattern: ${data.patternName}`);
      const client = tx || this.prisma;

      const pattern = await client.projectPattern.create({
        data: {
          projectContextId: data.projectContextId,
          patternName: data.patternName,
          patternType: data.patternType,
          description: data.description,
          implementation: data.implementation || {},
          examples: data.examples || {},
          enforcementLevel: data.enforcementLevel || 'recommended',
          validationRules: data.validationRules || {},
          antiPatterns: data.antiPatterns || {},
          applicableRoles: data.applicableRoles || {},
          applicableScenarios: data.applicableScenarios || {},
        },
      });

      this.logger.debug(`Created project pattern: ${pattern.id}`);
      return { success: true, data: pattern };
    } catch (error) {
      this.logger.error(
        `Error creating project pattern: ${error.message}`,
        error.stack,
      );
      return {
        success: false,
        error: `Failed to create project pattern: ${error.message}`,
      };
    }
  }

  async updateProjectPattern(
    id: number,
    data: UpdateProjectPatternDTO,
    tx?: PrismaTransaction,
  ): Promise<ProjectPatternResult> {
    try {
      this.logger.debug(`Updating project pattern: ${id}`);
      const client = tx || this.prisma;

      const pattern = await client.projectPattern.update({
        where: { id },
        data: {
          patternName: data.patternName,
          patternType: data.patternType,
          description: data.description,
          implementation: data.implementation,
          examples: data.examples,
          enforcementLevel: data.enforcementLevel,
          validationRules: data.validationRules,
          antiPatterns: data.antiPatterns,
          applicableRoles: data.applicableRoles,
          applicableScenarios: data.applicableScenarios,
        },
      });

      this.logger.debug(`Updated project pattern: ${pattern.id}`);
      return { success: true, data: pattern };
    } catch (error) {
      this.logger.error(
        `Error updating project pattern: ${error.message}`,
        error.stack,
      );
      return {
        success: false,
        error: `Failed to update project pattern: ${error.message}`,
      };
    }
  }

  async findProjectPatternByNameAndType(
    projectContextId: number,
    patternName: string,
    patternType: string,
    tx?: PrismaTransaction,
  ): Promise<ProjectPatternEntity | null> {
    try {
      this.logger.debug(
        `Finding project pattern by name and type: ${patternName}, ${patternType}`,
      );
      const client = tx || this.prisma;

      const pattern = await client.projectPattern.findFirst({
        where: {
          projectContextId,
          patternName,
          patternType: patternType as any,
        },
      });

      this.logger.debug(
        `Found project pattern: ${pattern ? pattern.id : 'null'}`,
      );
      return pattern;
    } catch (error) {
      this.logger.error(
        `Error finding project pattern by name and type: ${error.message}`,
        error.stack,
      );
      throw new Error(
        `Failed to find project pattern by name and type: ${error.message}`,
      );
    }
  }

  /**
   * UTILITY OPERATIONS
   */

  async getRoleProjectContext(
    projectPath: string,
    roleId: string,
    maxPatterns: number = 50,
    tx?: PrismaTransaction,
  ): Promise<{
    projectContext: ProjectContextEntity | null;
    behavioralProfile: ProjectBehavioralProfileEntity | null;
    patterns: ProjectPatternSummary[];
  }> {
    try {
      this.logger.debug(
        `Getting role project context for path: ${projectPath}, role: ${roleId}`,
      );

      // Find project context
      const projectContext = await this.findProjectByPath(projectPath, tx);

      if (!projectContext) {
        return {
          projectContext: null,
          behavioralProfile: null,
          patterns: [],
        };
      }

      // Find behavioral profile for the role
      const behavioralProfile = await this.findBehavioralProfile(
        projectContext.id,
        roleId,
        tx,
      );

      // Find project patterns
      const patterns = await this.findProjectPatterns(
        projectContext.id,
        { maxPatternsReturned: maxPatterns },
        tx,
      );

      this.logger.debug(`Found complete role project context`);
      return {
        projectContext,
        behavioralProfile,
        patterns,
      };
    } catch (error) {
      this.logger.error(
        `Error getting role project context: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to get role project context: ${error.message}`);
    }
  }

  async deleteProjectContext(
    id: number,
    tx?: PrismaTransaction,
  ): Promise<boolean> {
    try {
      this.logger.debug(`Deleting project context: ${id}`);
      const client = tx || this.prisma;

      await client.projectContext.delete({
        where: { id },
      });

      this.logger.debug(`Deleted project context: ${id}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Error deleting project context: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }

  async deleteBehavioralProfile(
    id: number,
    tx?: PrismaTransaction,
  ): Promise<boolean> {
    try {
      this.logger.debug(`Deleting behavioral profile: ${id}`);
      const client = tx || this.prisma;

      await client.projectBehavioralProfile.delete({
        where: { id },
      });

      this.logger.debug(`Deleted behavioral profile: ${id}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Error deleting behavioral profile: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }

  async deleteProjectPattern(
    id: number,
    tx?: PrismaTransaction,
  ): Promise<boolean> {
    try {
      this.logger.debug(`Deleting project pattern: ${id}`);
      const client = tx || this.prisma;

      await client.projectPattern.delete({
        where: { id },
      });

      this.logger.debug(`Deleted project pattern: ${id}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Error deleting project pattern: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }
}
