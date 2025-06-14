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
 * - Extends BaseMcpService for consistent response building
 */
@Injectable()
export class McpOperationExecutionMcpService extends BaseMcpService {
  private readonly logger = new Logger(McpOperationExecutionMcpService.name);

  constructor(
    private readonly coreServiceOrchestrator: CoreServiceOrchestrator,
    private readonly requiredInputExtractorService: RequiredInputExtractorService,
  ) {
    super();
  }

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
}
