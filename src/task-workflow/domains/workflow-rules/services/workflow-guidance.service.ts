import { Injectable, Logger } from '@nestjs/common';
import {
  ProjectBehavioralProfile,
  ProjectContext,
  WorkflowRole,
} from 'generated/prisma';
import { PrismaService } from '../../../../prisma/prisma.service';

// Simplified configuration for role-focused guidance only
export interface GuidanceConfig {
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
  currentRole: {
    name: string;
    displayName: string;
    description: string;
    capabilities: any;
  };
  projectContext: {
    projectType?: string;
    behavioralProfile?: any;
    detectedPatterns?: any[];
    qualityStandards?: any;
  };
  qualityReminders: string[];
  ruleEnforcement: {
    requiredPatterns: string[];
    antiPatterns: string[];
    complianceChecks: any[];
  };
}

export interface RoleContext {
  taskId: number;
  projectPath?: string;
}

@Injectable()
export class WorkflowGuidanceService {
  private readonly logger = new Logger(WorkflowGuidanceService.name);

  // Simplified configuration - removed step-related configs
  private readonly config: GuidanceConfig = {
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

  constructor(private prisma: PrismaService) {}

  /**
   * Update guidance configuration
   */
  updateConfig(config: Partial<GuidanceConfig>): void {
    if (config.defaults) {
      Object.assign(this.config.defaults, config.defaults);
    }
    if (config.patternDetection) {
      Object.assign(this.config.patternDetection, config.patternDetection);
    }
    if (config.performance) {
      Object.assign(this.config.performance, config.performance);
    }
    this.logger.log('Guidance configuration updated');
  }

  /**
   * Get current configuration
   */
  getConfig(): GuidanceConfig {
    return {
      defaults: { ...this.config.defaults },
      patternDetection: { ...this.config.patternDetection },
      performance: { ...this.config.performance },
    };
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
        currentRole: {
          name: role.name,
          displayName: role.displayName,
          description: role.description,
          capabilities: role.capabilities,
        },
        projectContext: {
          projectType: projectContext?.projectType,
          behavioralProfile: behavioralProfile,
          detectedPatterns: projectContext
            ? await this.getProjectPatterns(projectContext.id)
            : [],
          qualityStandards: behavioralProfile?.qualityStandards,
        },
        qualityReminders: await this.getQualityReminders(
          role.id,
          projectContext?.id,
        ),
        ruleEnforcement: await this.getRuleEnforcement(
          role.id,
          projectContext?.id,
        ),
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

  private async getQualityReminders(
    roleId: string,
    projectContextId?: number,
  ): Promise<string[]> {
    const reminders: string[] = [];

    // Add role-specific quality reminders
    const role = await this.prisma.workflowRole.findUnique({
      where: { id: roleId },
    });

    // Type-safe access to JSON field
    const capabilities = role?.capabilities as RoleCapabilities;
    if (
      capabilities?.qualityReminders &&
      Array.isArray(capabilities.qualityReminders)
    ) {
      reminders.push(...capabilities.qualityReminders);
    }

    // Add project-specific quality reminders
    if (projectContextId) {
      const projectProfile =
        await this.prisma.projectBehavioralProfile.findFirst({
          where: { projectContextId },
        });

      // Type-safe access to JSON field
      const qualityStandards =
        projectProfile?.qualityStandards as QualityStandards;
      if (
        qualityStandards?.reminders &&
        Array.isArray(qualityStandards.reminders)
      ) {
        reminders.push(...qualityStandards.reminders);
      }
    }

    return reminders;
  }

  private async getRuleEnforcement(
    _roleId: string,
    projectContextId?: number,
  ): Promise<{
    requiredPatterns: string[];
    antiPatterns: string[];
    complianceChecks: any[];
  }> {
    const enforcement: {
      requiredPatterns: string[];
      antiPatterns: string[];
      complianceChecks: any[];
    } = {
      requiredPatterns: [],
      antiPatterns: [],
      complianceChecks: [],
    };

    // Get patterns from project context
    if (projectContextId) {
      const patterns = await this.prisma.projectPattern.findMany({
        where: { projectContextId },
      });

      // Use configurable keywords for pattern detection
      enforcement.requiredPatterns = patterns
        .filter((p) =>
          this.config.patternDetection.requiredPatternKeywords.some((keyword) =>
            p.description.toLowerCase().includes(keyword.toLowerCase()),
          ),
        )
        .map((p) => p.patternName);

      // Use implementation field for anti-patterns with type safety
      enforcement.antiPatterns = patterns.flatMap((p) => {
        const impl = p.implementation as PatternImplementation;
        return Array.isArray(impl?.antiPatterns) ? impl.antiPatterns : [];
      });

      // Use implementation field for compliance checks with type safety
      enforcement.complianceChecks = patterns
        .map((p) => {
          const impl = p.implementation as PatternImplementation;
          return impl?.complianceChecks;
        })
        .filter((checks): checks is any[] => Array.isArray(checks));
    }

    return enforcement;
  }

  private async getProjectPatterns(projectContextId: number): Promise<any[]> {
    const patterns = await this.prisma.projectPattern.findMany({
      where: { projectContextId },
      take: this.config.performance.maxPatternsReturned,
    });

    return patterns.map((pattern) => ({
      name: pattern.patternName,
      type: pattern.patternType,
      description: pattern.description,
      usage: this.config.defaults.patternUsage,
      confidence: this.config.defaults.patternConfidence,
    }));
  }
}
