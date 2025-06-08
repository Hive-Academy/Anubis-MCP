import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { McpModule, McpTransportType } from '@rekog/mcp-nest';
import { TaskWorkflowModule } from './task-workflow/task-workflow.module';
import { UtilsModule } from './task-workflow/utils/utils.module';

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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Ensure environment variables are available
      expandVariables: true,
    }),
    PrismaModule,
    McpModule.forRoot({
      name: process.env.MCP_SERVER_NAME || 'MCP-Workflow-Manager',
      version: process.env.MCP_SERVER_VERSION || '1.0.0',
      instructions:
        'MCP Server for AI Workflow Manager - provides comprehensive workflow automation and task management for AI development in Cursor IDE and other MCP-compatible clients.',
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
})
export class AppModule {}
