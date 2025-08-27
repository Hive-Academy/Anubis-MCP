import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { GlobalFileLoggerService } from './utils/global-file-logger.service';

async function bootstrapProduction() {
  if (process.env.DASHBOARD_ENABLE === '1') {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
      logger: false,
    });
    const globalLogger = new GlobalFileLoggerService();
    app.useLogger(globalLogger);
    app.setViewEngine('ejs');
    app.setBaseViewsDir('dist/views');
    await app.listen(process.env.PORT ?? 3000);
    return;
  }
  // No HTTP server: MCP-only
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });
  return app.close();
}

async function bootstrapDevelopment() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // Enable EJS view engine for dashboard routes
  app.setViewEngine('ejs');
  app.setBaseViewsDir('src/views');

  const globalLogger = new GlobalFileLoggerService();
  app.useLogger(globalLogger);
  await app.listen(process.env.PORT ?? 3000);
}

if (process.env.NODE_ENV === 'production') {
  void bootstrapProduction();
} else {
  void bootstrapDevelopment();
}
