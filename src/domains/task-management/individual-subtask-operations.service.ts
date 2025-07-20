import { Injectable } from '@nestjs/common';
import { ZodSchema } from 'zod';
import { Subtask } from 'generated/prisma';
import {
  IndividualSubtaskOperationsInput,
  IndividualSubtaskOperationsInputSchema,
  BulkSubtaskCreationResult,
} from './schemas/individual-subtask-operations.schema';
import { Tool } from '@rekog/mcp-nest';
import {
  BaseMcpService,
  McpResponse,
} from '../workflow-rules/utils/mcp-response.utils';
import { AutoWorkflowValidation } from '../workflow-rules/utils/dynamic-workflow-validation.util';

// Import focused services
import { SubtaskCreationService } from './services/subtask-creation.service';
import { SubtaskUpdateService } from './services/subtask-update.service';
import { SubtaskQueryService } from './services/subtask-query.service';

// Type-safe interfaces for subtask operations
export interface SubtaskOperationResult {
  success: boolean;
  data?:
    | Subtask
    | SubtaskWithEvidence
    | NextSubtaskResult
    | SubtaskCreationResult
    | SubtaskUpdateResult
    | BulkSubtaskCreationResult;
  error?: {
    message: string;
    code: string;
    operation: string;
  };
  metadata?: {
    operation: string;
    taskId: number;
    subtaskId?: number;
    responseTime: number;
  };
}

export interface SubtaskWithEvidence {
  subtask: Subtask;
  completionEvidence?: any;
}

export interface NextSubtaskResult {
  nextSubtask: Subtask | null;
  message: string;
}

export interface SubtaskCreationResult {
  message: string;
}

export interface SubtaskUpdateResult {
  message: string;
}

/**
 * Individual Subtask Operations Service (MCP Tool) - OPTIMIZED THIN ORCHESTRATOR
 *
 * This service acts as a clean MCP interface that delegates all business logic
 * to focused, specialized services:
 *
 * - SubtaskCreationService: Individual and batch subtask creation
 * - SubtaskUpdateService: Status transitions and evidence collection
 * - SubtaskQueryService: Getting subtasks and finding next subtask (with in-progress detection)
 *
 * Benefits:
 * ✅ Single Responsibility: Only handles MCP orchestration
 * ✅ Dependency Injection: Clean separation of concerns
 * ✅ Testability: Each service can be tested independently
 * ✅ Maintainability: Changes isolated to specific services
 * ✅ Clean Architecture: Business logic separated from MCP concerns
 */
@Injectable()
export class IndividualSubtaskOperationsService extends BaseMcpService {
  constructor(
    private readonly subtaskCreationService: SubtaskCreationService,
    private readonly subtaskUpdateService: SubtaskUpdateService,
    private readonly subtaskQueryService: SubtaskQueryService,
  ) {
    super();
  }

  @Tool({
    name: 'individual_subtask_operations',
    description:
      'Execute individual subtask operations including creation, updates, dependency tracking, and batch management with evidence collection',
    parameters: IndividualSubtaskOperationsInputSchema as ZodSchema,
  })
  @AutoWorkflowValidation(
    IndividualSubtaskOperationsInputSchema,
    'individual_subtask_operations',
    {
      requiredIds: ['taskId'],
      allowBootstrap: false,
      contextSelectionStrategy: 'byTaskId',
    },
  )
  async executeIndividualSubtaskOperation(
    input: IndividualSubtaskOperationsInput,
  ): Promise<McpResponse> {
    const startTime = performance.now();

    try {
      let result:
        | Subtask
        | NextSubtaskResult
        | SubtaskCreationResult
        | SubtaskUpdateResult
        | BulkSubtaskCreationResult;

      // Delegate to appropriate focused service based on operation
      switch (input.operation) {
        case 'create_subtask':
          result = await this.subtaskCreationService.createSubtask(input);
          break;
        case 'create_subtasks_batch':
          result = await this.subtaskCreationService.createSubtasksBatch(input);
          break;
        case 'update_subtask':
          result = await this.subtaskUpdateService.updateSubtask(input);
          break;
        case 'get_subtask':
          result = await this.subtaskQueryService.getSubtask(input);
          break;
        case 'get_next_subtask':
          result = await this.subtaskQueryService.getNextSubtask(input);
          break;
        default:
          throw new Error(`Unknown operation: ${String(input.operation)}`);
      }

      const responseTime = performance.now() - startTime;

      return this.buildResponse({
        success: true,
        data: result,
        metadata: {
          operation: input.operation,
          taskId: input.taskId,
          subtaskId: input.subtaskId,
          responseTime: Math.round(responseTime),
        },
      });
    } catch (error: any) {
      return this.buildResponse({
        success: false,
        error: {
          message: error.message,
          code: 'SUBTASK_OPERATION_FAILED',
          operation: input.operation,
        },
      });
    }
  }

  /**
   * Internal method for backward compatibility
   * Allows other services to call subtask operations without MCP wrapping
   */
  async executeIndividualSubtaskOperationInternal(
    input: IndividualSubtaskOperationsInput,
  ): Promise<SubtaskOperationResult> {
    const startTime = performance.now();

    try {
      let result:
        | Subtask
        | SubtaskWithEvidence
        | NextSubtaskResult
        | SubtaskCreationResult
        | SubtaskUpdateResult
        | BulkSubtaskCreationResult;

      // Delegate to appropriate focused service based on operation
      switch (input.operation) {
        case 'create_subtask':
          result = await this.subtaskCreationService.createSubtask(input);
          break;
        case 'create_subtasks_batch':
          result = await this.subtaskCreationService.createSubtasksBatch(input);
          break;
        case 'update_subtask':
          result = await this.subtaskUpdateService.updateSubtask(input);
          break;
        case 'get_subtask':
          result = await this.subtaskQueryService.getSubtask(input);
          break;
        case 'get_next_subtask':
          result = await this.subtaskQueryService.getNextSubtask(input);
          break;
        default:
          throw new Error(`Unknown operation: ${String(input.operation)}`);
      }

      const responseTime = performance.now() - startTime;

      return {
        success: true,
        data: result,
        metadata: {
          operation: input.operation,
          taskId: input.taskId,
          subtaskId: input.subtaskId,
          responseTime: Math.round(responseTime),
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message,
          code: 'SUBTASK_OPERATION_FAILED',
          operation: input.operation,
        },
      };
    }
  }
}
