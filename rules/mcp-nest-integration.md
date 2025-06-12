---
description: This document provides practical guidelines and best practices for integrating the `@rekog/mcp-nest` library to expose Model Context Protocol (MCP) tools and resources from a NestJS application. Adhering to these guidelines will help create robust, maintainable, and well-structured MCP servers.
globs: 
alwaysApply: false
---
# Guidelines for @rekog/mcp-nest Integration

This document provides practical guidelines and best practices for integrating the `@rekog/mcp-nest` library to expose Model Context Protocol (MCP) tools and resources from a NestJS application. Adhering to these guidelines will help create robust, maintainable, and well-structured MCP servers.

## 1. Project Setup and Installation

-   **Install Dependencies**: Ensure the necessary packages are added to your NestJS project. This typically includes `@rekog/mcp-nest` itself, the core MCP SDK, and Zod for parameter validation.
    ```bash
    npm install @rekog/mcp-nest @modelcontextprotocol/sdk zod
    ```
    Also ensure NestJS core packages like `@nestjs/common`, `@nestjs/core`, `reflect-metadata`, and `rxjs` are present.

## 2. Configuring `McpModule`

-   **Import `McpModule`**: In your main application module (e.g., `AppModule.ts` or a dedicated module for MCP integration like `McpModule.ts`), import `McpModule` from `@rekog/mcp-nest`.
-   **Use `McpModule.forRoot()` or `McpModule.forRootAsync()`**: Configure the MCP server capabilities. Key options include:
    -   `name`: A descriptive name for your MCP server (e.g., 'MyWorkflowManagerServer').
    -   `version`: The version of your MCP server (e.g., '0.1.0').
    -   `transport`: Specify the MCP transport layer. `@rekog/mcp-nest` supports:
        -   `McpStdioTransport`: For communication over standard input/output.
        -   `McpHttpSseTransport`: For HTTP-based communication using Server-Sent Events (requires port configuration).
        -   `McpStreamableHttpTransport`: For HTTP-based communication with streaming (requires port configuration).
    -   `guards`: (Optional) An array of NestJS Guards to apply globally to all MCP tools and resources for authentication/authorization.
    -   `prefix`: (Optional) An API prefix if using an HTTP-based transport (e.g., '/mcp').

    ```typescript
    // Example: app.module.ts
    import { Module } from '@nestjs/common';
    import { McpModule, McpStdioTransport } from '@rekog/mcp-nest';
    // import { ApiKeyAuthGuard } from './auth/api-key-auth.guard'; // Your custom guard

    @Module({
      imports: [
        McpModule.forRoot({
          name: 'MyMcpServer',
          version: '1.0.0',
          transport: new McpStdioTransport(),
          // guards: [ApiKeyAuthGuard], // Apply a global auth guard
        }),
        // ... other application modules
      ],
      // ... providers for your tools if not in separate modules
    })
    export class AppModule {}
    ```

## 3. Defining MCP Tools and Resources

-   **Create NestJS Services**: House the logic for your MCP tools and resources within standard NestJS injectable services (`@Injectable()`). This promotes modularity and allows you to use DI for other application services (e.g., `PrismaService`, business logic services).
-   **Use `@Tool()` Decorator**:
    -   Apply to an `async` method within your NestJS service.
    -   **`name`**: A unique, descriptive name for the tool (e.g., 'file-writer-tool', 'user-data-fetcher').
    -   **`description`**: A clear, human-readable explanation of the tool's purpose and functionality.
    -   **`parameters`**: A Zod schema (`z.object({...})`) that defines the expected input parameters. Each parameter should have a `.describe()` for clarity.
