import { Injectable } from '@nestjs/common';
import { Prisma, ResearchReport } from 'generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';
import { ResearchOperationsInput } from './schemas/research-operations.schema';

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
 * Research Operations Service (Internal)
 *
 * Internal service for research reports and communication management.
 * No longer exposed as MCP tool - used by workflow-rules MCP interface.
 *
 * SOLID Principles Applied:
 * - Single Responsibility: Focused on research and communication operations only
 * - Open/Closed: Extensible through input schema without modifying core logic
 * - Liskov Substitution: Consistent interface for all research operations
 * - Interface Segregation: Clean separation of research concerns
 * - Dependency Inversion: Depends on PrismaService abstraction
 */
@Injectable()
export class ResearchOperationsService {
  constructor(private readonly prisma: PrismaService) {}

  async executeResearchOperation(
    input: ResearchOperationsInput,
  ): Promise<ResearchOperationResult> {
    const startTime = performance.now();

    try {
      let result: ResearchReport;

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

      return {
        success: true,
        data: result,
        metadata: {
          operation: input.operation,
          taskId: input.taskId,
          responseTime: Math.round(responseTime),
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message,
          code: 'RESEARCH_OPERATION_FAILED',
          operation: input.operation,
        },
      };
    }
  }

  private async createResearch(
    input: ResearchOperationsInput,
  ): Promise<ResearchReport> {
    const { taskId, researchData } = input;

    if (!researchData) {
      throw new Error('Research data is required for creation');
    }

    const research = await this.prisma.researchReport.create({
      data: {
        task: { connect: { id: taskId } },
        title: researchData.title || 'Research Report',
        summary: researchData.summary || '',
        findings: researchData.findings,
        recommendations: researchData.recommendations || '',
        references: researchData.references || [],
      } satisfies Prisma.ResearchReportCreateInput,
    });

    return research;
  }

  private async updateResearch(
    input: ResearchOperationsInput,
  ): Promise<ResearchReport> {
    const { taskId, researchData } = input;

    if (!researchData) {
      throw new Error('Research data is required for update');
    }

    // Find the research report by taskId first
    const existingResearch = await this.prisma.researchReport.findFirst({
      where: { taskId },
    });

    if (!existingResearch) {
      throw new Error(`Research report not found for task ${taskId}`);
    }

    const updateData: Prisma.ResearchReportUpdateInput = {};

    if (researchData.title) updateData.title = researchData.title;
    if (researchData.summary) updateData.summary = researchData.summary;
    if (researchData.findings) updateData.findings = researchData.findings;
    if (researchData.recommendations)
      updateData.recommendations = researchData.recommendations;
    if (researchData.references)
      updateData.references = researchData.references;

    const research = await this.prisma.researchReport.update({
      where: { id: existingResearch.id },
      data: updateData,
    });

    return research;
  }

  private async getResearch(
    input: ResearchOperationsInput,
  ): Promise<ResearchReport> {
    const { taskId } = input;

    const research = await this.prisma.researchReport.findFirst({
      where: { taskId },
    });

    if (!research) {
      throw new Error(`Research report not found for task ${taskId}`);
    }

    return research;
  }
}
