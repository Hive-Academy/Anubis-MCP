import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';

export interface AIAgentConfig {
  name: string;
  sourceTemplate: string;
  targetPath: string;
  targetFileName: string;
  requiresFrontmatter: boolean;
  ensureDirectories: string[];
  specialHandling?: 'roocode' | 'kilocode'; // Optional special handling for specific agents
  turboTemplate?: string; // Optional turbo-dev specific template
}

@Injectable()
export class InitRulesService {
  private readonly templatesPath = path.join(__dirname, 'templates');

  private readonly agentConfigs: Record<string, AIAgentConfig> = {
    cursor: {
      name: 'Cursor IDE',
      sourceTemplate: 'multi-role-workflow-protocol.md',
      turboTemplate: 'turbo-dev-protocol.md',
      targetPath: '.cursor/rules',
      targetFileName: '000-workflow-core.mdc',
      requiresFrontmatter: true,
      ensureDirectories: ['.cursor', '.cursor/rules'],
    },
    copilot: {
      name: 'GitHub Copilot',
      sourceTemplate: 'multi-role-workflow-protocol.md',
      turboTemplate: 'turbo-dev-protocol.md',
      targetPath: '.github/chatmodes',
      targetFileName: '𓂀𓁢𓋹𝔸ℕ𝕌𝔹𝕀𝕊𓋹𓁢𓂀.chatmode.md',
      requiresFrontmatter: true,
      ensureDirectories: ['.github', '.github/chatmodes'],
    },
    roocode: {
      name: 'RooCode',
      sourceTemplate: 'workflow-protocol-xml.md',
      targetPath: '.roo/rules-anubis',
      targetFileName: 'rules.md',
      requiresFrontmatter: false, // XML file doesn't need frontmatter
      ensureDirectories: ['.roo', '.roo/rules-anubis'],
      specialHandling: 'roocode', // Add special flag
    },
    kilocode: {
      name: 'KiloCode',
      sourceTemplate: 'workflow-protocol-xml.md',
      targetPath: '.kilocode/rules-anubis',
      targetFileName: 'rules.md',
      requiresFrontmatter: false, // XML file doesn't need frontmatter
      ensureDirectories: ['.kilocode', '.kilocode/rules-anubis'],
      specialHandling: 'kilocode', // Add special flag
    },
  };

