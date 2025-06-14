import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { ZodSchema, z } from 'zod';
import { CoreServiceOrchestrator } from '../services/core-service-orchestrator.service';
import { RequiredInputExtractorService } from '../services/required-input-extractor.service';
import { getErrorMessage } from '../utils/type-safety.utils';

// ===================================================================
// 🔥 MCP OPERATION EXECUTION SERVICE - DEDICATED MCP_CALL HANDLER
// ===================================================================
// Purpose: Clean separation of MCP operation execution from step guidance
// Scope: Internal MCP_CALL operations only (TaskOperations, ResearchOperations, etc.)
// ZERO Step Logic: Pure MCP operation delegation and execution

// 🎯 STRICT TYPE DEFINITIONS

const ExecuteMcpOperationInputSchema = z.object({
  serviceName: z
    .string()
    .describe('Service name (TaskOperations, ResearchOperations, etc.)'),
  operation: z.string().describe('Operation name (create, update, get, etc.)'),
  parameters: z.unknown().describe('Operation parameters for the service'),
});

type ExecuteMcpOperationInput = z.infer<typeof ExecuteMcpOperationInputSchema>;

/**
 * 🚀 MCP Operation Execution Service
 *
 * DEDICATED SERVICE FOR MCP_CALL OPERATIONS:
 * - Clear separation from step execution logic
 * - Focused on internal MCP operations only
 * - Direct delegation to CoreServiceOrchestrator
 * - Parameter extraction and validation support
 * - Clean error handling and response formatting
 */
@Injectable()
export class McpOperationExecutionMcpService {
  private readonly logger = new Logger(McpOperationExecutionMcpService.name);

  constructor(
    private readonly coreServiceOrchestrator: CoreServiceOrchestrator,
    private readonly requiredInputExtractorService: RequiredInputExtractorService,
  ) {}

  // ===================================================================
  // 🚀 MCP OPERATION EXECUTION TOOL - Core workflow operations
  // ===================================================================

  @Tool({
    name: 'execute_mcp_operation',
    description: `Execute MCP service operations for workflow management.

🎯 CORE WORKFLOW OPERATIONS - Database and business logic execution

**This tool enables proper MCP workflow:**
1. AI gets guidance with MCP_CALL instructions 
2. AI collects required data using intelligence + local tools
3. AI calls this tool with complete parameters
4. MCP server executes operation through core services
5. MCP server returns results to AI

**Supported Services:**
- TaskOperations: create, update, get, list
- ResearchOperations: create_research, update_research, add_comment
- WorkflowOperations: delegate, complete, escalate
- PlanningOperations: create_plan, create_subtasks
- ReviewOperations: create_review, create_completion

**Example:**
AI collects task data, then calls:
{
  "serviceName": "TaskOperations",
  "operation": "create", 
  "parameters": { taskName: "...", description: "...", ... }
}`,
    parameters:
      ExecuteMcpOperationInputSchema as ZodSchema<ExecuteMcpOperationInput>,
  })
  async executeMcpOperation(input: ExecuteMcpOperationInput) {
    try {
      this.logger.log(
        `Executing MCP operation: ${input.serviceName}.${input.operation}`,
      );

      // Route to CoreServiceOrchestrator for actual execution
      const operationResult =
        await this.coreServiceOrchestrator.executeServiceCall(
          input.serviceName,
          input.operation,
          input.parameters as Record<string, unknown>,
        );

      // ✅ MINIMAL RESPONSE: Only essential operation result
      return this.buildMinimalResponse({
        serviceName: input.serviceName,
        operation: input.operation,
        success: operationResult.success,
        data: operationResult.data,
      });
    } catch (error) {
      return this.buildErrorResponse(
        `Failed to execute ${input.serviceName}.${input.operation}`,
        getErrorMessage(error),
        'MCP_OPERATION_ERROR',
      );
    }
  }

  // ===================================================================
  // 📋 PARAMETER GUIDANCE TOOLS - Help AI understand required parameters
  // ===================================================================

  @Tool({
    name: 'get_mcp_operation_parameters',
    description: `Get required and optional parameters for MCP operations.

🎯 PARAMETER GUIDANCE - Help AI understand what data is needed

**Returns:**
- Required parameters with descriptions
- Optional parameters and defaults
- Parameter validation rules
- Usage examples

**Example:**
{
  "serviceName": "TaskOperations",
  "operation": "create"
}`,
    parameters: z.object({
      serviceName: z.string().describe('Service name to query'),
      operation: z.string().describe('Operation to get parameters for'),
    }) as ZodSchema<{ serviceName: string; operation: string }>,
  })
  getMcpOperationParameters(input: { serviceName: string; operation: string }) {
    try {
      this.logger.log(
        `Getting parameter requirements for: ${input.serviceName}.${input.operation}`,
      );

      // Extract parameter requirements using RequiredInputExtractorService
      const extraction =
        this.requiredInputExtractorService.extractFromServiceSchema(
          input.serviceName,
          input.operation,
        );

      return this.buildMinimalResponse({
        serviceName: input.serviceName,
        operation: input.operation,
        requiredParameters: extraction.requiredParameters,
        optionalParameters: extraction.optionalParameters,
        parameterDetails: extraction.parameterDetails,
        usage: `Call execute_mcp_operation with serviceName: "${input.serviceName}", operation: "${input.operation}", and these parameters`,
      });
    } catch (error) {
      return this.buildErrorResponse(
        `Failed to get parameters for ${input.serviceName}.${input.operation}`,
        getErrorMessage(error),
        'PARAMETER_EXTRACTION_ERROR',
      );
    }
  }

  @Tool({
    name: 'list_supported_mcp_operations',
    description: `List all supported MCP services and their operations.

🎯 SERVICE DISCOVERY - Find available operations

**Returns:**
- All supported services
- Available operations per service
- Service descriptions and capabilities`,
    parameters: z.object({
      serviceFilter: z
        .string()
        .optional()
        .describe('Optional service name filter'),
    }) as ZodSchema<{ serviceFilter?: string }>,
  })
  listSupportedMcpOperations(input: { serviceFilter?: string }) {
    try {
      this.logger.log('Listing supported MCP operations');

      const supportedServices =
        this.coreServiceOrchestrator.getSupportedServices();

      // Filter by service if requested
      const filteredServices = input.serviceFilter
        ? { [input.serviceFilter]: supportedServices[input.serviceFilter] }
        : supportedServices;

      return this.buildMinimalResponse({
        supportedServices: filteredServices,
        totalServices: Object.keys(filteredServices).length,
        serviceNames: Object.keys(filteredServices),
        usage:
          'Use execute_mcp_operation with any of these serviceName/operation combinations',
      });
    } catch (error) {
      return this.buildErrorResponse(
        'Failed to list supported operations',
        getErrorMessage(error),
        'SERVICE_DISCOVERY_ERROR',
      );
    }
  }

  // ===================================================================
  // 🔧 PRIVATE HELPER METHODS
  // ===================================================================

  private buildErrorResponse(message: string, error: string, code: string) {
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(
            {
              type: 'error',
              success: false,
              error: {
                message,
                details: error,
                code,
              },
              timestamp: new Date().toISOString(),
            },
            null,
            2,
          ),
        },
      ],
    };
  }

  private buildMinimalResponse(data: unknown) {
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }
}
