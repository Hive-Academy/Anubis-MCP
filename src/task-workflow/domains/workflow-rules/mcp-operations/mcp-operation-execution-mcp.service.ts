import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { ZodSchema, z } from 'zod';
import { CoreServiceOrchestrator } from '../services/core-service-orchestrator.service';
import { RequiredInputExtractorService } from '../services/required-input-extractor.service';
import { getErrorMessage } from '../utils/type-safety.utils';
import { BaseMcpService } from '../utils/mcp-response.utils';

// ===================================================================
// 🔥 MCP OPERATION EXECUTION SERVICE - DEDICATED MCP_CALL HANDLER
// ===================================================================
// Purpose: Clean separation of MCP operation execution from step guidance
// Scope: Internal MCP_CALL operations only (TaskOperations, ResearchOperations, etc.)
// ZERO Step Logic: Pure MCP operation delegation and execution

// 🎯 STRICT TYPE DEFINITIONS WITH COMPREHENSIVE SERVICE MAPPING

const ExecuteMcpOperationInputSchema = z.object({
  serviceName: z
    .enum([
      'TaskOperations',
      'PlanningOperations',
      'WorkflowOperations',
      'ReviewOperations',
      'ResearchOperations',
      'SubtaskOperations',
    ])
    .describe('Service name - must be one of the supported services'),
  operation: z
    .string()
    .describe('Operation name - must be supported by the selected service'),
  parameters: z
    .unknown()
    .optional()
    .describe(
      'Operation parameters for the service (optional for some operations)',
    ),
});

const GetOperationSchemaInputSchema = z.object({
  serviceName: z
    .enum([
      'TaskOperations',
      'PlanningOperations',
      'WorkflowOperations',
      'ReviewOperations',
      'ResearchOperations',
      'SubtaskOperations',
    ])
    .describe('Service name to get schema for'),
  operation: z
    .string()
    .optional()
    .describe('Optional operation name to get specific operation schema'),
});

type ExecuteMcpOperationInput = z.infer<typeof ExecuteMcpOperationInputSchema>;
type GetOperationSchemaInput = z.infer<typeof GetOperationSchemaInputSchema>;

/**
 * 🚀 MCP Operation Execution Service
 *
 * DEDICATED SERVICE FOR MCP_CALL OPERATIONS:
 * - Clear separation from step execution logic
 * - Focused on internal MCP operations only
 * - Direct delegation to CoreServiceOrchestrator
 * - Parameter extraction and validation support
 * - Clean error handling and response formatting
 * - Extends BaseMcpService for consistent response building
 */
@Injectable()
export class McpOperationExecutionMcpService extends BaseMcpService {
  private readonly logger = new Logger(McpOperationExecutionMcpService.name);

  constructor(
    private readonly coreServiceOrchestrator: CoreServiceOrchestrator,
    private readonly requiredInputService: RequiredInputExtractorService,
  ) {
    super();
  }

  // ===================================================================
  // 🔥 NEW: GET OPERATION SCHEMA TOOL - For understanding parameter structure
  // ===================================================================

  @Tool({
    name: 'get_operation_schema',
    description: `Get the parameter schema definition for a specific MCP service and operation. Returns the exact structure needed for parameters when calling execute_mcp_operation. Useful for understanding what parameters are required and optional for any service operation.`,
    parameters:
      GetOperationSchemaInputSchema as ZodSchema<GetOperationSchemaInput>,
  })
  getOperationSchema(input: GetOperationSchemaInput) {
    try {
      this.logger.log(
        `Getting schema for: ${input.serviceName}${input.operation ? `.${input.operation}` : ''}`,
      );

      // Extract schema using the same service that step guidance uses
      const schemaResult = this.requiredInputService.extractFromServiceSchema(
        input.serviceName,
        input.operation,
      );

      return this.buildMinimalResponse({
        success: true,
        data: {
          serviceName: input.serviceName,
          operation: input.operation || 'all operations',
          schema: schemaResult.schemaDefinition,
        },
      });
    } catch (error) {
      return this.buildErrorResponse(
        `Failed to get schema for ${input.serviceName}${input.operation ? `.${input.operation}` : ''}`,
        getErrorMessage(error),
        'SCHEMA_EXTRACTION_ERROR',
      );
    }
  }

  // ===================================================================
  // 🚀 MCP OPERATION EXECUTION TOOL - Core workflow operations
  // ===================================================================

  @Tool({
    name: 'execute_mcp_operation',
    description: `Core workflow operations service for executing database and business logic operations through MCP services like TaskOperations, PlanningOperations, WorkflowOperations, etc. Uses consistent parameters and follows strict naming conventions.`,
    parameters:
      ExecuteMcpOperationInputSchema as ZodSchema<ExecuteMcpOperationInput>,
  })
  async executeMcpOperation(input: ExecuteMcpOperationInput) {
    try {
      this.logger.log(
        `Executing MCP operation: ${input.serviceName}.${input.operation}`,
      );

      // Log the exact parameters received for debugging
      this.logger.debug(
        `Parameters received: ${JSON.stringify(input.parameters, null, 2)}`,
      );

      // Validate that the operation is supported
      const supportedServices =
        this.coreServiceOrchestrator.getSupportedServices();
      const supportedOperations = supportedServices[input.serviceName];

      if (!supportedOperations) {
        throw new Error(
          `Service '${input.serviceName}' is not supported. Available services: ${Object.keys(supportedServices).join(', ')}`,
        );
      }

      if (!supportedOperations.includes(input.operation)) {
        throw new Error(
          `Operation '${input.operation}' is not supported for service '${input.serviceName}'. Available operations: ${supportedOperations.join(', ')}`,
        );
      }

      // Route to CoreServiceOrchestrator for actual execution
      // IMPORTANT: Pass parameters as-is without transformation - they should match the expected structure
      const operationResult =
        await this.coreServiceOrchestrator.executeServiceCall(
          input.serviceName,
          input.operation,
          (input.parameters as Record<string, unknown>) || {}, // Use parameters exactly as sent by AI
        );

      // ✅ MINIMAL RESPONSE: Only essential operation result
      return this.buildMinimalResponse({
        success: operationResult.success,
        data: operationResult.data,
        ...(operationResult.error && { error: operationResult.error }),
        ...(operationResult.duration && { duration: operationResult.duration }),
      });
    } catch (error) {
      return this.buildErrorResponse(
        `Failed to execute ${input.serviceName}.${input.operation}`,
        getErrorMessage(error),
        'MCP_OPERATION_ERROR',
      );
    }
  }
}
