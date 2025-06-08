import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { PrismaService } from '../../../prisma/prisma.service';
import { MCPCacheService } from '../../utils/mcp-cache.service';
import { PerformanceMonitorService } from '../../utils/performance-monitor.service';
import { z } from 'zod';

const AgentContextSchema = z.object({
  operation: z.enum([
    'get_comprehensive_context',
    'get_conversation_context',
    'preload_context',
    'get_cache_metrics',
  ]),
  taskId: z.string().optional(),
  conversationId: z.string().optional(),
  contextType: z.string().optional(),
  includeWorkflowHistory: z.boolean().default(true),
  includeReports: z.boolean().default(true),
  includePlans: z.boolean().default(true),
  includeSubtasks: z.boolean().default(true),
});

type AgentContextInput = z.infer<typeof AgentContextSchema>;

@Injectable()
export class AgentContextService {
  private readonly logger = new Logger(AgentContextService.name);

  constructor(
    private prisma: PrismaService,
    private cacheService: MCPCacheService,
    private performanceMonitor: PerformanceMonitorService,
  ) {}

  @Tool({
    name: 'agent_context_optimization',
    description: `
Agent Context Optimization - Reduces MCP calls through intelligent caching

**Purpose:** Minimize the number of MCP calls AI agents need to make by providing comprehensive context in single operations.

**Operations:**
- get_comprehensive_context: Get all task-related data in one call (task, plans, subtasks, reports, workflow status)
- get_conversation_context: Get cached conversation-level context to avoid repeated queries
- preload_context: Preload anticipated context data for faster subsequent access
- get_cache_metrics: Get agent-level cache efficiency metrics

**Key Benefits:**
- Reduces token usage by avoiding multiple MCP calls
- Provides comprehensive context in single operations
- Intelligent conversation-level caching
- Preloads anticipated data for better performance

**Examples:**
- Comprehensive context: { operation: "get_comprehensive_context", taskId: "TSK-001" }
- Conversation cache: { operation: "get_conversation_context", conversationId: "conv-123", contextType: "task_analysis" }
- Preload context: { operation: "preload_context", taskId: "TSK-001" }
- Cache metrics: { operation: "get_cache_metrics" }
`,
    schema: AgentContextSchema,
  })
  async handleAgentContext(input: AgentContextInput) {
    const startTime = Date.now();
    this.logger.log(`Agent context operation: ${input.operation}`);

    try {
      let result;
      let cached = false;

      switch (input.operation) {
        case 'get_comprehensive_context':
          result = await this.getComprehensiveContext(input);
          break;
        case 'get_conversation_context':
          result = await this.getConversationContext(input);
          break;
        case 'preload_context':
          result = await this.preloadContext(input);
          break;
        case 'get_cache_metrics':
          result = await this.getCacheMetrics();
          break;
        default:
          throw new Error(`Unknown operation: ${input.operation}`);
      }

      const responseTime = Date.now() - startTime;

      return {
        success: true,
        operation: input.operation,
        data: result,
        cached,
        responseTime,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `Agent context operation failed: ${error.message}`,
        error.stack,
      );
      return {
        success: false,
        error: {
          message: error.message,
          code: 'AGENT_CONTEXT_FAILED',
          operation: input.operation,
        },
      };
    }
  }

  /**
   * Get comprehensive task context in a single call
   * Replaces multiple MCP calls with one comprehensive response
   */
  private async getComprehensiveContext(input: AgentContextInput) {
    if (!input.taskId) {
      throw new Error('taskId is required for comprehensive context');
    }

    // Check cache first
    const cachedContext = await this.cacheService.getAgentTaskContext(
      input.taskId,
    );
    if (cachedContext) {
      this.logger.log(`Cache hit for comprehensive context: ${input.taskId}`);
      return { ...cachedContext, cached: true };
    }

    this.logger.log(`Loading comprehensive context for task: ${input.taskId}`);

    // Load all data in parallel
    const [task, workflowStatus, reports, plans, subtasks] = await Promise.all([
      this.getTaskData(input.taskId),
      input.includeWorkflowHistory
        ? this.getWorkflowStatus(input.taskId)
        : null,
      input.includeReports ? this.getReports(input.taskId) : null,
      input.includePlans ? this.getPlans(input.taskId) : null,
      input.includeSubtasks ? this.getSubtasks(input.taskId) : null,
    ]);

    const comprehensiveContext = {
      task,
      workflowStatus,
      reports,
      plans,
      subtasks,
      metadata: {
        loadedAt: new Date().toISOString(),
        includeFlags: {
          workflowHistory: input.includeWorkflowHistory,
          reports: input.includeReports,
          plans: input.includePlans,
          subtasks: input.includeSubtasks,
        },
      },
      cached: false,
    };

    // Cache the comprehensive context
    await this.cacheService.setAgentTaskContext(
      input.taskId,
      comprehensiveContext,
    );

    return comprehensiveContext;
  }

