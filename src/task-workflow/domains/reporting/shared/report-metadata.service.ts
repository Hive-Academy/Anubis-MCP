import { Injectable, Logger } from '@nestjs/common';
import { IReportMetadataService } from './interfaces';
import { ReportMetadata } from './types';

/**
 * Metadata generation service for all reports
 * Follows KISS principle with focused metadata logic
 * Max 200 lines following architecture guidelines
 */
@Injectable()
export class ReportMetadataService implements IReportMetadataService {
  private readonly logger = new Logger(ReportMetadataService.name);

  /**
   * Generate standard metadata for reports
   */
  generateMetadata(reportType: string, generatedBy?: string): ReportMetadata {
    return {
      generatedAt: this.getCurrentTimestamp(),
      reportType,
      version: this.getReportVersion(reportType),
      generatedBy: generatedBy || 'system',
    };
  }

  /**
   * Calculate data statistics for metadata enhancement
   */
  calculateDataStats(
    data: unknown,
    reportType: string,
  ): {
    dataCount: number;
    complexity: 'low' | 'medium' | 'high';
    estimatedReadTime: string;
  } {
    let dataCount = 0;

    if (Array.isArray(data)) {
      dataCount = data.length;
    } else if (data && typeof data === 'object') {
      dataCount = Object.keys(data).length;
    }

    return {
      dataCount,
      complexity: this.assessComplexity(dataCount, reportType),
      estimatedReadTime: this.estimateReadTime(dataCount, reportType),
    };
  }

  /**
   * Get current timestamp in ISO format
   */
  private getCurrentTimestamp(): string {
    return new Date().toISOString();
  }

  /**
   * Get version for specific report type
   */
  private getReportVersion(reportType: string): string {
    const versions: Record<string, string> = {
      'delegation-flow': '2.1.0',
      'workflow-analytics': '2.0.0',
      'role-performance': '1.8.0',
      'task-detail': '1.5.0',
      'implementation-plan': '1.7.0',
      'interactive-dashboard': '3.0.0',
      'simple-report': '1.2.0',
    };

    return versions[reportType] || '1.0.0';
  }

  /**
   * Assess complexity based on data count and report type
   */
  private assessComplexity(
    dataCount: number,
    reportType: string,
  ): 'low' | 'medium' | 'high' {
    const complexityThresholds: Record<
      string,
      { medium: number; high: number }
    > = {
      'delegation-flow': { medium: 50, high: 200 },
      'workflow-analytics': { medium: 100, high: 500 },
      'role-performance': { medium: 20, high: 100 },
      'task-detail': { medium: 10, high: 50 },
      'implementation-plan': { medium: 30, high: 150 },
      'interactive-dashboard': { medium: 200, high: 1000 },
      'simple-report': { medium: 50, high: 200 },
    };

    const thresholds = complexityThresholds[reportType] || {
      medium: 50,
      high: 200,
    };

    if (dataCount >= thresholds.high) return 'high';
    if (dataCount >= thresholds.medium) return 'medium';
    return 'low';
  }

  /**
   * Estimate reading time based on data points and report type
   */
  private estimateReadTime(dataCount: number, reportType: string): string {
    const baseReadTimes: Record<string, number> = {
      'delegation-flow': 2, // minutes
      'workflow-analytics': 5,
      'role-performance': 3,
      'task-detail': 1,
      'implementation-plan': 3,
      'interactive-dashboard': 10,
      'simple-report': 1,
    };

    const baseTime = baseReadTimes[reportType] || 2;
    const additionalTime = Math.ceil(dataCount / 100); // 1 minute per 100 data points
    const totalMinutes = baseTime + additionalTime;

    if (totalMinutes < 60) {
      return `${totalMinutes} min`;
    } else {
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${hours}h ${minutes}m`;
    }
  }
}
