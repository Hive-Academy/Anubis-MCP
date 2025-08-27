/**
 * 🧠 WORKFLOW CONTEXT CACHE SERVICE
 *
 * Purpose: Server-side memory cache for context-limited AI agents
 * Solves: AI agents forgetting critical workflow IDs during long conversations
 *
 * Features:
 * - In-memory storage of critical workflow state
 * - Automatic ID resolution and validation
 * - TTL-based expiration with refresh on access
 * - Thread-safe operations with proper error handling
 *
 * Architecture: Singleton service with LRU cache for memory efficiency
 */

import { Injectable, Logger } from '@nestjs/common';

export interface WorkflowContextState {
  // Core Identifiers - The most critical ones AI agents forget
  executionId: string;
  taskId: number;
  currentRoleId: string;
  currentStepId?: string;

  // Additional Context
  roleName: string;
  stepName?: string;
  taskName?: string;
  projectPath?: string;

  // Metadata
  lastAccessed: Date;
  createdAt: Date;
  accessCount: number;
  source: 'bootstrap' | 'transition' | 'step_completion' | 'manual';
}

export interface CacheStats {
  totalEntries: number;
  hitRate: number;
  totalAccess: number;
  totalHits: number;
  totalMisses: number;
  oldestEntry?: Date;
  newestEntry?: Date;
}

@Injectable()
export class WorkflowContextCacheService {
  private readonly logger = new Logger(WorkflowContextCacheService.name);

  // LRU Cache with memory limits
  private readonly contextCache = new Map<string, WorkflowContextState>();
  private readonly maxCacheSize = 100; // Maximum entries
  private readonly defaultTTL = 30 * 60 * 1000; // 30 minutes in ms

  // Statistics tracking
  private stats = {
    totalAccess: 0,
    totalHits: 0,
    totalMisses: 0,
    lastCleanup: new Date(),
  };

  /**
   * 🔄 STORE WORKFLOW CONTEXT
   * Called when critical workflow state changes
   */
  storeContext(
    key: string,
    context: Omit<
      WorkflowContextState,
      'lastAccessed' | 'createdAt' | 'accessCount'
    >,
  ): void {
    try {
      const now = new Date();

      // Prepare full context state
      const fullContext: WorkflowContextState = {
        ...context,
        lastAccessed: now,
        createdAt: now,
        accessCount: 0,
      };

      // LRU eviction if needed
      if (this.contextCache.size >= this.maxCacheSize) {
        this.evictLeastRecentlyUsed();
      }

      // Store context
      this.contextCache.set(key, fullContext);

      this.logger.log(`🧠 Stored workflow context for key: ${key}`, {
        executionId: context.executionId,
        taskId: context.taskId,
        roleName: context.roleName,
        source: context.source,
      });
    } catch (error) {
      this.logger.error(`Failed to store context for key: ${key}`, error);
    }
  }

  /**
   * 🔍 GET WORKFLOW CONTEXT
   * Returns stored context and updates access stats
   */
  getContext(key: string): WorkflowContextState | null {
    this.stats.totalAccess++;

    const context = this.contextCache.get(key);

    if (context) {
      // Update access metadata
      context.lastAccessed = new Date();
      context.accessCount++;

      // Move to end for LRU
      this.contextCache.delete(key);
      this.contextCache.set(key, context);

      this.stats.totalHits++;

      this.logger.debug(`🎯 Cache HIT for key: ${key}`, {
        executionId: context.executionId,
        accessCount: context.accessCount,
      });

      return context;
    }

    this.stats.totalMisses++;
    this.logger.debug(`💥 Cache MISS for key: ${key}`);

    return null;
  }

  /**
   * 🔎 FIND CONTEXT BY EXECUTION ID
   * Useful when AI agents only remember executionId
   */
  findContextByExecutionId(executionId: string): WorkflowContextState | null {
    for (const context of this.contextCache.values()) {
      if (context.executionId === executionId) {
        return context;
      }
    }
    return null;
  }