-   **Use `@Resource()` Decorator**: Similar to `@Tool()`, for defining MCP resources if your application requires them.
-   **Tool Method Signature**: Tool methods should be `async` and typically receive two arguments:
    1.  `params`: An object containing the validated input parameters, automatically typed based on your Zod schema.
    2.  `context: Context`: Provides access to request metadata, client information, and utility methods like `reportProgress()`.

    ```typescript
    // Example: file.tool.service.ts
    import { Injectable } from '@nestjs/common';
    import { Tool, Context, McpUtils } from '@rekog/mcp-nest';
    import { z } from 'zod';

    @Injectable()
    export class FileToolService {
      @Tool({
        name: 'write-text-file',
        description: 'Writes provided text content to a specified file path.',
        parameters: z.object({
          filePath: z.string().describe('The absolute path where the file should be written.'),
          content: z.string().describe('The text content to write into the file.'),
        }),
      })
      async writeTextFile(
        params: { filePath: string; content: string },
        context: Context,
      ) {
        // Implementation logic here (e.g., using Node.js fs module)
        // Remember to handle potential errors during file operations.
        try {
          // fs.writeFileSync(params.filePath, params.content);
          await context.reportProgress?.({ message: 'File writing complete.', progress: 100, total: 100 });
          return { content: [{ type: 'text', text: `Successfully wrote to ${params.filePath}` }] };
        } catch (error) {
          return McpUtils.errorResponse(
            `Failed to write file: ${(error as Error).message}`,
            'FILE_WRITE_ERROR',
          );
        }
      }
    }
    ```
-   **Provide Services**: Ensure your tool services are provided within a NestJS module (either `AppModule` or a dedicated feature module) so `@rekog/mcp-nest` can discover them.

## 4. Implementing Authentication and Authorization

-   **NestJS Guards**: Develop standard NestJS Guards (classes implementing `CanActivate`) to handle your authentication (e.g., API key validation, JWT verification) and authorization logic.
-   **Global Application**: Apply these guards globally by including them in the `guards` array when configuring `McpModule.forRoot()`.
-   **Guard Logic**: Inside the `canActivate` method of your guard, you can access request details from the `ExecutionContext` to perform validation. Return `true` to allow access, `false` or throw an exception to deny.

## 5. Handling Parameters and Validation

-   **Zod Schemas**: Define clear and specific Zod schemas for the `parameters` of each tool. Use `.describe()` for each parameter to aid understanding and documentation.
-   **Automatic Validation**: `@rekog/mcp-nest` automatically validates incoming parameters against these schemas. If validation fails, an appropriate MCP error is returned to the client, so you don't need to write manual validation logic for the parameter structure itself within your tool method.

## 6. Reporting Progress

-   **`context.reportProgress()`**: For tools that may take some time to execute, use `await context.reportProgress?.({ message: string, progress: number, total?: number })` to send progress updates to the MCP client.
-   This is crucial for providing user feedback during long-running operations.

## 7. Error Handling in Tools

-   **Robust Error Management**: Implement comprehensive error handling within your tool logic (e.g., using `try/catch` blocks).
-   **`McpUtils.errorResponse()`**: When an error occurs that prevents the tool from completing successfully, use `McpUtils.errorResponse(message: string, code?: string, details?: any)` to construct and return a standardized MCP error object.
    -   `message`: A human-readable error message.
    -   `code`: (Optional) A short, machine-readable error code (e.g., 'NOT_FOUND', 'INVALID_INPUT', 'PERMISSION_DENIED').
    -   `details`: (Optional) Any additional structured information about the error.
-   **Throwing `McpError`**: Alternatively, you can `throw new McpError(message, code, details)`.
-   **Avoid Leaking Sensitive Information**: Ensure error messages do not expose sensitive system details.

## 8. Leveraging NestJS Features

-   **Dependency Injection**: Inject other NestJS services (e.g., configuration services, database services like `PrismaService`, custom business logic services) into your tool services using constructor injection. This allows your tools to interact with other parts of your application in a decoupled and testable manner.
-   **Configuration**: Use `@nestjs/config` and `ConfigService` to manage any configuration your tools might need.

## 9. Testing MCP Tools

-   **Unit Testing**: Focus on unit testing the logic within your tool service methods.
    -   Mock any injected dependencies.
    -   Mock the `Context` object and its methods (like `reportProgress`).
    -   Test various parameter inputs and error conditions.
-   **NestJS Testing Utilities**: Utilize `@nestjs/testing` to create a testing module for your tool services.

By following these guidelines, you can effectively integrate `@rekog/mcp-nest` into your NestJS applications to build powerful and well-structured MCP servers. Always refer to the official `@rekog/mcp-nest` documentation for the most up-to-date and detailed information.
