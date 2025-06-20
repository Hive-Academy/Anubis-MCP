import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { McpModule, McpTransportType } from '@rekog/mcp-nest';
import { TaskWorkflowModule } from './task-workflow/task-workflow.module';
import { UtilsModule } from './task-workflow/utils/utils.module';
import { APP_FILTER } from '@nestjs/core';

// Global exception filter for MCP debugging
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';

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
    TaskWorkflowModule,
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
