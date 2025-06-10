---
description: This document outlines key best practices for developing applications using the NestJS framework, ensuring maintainable, scalable, and robust code.
globs: 
alwaysApply: false
---
# NestJS Best Practices

This document outlines key best practices for developing applications using the NestJS framework, ensuring maintainable, scalable, and robust code.

## 1. Modularity

-   **Organize by Feature**: Structure your application into feature modules (e.g., `UserModule`, `ProductModule`). Each module should encapsulate all related components:
    -   Controllers
    -   Services (Providers)
    -   Data Transfer Objects (DTOs)
    -   Entities (if applicable, e.g., Prisma models used within the module's context)
-   **Clear Boundaries**: Ensure modules have clear responsibilities and minimal coupling with other modules.
-   **Exports/Imports**: Explicitly define what each module exports and what external modules it imports.

## 2. Dependency Injection (DI)

-   **Leverage Extensively**: Utilize NestJS's built-in DI system for managing dependencies. This promotes loose coupling and testability.
-   **`@Injectable()`**: Decorate all services (providers) with `@Injectable()` so they can be managed by the DI container.
-   **Constructor Injection**: Prefer constructor injection for providing dependencies to classes.
-   **Scope**: Understand and use appropriate scopes (Singleton, Request, Transient) for your providers if needed, though Singleton is the default and most common.

## 3. Data Transfer Objects (DTOs) and Validation

-   **Define Payloads**: Use DTO classes to define the shape of request and response payloads. This improves clarity and provides a single source of truth for data structures.
-   **Validation with `class-validator`**: Decorate DTO properties with `class-validator` decorators (e.g., `@IsString()`, `@IsEmail()`, `@MinLength()`) to define validation rules.
-   **`ValidationPipe`**: Apply the global `ValidationPipe` (or use it selectively) to automatically validate incoming request bodies, query parameters, and path parameters against DTOs.
    ```typescript
    // Example: main.ts
    // app.useGlobalPipes(new ValidationPipe());
    ```
-   **Transformation with `class-transformer`**: Use `class-transformer` (often with `ValidationPipe`) to transform plain incoming objects into typed DTO instances.

## 4. Configuration Management

-   **`@nestjs/config` Module**: Use the official `@nestjs/config` module for managing environment variables and application configuration.
-   **Centralized Access**: Access configuration values through the `ConfigService`.
-   **Schema Validation**: Optionally, define a schema (e.g., using Joi or a custom validation class) to validate environment variables at application startup.
-   **`.env` Files**: Store environment-specific configurations in `.env` files (e.g., `.env.development`, `.env.production`).

## 5. Asynchronous Operations

-   **`async/await`**: Use `async/await` syntax for all asynchronous operations (e.g., database queries, external API calls, file system operations).
-   **Promise-based**: NestJS services and controllers often return Promises.
-   **Error Handling**: Implement proper error handling for asynchronous code using `try/catch` blocks or NestJS exception filters. Ensure that rejections from Promises are handled.

## 6. Consistent Naming Conventions

-   **Files**: Use kebab-case for filenames (e.g., `user.module.ts`, `user.controller.ts`, `create-user.dto.ts`).
-   **Classes**: Use PascalCase for classes (e.g., `UserService`, `CreateUserDto`).
-   **Methods & Variables**: Use camelCase for methods and variables (e.g., `getUsers`, `userId`).
-   **Modules**: Name modules descriptively based on the feature they represent (e.g., `AuthModule`).

## 7. Clean Architecture Considerations

-   **Separation of Concerns**: For larger or more complex applications, consider principles from Clean Architecture (or similar patterns like Hexagonal Architecture, Onion Architecture).
    -   **Entities**: Core business objects.
    -   **Use Cases (Services)**: Application-specific business rules.
    -   **Interface Adapters (Controllers, Presenters)**: Convert data for use cases and UI.
    -   **Frameworks & Drivers (NestJS itself, Database, External APIs)**: Outer layer, details.
-   **Dependency Rule**: Ensure dependencies flow inwards (e.g., use cases should not depend on controllers or specific database implementations).
-   **Abstract Dependencies**: Use interfaces or abstract classes to define dependencies between layers, allowing for easier testing and replacement of implementations.

## 8. Error Handling

-   **Built-in HTTP Exceptions**: Use NestJS's built-in HTTP exceptions (e.g., `NotFoundException`, `BadRequestException`, `UnauthorizedException`) for standard error responses.
-   **Custom Exceptions**: Create custom exception classes that extend `HttpException` for application-specific errors.
-   **Exception Filters**: Implement global or controller-specific exception filters to customize error responses and logging.

## 9. Logging

-   **`LoggerService`**: Use NestJS's built-in `Logger` or create a custom logger service that implements `LoggerService`.
-   **Contextual Logging**: Provide context (e.g., class name, method name) in log messages for easier debugging.
-   **Log Levels**: Use appropriate log levels (e.g., `error`, `warn`, `log`, `debug`, `verbose`).

## 10. Testing

-   **Unit Tests**: Write unit tests for services, controllers, and other providers in isolation. Use `@nestjs/testing` to create testing modules and mock dependencies.
-   **Integration Tests**: Test interactions between different parts of your application (e.g., controller-service-database).
-   **E2E Tests**: Test the application as a whole by making HTTP requests to its endpoints.
```