import { Inject, Injectable } from '@nestjs/common';
import { WorkflowRole } from 'generated/prisma';
import { IWorkflowRoleRepository } from '../repositories/interfaces/workflow-role.repository.interface';
import { WorkflowRoleIncludeOptions } from '../repositories/types/workflow-role.types';
import {
  BaseServiceConfig,
  ConfigurableService,
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
}

export interface RoleContext {
  taskId: number;
  projectPath?: string;
}

@Injectable()
export class WorkflowGuidanceService extends ConfigurableService<GuidanceConfig> {
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

  constructor(
    @Inject('IWorkflowRoleRepository')
    private workflowRoleRepository: IWorkflowRoleRepository,
  ) {
    super();
    this.initializeConfig();
  }

  /**
   * FOCUSED: Get ONLY role/persona context - NO step details
   * Call this ONCE when switching roles to get the persona context
   * REMOVED: All envelope builder services and redundant data
   */
  async getWorkflowGuidance(
    roleName: string,
    _context: RoleContext,
  ): Promise<WorkflowGuidance> {
    // Get role information WITHOUT relations to keep response minimal
    // Explicitly pass empty include to avoid loading any relations
    const role = await this.getWorkflowRole(roleName, {});
    if (!role) {
      throw new Error(`Workflow role '${roleName}' not found`);
    }

    // FOCUSED: Build role-only guidance structure (NO step details)
    const roleGuidance: WorkflowGuidance = {
      currentRole: role,
    };

    return roleGuidance;
  }

  // Private helper methods focused on role/persona guidance only

  /**
   * Get workflow role with optional relations
   * @param roleName - The name of the role to find
   * @param include - Options to specify which relations to include
   */
  private async getWorkflowRole(
    roleName: string,
    include?: WorkflowRoleIncludeOptions,
  ): Promise<WorkflowRole | null> {
    return await this.workflowRoleRepository.findByName(roleName, include);
  }
}
