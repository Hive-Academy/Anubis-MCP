import { Injectable, Inject } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { Prisma, ResearchReport } from 'generated/prisma';
import { ZodSchema } from 'zod';
import {
  BaseMcpService,
  McpResponse,
} from '../workflow-rules/utils/mcp-response.utils';
import {
  ResearchOperationsInput,
  ResearchOperationsInputSchema,
} from './schemas/research-operations.schema';
import { ResearchReportRepository } from './repositories/implementations/research-report.repository';
import { AutoWorkflowValidation } from '../workflow-rules/utils/dynamic-workflow-validation.util';

// Type-safe interfaces for research operations
export interface ResearchOperationResult {
  success: boolean;
  data?: ResearchReport;
  error?: {
    message: string;
    code: string;
    operation: string;
  };
  metadata?: {
    operation: string;
    taskId: number;
    responseTime: number;
  };
}

/**
 * Research Operations Service - MCP Tool
 * Handles research report lifecycle management for workflow tasks
 *
 * SOLID Principles Applied:
 * - Single Responsibility: Focused on research and communication operations only
 * - Open/Closed: Extensible through input schema without modifying core logic
 * - Liskov Substitution: Consistent interface for all research operations
 * - Interface Segregation: Clean separation of research concerns
 * - Dependency Inversion: Depends on PrismaService abstraction
 */
@Injectable()
export class ResearchOperationsService extends BaseMcpService {
  constructor(
    @Inject('IResearchReportRepository')
    private readonly researchReportRepository: ResearchReportRepository,
  ) {
    super();
  }

  @Tool({
    name: 'execute_research_operation',
    description:
      'Execute research operations including create, update, get, and list operations for research reports',
    parameters: ResearchOperationsInputSchema as ZodSchema,
  })
  @AutoWorkflowValidation(
    ResearchOperationsInputSchema,
    'execute_research_operation',
    {
      requiredIds: ['taskId'],
      allowBootstrap: false,
      contextSelectionStrategy: 'byTaskId',
    },
  )
  async executeResearchOperation(
    input: ResearchOperationsInput,
  ): Promise<McpResponse> {
    const startTime = performance.now();

    try {
      let result: ResearchReport | { message: string; researchId: number };

      switch (input.operation) {
        case 'create_research':
          result = await this.createResearch(input);
          break;
        case 'update_research':
          result = await this.updateResearch(input);
          break;
        case 'get_research':
          result = await this.getResearch(input);
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
          responseTime: Math.round(responseTime),
        },
      });
    } catch (error: any) {
      return this.buildResponse({
        success: false,
        error: {
          message: error.message,
          code: 'RESEARCH_OPERATION_FAILED',
          operation: input.operation,
        },
      });
    }
  }

  private async createResearch(
    input: ResearchOperationsInput,
  ): Promise<{ message: string; researchId: number }> {
    const { taskId, researchData } = input;

    if (!researchData) {
      throw new Error('Research data is required for creation');
    }

    const research = await this.researchReportRepository.create({
      task: { connect: { id: taskId } },
      title: researchData.title || 'Research Report',
      summary: researchData.summary || '',
      findings: researchData.findings,
      recommendations: researchData.recommendations || '',
      references: researchData.references || [],
    } satisfies Prisma.ResearchReportCreateInput);

    return {
      message: `Research report created successfully for task ${taskId}`,
      researchId: research.id,
    };
  }

  private async updateResearch(
    input: ResearchOperationsInput,
  ): Promise<ResearchReport> {
    const { taskId, researchData } = input;

    if (!researchData) {
      throw new Error('Research data is required for update');
    }

    // Find the research report by taskId first
    const existingReports =
      await this.researchReportRepository.findByTaskId(taskId);

    if (!existingReports || existingReports.length === 0) {
      throw new Error(`Research report not found for task ${taskId}`);
    }

    const existingResearch = existingReports[0]; // Get the most recent one

    const updateData: any = {};

    if (researchData.title) updateData.title = researchData.title;
    if (researchData.summary) updateData.summary = researchData.summary;
    if (researchData.findings) updateData.findings = researchData.findings;
    if (researchData.recommendations)
      updateData.recommendations = researchData.recommendations;
    if (researchData.references)
      updateData.references = researchData.references;

    const research = await this.researchReportRepository.update(
      existingResearch.id,
      updateData,
    );

    return research;
  }

  private async getResearch(
    input: ResearchOperationsInput,
  ): Promise<ResearchReport> {
    const { taskId } = input;

    const reports = await this.researchReportRepository.findByTaskId(taskId);

    if (!reports || reports.length === 0) {
      throw new Error(`Research report not found for task ${taskId}`);
    }

    return reports[0]; // Return the most recent one
  }
}
