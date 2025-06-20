# 🏺 Developer Guide - Anubis

**Intelligent Guidance for AI Workflows | Enterprise-Grade MCP Workflow Intelligence System**

**Anubis is the intelligent guide for AI workflows - the first MCP-compliant system that embeds intelligent guidance directly into each step, ensuring your AI agents follow complex development processes consistently and reliably.**

This guide documents the **Anubis** v1.0.15 - a sophisticated, enterprise-grade workflow management system built with NestJS v11.0.1, Prisma v6.9.0, and @rekog/mcp-nest v1.5.2.

## Quick Reference

- **Version**: v1.0.15
- **Package**: @hive-academy/anubis v1.0.15
- **Docker**: hiveacademy/anubis
- **MCP Protocol**: Fully compliant guidance-only architecture
- **Database**: SQLite (default) / PostgreSQL (production)
- **Node.js**: >=18.0.0 required

### **🎯 Architecture Overview**

**Current Implementation:**

- **Backend**: NestJS v11.0.1 with TypeScript for enterprise-grade scalability
- **Database**: Prisma ORM v6.9.0 with SQLite (default) and PostgreSQL support
- **MCP Integration**: @rekog/mcp-nest v1.5.2 for seamless protocol compliance
- **Validation**: Zod v3.24.4 for comprehensive parameter validation
- **Package**: @hive-academy/anubis v1.0.15

**Key Features:**

- **Domain-driven design** with clear boundaries and separation of concerns
- **MCP-compliant guidance architecture** providing intelligent workflow guidance
- **Database-driven workflow intelligence** with dynamic rule management
- **Feature-based organization** with embedded workflow intelligence
- **12 specialized MCP tools** for comprehensive workflow management

## **1. Development Setup**

### **Prerequisites**

```bash
# Required versions
Node.js >= 18.0.0
npm >= 8.0.0
```

### **Local Development Setup**

```bash
# Clone the repository
git clone https://github.com/Hive-Academy/Anubis-MCP.git
cd Anubis

# Install dependencies
npm install

# Setup database (automatic Prisma client generation)
npx prisma generate
npx prisma db push

# Start development server
npm run start:dev

# Alternative: Start with debugging
npm run start:debug
```

### **Database Setup**

```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Initialize database (generate + migrate)
npm run db:init

# Reset database and seed workflow rules
npm run db:reset

# Generate workflow rules
npm run rules:gen
```

### **NPX Package Usage (Recommended)**

```bash
# Use as NPX package (no local installation needed)
npx -y @hive-academy/anubis

# Configure in MCP client (Cursor IDE)
{
  "mcpServers": {
    "anubis": {
      "command": "npx",
      "args": ["-y", "@hive-academy/anubis"]
    }
  }
}
```

## **2. Project Structure & Development Patterns**

### **Domain-Driven Architecture**

```
src/task-workflow/
├── domains/
│   ├── workflow-rules/              # PRIMARY MCP INTERFACE
│   │   ├── services/                # Core workflow services
│   │   │   ├── workflow-guidance.service.ts
│   │   │   ├── step-guidance.service.ts
│   │   │   ├── step-execution.service.ts
│   │   │   ├── role-transition.service.ts
│   │   │   ├── workflow-execution.service.ts
│   │   │   ├── workflow-bootstrap.service.ts
│   │   │   └── core-service-orchestrator.service.ts
│   │   ├── mcp-operations/          # MCP tool implementations
│   │   │   ├── workflow-guidance-mcp.service.ts
│   │   │   ├── step-execution-mcp.service.ts
│   │   │   ├── role-transition-mcp.service.ts
│   │   │   ├── workflow-execution-mcp.service.ts
│   │   │   ├── workflow-bootstrap-mcp.service.ts
│   │   │   └── mcp-operation-execution-mcp.service.ts
│   │   └── utils/                   # Shared utilities
│   ├── core-workflow/               # INTERNAL BUSINESS LOGIC
│   │   ├── task-operations.service.ts
│   │   ├── planning-operations.service.ts
│   │   ├── individual-subtask-operations.service.ts
│   │   ├── workflow-operations.service.ts
│   │   ├── review-operations.service.ts
│   │   ├── research-operations.service.ts
│   │   └── schemas/                 # Zod validation schemas
│   └── reporting/                   # ANALYTICS & DASHBOARDS
│       ├── shared/                  # Core shared services
│       ├── workflow-analytics/      # Workflow analysis
│       ├── task-management/         # Task reporting
│       └── dashboard/               # Interactive dashboards
```