  /**
   * 🔎 FIND CONTEXT BY TASK ID
   * Useful when AI agents only remember taskId
   */
  findContextByTaskId(taskId: number): WorkflowContextState | null {
    for (const context of this.contextCache.values()) {
      if (context.taskId === taskId) {
        return context;
      }
    }
    return null;
  }

  /**
   * 🔄 UPDATE CONTEXT FIELD
   * Partial updates to existing context
   */
  updateContext(
    key: string,
    updates: Partial<
      Pick<
        WorkflowContextState,
        'currentRoleId' | 'currentStepId' | 'roleName' | 'stepName'
      >
    >,
  ): boolean {
    const context = this.contextCache.get(key);

    if (context) {
      Object.assign(context, updates, { lastAccessed: new Date() });
      this.contextCache.set(key, context);

      this.logger.log(`🔄 Updated context for key: ${key}`, updates);
      return true;
    }

    return false;
  }

  /**
   * ❌ REMOVE CONTEXT
   */
  removeContext(key: string): boolean {
    const removed = this.contextCache.delete(key);
    if (removed) {
      this.logger.log(`🗑️ Removed context for key: ${key}`);
    }
    return removed;
  }

  /**
   * 📊 GET CACHE STATISTICS
   */
  getStats(): CacheStats {
    const entries = Array.from(this.contextCache.values());
    const hitRate =
      this.stats.totalAccess > 0
        ? (this.stats.totalHits / this.stats.totalAccess) * 100
        : 0;

    return {
      totalEntries: this.contextCache.size,
      hitRate: Math.round(hitRate * 100) / 100,
      totalAccess: this.stats.totalAccess,
      totalHits: this.stats.totalHits,
      totalMisses: this.stats.totalMisses,
      oldestEntry:
        entries.length > 0
          ? new Date(Math.min(...entries.map((e) => e.createdAt.getTime())))
          : undefined,
      newestEntry:
        entries.length > 0
          ? new Date(Math.max(...entries.map((e) => e.createdAt.getTime())))
          : undefined,
    };
  }

  /**
   * 🧹 CLEANUP EXPIRED ENTRIES
   * Runs manually or can be called periodically
   */
  cleanupExpiredEntries(): void {
    const now = new Date();
    const expiredKeys: string[] = [];

    for (const [key, context] of this.contextCache.entries()) {
      const age = now.getTime() - context.lastAccessed.getTime();
      if (age > this.defaultTTL) {
        expiredKeys.push(key);
      }
    }

    // Remove expired entries
    expiredKeys.forEach((key) => this.contextCache.delete(key));

    if (expiredKeys.length > 0) {
      this.logger.log(
        `🧹 Cleaned up ${expiredKeys.length} expired context entries`,
      );
    }

    this.stats.lastCleanup = now;
  }

  /**
   * 🔄 LRU EVICTION
   * Remove least recently used entry when cache is full
   */
  private evictLeastRecentlyUsed(): void {
    let oldestKey = '';
    let oldestTime = new Date();

    for (const [key, context] of this.contextCache.entries()) {
      if (context.lastAccessed < oldestTime) {
        oldestTime = context.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.contextCache.delete(oldestKey);
      this.logger.debug(`🔄 LRU evicted context: ${oldestKey}`);
    }
  }

  /**
   * 🔧 GENERATE CONTEXT KEY
   * Utility method to create consistent cache keys
   */
  static generateKey(executionId: string, source = 'default'): string {
    return `workflow:${executionId}:${source}`;
  }

  /**
   * 🧪 DEVELOPMENT UTILITIES
   */

  // Clear all cache (dev only)
  clearAll(): void {
    const size = this.contextCache.size;
    this.contextCache.clear();
    this.logger.warn(`🧪 DEV: Cleared all cache entries (${size})`);
  }

  // List all keys (dev only)
  getAllKeys(): string[] {
    return Array.from(this.contextCache.keys());
  }

  // Get all contexts (dev only)
  getAllContexts(): WorkflowContextState[] {
    return Array.from(this.contextCache.values());
  }
}
