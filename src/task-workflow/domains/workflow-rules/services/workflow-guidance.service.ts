import { Injectable, Logger } from '@nestjs/common';
import {
  ProjectBehavioralProfile,
  ProjectContext,
  WorkflowRole,
} from 'generated/prisma';
import { PrismaService } from '../../../../prisma/prisma.service';
import {
  ConfigurableService,
  BaseServiceConfig,
} from '../utils/configurable-service.base';

// Simplified configuration for role-focused guidance only
export interface GuidanceConfig extends BaseServiceConfig {
  defaults: {
    patternConfidence: number;
    patternUsage: string;
  };
  patternDetection: {
    requiredPatternKeywords: string[];
    antiPatternKeywords: string[];
  };
  performance: {
    maxPatternsReturned: number;
    queryTimeoutMs: number;
  };
}

// Type-safe interfaces for JSON fields
export interface RoleCapabilities {
  qualityReminders?: string[];
  [key: string]: any;
}

export interface QualityStandards {
  reminders?: string[];
  [key: string]: any;
}

export interface PatternImplementation {
  antiPatterns?: string[];
  complianceChecks?: any[];
  [key: string]: any;
}

// FOCUSED: Role/Persona context only - NO step details
export interface WorkflowGuidance {
  currentRole: WorkflowRole;
  projectContext: {
    projectType?: string;
    behavioralProfile?: any;
    detectedPatterns?: any[];
    qualityStandards?: any;
  };
}

export interface RoleContext {
  taskId: number;
  projectPath?: string;
}

@Injectable()
export class WorkflowGuidanceService extends ConfigurableService<GuidanceConfig> {
  private readonly logger = new Logger(WorkflowGuidanceService.name);

  // Default configuration implementation (required by ConfigurableService)
  protected readonly defaultConfig: GuidanceConfig = {
    defaults: {
      patternConfidence: 0.8,
      patternUsage: 'general',
    },
    patternDetection: {
      requiredPatternKeywords: ['required', 'mandatory', 'must', 'essential'],
      antiPatternKeywords: ['avoid', 'anti', 'forbidden', 'prohibited'],
    },
    performance: {
      maxPatternsReturned: 50,
      queryTimeoutMs: 5000,
    },
  };

  constructor(private prisma: PrismaService) {
    super();
    this.initializeConfig();
  }

  // Optional: Override configuration change hook
  protected onConfigUpdate(): void {
    this.logger.log('Guidance configuration updated');
  }

  /**
   * FOCUSED: Get ONLY role/persona context - NO step details
   * Call this ONCE when switching roles to get the persona context
   * REMOVED: All envelope builder services and redundant data
   */
  async getWorkflowGuidance(
    roleName: string,
    context: RoleContext,
  ): Promise<WorkflowGuidance> {
    try {
      // Get role information
      const role = await this.getWorkflowRole(roleName);
      if (!role) {
        throw new Error(`Workflow role '${roleName}' not found`);
      }

      // Get project context if available
      const projectContext = await this.getProjectContext(context.projectPath);

      // Get project-specific behavioral profile
      const behavioralProfile = await this.getProjectBehavioralProfile(
        projectContext?.id,
        roleName,
      );

      // FOCUSED: Build role-only guidance structure (NO step details)
      const roleGuidance: WorkflowGuidance = {
        currentRole: role,
        projectContext: {
          projectType: projectContext?.projectType,
          behavioralProfile: behavioralProfile,
          detectedPatterns: projectContext
            ? await this.getProjectPatterns(projectContext.id)
            : [],
          qualityStandards: behavioralProfile?.qualityStandards,
        },
      };

      return roleGuidance;
    } catch (error) {
      this.logger.error(
        `Error getting workflow guidance for role ${roleName}:`,
        error,
      );
      throw error;
    }
  }

  // Private helper methods focused on role/persona guidance only

  private async getWorkflowRole(
    roleName: string,
  ): Promise<WorkflowRole | null> {
    return await this.prisma.workflowRole.findUnique({
      where: { name: roleName },
      select: {
        id: true,
        name: true,
        description: true,
        priority: true,
        isActive: true,
        capabilities: true,
        coreResponsibilities: true,
        keyCapabilities: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  private getProjectContext(
    projectPath?: string,
  ): Promise<ProjectContext | null> {
    if (!projectPath) return Promise.resolve(null);

    return this.prisma.projectContext.findFirst({
      where: { projectPath },
    });
  }

  private getProjectBehavioralProfile(
    projectContextId?: number,
    roleName?: string,
  ): Promise<ProjectBehavioralProfile | null> {
    if (!projectContextId || !roleName) return Promise.resolve(null);

    return this.prisma.projectBehavioralProfile.findFirst({
      where: {
        projectContextId,
      },
    });
  }

  private async getProjectPatterns(projectContextId: number): Promise<any[]> {
    const patterns = await this.prisma.projectPattern.findMany({
      where: { projectContextId },
      take: this.getConfigValue('performance').maxPatternsReturned,
    });

    return patterns.map((pattern) => ({
      name: pattern.patternName,
      type: pattern.patternType,
      description: pattern.description,
      usage: this.getConfigValue('defaults').patternUsage,
      confidence: this.getConfigValue('defaults').patternConfidence,
    }));
  }
}