### **Development Patterns**

#### **1. MCP Tool Development Pattern**

```typescript
@Injectable()
export class ExampleMCPService {
  constructor(
    private readonly workflowGuidance: WorkflowGuidanceService,
    private readonly stepGuidance: StepGuidanceService,
    private readonly prisma: PrismaService,
  ) {}

  @Tool({
    name: 'example_operation',
    description: 'Example MCP tool with embedded intelligence',
    schema: ExampleParamsSchema, // Zod validation schema
  })
  async exampleOperation(params: ExampleParams): Promise<EnhancedMCPResponse> {
    // 1. Validate parameters (automatic with Zod)
    // 2. Execute core business logic
    const result = await this.executeBusinessLogic(params);

    // 3. Generate embedded intelligence
    const guidance = await this.workflowGuidance.generateRoleGuidance({
      roleName: params.currentRole,
      serviceType: 'example',
      taskContext: params.taskContext,
      executionData: result,
    });

    // 4. Return enhanced response with embedded intelligence
    return {
      data: result,
      workflowGuidance: guidance,
      recommendations: await this.generateRecommendations(params, result),
      metadata: {
        operation: 'example_operation',
        serviceValidated: true,
        responseTime: Date.now() - startTime,
      },
    };
  }
}
```

#### **2. Service Development Pattern**

```typescript
@Injectable()
export class ExampleService extends ConfigurableService<ExampleConfig> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: GlobalFileLoggerService,
  ) {
    super('ExampleService');
  }

  async executeOperation(params: ExampleParams): Promise<ExampleResult> {
    try {
      // 1. Log operation start
      this.logger.log('Starting example operation', { params });

      // 2. Validate business rules
      await this.validateBusinessRules(params);

      // 3. Execute database operations with Prisma
      const result = await this.prisma.exampleEntity.create({
        data: params.data,
        include: {
          relatedEntities: true,
        },
      });

      // 4. Apply business logic
      const processedResult = await this.processResult(result);

      // 5. Log success and return
      this.logger.log('Example operation completed', {
        result: processedResult,
      });
      return processedResult;
    } catch (error) {
      // 6. Handle errors with structured logging
      this.logger.error('Example operation failed', { error, params });
      throw new Error(`Example operation failed: ${error.message}`);
    }
  }
}
```

#### **3. Zod Schema Pattern**

```typescript
import { z } from 'zod';

// Define parameter schema
export const ExampleParamsSchema = z.object({
  taskId: z.number().int().positive(),
  operationType: z.enum(['create', 'update', 'delete']),
  data: z.object({
    name: z.string().min(1).max(255),
    description: z.string().optional(),
    priority: z.enum(['Low', 'Medium', 'High', 'Critical']),
  }),
  options: z.object({
    includeRelated: z.boolean().default(false),
    validateConstraints: z.boolean().default(true),
  }).optional(),
});

// Export type for TypeScript
export type ExampleParams = z.infer<typeof ExampleParamsSchema>;

// Use in MCP tool
@Tool({
  name: 'example_operation',
  description: 'Example operation with comprehensive validation',
  schema: ExampleParamsSchema,
})
async exampleOperation(params: ExampleParams): Promise<ExampleResponse> {
  // Parameters are automatically validated by @rekog/mcp-nest
  // TypeScript types are enforced
  return await this.exampleService.executeOperation(params);
}
```

