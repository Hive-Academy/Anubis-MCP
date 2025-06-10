import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ResearchOperationsInput } from './schemas/research-operations.schema';
import { ResearchReport, Comment, Prisma } from 'generated/prisma';

// Type-safe interfaces for research operations
export interface ResearchOperationResult {
  success: boolean;
  data?: ResearchReport | Comment | ResearchWithComments | CommentSummary;
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

export interface ResearchWithComments extends ResearchReport {
  comments: Comment[];
}

export interface CommentSummary {
  summary: {
    total: number;
    byType: Record<string, number>;
  };
  comments: Comment[];
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
  private readonly logger = new Logger(ResearchOperationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async executeResearchOperation(
    input: ResearchOperationsInput,
  ): Promise<ResearchOperationResult> {
    const startTime = performance.now();

    try {
      this.logger.debug(`Research Operation: ${input.operation}`, {
        taskId: input.taskId,
      });

      let result:
        | ResearchReport
        | Comment
        | ResearchWithComments
        | CommentSummary;

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
        case 'add_comment':
          result = await this.addComment(input);
          break;
        case 'get_comments':
          result = await this.getComments(input);
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
      this.logger.error(`Research operation failed:`, error);

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
  ): Promise<ResearchReport | ResearchWithComments> {
    const { taskId, includeComments } = input;

    const research = await this.prisma.researchReport.findFirst({
      where: { taskId },
    });

    if (!research) {
      throw new Error(`Research report not found for task ${taskId}`);
    }

    // If comments requested, get them separately since they're not directly related
    if (includeComments) {
      const comments = await this.prisma.comment.findMany({
        where: { taskId },
        orderBy: { createdAt: 'desc' },
      });

      return {
        ...research,
        comments,
      } as ResearchWithComments;
    }

    return research;
  }

  private async addComment(input: ResearchOperationsInput): Promise<Comment> {
    const { taskId, commentData } = input;

    if (!commentData) {
      throw new Error('Comment data is required for creation');
    }

    const comment = await this.prisma.comment.create({
      data: {
        task: { connect: { id: taskId } },
        content: commentData.content,
        mode: commentData.author || 'system', // Map author to mode field
      } satisfies Prisma.CommentCreateInput,
    });

    return comment;
  }

  private async getComments(
    input: ResearchOperationsInput,
  ): Promise<CommentSummary> {
    const { taskId, commentType } = input;

    const where: Prisma.CommentWhereInput = { taskId };
    if (commentType) {
      where.mode = commentType; // Map contextType to mode field
    }

    const comments = await this.prisma.comment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const summary = {
      total: comments.length,
      byType: {} as Record<string, number>,
    };

    // Build summary properly typed
    comments.forEach((comment) => {
      const type = comment.mode;
      summary.byType[type] = (summary.byType[type] || 0) + 1;
    });

    return {
      summary,
      comments,
    };
  }
}
