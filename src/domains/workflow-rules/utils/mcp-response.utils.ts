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
 * 🎯 BaseMcpService Abstract Class
 *
 * Abstract Factory pattern implementation for MCP response building.
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
 *       return this.buildMinimalResponse(result);
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
   * Build minimal response for successful MCP operations
   *
   * Maintains exact response format compatibility with existing services.
   * Uses JSON.stringify with 2-space indentation for consistent formatting.
   *
   * @param data - Data to include in response (any serializable type)
   * @returns Standardized MCP response structure
   */
  protected buildMinimalResponse(data: unknown): McpResponse {
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }

  /**
   * Build error response for failed MCP operations
   *
   * Provides consistent error response format across all MCP services.
   * Includes timestamp and structured error information for debugging.
   *
   * @param message - High-level error message
   * @param error - Detailed error information
   * @param code - Error code for categorization
   * @returns Standardized MCP error response structure
   */
  protected buildErrorResponse(
    message: string,
    error: string,
    code: string,
  ): McpErrorResponse {
    const errorDetails: ErrorDetails = {
      type: 'error',
      success: false,
      error: {
        message,
        details: error,
        code,
      },
      timestamp: new Date().toISOString(),
    };

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(errorDetails, null, 2),
        },
      ],
    };
  }

  /**
   * Build success response with additional metadata
   *
   * Enhanced response builder for operations that need metadata.
   * Useful for operations that require timing, status, or other contextual information.
   *
   * @param data - Primary response data
   * @param metadata - Additional metadata (optional)
   * @returns Enhanced MCP response with metadata
   */
  protected buildSuccessResponse(
    data: unknown,
    metadata?: Record<string, unknown>,
  ): McpResponse {
    const responseData = {
      success: true,
      data,
      ...(metadata && { metadata }),
      timestamp: new Date().toISOString(),
    };

    return this.buildMinimalResponse(responseData);
  }

  /**
   * Build response with custom structure
   *
   * Flexible response builder for specialized response formats.
   * Maintains consistent JSON formatting while allowing custom structure.
   *
   * @param responseStructure - Custom response structure
   * @returns MCP response with custom structure
   */
  protected buildCustomResponse(responseStructure: unknown): McpResponse {
    return this.buildMinimalResponse(responseStructure);
  }
}
