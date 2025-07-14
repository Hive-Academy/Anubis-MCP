# 🏺 Developer Guide - Anubis (v1.2.11)

**Repository Pattern Architecture | Enterprise MCP Workflow System**

## Quick Reference

- **Version**: v1.2.11
- **Package**: @hive-academy/anubis v1.2.11  
- **Architecture**: Repository Pattern (225% implementation success)
- **Type Safety**: 95% TypeScript compliance, zero compilation errors

## **🚀 Quick Setup**

```bash
# Clone and install
git clone https://github.com/hive-academy/anubis.git
cd anubis
npm install

# Database setup
npm run prisma:generate
npm run prisma:migrate

# Build and verify
npm run build
npm run test
```

### **Development Commands**

```bash
npm run start:dev    # Development server
npm run build        # Production build  
npm run test         # Run tests
npm run type-check   # TypeScript validation
```

## **🏗️ Repository Pattern Development**

### **Creating Services**

```typescript
// 1. Repository Interface
export interface IMyEntityRepository {
  findById(id: string): Promise<MyEntity | null>;
  create(data: CreateMyEntityData): Promise<MyEntity>;
  update(id: string, data: UpdateMyEntityData): Promise<MyEntity>;
}

// 2. Repository Implementation  
@Injectable()
export class MyEntityRepository implements IMyEntityRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<MyEntity | null> {
    return this.prisma.myEntity.findUnique({ where: { id } });
  }

  async create(data: CreateMyEntityData): Promise<MyEntity> {
    return this.prisma.myEntity.create({ data });
  }
}

// 3. Operations Service
@Injectable()
export class MyEntityOperationsService {
  constructor(private repository: IMyEntityRepository) {}

  async getEntity(id: string): Promise<MyEntity> {
    const entity = await this.repository.findById(id);
    if (!entity) throw new NotFoundException('Entity not found');
    return entity;
  }
}
```

### **MCP Tool Integration**

```typescript
@McpTool()
export class MyEntityTools {
  constructor(private operations: MyEntityOperationsService) {}

  @McpFunction('get_entity', {
    description: 'Get entity by ID',
    parameters: z.object({
      id: z.string(),
    }),
  })
  async getEntity(params: { id: string }) {
    return this.operations.getEntity(params.id);
  }
}
```

## **📁 Project Structure**

```
src/
├── domains/
│   ├── task-management/        # Task workflow operations
│   ├── workflow-rules/         # MCP workflow tools  
│   └── init-rules/            # Rule initialization
├── prisma/                    # Database services
├── types/                     # Shared TypeScript types
└── utils/                     # Common utilities
```

## **🧪 Testing Strategy**

### **Unit Tests**

```typescript
describe('MyEntityOperationsService', () => {
  let service: MyEntityOperationsService;
  let repository: jest.Mocked<IMyEntityRepository>;

  beforeEach(async () => {
    const mockRepository = createMock<IMyEntityRepository>();
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MyEntityOperationsService,
        { provide: IMyEntityRepository, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<MyEntityOperationsService>(MyEntityOperationsService);
    repository = module.get(IMyEntityRepository);
  });

  it('should get entity successfully', async () => {
    const mockEntity = { id: '1', name: 'Test' };
    repository.findById.mockResolvedValue(mockEntity);

    const result = await service.getEntity('1');
    expect(result).toEqual(mockEntity);
  });
});
```

### **Integration Tests**

```typescript
describe('MyEntity E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();
  });

  it('should create and retrieve entity', async () => {
    const entity = await prisma.myEntity.create({
      data: { name: 'Test Entity' },
    });

    expect(entity.name).toBe('Test Entity');
  });
});
```

## **🛠️ Common Troubleshooting**

### **MCP Connection Issues**

```bash
# Check MCP server status
npm run start:dev

# Test MCP tools
curl -X POST http://localhost:3000/mcp/tools

# Debug with logging
DEBUG=mcp:* npm run start:dev
```

### **Database Issues**

```bash
# Reset database
npm run prisma:reset

# Generate client
npm run prisma:generate

# Apply migrations
npm run prisma:migrate
```

### **TypeScript Errors**

```bash
# Check types
npm run type-check

# Fix imports
npm run lint:fix

# Rebuild
npm run build
```

## **📈 Performance Tips**

- **Use Repository Pattern**: Centralized data access, easier testing
- **Leverage Prisma**: Optimized queries, type safety
- **Cache Expensive Operations**: Use in-memory cache for frequent queries
- **Profile with @Performance**: Monitor critical operation timing
- **Optimize Database**: Use proper indexes and relations

## **🔧 Development Best Practices**

1. **Follow DDD Architecture**: Organize by domain, not technical layers
2. **Use Dependency Injection**: NestJS DI container for all services
3. **Type Everything**: Explicit types, avoid `any`, use strict mode
4. **Test Thoroughly**: Unit tests for logic, integration tests for data flow
5. **Handle Errors Gracefully**: Use global exception filter, structured logging
6. **Keep MCP Tools Thin**: Delegate to operation services for business logic
7. **Document Public APIs**: JSDoc comments for all public methods
8. **Use Prisma Best Practices**: Transactions for consistency, proper relations

---

**🏺 Anubis v1.2.11** - Repository Pattern Architecture for Enterprise MCP Workflows
