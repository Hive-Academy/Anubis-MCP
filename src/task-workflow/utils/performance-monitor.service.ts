import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';

export interface PerformanceMetrics {
  operationId: string;
  operation: string;
  startTime: number;
  endTime: number;
  duration: number;
  queryCount: number;
  cacheHits: number;
  cacheMisses: number;
  memoryUsage: number;
  errorCount: number;
  tokensSaved?: number;
  responseSize: number;
}

export interface CacheStats {
  totalRequests: number;
  cacheHitRate: number;
  averageResponseTime: number;
  totalTokensSaved: number;
  memoryUsage: number;
  errorRate: number;
}

@Injectable()
export class PerformanceMonitorService {
  private readonly metricsFile = path.join(
    process.cwd(),
    'logs',
    'mcp-performance.jsonl',
  );
  private readonly cacheStatsFile = path.join(
    process.cwd(),
    'logs',
    'cache-stats.json',
  );
  private activeOperations = new Map<string, Partial<PerformanceMetrics>>();

  constructor() {
    this.ensureLogDirectory();
  }

  private async ensureLogDirectory() {
    const logDir = path.dirname(this.metricsFile);
    try {
      await fs.mkdir(logDir, { recursive: true });
    } catch (_error) {
      // Directory might already exist
    }
  }

  /**
   * Start tracking a performance operation
   */
  startOperation(operationId: string, operation: string): void {
    this.activeOperations.set(operationId, {
      operationId,
      operation,
      startTime: performance.now(),
      queryCount: 0,
      cacheHits: 0,
      cacheMisses: 0,
      errorCount: 0,
      memoryUsage: process.memoryUsage().heapUsed,
    });
  }

  /**
   * Record a cache hit for an operation
   */
  recordCacheHit(operationId: string, tokensSaved?: number): void {
    const operation = this.activeOperations.get(operationId);
    if (operation) {
      operation.cacheHits = (operation.cacheHits || 0) + 1;
      operation.tokensSaved = (operation.tokensSaved || 0) + (tokensSaved || 0);
    }
  }

  /**
   * Record a cache miss for an operation
   */
  recordCacheMiss(operationId: string): void {
    const operation = this.activeOperations.get(operationId);
    if (operation) {
      operation.cacheMisses = (operation.cacheMisses || 0) + 1;
    }
  }

  /**
   * Record a database query for an operation
   */
  recordQuery(operationId: string): void {
    const operation = this.activeOperations.get(operationId);
    if (operation) {
      operation.queryCount = (operation.queryCount || 0) + 1;
    }
  }

  /**
   * Record an error for an operation
   */
  recordError(operationId: string): void {
    const operation = this.activeOperations.get(operationId);
    if (operation) {
      operation.errorCount = (operation.errorCount || 0) + 1;
    }
  }

  /**
   * End tracking and log the operation metrics
   */
  async endOperation(
    operationId: string,
    responseSize: number = 0,
  ): Promise<PerformanceMetrics | null> {
    const operation = this.activeOperations.get(operationId);
    if (!operation) {
      return null;
    }

    const endTime = performance.now();
    const finalMetrics: PerformanceMetrics = {
      ...operation,
      endTime,
      duration: endTime - (operation.startTime || 0),
      responseSize,
      memoryUsage: process.memoryUsage().heapUsed,
    } as PerformanceMetrics;

    // Log to file (STDIO compatible)
    await this.logMetrics(finalMetrics);

    // Clean up
    this.activeOperations.delete(operationId);

    return finalMetrics;
  }

  /**
   * Log metrics to file (STDIO protocol compatible)
   */
  private async logMetrics(metrics: PerformanceMetrics): Promise<void> {
    try {
      const logEntry =
        JSON.stringify({
          ...metrics,
          timestamp: new Date().toISOString(),
        }) + '\n';

      await fs.appendFile(this.metricsFile, logEntry);
    } catch (_error) {
      // Silently fail to avoid disrupting MCP operations
    }
  }

