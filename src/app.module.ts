import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { McpModule, McpTransportType } from '@rekog/mcp-nest';
import { PrismaModule } from './prisma/prisma.module';
import { UtilsModule } from './utils/utils.module';

// Global exception filter for MCP debugging
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { CoreWorkflowModule } from './domains/core-workflow/core-workflow.module';
import { InitRulesModule } from './domains/init-rules/init-rules.module';
import { WorkflowRulesModule } from './domains/workflow-rules/workflow-rules.module';

// Determine transport type based on environment
const getTransportType = (): McpTransportType => {
  const transportEnv = process.env.MCP_TRANSPORT_TYPE?.toUpperCase();

  switch (transportEnv) {
    case 'HTTP':
    case 'SSE':
      return McpTransportType.SSE;
    case 'STREAMABLE_HTTP':
      return McpTransportType.STREAMABLE_HTTP;
    case 'STDIO':
    default:
      return McpTransportType.STDIO;
  }
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const timestamp = new Date().toISOString();

    // Log the exception with full details
    this.logger.error('[MCP-GLOBAL-EXCEPTION]', {
      timestamp,
      exception:
        exception instanceof Error
          ? {
              name: exception.name,
              message: exception.message,
              stack: exception.stack,
            }
          : exception,
      hostType: host.getType(),
      context: 'MCP Tool Call Handler',
    });

    // If it's an HTTP exception, rethrow it
    if (exception instanceof HttpException) {
      throw exception;
    }

    // For other exceptions, create a generic error response
    throw new Error(
      `Unhandled exception in MCP handler: ${exception instanceof Error ? exception.message : 'Unknown error'}`,
    );
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Ensure environment variables are available
      expandVariables: true,
    }),
    PrismaModule,
    McpModule.forRoot({
      name: process.env.MCP_SERVER_NAME || 'Anubis',
      version: process.env.MCP_SERVER_VERSION || '1.0.0',
      instructions:
        '🏺 Anubis - Intelligent Guidance for AI Workflows | MCP-compliant workflow intelligence system with embedded, context-aware guidance for reliable AI-assisted development',
      transport: getTransportType(),
      // Additional configuration for HTTP/SSE transports
      ...(getTransportType() === McpTransportType.SSE && {
        sseEndpoint: 'sse',
        messagesEndpoint: 'messages',
      }),
      ...(getTransportType() === McpTransportType.STREAMABLE_HTTP && {
        mcpEndpoint: 'mcp',
      }),
    }),

    // Rule-based workflow architecture - clean and focused
    CoreWorkflowModule, // Internal task management services (NOT MCP tools)
    WorkflowRulesModule, // Rule-driven workflow MCP interface (8 tools)
    InitRulesModule, // Tool initialization for different AI agents,
    UtilsModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
