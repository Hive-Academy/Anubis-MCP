/**
 * 🚀 BaseMcpService Abstract Class
 *
 * ABSTRACT FACTORY PATTERN IMPLEMENTATION:
 * - Consolidates duplicate MCP response building methods
 * - Addresses verified redundancy in step-execution-mcp.service.ts,
 *   role-transition-mcp.service.ts, and mcp-operation-execution-mcp.service.ts
 * - Maintains exact response format compatibility for backward compatibility
 * - Provides type-safe response building with comprehensive error handling
 *
 * SOLID PRINCIPLES APPLIED:
 * - Single Responsibility: Focused solely on MCP response building
 * - Open/Closed: Extensible through inheritance, closed for modification
 * - Dependency Inversion: Abstract interface for concrete implementations
 */

/**
 * Standard MCP response content structure
 */
export interface McpResponseContent {
  type: 'text';
  text: string;
}

/**
 * Standard MCP response structure
 */
export interface McpResponse {
  content: McpResponseContent[];
}

/**
 * Error response structure for MCP operations
 */
export interface McpErrorResponse extends McpResponse {
  content: [
    {
      type: 'text';
      text: string; // JSON stringified error object
    },
  ];
}

/**
 * Error details structure
 */
export interface ErrorDetails {
  type: 'error';
  success: false;
  error: {
    message: string;
    details: string;
    code: string;
  };
  timestamp: string;
}

/**
 * Optimization configuration for JSON response optimization
 */
export interface OptimizationConfig {
  removeNulls?: boolean; // Remove null/undefined values (default: true)
  removeEmptyStrings?: boolean; // Remove empty strings (default: true)
  removeEmptyArrays?: boolean; // Remove empty arrays (default: false)
  removeEmptyObjects?: boolean; // Remove empty objects (default: false)
  flattenLevel?: number; // Max levels to flatten (default: 2)
  cleanMarkdown?: boolean; // Strip markdown formatting (default: true)
  preserveFields?: string[]; // Fields to never modify
}

const DEFAULT_CONFIG: OptimizationConfig = {
  removeNulls: true,
  removeEmptyStrings: true,
  removeEmptyArrays: true,
  removeEmptyObjects: true,
  flattenLevel: 2,
  cleanMarkdown: true,
  preserveFields: ['id', 'success', 'error'],
};

/**
 * 🎯 BaseMcpService Abstract Class
 *
 * Abstract Factory pattern implementation for MCP response building with optimization.
 * Eliminates duplicate response building methods across MCP services.
 *
 * USAGE:
 * ```typescript
 * @Injectable()
 * export class YourMcpService extends BaseMcpService {
 *   @Tool({...})
 *   async yourTool(input: YourInput) {
 *     try {
 *       const result = await this.processInput(input);
 *       return this.buildResponse(result);
 *     } catch (error) {
 *       return this.buildErrorResponse(
 *         'Operation failed',
 *         getErrorMessage(error),
 *         'OPERATION_ERROR'
 *       );
 *     }
 *   }
 * }
 * ```
 */
export abstract class BaseMcpService {
  /**
   * Build optimized response for MCP operations
   *
   * Single unified method that handles all response building with optimization.
   * Applies markdown cleaning, removes empty values, and formats consistently.
   *
   * @param data - Data to include in response (any serializable type)
   * @param config - Optional optimization configuration
   * @returns Optimized MCP response structure
   */
  protected buildResponse(
    data: unknown,
    config: Partial<OptimizationConfig> = {},
  ): McpResponse {
    // Apply optimization to the data
    const optimized = optimizeJson(data, {
      removeNulls: true,
      removeEmptyStrings: true,
      removeEmptyArrays: false,
      removeEmptyObjects: false,
      cleanMarkdown: true,
      flattenLevel: 2,
      ...config,
    });

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(optimized.optimized, null, 2),
        },
      ],
    };
  }

  /**
   * Build error response for failed MCP operations
   *
   * @param message - Error message
   * @param details - Error details
   * @param code - Error code
   * @returns Standardized error response
   */
  protected buildErrorResponse(
    message: string,
    details: string,
    code: string,
  ): McpErrorResponse {
    const errorDetails: ErrorDetails = {
      type: 'error',
      success: false,
      error: {
        message,
        details,
        code,
      },
      timestamp: new Date().toISOString(),
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(errorDetails, null, 2),
        },
      ],
    };
  }
}