  /**
   * Deploy Anubis workflow rules to specified AI agent
   * @param agentName - The AI agent to deploy rules for
   * @param projectRoot - Root directory of the target project
   * @param options - Optional configuration including workflowType and templateFile
   * @returns Promise with deployment result
   */
  async InitRules(
    agentName: string,
    projectRoot: string,
    options?: {
      workflowType?: 'turbo' | 'multiRole';
      templateFile?: string;
    },
  ): Promise<{
    success: boolean;
    message: string;
    targetFile?: string;
    workflowType?: string;
  }> {
    const config = this.agentConfigs[agentName];
    if (!config) {
      return {
        success: false,
        message: `Unsupported AI agent: ${agentName}. Supported agents: ${Object.keys(this.agentConfigs).join(', ')}`,
      };
    }

    try {
      // Ensure target directories exist
      await this.ensureDirectories(projectRoot, config.ensureDirectories);

      // Determine which template to use
      let templateToUse: string;
      let workflowType: string;

      if (options?.templateFile) {
        // Use explicit template file if provided
        templateToUse = options.templateFile;
        workflowType = 'custom';
      } else if (options?.workflowType === 'turbo' && config.turboTemplate) {
        // Use turbo template if requested and available
        templateToUse = config.turboTemplate;
        workflowType = 'turbo';
      } else {
        // Use default (multiRole) template
        templateToUse = config.sourceTemplate;
        workflowType = 'multiRole';
      }

      // Read source template
      const sourceContent = await this.readTemplate(templateToUse);

      // Process content (add frontmatter if required)
      const processedContent = config.requiresFrontmatter
        ? this.addFrontmatter(sourceContent, config, workflowType)
        : sourceContent;

      // Write to target location
      const targetFilePath = path.join(
        projectRoot,
        config.targetPath,
        config.targetFileName,
      );
      await fs.writeFile(targetFilePath, processedContent, 'utf8');

      if (config.specialHandling === 'roocode') {
        const sourceJsonPath = path.join(
          this.templatesPath,
          'custom-mode.json',
        );
        const targetJsonPath = path.join(projectRoot, '.roomodes');
        await fs.copyFile(sourceJsonPath, targetJsonPath);
      }

      if (config.specialHandling === 'kilocode') {
        const sourceJsonPath = path.join(
          this.templatesPath,
          'custom-mode.json',
        );
        const targetJsonPath = path.join(projectRoot, '.kilocodemodes');
        await fs.copyFile(sourceJsonPath, targetJsonPath);
      }

      return {
        success: true,
        message: `Successfully deployed Anubis ${workflowType} rules for ${config.name}`,
        targetFile: targetFilePath,
        workflowType,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to deploy rules for ${config.name}: ${error.message}`,
      };
    }
  }

  /**
   * Get list of supported AI agents
   */
  getSupportedAgents(): string[] {
    return Object.keys(this.agentConfigs);
  }

  /**
   * Get configuration for a specific agent
   */
  getAgentConfig(agentName: string): AIAgentConfig | null {
    return this.agentConfigs[agentName] || null;
  }

  /**
   * Ensure all required directories exist
   */
  private async ensureDirectories(
    projectRoot: string,
    directories: string[],
  ): Promise<void> {
    for (const dir of directories) {
      const fullPath = path.join(projectRoot, dir);
      try {
        await fs.access(fullPath);
      } catch {
        await fs.mkdir(fullPath, { recursive: true });
      }
    }
  }

  /**
   * Read template file content
   */
  private async readTemplate(templateName: string): Promise<string> {
    const templatePath = path.join(this.templatesPath, templateName);
    return await fs.readFile(templatePath, 'utf8');
  }

  /**
   * Add frontmatter to content if required
   */
  private addFrontmatter(
    content: string,
    config: AIAgentConfig,
    workflowType?: string,
  ): string {
    // Check if content already has frontmatter
    if (content.startsWith('---')) {
      return content;
    }

    // Add basic frontmatter based on agent type
    const frontmatter = this.generateFrontmatter(config, workflowType);
    return `${frontmatter}\n\n${content}`;
  }

  /**
   * Generate appropriate frontmatter for the agent
   */
  private generateFrontmatter(
    config: AIAgentConfig,
    workflowType?: string,
  ): string {
    const timestamp = new Date().toISOString();
    const workflowTypeLabel =
      workflowType === 'turbo'
        ? ' - Turbo-Dev Mode'
        : workflowType === 'multiRole'
          ? ' - Multi-Role Mode'
          : '';

    switch (config.name) {
      case 'Cursor IDE':
        return `---
description: Anubis Workflow Protocol${workflowTypeLabel}
globs: 
alwaysApply: true
---`;

      case 'GitHub Copilot':
        return `---
description: 'Anubis${workflowTypeLabel} - Intelligent guidance for AI workflows. The first MCP-compliant system that embeds intelligent guidance directly into each step, ensuring your AI agents follow complex development processes consistently and reliably.'

tools: [
  'changes',
  'codebase',
  'editFiles',
  'extensions',
  'fetch',
  'problems',
  'runCommands',
  'runTasks',
  'search',
  'usages',
  'anubis',
  'mcp-server-firecrawl'
  ]
---`;

      default:
        return `---
title: "Anubis Workflow Protocol${workflowTypeLabel}"
description: "Intelligent guidance for AI workflows"
version: "1.0.0"
created: "${timestamp}"
---`;
    }
  }
}
