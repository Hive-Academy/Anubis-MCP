import { Module } from '@nestjs/common';
import { MCPCacheService } from './mcp-cache.service';
import { PrismaErrorHandlerService } from './prisma-error.handler';
import { PerformanceMonitorService } from './performance-monitor.service';
import { FileLoggerService } from './file-logger.service';

@Module({
  imports: [],
  exports: [
    // Utils
    PrismaErrorHandlerService,
    PerformanceMonitorService,
    MCPCacheService,
    FileLoggerService,
  ],
  providers: [
    // Utils
    PrismaErrorHandlerService,

    // Performance and Caching Services
    PerformanceMonitorService,
    MCPCacheService,
    FileLoggerService,
  ],
})
export class UtilsModule {}
