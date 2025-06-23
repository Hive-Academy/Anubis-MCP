import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GlobalFileLoggerService } from './task-workflow/utils/global-file-logger.service';
import { Logger } from '@nestjs/common';

Logger.overrideLogger(false);

async function bootstrapProduction() {
  // Pass the logger to NestFactory.create to override ALL logging calls
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });

  return app.close();
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function bootstrapDevelopment() {
  const app = await NestFactory.create(AppModule);

  const globalLogger = new GlobalFileLoggerService();
  app.useLogger(globalLogger);
  await app.listen(process.env.PORT ?? 3000);
}

// if (process.env.NODE_ENV === 'production') {
void bootstrapProduction();
// } else {
//   void bootstrapDevelopment();
// }