  /**
   * Get comprehensive cache statistics
   */
  async getCacheStats(): Promise<CacheStats> {
    try {
      const content = await fs.readFile(this.metricsFile, 'utf-8');
      const lines = content.trim().split('\n').filter(Boolean);

      if (lines.length === 0) {
        return this.getEmptyStats();
      }

      const metrics = lines
        .map((line) => {
          try {
            return JSON.parse(line) as PerformanceMetrics;
          } catch {
            return null;
          }
        })
        .filter(Boolean);

      const totalRequests = metrics.length;
      const totalCacheHits = metrics.reduce(
        (sum, m) => sum + (m?.cacheHits || 0),
        0,
      );
      const totalCacheMisses = metrics.reduce(
        (sum, m) => sum + (m?.cacheMisses || 0),
        0,
      );
      const totalCacheOperations = totalCacheHits + totalCacheMisses;

      const stats: CacheStats = {
        totalRequests,
        cacheHitRate:
          totalCacheOperations > 0 ? totalCacheHits / totalCacheOperations : 0,
        averageResponseTime:
          metrics.reduce((sum, m) => sum + (m?.duration || 0), 0) /
          totalRequests,
        totalTokensSaved: metrics.reduce(
          (sum, m) => sum + (m?.tokensSaved || 0),
          0,
        ),
        memoryUsage:
          metrics.length > 0
            ? metrics[metrics.length - 1]?.memoryUsage || 0
            : 0,
        errorRate:
          metrics.reduce((sum, m) => sum + (m?.errorCount || 0), 0) /
          totalRequests,
      };

      // Cache stats for quick access
      await this.cacheStats(stats);

      return stats;
    } catch (_error) {
      return this.getEmptyStats();
    }
  }

  /**
   * Get cached stats (faster access)
   */
  async getCachedStats(): Promise<CacheStats | null> {
    try {
      const content = await fs.readFile(this.cacheStatsFile, 'utf-8');
      return JSON.parse(content) as CacheStats;
    } catch {
      return null;
    }
  }

  /**
   * Cache stats to file
   */
  private async cacheStats(stats: CacheStats): Promise<void> {
    try {
      await fs.writeFile(
        this.cacheStatsFile,
        JSON.stringify(
          {
            ...stats,
            lastUpdated: new Date().toISOString(),
          },
          null,
          2,
        ),
      );
    } catch {
      // Silently fail
    }
  }

  /**
   * Clear old metrics (cleanup)
   */
  async clearOldMetrics(daysToKeep: number = 7): Promise<void> {
    try {
      const content = await fs.readFile(this.metricsFile, 'utf-8');
      const lines = content.trim().split('\n').filter(Boolean);

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const recentLines = lines.filter((line) => {
        try {
          const metrics = JSON.parse(line);
          return new Date(metrics.timestamp) > cutoffDate;
        } catch {
          return false;
        }
      });

      await fs.writeFile(this.metricsFile, recentLines.join('\n') + '\n');
    } catch {
      // Silently fail
    }
  }

  /**
   * Generate performance report
   */
  async generatePerformanceReport(): Promise<string> {
    const stats = await this.getCacheStats();

    return `
# MCP Performance Report
Generated: ${new Date().toISOString()}

## Cache Performance
- Total Requests: ${stats.totalRequests}
- Cache Hit Rate: ${(stats.cacheHitRate * 100).toFixed(2)}%
- Average Response Time: ${stats.averageResponseTime.toFixed(2)}ms
- Total Tokens Saved: ${stats.totalTokensSaved}
- Error Rate: ${(stats.errorRate * 100).toFixed(2)}%
- Memory Usage: ${(stats.memoryUsage / 1024 / 1024).toFixed(2)}MB

## Recommendations
${this.generateRecommendations(stats)}
    `.trim();
  }

  private generateRecommendations(stats: CacheStats): string {
    const recommendations: string[] = [];

    if (stats.cacheHitRate < 0.5) {
      recommendations.push(
        '- Consider increasing cache TTL or improving cache key strategies',
      );
    }

    if (stats.averageResponseTime > 1000) {
      recommendations.push(
        '- Response times are high - consider database query optimization',
      );
    }

    if (stats.errorRate > 0.05) {
      recommendations.push(
        '- Error rate is elevated - investigate error patterns',
      );
    }

    if (stats.memoryUsage > 500 * 1024 * 1024) {
      // 500MB
      recommendations.push(
        '- Memory usage is high - consider cache size limits',
      );
    }

    return recommendations.length > 0
      ? recommendations.join('\n')
      : '- Performance metrics look good!';
  }

  private getEmptyStats(): CacheStats {
    return {
      totalRequests: 0,
      cacheHitRate: 0,
      averageResponseTime: 0,
      totalTokensSaved: 0,
      memoryUsage: 0,
      errorRate: 0,
    };
  }
}