## **3. Coding Standards & Best Practices**

### **TypeScript Standards**

```typescript
// 1. Use strict TypeScript configuration
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}

// 2. Prefer interfaces for object shapes
interface UserProfile {
  id: number;
  username: string;
  email: string;
}

// 3. Use type aliases for complex types
type UserId = string | number;
type UserWithRoles = UserProfile & { roles: string[] };

// 4. Use const assertions for immutable data
const httpMethods = ['GET', 'POST', 'PUT', 'DELETE'] as const;
type HttpMethod = typeof httpMethods[number];

// 5. Define return types explicitly
function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

### **NestJS Patterns**

```typescript
// 1. Use dependency injection properly
@Injectable()
export class ExampleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: GlobalFileLoggerService,
    @Inject('CONFIG_TOKEN') private readonly config: ExampleConfig,
  ) {}
}

// 2. Use proper module organization
@Module({
  imports: [PrismaModule, UtilsModule],
  providers: [ExampleService, ExampleMCPService],
  exports: [ExampleService],
})
export class ExampleModule {}

// 3. Use guards for validation
@Injectable()
export class ExampleGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // Validation logic
    return true;
  }
}
```

### **Database Patterns with Prisma**

```typescript
// 1. Use proper Prisma patterns
async findTaskWithRelations(taskId: number): Promise<TaskWithRelations> {
  return await this.prisma.task.findUnique({
    where: { id: taskId },
    include: {
      plans: {
        include: {
          subtasks: true,
        },
      },
      delegations: true,
      reviews: true,
      research: true,
    },
  });
}

// 2. Use transactions for complex operations
async createTaskWithPlan(taskData: TaskData, planData: PlanData): Promise<Task> {
  return await this.prisma.$transaction(async (tx) => {
    const task = await tx.task.create({
      data: taskData,
    });

    const plan = await tx.implementationPlan.create({
      data: {
        ...planData,
        taskId: task.id,
      },
    });

    return task;
  });
}

// 3. Handle Prisma errors properly
try {
  const result = await this.prisma.task.create({ data });
  return result;
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      throw new Error('Task with this name already exists');
    }
  }
  throw error;
}
```

## **4. Testing Approaches**

### **Unit Testing with Jest**

```typescript
// Example unit test
describe('ExampleService', () => {
  let service: ExampleService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExampleService,
        {
          provide: PrismaService,
          useValue: {
            task: {
              create: jest.fn(),
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<ExampleService>(ExampleService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should create task successfully', async () => {
    const taskData = { name: 'Test Task', priority: 'Medium' };
    const expectedResult = { id: 1, ...taskData };

    jest.spyOn(prisma.task, 'create').mockResolvedValue(expectedResult);

    const result = await service.createTask(taskData);

    expect(result).toEqual(expectedResult);
    expect(prisma.task.create).toHaveBeenCalledWith({
      data: taskData,
    });
  });
});
```

### **Integration Testing**

```typescript
// Example integration test
describe('TaskOperations Integration', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it('should create and retrieve task', async () => {
    // Create task
    const taskData = {
      name: 'Integration Test Task',
      priority: 'High',
      description: { businessRequirements: 'Test requirements' },
    };

    const createdTask = await prisma.task.create({
      data: taskData,
    });

    // Retrieve task
    const retrievedTask = await prisma.task.findUnique({
      where: { id: createdTask.id },
    });

    expect(retrievedTask).toBeDefined();
    expect(retrievedTask.name).toBe(taskData.name);
  });
});
```

### **MCP Tool Testing**

```bash
# Start MCP server for testing
npm run start:dev

# Test MCP tools with client
# 1. Connect MCP client to server
# 2. Execute tool operations
# 3. Verify responses and embedded guidance
# 4. Test error scenarios
```

## **5. Performance Optimization**

### **Caching Strategy**

```typescript
// Two-layer caching system
interface MCPResponseCache {
  key: string; // Generated from tool name + parameters
  response: EnhancedMCPResponse;
  ttl: number; // Time-to-live in seconds
  tokenEstimate: number; // Token count for savings tracking
  guidanceHash: string; // Hash for invalidation
}

interface DatabaseQueryCache {
  key: string; // Generated from query + parameters
  data: any; // Prisma query results
  ttl: number; // Time-to-live in seconds
  relationships: string[]; // Related entities for invalidation
  rulesVersion: string; // Workflow rules version
}
```

### **Database Optimization**

```typescript
// 1. Use proper indexing in Prisma schema
model Task {
  id          Int      @id @default(autoincrement())
  name        String   @unique // Indexed for fast lookups
  status      String   @db.VarChar(50) // Optimize string length
  priority    String   @db.VarChar(20)
  createdAt   DateTime @default(now()) @db.Timestamp(6)

  @@index([status, priority]) // Composite index for filtering
  @@index([createdAt]) // Index for date-based queries
}

// 2. Use efficient queries
async findTasksWithOptimization(filters: TaskFilters): Promise<Task[]> {
  return await this.prisma.task.findMany({
    where: {
      status: filters.status,
      priority: filters.priority,
    },
    select: {
      id: true,
      name: true,
      status: true,
      priority: true,
      // Only select needed fields
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 50, // Limit results
  });
}
```

## **6. Error Handling & Logging**

### **Structured Error Handling**

```typescript
// Custom error classes
export class WorkflowError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any,
  ) {
    super(message);
    this.name = 'WorkflowError';
  }
}