/**
 * Unified JSON optimizer for reducing response size
 *
 * Single function that handles all optimization needs:
 * 1. Removes null/undefined/empty values (configurable)
 * 2. Cleans markdown formatting from text fields
 * 3. Flattens nested objects to reduce nesting (optional)
 * 4. Works with any JSON structure
 *
 * @param data - Any JSON-serializable object
 * @param config - Optional configuration
 * @returns Optimized object with estimated token savings
 */
export function optimizeJson(
  data: unknown,
  config: Partial<OptimizationConfig> = {},
): {
  optimized: unknown;
  originalSize: number;
  optimizedSize: number;
  savings: number;
  savingsPercent: number;
} {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // Handle null/undefined data
  if (data === null || data === undefined) {
    return {
      optimized: data,
      originalSize: 0,
      optimizedSize: 0,
      savings: 0,
      savingsPercent: 0,
    };
  }

  // Calculate original size
  const originalJson = JSON.stringify(data, null, 2);
  const originalSize = originalJson?.length || 0;

  let result = data;

  // Step 1: Remove unwanted values
  if (
    finalConfig.removeNulls ||
    finalConfig.removeEmptyStrings ||
    finalConfig.removeEmptyArrays ||
    finalConfig.removeEmptyObjects
  ) {
    result = cleanObject(result, finalConfig) as object;
  }

  // Step 2: Clean markdown from string fields
  if (finalConfig.cleanMarkdown) {
    result = cleanMarkdown(result, finalConfig.preserveFields || []) as object;
  }

  // Step 3: Flatten nested structures (limited depth)
  if (finalConfig.flattenLevel && finalConfig.flattenLevel > 0) {
    result = flattenObject(result, finalConfig.flattenLevel) as object;
  }

  // Calculate savings
  const optimizedJson = JSON.stringify(result, null, 2);
  const optimizedSize = optimizedJson?.length || 0;
  const savings = originalSize - optimizedSize;
  const savingsPercent =
    originalSize > 0 ? Math.round((savings / originalSize) * 100) : 0;

  return {
    optimized: result,
    originalSize,
    optimizedSize,
    savings,
    savingsPercent,
  };
}

/**
 * Clean object by removing unwanted values
 * Works recursively through nested objects and arrays
 */
function cleanObject(obj: unknown, config: OptimizationConfig): unknown {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj
      .map((item) => cleanObject(item, config))
      .filter((item) => {
        if (config.removeNulls && (item === null || item === undefined))
          return false;
        if (config.removeEmptyStrings && item === '') return false;
        if (
          config.removeEmptyArrays &&
          Array.isArray(item) &&
          item.length === 0
        )
          return false;
        return true;
      });
  }

  const result = {} as Record<string, unknown>;

  Object.entries(obj as Record<string, unknown>).forEach(([key, value]) => {
    // Never remove preserved fields
    if (config.preserveFields?.includes(key)) {
      result[key] = value;
      return;
    }

    // Remove based on config
    if (config.removeNulls && (value === null || value === undefined)) return;
    if (config.removeEmptyStrings && value === '') return;
    if (config.removeEmptyArrays && Array.isArray(value) && value.length === 0)
      return;
    if (
      config.removeEmptyObjects &&
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value) &&
      Object.keys(value).length === 0
    )
      return;

    // Recursively clean nested objects
    if (typeof value === 'object' && value !== null) {
      result[key] = cleanObject(value, config);
    } else {
      result[key] = value;
    }
  });

  return result;
}

/**
 * Clean markdown formatting from string fields in objects
 * Handles complex markdown and edge cases with fallback protection
 */
