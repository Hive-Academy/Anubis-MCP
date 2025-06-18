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
}

@Injectable()
export class InitRulesService {
  private readonly templatesPath = path.join(__dirname, 'templates');

  private readonly agentConfigs: Record<string, AIAgentConfig> = {
    cursor: {
      name: 'Cursor IDE',
      sourceTemplate: 'workflow-protocol-function-calls.md',
      targetPath: '.cursor/rules',
      targetFileName: '000-workflow-core.md',
      requiresFrontmatter: true,
      ensureDirectories: ['.cursor', '.cursor/rules'],
    },
    copilot: {
      name: 'GitHub Copilot',
      sourceTemplate: 'workflow-protocol-function-calls.md',
      targetPath: '.github/chatmodes',
      targetFileName: '𓂀𓁢𓋹𝔸ℕ𝕌𝔹𝕀𝕊𓋹𓁢𓂀.chatmode.md',
      requiresFrontmatter: true,
      ensureDirectories: ['.github', '.github/chatmodes'],
    },
  };

  /**
   * Deploy Anubis workflow rules to specified AI agent
   * @param agentName - The AI agent to deploy rules for
   * @param projectRoot - Root directory of the target project
   * @returns Promise with deployment result
   */
  async deployRules(
    agentName: string,
    projectRoot: string,
  ): Promise<{
    success: boolean;
    message: string;
    targetFile?: string;
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

      // Read source template
      const sourceContent = await this.readTemplate(config.sourceTemplate);

      // Process content (add frontmatter if required)
      const processedContent = config.requiresFrontmatter
        ? this.addFrontmatter(sourceContent, config)
        : sourceContent;

      // Write to target location
      const targetFilePath = path.join(
        projectRoot,
        config.targetPath,
        config.targetFileName,
      );
      await fs.writeFile(targetFilePath, processedContent, 'utf8');

      return {
        success: true,
        message: `Successfully deployed Anubis rules for ${config.name}`,
        targetFile: targetFilePath,
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
   * Deploy rules to all supported agents
   */
  async deployAllRules(projectRoot: string): Promise<{
    success: boolean;
    results: Array<{
      agent: string;
      success: boolean;
      message: string;
      targetFile?: string;
    }>;
  }> {
    const results = [];
    let overallSuccess = true;

    for (const agentName of this.getSupportedAgents()) {
      const result = await this.deployRules(agentName, projectRoot);
      results.push({
        agent: agentName,
        ...result,
      });

      if (!result.success) {
        overallSuccess = false;
      }
    }

    return {
      success: overallSuccess,
      results,
    };
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
  private addFrontmatter(content: string, config: AIAgentConfig): string {
    // Check if content already has frontmatter
    if (content.startsWith('---')) {
      return content;
    }

    // Add basic frontmatter based on agent type
    const frontmatter = this.generateFrontmatter(config);
    return `${frontmatter}\n\n${content}`;
  }

  /**
   * Generate appropriate frontmatter for the agent
   */
  private generateFrontmatter(config: AIAgentConfig): string {
    const timestamp = new Date().toISOString();

    switch (config.name) {
      case 'Cursor IDE':
        return `---
title: "Anubis Workflow Protocol"
description: "Divine guidance for AI workflows - MCP-compliant system for structured development"
version: "1.0.0"
created: "${timestamp}"
agent: "cursor"
---`;

      case 'GitHub Copilot':
        return `---
name: "𓂀𓁢𓋹𝔸ℕ𝕌𝔹𝕀𝕊𓋹𓁢𓂀"
description: "Anubis - Divine Guidance for AI Workflows"
version: "1.0.0"
created: "${timestamp}"
agent: "copilot"
---`;

      default:
        return `---
title: "Anubis Workflow Protocol"
description: "Divine guidance for AI workflows"
version: "1.0.0"
created: "${timestamp}"
---`;
    }
  }
}
