# 🔄 Service Migration Priority Matrix

## Overview
This matrix provides prioritization and migration strategy for the 6 remaining services that need repository pattern implementation.

---

## 📊 PRIORITY MATRIX

| Service | Current State | Risk Level | Migration Complexity | Business Impact | Priority |
|---------|---------------|------------|---------------------|-----------------|----------|
| `step-query.service.ts` | Mixed (Partial) | 🔴 HIGH | 🔴 HIGH | 🔴 CRITICAL | **P0** |
| `step-execution.service.ts` | Direct Prisma | 🔴 HIGH | 🟡 MEDIUM | 🔴 CRITICAL | **P1** |
| `role-transition.service.ts` | Direct Prisma | 🟡 MEDIUM | 🟡 MEDIUM | 🟡 HIGH | **P2** |
| `task-operations.service.ts` | Direct Prisma | 🟡 MEDIUM | 🟢 LOW | 🟡 HIGH | **P3** |
| `execution-data-enricher.service.ts` | Direct Prisma | 🟡 MEDIUM | 🟢 LOW | 🟢 MEDIUM | **P4** |
| `workflow-guidance-mcp.service.ts` | Direct Prisma | 🟡 MEDIUM | 🟢 LOW | 🟢 MEDIUM | **P5** |

---

## 🎯 DETAILED MIGRATION PLANS

### P0: step-query.service.ts (HIGHEST PRIORITY)
**Current State**: Mixed implementation (partially migrated)  
**Risk**: 🔴 HIGH - Central to all step operations  
**Timeline**: 2-3 days

#### Why Priority 0?
- Already partially migrated - creates inconsistency
- Core dependency for step execution workflow
- Complex query patterns need careful migration
- Blocking other service migrations

#### Migration Strategy:
```typescript
// Current mixed state:
constructor(
  private readonly stepRepository: IWorkflowStepRepository,
  private readonly executionRepository: IWorkflowExecutionRepository,
  private readonly prisma: PrismaService, // TODO: Remove after full refactoring
) {}

// Target state:
constructor(
  private readonly stepRepository: IWorkflowStepRepository,
  private readonly executionRepository: IWorkflowExecutionRepository,
  private readonly stepProgressRepository: IStepProgressRepository,
  private readonly roleRepository: IWorkflowRoleRepository,
) {}
```

#### Required New Repositories:
1. `IStepProgressRepository` - For step progress tracking
2. Enhanced `IWorkflowStepRepository` - For complex step queries

#### Key Migration Tasks:
- [ ] Move complex Prisma queries to repository methods
- [ ] Create `getStepWithDetails()` repository method
- [ ] Implement `validateAndSyncExecutionState()` repository method
- [ ] Remove direct Prisma dependency
- [ ] Update all method signatures

---

### P1: step-execution.service.ts (HIGH PRIORITY)
**Current State**: Direct Prisma injection  
**Risk**: 🔴 HIGH - Core execution engine  
**Timeline**: 1-2 days

#### Why Priority 1?
- Central to workflow execution process
- Handles step lifecycle management
- Straightforward migration pattern
- Enables P2 and P3 migrations

#### Migration Strategy:
```typescript
// Current state:
constructor(
  private readonly guidanceService: StepGuidanceService,
  private readonly progressService: StepProgressTrackerService,
  private readonly queryService: StepQueryService,
  private readonly prisma: PrismaService,
  private readonly workflowExecutionService: WorkflowExecutionService,
) {}

// Target state:
constructor(
  private readonly guidanceService: StepGuidanceService,
  private readonly progressService: StepProgressTrackerService,
  private readonly queryService: StepQueryService,
  private readonly executionRepository: IWorkflowExecutionRepository,
  private readonly workflowExecutionService: WorkflowExecutionService,
) {}
```

#### Required Repository Operations:
- `findExecutionById()` - Get execution by ID
- `updateExecutionState()` - Update execution state
- `createExecutionEntry()` - Create new execution record

#### Key Migration Tasks:
- [ ] Replace `prisma.workflowExecution` calls with repository methods
- [ ] Update `processStepCompletion()` method
- [ ] Remove PrismaService dependency
- [ ] Add comprehensive error handling

---

### P2: role-transition.service.ts (MEDIUM PRIORITY)
**Current State**: Direct Prisma injection  
**Risk**: 🟡 MEDIUM - Role transition logic  
**Timeline**: 1-2 days

#### Why Priority 2?
- Handles role transitions and workflow progression
- Transaction-heavy operations need careful migration
- Depends on P0 and P1 completions
- Less frequent usage than core services

#### Migration Strategy:
```typescript
// Current state:
constructor(
  private prisma: PrismaService,
  private workflowExecutionService: WorkflowExecutionService,
) {}

// Target state:
constructor(
  private readonly roleRepository: IWorkflowRoleRepository,
  private readonly transitionRepository: IRoleTransitionRepository,
  private readonly workflowExecutionService: WorkflowExecutionService,
) {}
```

#### Required New Repository:
`IRoleTransitionRepository` - For role transition operations

#### Key Migration Tasks:
- [ ] Create `IRoleTransitionRepository` interface
- [ ] Implement `RoleTransitionRepository` class
- [ ] Migrate `getAvailableTransitions()` method
- [ ] Migrate `validateTransition()` method
- [ ] Handle transaction operations properly

---

### P3: task-operations.service.ts (MEDIUM PRIORITY)
**Current State**: Direct Prisma injection  
**Risk**: 🟡 MEDIUM - Task CRUD operations  
**Timeline**: 1 day