  /**
   * Get conversation-level context to avoid repeated queries
   */
  private async getConversationContext(input: AgentContextInput) {
    if (!input.conversationId || !input.contextType) {
      throw new Error(
        'conversationId and contextType are required for conversation context',
      );
    }

    const cachedContext = await this.cacheService.getConversationContext(
      input.conversationId,
      input.contextType,
    );

    if (cachedContext) {
      this.logger.log(
        `Conversation context cache hit: ${input.conversationId}:${input.contextType}`,
      );
      return { ...cachedContext, cached: true };
    }

    // If no cached context, return empty context that can be populated
    const emptyContext = {
      conversationId: input.conversationId,
      contextType: input.contextType,
      data: {},
      createdAt: new Date().toISOString(),
      cached: false,
    };

    // Cache the empty context for future use
    await this.cacheService.setConversationContext(
      input.conversationId,
      input.contextType,
      emptyContext,
    );

    return emptyContext;
  }

  /**
   * Preload context data for anticipated agent needs
   */
  private async preloadContext(input: AgentContextInput) {
    if (!input.taskId) {
      throw new Error('taskId is required for preload context');
    }

    this.logger.log(`Preloading context for task: ${input.taskId}`);

    const preloadedContext = await this.cacheService.preloadAgentContext(
      input.taskId,
      {
        getTask: () => this.getTaskData(input.taskId!),
        getWorkflowStatus: () => this.getWorkflowStatus(input.taskId!),
        getReports: () => this.getReports(input.taskId!),
        getPlans: () => this.getPlans(input.taskId!),
      },
    );

    return {
      taskId: input.taskId,
      preloaded: true,
      context: preloadedContext,
      message: 'Context preloaded successfully for faster subsequent access',
    };
  }

  /**
   * Get cache efficiency metrics for agent usage
   */
  private async getCacheMetrics() {
    const metrics = this.cacheService.getAgentCacheMetrics();
    const performanceStats = this.performanceMonitor.getStats();

    return {
      cacheMetrics: metrics,
      performanceStats,
      efficiency: {
        cacheHitRatio: metrics.agentCacheRatio,
        estimatedMCPCallsAvoided: metrics.estimatedMCPCallsAvoided,
        estimatedTokensSaved: metrics.estimatedTokensSaved,
        averageResponseTime: performanceStats.averageResponseTime,
      },
      recommendations: this.generateCacheRecommendations(metrics),
    };
  }

  /**
   * Generate cache optimization recommendations
   */
  private generateCacheRecommendations(metrics: any) {
    const recommendations = [];

    if (metrics.agentCacheRatio < 0.3) {
      recommendations.push(
        'Consider using more comprehensive context calls to improve cache efficiency',
      );
    }

    if (metrics.estimatedMCPCallsAvoided < 10) {
      recommendations.push(
        'Preload context for frequently accessed tasks to reduce MCP calls',
      );
    }

    if (metrics.totalEntries > 800) {
      recommendations.push(
        'Cache is near capacity - consider clearing old entries or increasing limits',
      );
    }

    return recommendations;
  }

  // Helper methods for data loading
  private async getTaskData(taskId: string) {
    return this.prisma.task.findUnique({
      where: { taskId },
      include: {
        description: true,
        codebaseAnalysis: true,
      },
    });
  }

  private async getWorkflowStatus(taskId: string) {
    return this.prisma.workflowTransition.findMany({
      where: { taskId },
      orderBy: { transitionTimestamp: 'desc' },
      take: 10,
    });
  }

  private async getReports(taskId: string) {
    const [research, codeReview, completion] = await Promise.all([
      this.prisma.researchReport.findMany({ where: { taskId } }),
      this.prisma.codeReview.findMany({ where: { taskId } }),
      this.prisma.completionReport.findMany({ where: { taskId } }),
    ]);

    return { research, codeReview, completion };
  }

  private async getPlans(taskId: string) {
    return this.prisma.implementationPlan.findMany({
      where: { taskId },
      include: {
        subtaskBatches: {
          include: {
            subtasks: true,
          },
        },
      },
    });
  }

  private async getSubtasks(taskId: string) {
    return this.prisma.subtask.findMany({
      where: { taskId },
      include: {
        completionEvidence: true,
      },
      orderBy: [{ batchId: 'asc' }, { sequenceNumber: 'asc' }],
    });
  }
}