// Error handling in services
async executeOperation(params: any): Promise<any> {
  try {
    return await this.performOperation(params);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new WorkflowError(
        'Database operation failed',
        'DB_ERROR',
        { prismaCode: error.code, params },
      );
    }

    if (error instanceof WorkflowError) {
      throw error; // Re-throw workflow errors
    }

    throw new WorkflowError(
      'Unexpected error occurred',
      'UNKNOWN_ERROR',
      { originalError: error.message, params },
    );
  }
}
```

### **Logging Patterns**

```typescript
// Use GlobalFileLoggerService for STDIO-compatible logging
@Injectable()
export class ExampleService {
  constructor(private readonly logger: GlobalFileLoggerService) {}

  async performOperation(params: any): Promise<any> {
    // Log operation start
    this.logger.log('Operation started', {
      operation: 'performOperation',
      params: this.sanitizeParams(params),
    });

    try {
      const result = await this.executeLogic(params);

      // Log success
      this.logger.log('Operation completed successfully', {
        operation: 'performOperation',
        resultSummary: this.summarizeResult(result),
      });

      return result;
    } catch (error) {
      // Log error with context
      this.logger.error('Operation failed', {
        operation: 'performOperation',
        error: error.message,
        stack: error.stack,
        params: this.sanitizeParams(params),
      });

      throw error;
    }
  }
}
```

## **7. Deployment & Production**

### **Environment Configuration**

```bash
# Core environment variables
DATABASE_URL=file:./workflow.db              # Database connection
NODE_ENV=production                          # Environment mode
LOG_LEVEL=info                              # Logging level
CACHE_TTL=300                               # Cache time-to-live
PERFORMANCE_MONITORING=true                  # Performance tracking
WORKFLOW_RULES_VERSION=1.0.0                # Rules version tracking
```

### **Docker Deployment**

```dockerfile
# Dockerfile example
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production

# Generate Prisma client
RUN npx prisma generate

