---
description: This document details best practices for using Prisma ORM, particularly when integrated with a NestJS application. Following these guidelines will help ensure a robust, maintainable, and type-safe data access layer.
globs: 
alwaysApply: false
---
# Prisma Best Practices

This document details best practices for using Prisma ORM, particularly when integrated with a NestJS application. Following these guidelines will help ensure a robust, maintainable, and type-safe data access layer.

## 1. Dedicated `PrismaService` in NestJS

-   **Create a Service**: Implement a dedicated `PrismaService` within your NestJS application. This service should extend `PrismaClient`.
-   **Lifecycle Hooks**: Implement `OnModuleInit` to call `this.$connect()` and `OnModuleDestroy` to call `this.$disconnect()` within your `PrismaService`. This ensures proper connection management.
-   **`PrismaModule`**: Create a `PrismaModule` that provides and exports the `PrismaService`. This module can then be imported into other feature modules that require database access.
-   **Global Module (Optional)**: Consider making `PrismaModule` global (`@Global()`) if Prisma access is needed ubiquitously across the application, to avoid importing it into every feature module.

    ```typescript
    // Example: core/prisma/prisma.service.ts
    import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
    import { PrismaClient } from '@prisma/client';

    @Injectable()
    export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
      async onModuleInit() {
        await this.$connect();
      }

      async onModuleDestroy() {
        await this.$disconnect();
      }
    }

    // Example: core/prisma/prisma.module.ts
    import { Global, Module } from '@nestjs/common';
    import { PrismaService } from './prisma.service';

    @Global() // Optional
    @Module({
      providers: [PrismaService],
      exports: [PrismaService],
    })
    export class PrismaModule {}
    ```

## 2. Schema as Single Source of Truth

-   **`schema.prisma`**: Your `prisma/schema.prisma` file is the definitive source for your database schema, including models, fields, relations, and data source configuration.
-   **Declarative Definition**: Define your data model declaratively in this file. Avoid manual database schema changes outside of Prisma migrations.

## 3. Migration Workflow

-   **Development (`prisma migrate dev`)**:
    -   Use `npx prisma migrate dev --name <descriptive-migration-name>` during development.
    -   This command creates a new SQL migration file based on changes to `schema.prisma`, applies it to your development database, and regenerates `PrismaClient`.
    -   Review the generated SQL migration files to understand the changes being applied.
-   **Production (`prisma migrate deploy`)**:
    -   Use `npx prisma migrate deploy` in production environments (and CI/CD pipelines).
    -   This command applies all pending migrations. It does not generate new migrations or prompt for input, making it suitable for automated deployments.
-   **Reset (`prisma migrate reset`)**: Use with caution in development to reset the database and reapply all migrations.

## 4. Leverage Type Safety

-   **Generated Client**: Prisma Client is auto-generated from your `schema.prisma` file and is fully type-safe.
-   **TypeScript Integration**: Utilize these generated types extensively in your NestJS services, DTOs, and controller methods to ensure end-to-end type safety.
    -   Example: `Prisma.UserCreateInput`, `Prisma.UserWhereUniqueInput`, `User` (model type).
-   **Auto-completion**: Benefit from editor auto-completion and type checking, reducing runtime errors.

## 5. Transaction Management

-   **`$transaction` API**: For operations that must be atomic (either all succeed or all fail), use Prisma's transaction API.
    -   **Sequential Operations**: Pass an array of Prisma Client queries to `prisma.$transaction([...])`. These are executed sequentially within a single transaction.
    -   **Interactive Transactions (Preview)**: For more complex scenarios requiring conditional logic within a transaction, explore interactive transactions (check Prisma documentation for feature status and usage).
    ```typescript
    // Example: Sequential operations in a transaction
    // await this.prisma.$transaction([
    //   this.prisma.user.update({ where: { id: 1 }, data: { balance: { decrement: 100 } } }),
    //   this.prisma.account.update({ where: { id: 1 }, data: { balance: { increment: 100 } } }),
    // ]);
    ```

## 6. Error Handling

-   **Prisma-Specific Errors**: Be aware of common Prisma errors and handle them gracefully.
    -   `PrismaClientKnownRequestError`: For predictable errors related to the query engine (e.g., unique constraint violation `P2002`, record not found `P2025`). Inspect `error.code`.
    -   `PrismaClientValidationError`: For errors due to invalid query arguments.
-   **NestJS Integration**: Catch these errors in your services and map them to appropriate NestJS HTTP exceptions (e.g., `ConflictException` for `P2002`, `NotFoundException` for `P2025`).

## 7. Database Seeding

-   **`prisma db seed`**: Use Prisma's seeding mechanism to populate your database with initial data, especially for development and testing.
-   **Seed Script**: Create a `prisma/seed.ts` (or `.js`) file that uses `PrismaClient` to create records.
-   **Configuration**: Add a `[prisma.seed]` entry to your `package.json` if needed, or run `npx prisma db seed` directly.
-   **Idempotency**: Design seed scripts to be idempotent if possible (i.e., running them multiple times doesn't cause errors or duplicate data).

## 8. Query Optimization

-   **Select Specific Fields**: Use the `select` option in Prisma queries to fetch only the necessary fields, reducing data transfer and improving performance.
-   **Include Related Data**: Use the `include` option to fetch related records in a single query, avoiding N+1 problems. Be mindful of over-fetching deeply nested relations.
-   **Pagination**: Implement pagination using `take` and `skip` (or cursor-based pagination with `cursor`) for queries that return large datasets.
-   **Raw Queries**: For highly complex queries not easily expressed with Prisma Client, use `$queryRaw` or `$executeRaw` as an escape hatch, but be cautious about SQL injection risks (use `$queryRawUnsafe` or `$executeRawUnsafe` with extreme care and parameterized queries where possible).
