import { Module } from '@nestjs/common';
import { FileLoggerService } from './file-logger.service';
import { PrismaErrorHandlerService } from './prisma-error.handler';

@Module({
  imports: [],
  exports: [
    // Utils
    PrismaErrorHandlerService,
    FileLoggerService,
  ],
  providers: [
    // Utils
    PrismaErrorHandlerService,
    FileLoggerService,
  ],
})
export class UtilsModule {}
