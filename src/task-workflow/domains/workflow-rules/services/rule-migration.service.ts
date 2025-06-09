/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import * as fs from 'fs/promises';
import * as path from 'path';
import { RuleVersion } from 'generated/prisma';
import {
  getErrorMessage,
  safePropertyAccess,
} from '../utils/type-safety.utils';

export interface MigrationResult {
  success: boolean;
  message: string;
  migratedRules?: number;
  errors?: string[];
  version?: string;
}

export interface RuleVersionConfig {
  version: string;
  description: string;
  changeLog?: any;
  testGroup?: string;
  testPercentage?: number;
}

export interface MarkdownRuleFile {
  filePath: string;
  content: string;
  roleType: string;
  rules: ParsedRule[];
}

export interface ParsedRule {
  name: string;
  displayName: string;
  description: string;
  steps: ParsedStep[];
  roleType: string;
  priority: number;
}

export interface ParsedStep {
  name: string;
  displayName: string;
  description: string;
  stepType: string;
  sequenceNumber: number;
  conditions?: any[];
  actions?: any[];
  behavioralContext?: any;
  qualityChecklist?: any;
}

@Injectable()
export class RuleMigrationService {
  private readonly logger = new Logger(RuleMigrationService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Migrate markdown rules to database format
   */
  async migrateMarkdownRules(
    markdownRulesPath: string,
    versionConfig: RuleVersionConfig,
  ): Promise<MigrationResult> {
    try {
      this.logger.log(`Starting migration from ${markdownRulesPath}`);

      // Create new rule version
      const ruleVersion = await this.createRuleVersion(versionConfig);

      // Parse markdown files
      const markdownFiles = await this.parseMarkdownFiles(markdownRulesPath);

      let migratedRules = 0;
      const errors: string[] = [];

      // Migrate each file
      for (const file of markdownFiles) {
        try {
          await this.migrateRuleFile(file, ruleVersion.id);
          migratedRules += file.rules.length;
        } catch (error) {
          const errorMsg = `Failed to migrate ${file.filePath}: ${error.message}`;
          errors.push(errorMsg);
          this.logger.error(errorMsg);
        }
      }

      // Update version status
      if (errors.length === 0) {
        await this.activateRuleVersion(ruleVersion.id);
      }

      return {
        success: errors.length === 0,
        message: `Migration completed. ${migratedRules} rules migrated.`,
        migratedRules,
        errors: errors.length > 0 ? errors : undefined,
        version: ruleVersion.version,
      };
    } catch (error) {
      this.logger.error('Migration failed:', error);
      const errorMessage = getErrorMessage(error);
      return {
        success: false,
        message: `Migration failed: ${errorMessage}`,
        errors: [errorMessage],
      };
    }
  }

  /**
   * Create a new rule version
   */
  async createRuleVersion(config: RuleVersionConfig): Promise<RuleVersion> {
    // Deactivate current default version if setting new default
    if (!config.testGroup) {
      await this.prisma.ruleVersion.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.ruleVersion.create({
      data: {
        version: config.version,
        description: config.description,
        changeLog: config.changeLog || {},
        testGroup: config.testGroup,
        testPercentage: config.testPercentage,
        isActive: false, // Will be activated after successful migration
        isDefault: !config.testGroup, // Default if not a test version
        createdBy: 'migration-service',
      },
    });
  }

  /**
   * Activate a rule version
   */
  async activateRuleVersion(versionId: string): Promise<void> {
    await this.prisma.ruleVersion.update({
      where: { id: versionId },
      data: { isActive: true },
    });
  }

  /**
   * Parse markdown files from directory
   */
  private async parseMarkdownFiles(
    rulesPath: string,
  ): Promise<MarkdownRuleFile[]> {
    const files: MarkdownRuleFile[] = [];

    try {
      const entries = await fs.readdir(rulesPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.md')) {
          const filePath = path.join(rulesPath, entry.name);
          const content = await fs.readFile(filePath, 'utf8');

          const roleType = this.extractRoleTypeFromFilename(entry.name);
          const rules = this.parseMarkdownContent(content, roleType);

          files.push({
            filePath,
            content,
            roleType,
            rules,
          });
        }
      }
    } catch (error) {
      this.logger.error(
        `Failed to read markdown files from ${rulesPath}:`,
        error,
      );
      throw new Error(getErrorMessage(error));
    }

    return files;
  }

  /**
   * Extract role type from filename
   */
  private extractRoleTypeFromFilename(filename: string): string {
    // Extract role from filenames like "100-boomerang-role.md", "300-architect-role.md"
    const match = filename.match(/\d+-(.+)-role\.md$/);
    if (match) {
      return match[1].replace('-', '_'); // Convert "senior-developer" to "senior_developer"
    }

    // Fallback patterns
    if (filename.includes('boomerang')) return 'boomerang';
    if (filename.includes('researcher')) return 'researcher';
    if (filename.includes('architect')) return 'architect';
    if (filename.includes('senior-developer')) return 'senior_developer';
    if (filename.includes('code-review')) return 'code_review';
    if (filename.includes('integration-engineer'))
      return 'integration_engineer';

    return 'unknown';
  }

  /**
   * Parse markdown content into structured rules
   */
  private parseMarkdownContent(
    content: string,
    roleType: string,
  ): ParsedRule[] {
    const rules: ParsedRule[] = [];

    try {
      // This is a simplified parser - in a real implementation, you'd want more sophisticated parsing
      const lines = content.split('\n');
      let currentRule: Partial<ParsedRule> | null = null;
      let currentStep: Partial<ParsedStep> | null = null;
      let stepSequence = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Detect role definition (main heading)
        if (line.startsWith('# ') && !currentRule) {
          currentRule = {
            name: roleType,
            displayName: line.substring(2).trim(),
            description: '',
            steps: [],
            roleType,
            priority: this.getRolePriority(roleType),
          };
        }

        // Detect step definitions (subheadings)
        if (line.startsWith('## ') && currentRule) {
          // Save previous step
          if (currentStep) {
            currentRule.steps!.push(currentStep as ParsedStep);
          }

          stepSequence++;
          currentStep = {
            name: this.generateStepName(line.substring(3).trim()),
            displayName: line.substring(3).trim(),
            description: '',
            stepType: this.inferStepType(line),
            sequenceNumber: stepSequence,
            conditions: [],
            actions: [],
          };
        }

        // Collect descriptions and content
        if (line && !line.startsWith('#') && currentStep) {
          if (!currentStep.description) {
            currentStep.description = line;
          } else {
            currentStep.description += ' ' + line;
          }
        }

        // Extract behavioral context from specific sections
        if (
          line.includes('SOLID') ||
          line.includes('principles') ||
          line.includes('patterns')
        ) {
          if (currentStep) {
            currentStep.behavioralContext = {
              principles: [line],
              patterns: [],
              qualityStandards: [],
            };
          }
        }
      }

      // Save final step and rule
      if (currentStep && currentRule) {
        currentRule.steps!.push(currentStep as ParsedStep);
      }

      if (currentRule) {
        rules.push(currentRule as ParsedRule);
      }
    } catch (error) {
      this.logger.error(
        `Failed to parse markdown content for ${roleType}:`,
        error,
      );
      throw new Error(getErrorMessage(error));
    }

    return rules;
  }

