import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { ZodSchema, z } from 'zod';
import { CoreServiceOrchestrator } from '../services/core-service-orchestrator.service';
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

**SUPPORTED SERVICES AND OPERATIONS:**

**TaskOperations Service:**
- create: Create new task with comprehensive data
- update: Update existing task properties and status
- get: Retrieve task details with optional inclusions (CONSISTENT: uses taskId)
- list: List tasks with filtering and pagination

**PlanningOperations Service:**
- create_plan: Create implementation plan for a task (CONSISTENT: uses taskId)
- update_plan: Update existing implementation plan (CONSISTENT: uses taskId)
- get_plan: Retrieve plan with optional subtasks (CONSISTENT: uses taskId)
- create_subtasks: Create batch of subtasks for a plan (CONSISTENT: uses taskId)
- update_batch: Update status of entire subtask batch (CONSISTENT: uses taskId)
- get_batch: Retrieve specific subtask batch (CONSISTENT: uses taskId)

**WorkflowOperations Service:**
- delegate: Delegate task to another role with context (CONSISTENT: uses taskId)
- complete: Mark workflow as completed (CONSISTENT: uses taskId)
- escalate: Escalate task to higher authority (CONSISTENT: uses taskId)

**ReviewOperations Service:**
- create_review: Create code review for completed work (CONSISTENT: uses taskId)
- update_review: Update review status and feedback (CONSISTENT: uses taskId)
- get_review: Retrieve review details (CONSISTENT: uses taskId)
- create_completion: Mark review as completed (CONSISTENT: uses taskId)

**ResearchOperations Service:**
- create_research: Create research task (CONSISTENT: uses taskId)
- update_research: Update research findings (CONSISTENT: uses taskId)
- get_research: Retrieve research details (CONSISTENT: uses taskId)
- add_comment: Add comment to research (CONSISTENT: uses taskId)

**SubtaskOperations Service:**
- create_subtask: Create individual subtask with detailed specs (CONSISTENT: uses taskId)
- update_subtask: Update subtask status and completion evidence (CONSISTENT: uses taskId AND subtaskId)
- get_subtask: Retrieve subtask details with dependencies (CONSISTENT: uses subtaskId)
- get_next_subtask: Get next available subtask for execution (CONSISTENT: uses taskId)

**EXACT PARAMETER STRUCTURES USED BY AI:**

TaskOperations.get (CONSISTENT PARAMETERS):
{
  "serviceName": "TaskOperations",
  "operation": "get",
  "parameters": {
    "taskId": 2,
    "includeAnalysis": true,
    "includePlans": true,
    "includeSubtasks": true
  }
}

PlanningOperations.get_plan (CONSISTENT PARAMETERS):
{
  "serviceName": "PlanningOperations",
  "operation": "get_plan", 
  "parameters": {
    "taskId": 2,
    "includeBatches": true
  }
}

SubtaskOperations.get_next_subtask (CONSISTENT PARAMETERS):
{
  "serviceName": "SubtaskOperations",
  "operation": "get_next_subtask",
  "parameters": {
    "taskId": 2
  }
}

SubtaskOperations.update_subtask (CONSISTENT PARAMETERS):
{
  "serviceName": "SubtaskOperations",
  "operation": "update_subtask",
  "parameters": {
    "taskId": 2,
    "subtaskId": 8,
    "updateData": {
      "status": "in-progress",
      "completionEvidence": {
        "implementationSummary": "What was implemented",
        "filesModified": ["file1.ts", "file2.ts"],
        "duration": "30 minutes"
      }
    }
  }
}

SubtaskOperations.get_subtask (CONSISTENT PARAMETERS):
{
  "serviceName": "SubtaskOperations",
  "operation": "get_subtask",
  "parameters": {
    "subtaskId": 8
  }
}

WorkflowOperations.delegate (CONSISTENT PARAMETERS):
{
  "serviceName": "WorkflowOperations",
  "operation": "delegate",
  "parameters": {
    "taskId": 2,
    "targetRole": "code-review",
    "delegationContext": "Implementation completed with evidence"
  }
}

TaskOperations.create (CONSISTENT PARAMETERS):
{
  "serviceName": "TaskOperations",
  "operation": "create",
  "parameters": {
    "taskName": "Task name",
    "description": "Detailed description", 
    "priority": "High",
    "requirements": "Specific requirements",
    "executionId": "execution-id-for-linking"
  }
}

**PARAMETER CONSISTENCY RULES:**
1. ALWAYS use "taskId" for task identification (never "id")
2. ALWAYS use "subtaskId" for subtask identification (never "id") 
3. ALWAYS use consistent parameter names across all operations
4. ALWAYS match the exact parameter structure the AI sends
5. NEVER require parameter mapping or transformation

**USAGE PATTERN:**
AI sends exact parameters as shown above, MCP server handles them directly without transformation.`,
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
        serviceName: input.serviceName,
        operation: input.operation,
        success: operationResult.success,
        data: operationResult.data,
        ...(operationResult.error && { error: operationResult.error }),
        metadata: {
          operation: input.operation,
          serviceValidated: true,
          supportedOperations: supportedOperations,
          responseTime: operationResult.duration,
        },
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