#### Why Priority 3?
- Already has `ITaskRepository` interface
- Straightforward CRUD operations
- Well-defined domain boundaries
- Lower risk of regression

#### Migration Strategy:
```typescript
// Current state:
constructor(
  private readonly taskRepository: ITaskRepository,
  private readonly prisma: PrismaService, // Keep for workflow execution updates
) {}

// Target state:
constructor(
  private readonly taskRepository: ITaskRepository,
  private readonly executionRepository: IWorkflowExecutionRepository,
) {}
```

#### Key Migration Tasks:
- [ ] Replace `prisma.workflowExecution` calls with repository methods
- [ ] Remove PrismaService dependency
- [ ] Update execution-related operations
- [ ] Validate task CRUD operations

---

### P4: execution-data-enricher.service.ts (LOWER PRIORITY)
**Current State**: Direct Prisma injection  
**Risk**: 🟡 MEDIUM - Data enrichment for UI  
**Timeline**: 1 day

#### Why Priority 4?
- Support service for UI data enrichment
- Simple query operations
- Lower business impact
- Can be done independently

#### Migration Strategy:
```typescript
// Current state:
constructor(
  private readonly stepExecution: StepExecutionService,
  private readonly roleTransition: RoleTransitionService,
  private readonly workflowGuidance: WorkflowGuidanceService,
  private readonly prisma: PrismaService,
) {}

// Target state:
constructor(
  private readonly stepExecution: StepExecutionService,
  private readonly roleTransition: RoleTransitionService,
  private readonly workflowGuidance: WorkflowGuidanceService,
  private readonly executionRepository: IWorkflowExecutionRepository,
  private readonly roleRepository: IWorkflowRoleRepository,
) {}
```

#### Key Migration Tasks:
- [ ] Replace Prisma queries with repository methods
- [ ] Update `getNextStepsForExecution()` method
- [ ] Update `getAvailableTransitions()` method
- [ ] Remove PrismaService dependency

---

### P5: workflow-guidance-mcp.service.ts (LOWEST PRIORITY)
**Current State**: Direct Prisma injection  
**Risk**: 🟡 MEDIUM - MCP interface layer  
**Timeline**: 0.5 days

#### Why Priority 5?
- MCP interface layer (not core business logic)
- Simple lookup operations
- Lowest business impact
- Can be done last

#### Migration Strategy:
```typescript
// Current state:
constructor(
  private readonly workflowGuidanceService: WorkflowGuidanceService,
  private readonly prisma: PrismaService,
  private readonly workflowExecutionService: WorkflowExecutionService,
) {}

// Target state:
constructor(
  private readonly workflowGuidanceService: WorkflowGuidanceService,
  private readonly executionRepository: IWorkflowExecutionRepository,
  private readonly workflowExecutionService: WorkflowExecutionService,
) {}
```

#### Key Migration Tasks:
- [ ] Replace `prisma.workflowExecution` calls with repository methods
- [ ] Update execution lookup logic
- [ ] Remove PrismaService dependency
- [ ] Validate MCP tool functionality

---

## 📋 IMPLEMENTATION TIMELINE

### Week 1: Critical Infrastructure
- **Day 1-2**: Complete P0 (`step-query.service.ts`)
- **Day 3-4**: Complete P1 (`step-execution.service.ts`)
- **Day 5**: Testing and validation

### Week 2: Core Services
- **Day 1-2**: Complete P2 (`role-transition.service.ts`)
- **Day 3**: Complete P3 (`task-operations.service.ts`)
- **Day 4-5**: Integration testing

### Week 3: Support Services
- **Day 1**: Complete P4 (`execution-data-enricher.service.ts`)
- **Day 2**: Complete P5 (`workflow-guidance-mcp.service.ts`)
- **Day 3-5**: Final validation and testing

---

## 🔄 DEPENDENCY CHAIN

```
P0 (step-query.service.ts)
├── Blocks P1 (step-execution.service.ts)
├── Blocks P2 (role-transition.service.ts)
└── Provides foundation for all others

P1 (step-execution.service.ts)
├── Enables P2 (role-transition.service.ts)
└── Supports P4 (execution-data-enricher.service.ts)

P2 (role-transition.service.ts)
└── Supports P4 (execution-data-enricher.service.ts)

P3 (task-operations.service.ts)
└── Independent, can be done anytime

P4 (execution-data-enricher.service.ts)
└── Depends on P1, P2 completion

P5 (workflow-guidance-mcp.service.ts)
└── Independent, can be done last
```

---

## 🎯 SUCCESS METRICS

### Per Service:
- [ ] Zero compilation errors
- [ ] All tests passing
- [ ] No direct Prisma dependencies
- [ ] Repository pattern compliance

### Overall Project:
- [ ] 100% repository pattern adoption
- [ ] Build passes without errors
- [ ] Performance maintained or improved
- [ ] Documentation updated

---

## 🚨 RISK MITIGATION

### High-Risk Operations:
1. **Complex Queries**: Carefully migrate complex Prisma queries
2. **Transactions**: Ensure transaction boundaries are maintained
3. **Error Handling**: Preserve existing error handling patterns
4. **Performance**: Monitor query performance during migration

### Mitigation Strategies:
1. **Incremental Migration**: One service at a time
2. **Comprehensive Testing**: Test each migration thoroughly
3. **Performance Monitoring**: Track metrics during migration
4. **Rollback Plan**: Keep previous versions available

---

*This priority matrix provides a structured approach to completing the repository pattern migration while minimizing risk and maintaining system stability.*