# Copy application code
COPY dist ./dist/

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "dist/main.js"]
```

### **Production Checklist**

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Prisma client generated
- [ ] Logging configured for production
- [ ] Performance monitoring enabled
- [ ] Error tracking configured
- [ ] Health checks implemented
- [ ] Security headers configured

## **8. Contributing Guidelines**

### **Code Review Standards**

1. **SOLID Principles Compliance**: All code must follow SOLID, KISS and DRY principles
2. **Type Safety**: Comprehensive TypeScript typing required
3. **Test Coverage**: Minimum 75% test coverage for new code
4. **Documentation**: All public APIs must be documented
5. **Performance**: No performance regressions allowed

### **Pull Request Process**

```bash
# 1. Create feature branch
git checkout -b feature/TSK-123-description

# 2. Implement changes following coding standards
# 3. Add comprehensive tests
npm run test

# 4. Run linting and formatting
npm run lint
npm run format

# 5. Update documentation if needed
# 6. Create pull request with detailed description
# 7. Address code review feedback
# 8. Merge after approval
```

### **Commit Message Format**

```bash
# Format: type(scope): description
feat(subtask): Add new subtask management functionality
fix(database): Resolve Prisma connection timeout issue
docs(api): Update MCP tool documentation
test(integration): Add comprehensive workflow tests
refactor(services): Consolidate duplicate service logic
```

## **9. Troubleshooting**

### **Common Issues**

#### **Database Issues**

```bash
# Prisma client out of sync
npm run db:generate

# Database schema issues
npx prisma db push --force-reset

# Migration issues
npx prisma migrate reset
```

#### **MCP Connection Issues**

```bash
# Check MCP server status
npm run start:dev

# Verify MCP client configuration
# Check mcpServers configuration in client

# Test MCP tools manually
# Use MCP client debugging tools
```

#### **Performance Issues**

```bash
# Check database query performance
npx prisma studio

# Monitor cache hit rates
# Check logs for performance metrics

# Profile application performance
npm run start:debug
```

## **10. Advanced Development Topics**

### **Custom MCP Tool Development**

```typescript
// 1. Create service with business logic
@Injectable()
export class CustomService {
  async executeCustomLogic(params: CustomParams): Promise<CustomResult> {
    // Implementation
  }
}

// 2. Create MCP tool wrapper
@Injectable()
export class CustomMCPService {
  constructor(private readonly customService: CustomService) {}

  @Tool({
    name: 'custom_operation',
    description: 'Custom MCP tool',
    schema: CustomParamsSchema,
  })
  async customOperation(params: CustomParams): Promise<CustomResponse> {
    const result = await this.customService.executeCustomLogic(params);
    return {
      data: result,
      metadata: {
        operation: 'custom_operation',
        responseTime: Date.now() - startTime,
      },
    };
  }
}

// 3. Register in module
@Module({
  providers: [CustomService, CustomMCPService],
  exports: [CustomService],
})
export class CustomModule {}
```

### **Database Schema Evolution**

```bash
# 1. Update Prisma schema
# Edit prisma/schema.prisma

# 2. Create migration
npx prisma migrate dev --name add-custom-feature

# 3. Generate client
npx prisma generate

# 4. Update TypeScript types
# 5. Update services to use new schema
# 6. Add tests for new functionality
```

### **Performance Monitoring**

```typescript
// Use performance decorator
@Performance()
async performanceMonitoredOperation(): Promise<any> {
  // Operation implementation
}

// Custom performance tracking
async customOperation(): Promise<any> {
  const startTime = Date.now();
  try {
    const result = await this.executeOperation();
    this.performanceMonitor.recordSuccess('customOperation', Date.now() - startTime);
    return result;
  } catch (error) {
    this.performanceMonitor.recordError('customOperation', Date.now() - startTime, error);
    throw error;
  }
}
```

---

**🚀 This developer guide provides comprehensive guidance for working with the Anubis. The system represents a sophisticated, enterprise-grade architecture that combines NestJS v11.0.1, Prisma v6.9.0, and MCP protocol compliance to deliver intelligent workflow guidance for AI agents in software development.**