  /**
   * Migrate a single rule file to database
   */
  private async migrateRuleFile(
    file: MarkdownRuleFile,
    versionId: string,
  ): Promise<void> {
    for (const rule of file.rules) {
      // Create or update workflow role
      const workflowRole = await this.prisma.workflowRole.upsert({
        where: { name: rule.name },
        update: {
          displayName: rule.displayName,
          description: rule.description,
          priority: rule.priority,
        },
        create: {
          name: rule.name,
          displayName: rule.displayName,
          description: rule.description,
          priority: rule.priority,
          roleType: 'WORKFLOW',
        },
      });

      // Create workflow steps
      for (const step of rule.steps) {
        await this.prisma.workflowStep.create({
          data: {
            roleId: workflowRole.id,
            name: step.name,
            displayName: step.displayName,
            description: step.description,
            sequenceNumber: step.sequenceNumber,
            stepType: step.stepType as
              | 'VALIDATION'
              | 'ANALYSIS'
              | 'ACTION'
              | 'DELEGATION'
              | 'REPORTING',
            behavioralContext: step.behavioralContext,
            qualityChecklist: step.qualityChecklist,
            actionData: {
              migrationVersion: versionId,
              originalFile: file.filePath,
            },
          },
        });
      }
    }
  }

  /**
   * Get role priority based on role type
   */
  private getRolePriority(roleType: string): number {
    const priorities: Record<string, number> = {
      boomerang: 100,
      researcher: 200,
      architect: 300,
      senior_developer: 400,
      code_review: 500,
      integration_engineer: 600,
    };

    return safePropertyAccess(priorities, roleType, 999);
  }

