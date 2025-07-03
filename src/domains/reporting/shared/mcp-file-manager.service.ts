import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

/**
 * MCP File Manager Service
 * Handles file operations for MCP report generation
 * Following KISS principle - single responsibility for file management
 */
@Injectable()
export class McpFileManagerService {
  /**
   * Get the correct project root path for reports
   */
  private getProjectRoot(providedBasePath?: string): string {
    // Priority order: provided base path, PROJECT_ROOT env var, current working directory
    if (providedBasePath && path.isAbsolute(providedBasePath)) {
      return providedBasePath;
    }

    if (process.env.PROJECT_ROOT && path.isAbsolute(process.env.PROJECT_ROOT)) {
      return process.env.PROJECT_ROOT;
    }

    return process.cwd();
  }

  /**
   * Save report content to file
   */
  async saveReportFile(
    content: string,
    reportType: string,
    identifier: string,
    basePath?: string,
    outputFormat: 'html' | 'json' = 'html',
  ): Promise<string> {
    const extension = outputFormat === 'json' ? 'json' : 'html';
    const fileName = `${reportType}-${identifier}-${Date.now()}.${extension}`;

    // Always use project root, never data directory
    const projectRoot = this.getProjectRoot(basePath);
    const filePath = path.join(
      projectRoot,
      'workflow-reports',
      'interactive',
      fileName,
    );

    await this.ensureDirectoryExists(path.dirname(filePath));
    await fs.promises.writeFile(filePath, content, 'utf8');

    return filePath;
  }

  /**
   * Ensure directory exists, create if needed
   */
  async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.promises.access(dirPath);
    } catch {
      await fs.promises.mkdir(dirPath, { recursive: true });
    }
  }

  /**
   * Generate unique report ID
   */
  generateReportId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clean up old report files (optional utility)
   */
  async cleanupOldReports(
    basePath?: string,
    maxAgeHours: number = 24,
  ): Promise<number> {
    // Always use project root, never data directory
    const projectRoot = this.getProjectRoot(basePath);
    const reportsDir = path.join(
      projectRoot,
      'workflow-reports',
      'interactive',
    );

    const files = await fs.promises.readdir(reportsDir);
    const cutoffTime = Date.now() - maxAgeHours * 60 * 60 * 1000;
    let deletedCount = 0;

    for (const file of files) {
      const filePath = path.join(reportsDir, file);
      const stats = await fs.promises.stat(filePath);

      if (stats.mtime.getTime() < cutoffTime) {
        await fs.promises.unlink(filePath);
        deletedCount++;
      }
    }

    return deletedCount;
  }
}
