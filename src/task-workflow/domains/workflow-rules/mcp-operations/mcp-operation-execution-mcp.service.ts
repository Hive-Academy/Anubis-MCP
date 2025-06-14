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

**SUPPORTED SERVICES AND OPERATIONS:**

**TaskOperations Service:**
- create: Create new task with comprehensive data
- update: Update existing task properties and status
- get: Retrieve task details with optional inclusions
- list: List tasks with filtering and pagination

**PlanningOperations Service:**
- create_plan: Create implementation plan for a task
- update_plan: Update existing implementation plan
- get_plan: Retrieve plan with optional subtasks (use includeBatches: true)
- create_subtasks: Create batch of subtasks for a plan
- update_batch: Update status of entire subtask batch
- get_batch: Retrieve specific subtask batch

**WorkflowOperations Service:**
- delegate: Delegate task to another role with context
- complete: Mark workflow as completed
- escalate: Escalate task to higher authority

**ReviewOperations Service:**
- create_review: Create code review for completed work
- update_review: Update review status and feedback
- get_review: Retrieve review details
- create_completion: Mark review as completed

**ResearchOperations Service:**
- create_research: Create research task
- update_research: Update research findings
- get_research: Retrieve research details
- add_comment: Add comment to research

**SubtaskOperations Service:**
- create_subtask: Create individual subtask with detailed specs
- update_subtask: Update subtask status and completion evidence
- get_subtask: Retrieve subtask details with dependencies
- get_next_subtask: Get next available subtask for execution

**PARAMETER EXAMPLES:**

TaskOperations.create:
{
  "taskName": "Task name",
  "description": "Detailed description", 
  "priority": "High|Medium|Low|Critical",
  "requirements": "Specific requirements"
}

TaskOperations.get:
{
  "taskId": 123,
  "includeAnalysis": true,
  "includePlans": true,
  "includeSubtasks": true
}

PlanningOperations.get_plan:
{
  "taskId": 123,
  "includeBatches": true
}

SubtaskOperations.update_subtask:
{
  "taskId": 123,
  "subtaskId": 456,
  "updateData": {
    "status": "completed|in-progress|not-started",
    "completionEvidence": {
      "implementationSummary": "What was implemented",
      "filesModified": ["file1.ts", "file2.ts"],
      "duration": "30 minutes"
    }
  }
}

WorkflowOperations.delegate:
{
  "taskId": 123,
  "targetRole": "code-review",
  "delegationContext": "Implementation completed with evidence"
}

**USAGE PATTERN:**
AI collects required data, then calls:
{
  "serviceName": "TaskOperations",
  "operation": "create", 
  "parameters": { taskName: "...", description: "...", priority: "High" }
}`,
    parameters:
      ExecuteMcpOperationInputSchema as ZodSchema<ExecuteMcpOperationInput>,
  })
  async executeMcpOperation(input: ExecuteMcpOperationInput) {
    try {
      this.logger.log(
        `Executing MCP operation: ${input.serviceName}.${input.operation}`,
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
      const operationResult =
        await this.coreServiceOrchestrator.executeServiceCall(
          input.serviceName,
          input.operation,
          (input.parameters as Record<string, unknown>) || {},
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