  /**
   * Generate step name from display name
   */
  private generateStepName(displayName: string): string {
    return displayName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);
  }

  /**
   * Infer step type from content
   */
  private inferStepType(content: string): string {
    const lower = content.toLowerCase();

    if (
      lower.includes('validate') ||
      lower.includes('check') ||
      lower.includes('verify')
    ) {
      return 'VALIDATION';
    }
    if (
      lower.includes('analyze') ||
      lower.includes('review') ||
      lower.includes('assess')
    ) {
      return 'ANALYSIS';
    }
    if (
      lower.includes('create') ||
      lower.includes('implement') ||
      lower.includes('execute')
    ) {
      return 'ACTION';
    }
    if (
      lower.includes('delegate') ||
      lower.includes('handoff') ||
      lower.includes('transition')
    ) {
      return 'DELEGATION';
    }
    if (
      lower.includes('report') ||
      lower.includes('document') ||
      lower.includes('generate')
    ) {
      return 'REPORTING';
    }

    return 'ACTION'; // Default
  }

  /**
   * Rollback to previous version
   */
  async rollbackToVersion(targetVersion: string): Promise<MigrationResult> {
    try {
      const version = await this.prisma.ruleVersion.findFirst({
        where: { version: targetVersion },
      });

      if (!version) {
        return {
          success: false,
          message: `Version ${targetVersion} not found`,
        };
      }

      // Deactivate current versions
      await this.prisma.ruleVersion.updateMany({
        where: { isActive: true },
        data: { isActive: false, isDefault: false },
      });

      // Activate target version
      await this.prisma.ruleVersion.update({
        where: { id: version.id },
        data: { isActive: true, isDefault: true },
      });

      return {
        success: true,
        message: `Successfully rolled back to version ${targetVersion}`,
        version: targetVersion,
      };
    } catch (error) {
      this.logger.error(`Rollback failed:`, error);
      const errorMessage = getErrorMessage(error);
      return {
        success: false,
        message: `Rollback failed: ${errorMessage}`,
      };
    }
  }

  /**
   * Get migration history
   */
  getMigrationHistory(): Promise<RuleVersion[]> {
    return this.prisma.ruleVersion.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Clean up old versions (keep last N versions)
   */
  async cleanupOldVersions(keepCount: number = 10): Promise<MigrationResult> {
    try {
      const versions = await this.prisma.ruleVersion.findMany({
        orderBy: { createdAt: 'desc' },
        skip: keepCount,
      });

      if (versions.length === 0) {
        return {
          success: true,
          message: 'No old versions to clean up',
        };
      }

      const deletedIds = versions.map((v) => v.id);
      await this.prisma.ruleVersion.deleteMany({
        where: { id: { in: deletedIds } },
      });

      return {
        success: true,
        message: `Cleaned up ${versions.length} old versions`,
      };
    } catch (error) {
      this.logger.error('Cleanup failed:', error);
      const errorMessage = getErrorMessage(error);
      return {
        success: false,
        message: `Cleanup failed: ${errorMessage}`,
      };
    }
  }
}