function cleanMarkdown(obj: unknown, preserveFields: string[]): unknown {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => cleanMarkdown(item, preserveFields));
  }

  const result = { ...obj } as Record<string, unknown>;

  Object.entries(result).forEach(([key, value]) => {
    // Skip preserved fields
    if (preserveFields.includes(key)) return;

    if (typeof value === 'string') {
      // Clean if it looks like markdown OR if it's a long string with newlines
      if (
        containsMarkdown(value) ||
        (value.length > 100 && value.includes('\n'))
      ) {
        try {
          let cleaned = value;

          // Handle escaped newlines
          cleaned = cleaned.replace(/\\n/g, '\n');

          // Clean markdown formatting
          cleaned = cleaned
            // Remove code block markers
            .replace(/```[\w]*\n?/g, '')
            .replace(/```/g, '')
            // Remove headers
            .replace(/^#+\s*/gm, '')
            // Remove bold/italic
            .replace(/\*\*([^*]+)\*\*/g, '$1')
            .replace(/\*([^*]+)\*/g, '$1')
            .replace(/__([^_]+)__/g, '$1')
            .replace(/_([^_]+)_/g, '$1')
            // Remove inline code
            .replace(/`([^`]+)`/g, '$1')
            // Remove links
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            // Clean up multiple newlines
            .replace(/\n{3,}/g, '\n\n')
            // Clean up excessive whitespace
            .replace(/[ \t]+/g, ' ')
            // Trim each line
            .split('\n')
            .map((line) => line.trim())
            .join('\n')
            .trim();

          // Only use cleaned version if it's significantly different and not empty
          if (cleaned && cleaned.length > 10 && cleaned !== value) {
            result[key] = cleaned;
          }
        } catch (error) {
          // If markdown cleaning fails, keep original
          console.warn(`Failed to clean markdown for field ${key}:`, error);
        }
      }
    } else if (typeof value === 'object' && value !== null) {
      result[key] = cleanMarkdown(value, preserveFields);
    }
  });

  return result;
}

/**
 * Detect if a string contains markdown formatting
 * Uses pattern matching to identify common markdown elements
 */
function containsMarkdown(text: string): boolean {
  if (!text || text.length < 5) return false;

  // Look for common markdown patterns
  const markdownPatterns = [
    /#+\s/, // Headers: # ## ###
    /\*\*.*?\*\*/, // Bold: **text**
    /\*.*?\*/, // Italic: *text*
    /`.*?`/, // Inline code: `code`
    /```[\s\S]*?```/, // Code blocks: ```code```
    /\[.*?\]\(.*?\)/, // Links: [text](url)
    /^\s*[-*+]\s/m, // Lists: - item
    /^\s*\d+\.\s/m, // Numbered lists: 1. item
    /\n\n/, // Double newlines (paragraph breaks)
    /\\n\\n/, // Escaped double newlines
    /\n#{1,6}\s/, // Headers at start of line
    /```\w+\n/, // Code block with language
    /\n\s*\*\s/, // List items on new lines
    /\n\s*-\s/, // Dash list items
    /\n\s*\d+\.\s/, // Numbered list items
  ];

  // Detect markdown patterns or multiple newlines
  const hasMarkdownPattern = markdownPatterns.some((pattern) =>
    pattern.test(text),
  );
  const hasMultipleNewlines = (text.match(/\n/g) || []).length > 2;
  const hasCodeBlocks = text.includes('`') || text.includes('\\n`');
  const hasHeaders = /^#+\s|\n#+\s/.test(text);

  return (
    hasMarkdownPattern || hasMultipleNewlines || hasCodeBlocks || hasHeaders
  );
}

/**
 * Flatten nested objects with depth control
 * Safely flattens objects without over-complicating structure
 */
function flattenObject(obj: unknown, maxDepth: number): unknown {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return obj;
  }

  try {
    const flattened = doFlatten(obj as Record<string, unknown>, maxDepth, 0);

    // Don't flatten if it creates too many keys
    const flattenedKeys = Object.keys(flattened);
    const originalKeys = Object.keys(obj as Record<string, unknown>);

    if (flattenedKeys.length > originalKeys.length * 3) {
      return obj;
    }

    return flattened;
  } catch (error) {
    console.warn('Failed to flatten object:', error);
    return obj;
  }
}

/**
 * Internal flattening implementation
 */
function doFlatten(
  obj: Record<string, unknown>,
  maxDepth: number,
  currentDepth: number,
): Record<string, unknown> {
  if (currentDepth >= maxDepth) return obj;

  const result: Record<string, unknown> = {};

  Object.entries(obj).forEach(([key, value]) => {
    if (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value) &&
      currentDepth < maxDepth
    ) {
      const flattened = doFlatten(
        value as Record<string, unknown>,
        maxDepth,
        currentDepth + 1,
      );
      Object.entries(flattened).forEach(([nestedKey, nestedValue]) => {
        result[`${key}.${nestedKey}`] = nestedValue;
      });
    } else {
      result[key] = value;
    }
  });

  return result;
}
