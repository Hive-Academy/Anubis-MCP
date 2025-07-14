import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma';
import { PrismaBetterSQLite3 } from '@prisma/adapter-better-sqlite3';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    // Use DATABASE_URL from environment (set by database-config.ts)
    // Fallback should align with Docker deployment pattern
    const databaseUrl =
      process.env.DATABASE_URL || 'file:./.anubis/workflow.db';

    const adapter = new PrismaBetterSQLite3({
      url: databaseUrl,
    });

    super({
      adapter,
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
