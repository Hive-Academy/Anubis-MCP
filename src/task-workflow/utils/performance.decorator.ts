import { PerformanceMonitorService } from './performance-monitor.service';
import { MCPCacheService } from './mcp-cache.service';

/**
 * Performance monitoring decorator for MCP operations
 * Automatically tracks performance metrics and handles caching
 */
export function MCPPerformance(options: {
  operation: string;
  cacheable?: boolean;
  cacheKey?: (args: any[]) => string;
  cacheTTL?: number;
}) {
  return function (
    _target: any,
    _propertyName: string,
    descriptor: PropertyDescriptor,
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]): Promise<unknown> {
      // Get services from the class instance (assumes they're injected)
      const performanceMonitor: PerformanceMonitorService =
        this.performanceMonitor;
      const cacheService: MCPCacheService = this.cacheService;

      const operationId = `${options.operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Start performance monitoring
      performanceMonitor?.startOperation(operationId, options.operation);
      let responseSize = 0;

      try {
        // Check cache if operation is cacheable
        if (options.cacheable && cacheService) {
          const cacheKey = options.cacheKey
            ? options.cacheKey(args)
            : `${options.operation}:${JSON.stringify(args)}`;

          const cachedResult = await cacheService.get(cacheKey, operationId);
          if (cachedResult) {
            responseSize = JSON.stringify(cachedResult).length;
            await performanceMonitor?.endOperation(operationId, responseSize);
            return cachedResult;
          } else {
            performanceMonitor?.recordCacheMiss(operationId);
          }
        }

        // Execute the original method
        const result = (await method.apply(this, args)) as unknown;
        responseSize = JSON.stringify(result).length;

        // Cache the result if cacheable
        if (options.cacheable && cacheService) {
          const cacheKey = options.cacheKey
            ? options.cacheKey(args)
            : `${options.operation}:${JSON.stringify(args)}`;

          const ttl =
            options.cacheTTL ||
            cacheService.getTTLForOperation(options.operation);
          await cacheService.set(cacheKey, result, { ttl });
        }

        // End performance monitoring
        await performanceMonitor?.endOperation(operationId, responseSize);

        return result;
      } catch (error) {
        performanceMonitor?.recordError(operationId);
        await performanceMonitor?.endOperation(operationId, responseSize);
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Cache key generators for common MCP operations
 */
export class CacheKeyGenerators {
  static taskContext(args: any[]): string {
    // Handle both array and direct input cases
    const input = Array.isArray(args) ? args[0] : args;
    return `task_context:${input.taskId}:${input.includeLevel || 'basic'}:${input.includeAnalysis || false}`;
  }

  static workflowStatus(args: any[]): string {
    // Handle both array and direct input cases
    const input = Array.isArray(args) ? args[0] : args;
    return `workflow_status:${input.taskId || 'all'}:${input.queryType}:${input.currentRole || 'any'}`;
  }

  static batchSubtasks(args: any[]): string {
    // Handle both array and direct input cases
    const input = Array.isArray(args) ? args[0] : args;
    return `batch_subtasks:${input.taskId}:${input.batchId}:${input.operation}`;
  }

  static reports(args: any[]): string {
    // Handle both array and direct input cases
    const input = Array.isArray(args) ? args[0] : args;
    return `reports:${input.taskId}:${input.reportTypes?.join(',') || 'all'}:${input.mode || 'detailed'}`;
  }
}
