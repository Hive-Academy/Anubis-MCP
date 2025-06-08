import { Injectable } from '@nestjs/common';
import { PerformanceMonitorService } from './performance-monitor.service';

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

interface CacheConfig {
  defaultTTL: number;
  maxEntries: number;
  maxMemoryMB: number;
  cleanupInterval: number;
}

@Injectable()
export class MCPCacheService {
  private cache = new Map<string, CacheEntry>();
  private config: CacheConfig = {
    defaultTTL: 300000, // 5 minutes
    maxEntries: 1000,
    maxMemoryMB: 100,
    cleanupInterval: 60000, // 1 minute
  };
  private cleanupTimer?: NodeJS.Timeout;

  constructor(private performanceMonitor: PerformanceMonitorService) {
    this.startCleanupTimer();
  }

  /**
   * Get cached data with performance tracking
   */
  async get<T>(key: string, operationId?: string): Promise<T | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      if (operationId) {
        this.performanceMonitor.recordCacheMiss(operationId);
      }
      return null;
    }

    // Check if expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      if (operationId) {
        this.performanceMonitor.recordCacheMiss(operationId);
      }
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    if (operationId) {
      // Estimate tokens saved (rough calculation)
      const tokensSaved = this.estimateTokensSaved(entry.data);
      this.performanceMonitor.recordCacheHit(operationId, tokensSaved);
    }

    return Promise.resolve(entry.data as T);
  }

  /**
   * Set cached data with TTL
   */
  async set<T>(
    key: string,
    data: T,
    options?: { ttl?: number },
  ): Promise<void> {
    const ttl = options?.ttl || this.config.defaultTTL;

    // Check memory limits before adding
    if (this.cache.size >= this.config.maxEntries) {
      this.evictLeastRecentlyUsed();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      accessCount: 0,
      lastAccessed: Date.now(),
    };

    this.cache.set(key, entry);

    // Check memory usage
    await this.checkMemoryUsage();
  }

  /**
   * Delete cached entry
   */
  async delete(key: string): Promise<boolean> {
    return Promise.resolve(this.cache.delete(key));
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    await Promise.resolve(this.cache.clear());
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const entries = Array.from(this.cache.values());
    const now = Date.now();

    return {
      totalEntries: this.cache.size,
      memoryUsageMB: this.getMemoryUsage(),
      expiredEntries: entries.filter((entry) => this.isExpired(entry)).length,
      averageAccessCount:
        entries.reduce((sum, entry) => sum + entry.accessCount, 0) /
          entries.length || 0,
      oldestEntry: Math.min(...entries.map((entry) => now - entry.timestamp)),
      newestEntry: Math.max(...entries.map((entry) => now - entry.timestamp)),
    };
  }

  /**
   * Generate cache key for MCP operations
   */
  generateMCPKey(operation: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce(
        (result, key) => {
          result[key] = params[key];
          return result;
        },
        {} as Record<string, any>,
      );

    const paramString = JSON.stringify(sortedParams);
    return `mcp:${operation}:${this.hashString(paramString)}`;
  }

  /**
   * Generate database cache key
   */
  generateDBKey(table: string, query: Record<string, any>): string {
    const queryString = JSON.stringify(query, Object.keys(query).sort());
    return `db:${table}:${this.hashString(queryString)}`;
  }

  /**
   * Get TTL for specific operation types
   */
  getTTLForOperation(operation: string): number {
    const ttlMap: Record<string, number> = {
      task_context: 300000, // 5 minutes
      task_list: 60000, // 1 minute
      subtask_batch: 180000, // 3 minutes
      workflow_status: 120000, // 2 minutes
      reports: 600000, // 10 minutes
      research: 1800000, // 30 minutes
    };

    return ttlMap[operation] || this.config.defaultTTL;
  }

  /**
   * Invalidate cache entries by pattern
   */
  async invalidatePattern(pattern: string): Promise<number> {
    const regex = new RegExp(pattern.replace('*', '.*'));
    let deletedCount = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        deletedCount++;
      }
    }

    return Promise.resolve(deletedCount);
  }

  /**
   * Invalidate cache for specific task
   */
  async invalidateTask(taskId: string): Promise<number> {
    return this.invalidatePattern(`*:${taskId}:*`);
  }

  /**
   * Preload cache with anticipated data
   */
  async preload<T>(
    key: string,
    dataLoader: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached) {
      return cached;
    }

    const data = await dataLoader();
    await this.set(key, data, { ttl });
    return data;
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private evictLeastRecentlyUsed(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  private async checkMemoryUsage(): Promise<void> {
    const memoryUsageMB = await Promise.resolve(this.getMemoryUsage());

    if (memoryUsageMB > this.config.maxMemoryMB) {
      // Evict 25% of entries, starting with least recently used
      const targetSize = Math.floor(this.cache.size * 0.75);
      const entries = Array.from(this.cache.entries()).sort(
        ([, a], [, b]) => a.lastAccessed - b.lastAccessed,
      );

      for (let i = 0; i < entries.length - targetSize; i++) {
        this.cache.delete(entries[i][0]);
      }
    }
  }

  private getMemoryUsage(): number {
    // Rough estimation of memory usage
    const heapUsed = process.memoryUsage().heapUsed;
    return heapUsed / (1024 * 1024); // Convert to MB
  }

  private estimateTokensSaved(data: any): number {
    // Rough estimation: 1 token ≈ 4 characters
    const jsonString = JSON.stringify(data);
    return Math.floor(jsonString.length / 4);
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  private cleanup(): void {
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach((key) => this.cache.delete(key));
  }

  onModuleDestroy() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
  }

  /**
   * Agent Context Cache - Reduces MCP calls by providing comprehensive context
   */

  /**
   * Get comprehensive task context for AI agents
   * This reduces multiple MCP calls into a single cached response
   */
  async getAgentTaskContext(
    taskId: string,
  ): Promise<Record<string, unknown> | null> {
    const cacheKey = `agent_context:task:${taskId}`;
    return this.get(cacheKey);
  }

  /**
   * Set comprehensive task context for AI agents
   * Includes task, description, plans, subtasks, reports, workflow status
   */
  async setAgentTaskContext(
    taskId: string,
    context: Record<string, unknown>,
  ): Promise<void> {
    const cacheKey = `agent_context:task:${taskId}`;
    // Longer TTL for comprehensive context (10 minutes)
    await this.set(cacheKey, context, { ttl: 600000 });
  }

  /**
   * Get workflow session context for AI agents
   * Caches frequently accessed workflow data across multiple tasks
   */
  async getAgentWorkflowSession(
    sessionId: string,
  ): Promise<Record<string, unknown> | null> {
    const cacheKey = `agent_session:workflow:${sessionId}`;
    return this.get(cacheKey);
  }

  /**
   * Set workflow session context for AI agents
   */
  async setAgentWorkflowSession(
    sessionId: string,
    context: Record<string, unknown>,
  ): Promise<void> {
    const cacheKey = `agent_session:workflow:${sessionId}`;
    // Medium TTL for session data (5 minutes)
    await this.set(cacheKey, context, { ttl: 300000 });
  }

  /**
   * Preload related context when agent accesses a task
   * Anticipates what the agent will likely need next
   */
  async preloadAgentContext(
    taskId: string,
    dataLoader: {
      getTask: () => Promise<any>;
      getWorkflowStatus: () => Promise<any>;
      getReports: () => Promise<any>;
      getPlans: () => Promise<any>;
    },
  ): Promise<any> {
    const cacheKey = `agent_context:task:${taskId}`;

    return this.preload(
      cacheKey,
      async () => {
        // Load all related data in parallel
        const [task, workflowStatus, reports, plans] = await Promise.all([
          dataLoader.getTask(),
          dataLoader.getWorkflowStatus(),
          dataLoader.getReports(),
          dataLoader.getPlans(),
        ]);

        return {
          task,
          workflowStatus,
          reports,
          plans,
          timestamp: Date.now(),
          cacheType: 'agent_comprehensive_context',
        };
      },
      600000,
    ); // 10 minutes TTL
  }

  /**
   * Get conversation context cache
   * Reduces repeated queries within the same conversation
   */
  async getConversationContext(
    conversationId: string,
    contextType: string,
  ): Promise<Record<string, unknown> | null> {
    const cacheKey = `conversation:${conversationId}:${contextType}`;
    return this.get(cacheKey);
  }

  /**
   * Set conversation context cache
   */
  async setConversationContext(
    conversationId: string,
    contextType: string,
    context: Record<string, unknown>,
  ): Promise<void> {
    const cacheKey = `conversation:${conversationId}:${contextType}`;
    // Short TTL for conversation context (2 minutes)
    await this.set(cacheKey, context, { ttl: 120000 });
  }

  /**
   * Invalidate agent context when task data changes
   */
  async invalidateAgentContext(taskId: string): Promise<number> {
    const patterns = [
      `agent_context:task:${taskId}`,
      `agent_session:*:${taskId}`,
      `conversation:*:task:${taskId}`,
    ];

    let totalDeleted = 0;
    for (const pattern of patterns) {
      totalDeleted += await this.invalidatePattern(pattern);
    }

    return totalDeleted;
  }

  /**
   * Get cache efficiency metrics for agent usage
   */
  getAgentCacheMetrics() {
    const stats = this.getCacheStats();
    const agentEntries = Array.from(this.cache.keys()).filter(
      (key) => key.startsWith('agent_') || key.startsWith('conversation:'),
    );

    return {
      ...stats,
      agentCacheEntries: agentEntries.length,
      agentCacheRatio: agentEntries.length / this.cache.size,
      estimatedMCPCallsAvoided: agentEntries.length * 3, // Rough estimate
      estimatedTokensSaved: agentEntries.reduce((total, key) => {
        const entry = this.cache.get(key);
        return total + (entry ? this.estimateTokensSaved(entry.data) : 0);
      }, 0),
    };
  }
}
