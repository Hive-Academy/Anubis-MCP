# Technical Architecture

## Technical Stack

### Core Framework

- **Backend**: NestJS v11.0.1 with TypeScript for enterprise-grade scalability
- **Database**: Prisma ORM v6.9.0 with SQLite (default) and PostgreSQL support
- **MCP Integration**: @rekog/mcp-nest v1.5.2 for seamless protocol compliance
- **Validation Framework**: Zod v3.24.4 for comprehensive parameter validation
- **Runtime Environment**: Node.js >=18.0.0 with npm >=8.0.0
- **Package Version**: @hive-academy/mcp-workflow-manager v1.0.14

### Architecture Patterns

- **Domain-driven design** with clear boundaries and separation of concerns
- **MCP-compliant guidance architecture** providing intelligent workflow guidance
- **Database-driven workflow intelligence** with dynamic rule management
- **Clean Architecture** principles with proper dependency injection patterns
- **Feature-based organization** with embedded workflow intelligence

## **🚀 MCP-Compliant Guidance Architecture**

**ARCHITECTURAL FOUNDATION**: The MCP Workflow Manager implements a **guidance-only architecture** that provides intelligent workflow guidance for AI agents to execute locally, ensuring full MCP protocol compliance.

### **Core Architectural Innovation: Database-Driven Workflow Intelligence**

The system eliminates static configuration files in favor of a **living, intelligent workflow system** that provides context-aware guidance directly embedded in MCP responses.

#### **Database-Driven Intelligence Architecture**

```typescript
// Core workflow intelligence tables
model WorkflowRule {
  id          Int      @id @default(autoincrement())
  roleId      String   // boomerang, researcher, architect, etc.
  serviceType String   // task, planning, workflow, review, research, subtask
  ruleName    String
  description String
  conditions  Json     // Dynamic rule conditions
  actions     Json     // Dynamic rule actions
  guidance    Json     // Context-aware guidance content
  priority    Int      @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model WorkflowStep {
  id              Int      @id @default(autoincrement())
  roleId          String
  stepName        String
  description     String
  prerequisites   Json     // Step dependencies
  actions         Json     // Actions to execute
  validations     Json     // Success criteria
  nextSteps       Json     // Possible next steps
  guidance        Json     // Step-specific guidance
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model RoleTransition {
  id              Int      @id @default(autoincrement())
  fromRole        String
  toRole          String
  transitionName  String
  requirements    Json     // Transition requirements
  validations     Json     // Validation rules
  handoffGuidance Json     // Handoff instructions
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### **MCP-Compliant Architecture Flow**

```mermaid
graph TD
    A[AI Agent/Cursor IDE] <-->|MCP Protocol| B(MCP Server - NestJS)
    B --> C{Guidance Generation Engine}
    C --> D[Database-Driven Intelligence]
    C --> E[Context-Aware Guidance]
    C --> F[Role-Based Recommendations]

    D --> G[StepGuidanceService]
    E --> G
    F --> G

    G --> H[Structured Guidance Response]
    H --> I{MCP Tool Layer - Guidance Only}
    I --> J[Guidance Generation Services]
    J --> K[PrismaService]
    K <--> L[(Workflow Database)]

    subgraph "MCP Compliance Layer"
        direction LR
        M[No Execution Logic]
        N[Guidance-Only Responses]
        O[AI Agent Instructions]
        P[Local Execution Recommendations]
        M --> N
        N --> O
        O --> P
    end

    subgraph "Guidance Components"
        direction LR
        Q[WorkflowRule Table]
        R[WorkflowStep Table]
        S[RoleTransition Table]
        T[GuidanceGeneratorService]
        Q --> T
        R --> T
        S --> T
        T --> G
    end

    subgraph "AI Agent Execution"
        direction LR
        U[Receives Guidance]
        V[Executes Locally]
        W[Uses Own Tools]
        X[Reports Back]
        U --> V
        V --> W
        W --> X
        X --> A
    end
```

## **🏗️ Domain-Driven Design Architecture**

### **Domain Structure**

The system follows a clean domain-driven design with clear boundaries and responsibilities:

```
src/task-workflow/
├── domains/
│   ├── workflow-rules/              # PRIMARY MCP INTERFACE
│   │   ├── services/
│   │   │   ├── workflow-guidance.service.ts        # Centralized guidance
│   │   │   ├── step-guidance.service.ts            # Step-specific guidance
│   │   │   ├── step-execution.service.ts           # Step management
│   │   │   ├── role-transition.service.ts          # Role transitions
│   │   │   ├── workflow-execution.service.ts       # Execution management
│   │   │   ├── workflow-bootstrap.service.ts       # Workflow initialization
│   │   │   └── core-service-orchestrator.service.ts # Service coordination
│   │   ├── mcp-operations/
│   │   │   ├── workflow-guidance-mcp.service.ts     # Guidance MCP tools
│   │   │   ├── step-execution-mcp.service.ts       # Step execution MCP tools
│   │   │   ├── role-transition-mcp.service.ts      # Transition MCP tools
│   │   │   ├── workflow-execution-mcp.service.ts   # Execution MCP tools
│   │   │   ├── workflow-bootstrap-mcp.service.ts   # Bootstrap MCP tools
│   │   │   └── mcp-operation-execution-mcp.service.ts # Operation orchestration
│   │   └── utils/                   # Shared utilities and helpers
│   ├── core-workflow/               # INTERNAL BUSINESS LOGIC
│   │   ├── task-operations.service.ts    # Task lifecycle management
│   │   ├── planning-operations.service.ts # Implementation planning
│   │   ├── individual-subtask-operations.service.ts # Subtask management
│   │   ├── workflow-operations.service.ts # Role-based delegation
│   │   ├── review-operations.service.ts # Code review operations
│   │   ├── research-operations.service.ts # Research operations
│   │   └── schemas/                 # Zod validation schemas
│   └── reporting/                   # ANALYTICS & DASHBOARDS
│       ├── shared/                  # Core shared services
│       │   ├── report-data.service.ts        # Centralized Prisma queries
│       │   ├── report-transform.service.ts   # Data formatting + Chart.js
│       │   ├── report-metadata.service.ts    # Common metadata
│       │   ├── mcp-file-manager.service.ts    # File management
│       │   └── mcp-response-builder.service.ts # Response building
│       ├── workflow-analytics/      # Workflow analysis
│       │   ├── delegation-flow/     # Delegation pattern analysis
│       │   ├── role-performance/    # Role performance metrics
│       │   └── workflow-analytics/  # Cross-workflow analytics
│       ├── task-management/         # Task reporting
│       │   ├── task-detail/         # Individual task reports
│       │   └── implementation-plan/ # Implementation tracking
│       └── dashboard/               # Interactive dashboards
│           ├── interactive-dashboard/ # Main dashboard
│           └── simple-report/       # Simple reporting
```

### **Domain Responsibilities**

#### **Workflow-Rules Domain (Primary Interface)**

- **Purpose**: Primary MCP interface layer for user interactions
- **Responsibilities**:
  - Provide context-aware workflow guidance
  - Manage step execution guidance
  - Handle role transitions and validations
  - Generate intelligent recommendations
  - Orchestrate core service operations
- **MCP Tools**: 8 specialized tools for workflow management
- **Key Services**:
  - `WorkflowGuidanceService` - Centralized guidance generation
  - `StepGuidanceService` - Step-specific guidance and execution
  - `RoleTransitionService` - Role transition management
  - `CoreServiceOrchestratorService` - Service coordination

#### **Core-Workflow Domain (Internal Services)**

- **Purpose**: Internal business logic services
- **Responsibilities**:
  - Task lifecycle management
  - Implementation planning and subtask operations
  - Role-based delegation and workflow operations
  - Code review and research operations
- **Access**: Internal only, not exposed directly to MCP clients
- **Key Services**:
  - `TaskOperationsService` - Task CRUD operations
  - `PlanningOperationsService` - Implementation planning
  - `IndividualSubtaskOperationsService` - Subtask management
  - `WorkflowOperationsService` - Delegation and workflow control

#### **Reporting Domain (Analytics)**

- **Purpose**: Analytics and dashboard generation
- **Responsibilities**:
  - Interactive dashboard creation with Chart.js
  - Workflow analytics and performance metrics
  - Task detail reports and progress tracking
  - System health monitoring
- **MCP Tools**: 4 specialized tools for reporting and analytics
- **Key Features**:
  - Feature-based organization with embedded intelligence
  - HTML generation with TypeScript string interpolation
  - Vanilla JavaScript with Chart.js visualizations
  - Tailwind CSS styling via CDN

## **🔧 MCP Tool Architecture**

### **Tool Organization (12 Total Tools)**

#### **Workflow Management Tools (8 tools)**

- `get_workflow_guidance` - Context-aware role behavior with embedded intelligence
- `get_step_guidance` - Step-by-step execution guidance with validation
- `report_step_completion` - Step completion reporting and progress tracking
- `get_step_progress` - Step execution history and analytics
- `get_next_available_step` - AI-powered next step recommendations
- `get_role_transitions` - Intelligent transition recommendations
- `validate_transition` - Comprehensive transition requirement checking
- `execute_transition` - Intelligent role transition execution

#### **Execution Management Tools (2 tools)**

- `workflow_execution_operations` - Query/update execution state
- `bootstrap_workflow` - Workflow initialization and setup

#### **Service Operations Tool (1 tool)**

- `execute_mcp_operation` - Execute core service operations (TaskOperations, PlanningOperations, etc.)

#### **Reporting Tools (4 tools)**

- `generate_workflow_report` - Interactive dashboards with Chart.js visualizations
- `get_report_status` - Report generation status and progress
- `cleanup_report` - Report file management and cleanup

### **MCP Tool Implementation Pattern**

```typescript
@Injectable()
export class ExampleMCPService {
  constructor(
    private readonly workflowGuidance: WorkflowGuidanceService,
    private readonly stepGuidance: StepGuidanceService,
  ) {}

  @Tool({
    name: 'example_operation',
    description: 'Example with embedded intelligence',
    schema: ExampleParamsSchema, // Zod validation
  })
  async exampleOperation(params: ExampleParams): Promise<EnhancedMCPResponse> {
    // Core business logic
    const result = await this.executeBusinessLogic(params);

    // Embedded intelligence generation
    const guidance = await this.workflowGuidance.generateRoleGuidance({
      roleName: params.currentRole,
      serviceType: 'example',
      taskContext: params.taskContext,
      executionData: result,
    });

    // Return enhanced response with embedded intelligence
    return {
      data: result,
      workflowGuidance: guidance,
      recommendations: await this.generateRecommendations(params, result),
    };
  }
}
```

## **💾 Database Architecture**

### **Core Database Models**

#### **Workflow Management Models**

```typescript
model Task {
  id          Int      @id @default(autoincrement())
  name        String
  description Json     // TaskDescription structure
  status      String   // not-started, in-progress, completed, failed
  priority    String   // Low, Medium, High, Critical
  owner       String?
  mode        String?
  gitBranch   String?
  dependencies String[] // Task dependencies
  redelegationCount Int @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  plans       ImplementationPlan[]
  delegations DelegationRecord[]
  reviews     CodeReview[]
  research    ResearchReport[]
  transitions WorkflowTransition[]
  executions  WorkflowExecution[]
}

model ImplementationPlan {
  id          Int      @id @default(autoincrement())
  taskId      Int
  title       String
  description String
  approach    Json
  subtasks    Subtask[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  task        Task     @relation(fields: [taskId], references: [id])
}

model Subtask {
  id                    Int      @id @default(autoincrement())
  taskId                Int      // Direct reference to task
  planId                Int
  name                  String
  description           String
  status                String   // not-started, in-progress, completed, failed
  sequenceNumber        Int
  batchId               String?  // Batch grouping identifier
  batchTitle            String?  // Human-readable batch name
  strategicGuidance     Json?
  qualityConstraints    Json?
  successCriteria       String[]
  architecturalRationale String?
  completionEvidence    Json?
  actualDuration        String?
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  plan                  ImplementationPlan @relation(fields: [planId], references: [id])
}
```

#### **Workflow Intelligence Models**

```typescript
model WorkflowRule {
  id          Int      @id @default(autoincrement())
  roleId      String   // boomerang, researcher, architect, senior-developer, code-review
  serviceType String   // task, planning, workflow, review, research, subtask
  ruleName    String
  description String
  conditions  Json     // Dynamic rule conditions
  actions     Json     // Dynamic rule actions
  guidance    Json     // Context-aware guidance content
  priority    Int      @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model WorkflowExecution {
  id                String   @id @default(cuid())
  taskId            Int?     // Optional for bootstrap executions
  currentRoleId     String
  currentStepId     String?
  executionState    Json     // Current workflow state
  executionContext  Json     // Additional context
  stepsCompleted    Int      @default(0)
  totalSteps        Int      @default(0)
  progressPercentage Float   @default(0)
  executionMode     String   @default("GUIDED") // GUIDED, AUTOMATED, HYBRID
  autoCreatedTask   Boolean  @default(false)
  taskCreationData  Json?    // Data for automatic task creation
  lastError         Json?    // Last error encountered
  recoveryAttempts  Int      @default(0)
  maxRecoveryAttempts Int    @default(3)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  completedAt       DateTime?
  startedAt         DateTime @default(now())

  task              Task?    @relation(fields: [taskId], references: [id])
}

model WorkflowRole {
  id           String   @id @default(cuid())
  name         String   @unique // boomerang, researcher, architect, etc.
  displayName  String
  description  String
  priority     Int      @default(0)
  isActive     Boolean  @default(true)
  roleType     String   @default("SPECIALIST") // COORDINATOR, SPECIALIST, REVIEWER
  capabilities Json     // Role capabilities and behavior
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model WorkflowStep {
  id                String   @id @default(cuid())
  roleId            String
  name              String
  displayName       String
  description       String
  sequenceNumber    Int
  isRequired        Boolean  @default(true)
  estimatedTime     String?
  stepType          String   @default("ACTION") // ACTION, VALIDATION, TRANSITION
  actionData        Json?
  behavioralContext Json?
  approachGuidance  Json?
  qualityChecklist  String[]
  patternEnforcement Json?
  contextValidation Json?
  triggerReport     Boolean  @default(false)
  reportType        String?
  reportTemplate    String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

### **Database Configuration**

#### **SQLite (Default)**

- **File Location**: `./workflow.db` (project-specific)
- **Benefits**: Zero configuration, automatic project isolation
- **Use Case**: Development, small teams, single-user scenarios

#### **PostgreSQL (Production)**

- **Configuration**: Environment variables for connection
- **Benefits**: Multi-user support, advanced features, scalability
- **Use Case**: Production deployments, team environments

```typescript
// Database configuration
const databaseUrl = process.env.DATABASE_URL || 'file:./workflow.db';

// Prisma configuration
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite" // or "postgresql"
  url      = env("DATABASE_URL")
}
```

## **⚡ Performance Architecture**

### **Two-Layer Caching System**

#### **Layer 1: MCP Response Cache**

```typescript
interface MCPResponseCache {
  key: string; // Generated from tool name + parameters
  response: EnhancedMCPResponse; // Complete MCP tool response with guidance
  ttl: number; // Time-to-live in seconds
  tokenEstimate: number; // Estimated token count for savings tracking
  guidanceHash: string; // Hash of embedded guidance for invalidation
}
```

#### **Layer 2: Database Query Cache**

```typescript
interface DatabaseQueryCache {
  key: string; // Generated from query + parameters
  data: any; // Prisma query results + workflow rules
  ttl: number; // Time-to-live in seconds
  relationships: string[]; // Related entities for invalidation
  rulesVersion: string; // Workflow rules version for cache invalidation
}
```

### **Performance Optimization Features**

- **Token Savings**: 25-75% reduction in token usage through intelligent caching
- **Response Times**: Sub-50ms for cached operations vs 150ms+ for uncached queries
- **Memory Management**: LRU eviction with configurable memory limits
- **STDIO Compatibility**: File-based logging that doesn't interfere with MCP protocol

### **Cache Strategy by Tool Type**

- **High-frequency tools** (`get_workflow_guidance`): 5-minute TTL, aggressive caching
- **Medium-frequency tools** (`get_step_guidance`): 2-minute TTL, selective caching
- **Low-frequency tools** (`execute_transition`): 30-second TTL, minimal caching
- **Write operations**: Intelligent cache invalidation for related entities

## **📊 Reporting Architecture**

### **Feature-Based Organization**

The reporting system uses feature-based organization with embedded workflow intelligence:

```
/src/task-workflow/domains/reporting/
  /shared/                           # Core shared services
    - report-data.service.ts         # Centralized Prisma queries
    - report-transform.service.ts    # Data formatting + Chart.js
    - report-metadata.service.ts     # Common metadata
    - mcp-file-manager.service.ts    # File management
    - mcp-response-builder.service.ts # Response building
    - html-generator-factory.service.ts # HTML generation factory

  /workflow-analytics/               # Workflow analysis domain
    /delegation-flow/                # Delegation pattern analysis
    /role-performance/               # Role performance metrics
    /workflow-analytics/             # Cross-workflow analytics

  /task-management/                  # Task reporting domain
    /task-detail/                    # Individual task reports
    /implementation-plan/            # Implementation tracking

  /dashboard/                        # Dashboard domain
    /interactive-dashboard/          # Main dashboard
      /view/                         # View generators
        - html-head.generator.ts     # HTML head + CDN
        - metrics-cards.generator.ts # Metric cards
        - charts.generator.ts        # Chart.js integration
        - tasks-list.generator.ts    # Task displays
        - scripts.generator.ts       # Vanilla JavaScript
    /simple-report/                  # Simple reporting
```

### **Report Generation Technology**

- **Server-Side**: NestJS + TypeScript + Prisma ORM
- **HTML Generation**: Direct TypeScript string interpolation (no template engines)
- **Client-Side**: Vanilla JavaScript with Chart.js visualizations
- **Styling**: Tailwind CSS via CDN with custom CSS classes
- **Interactivity**: Native JavaScript DOM manipulation
- **Charts**: Chart.js for data visualization with workflow progress indicators

## **🔒 Security Architecture**

### **Input Validation**

- **Zod Schemas**: Comprehensive parameter validation for all MCP tools
- **Type Safety**: TypeScript strict mode with comprehensive type checking
- **SQL Injection Prevention**: Prisma ORM provides built-in protection
- **HTML Escaping**: Built-in utilities in report generators

### **Authentication & Authorization**

- **NestJS Guards**: Configurable authentication and authorization
- **Environment Variables**: Secure configuration management
- **Database Security**: Proper connection string management
- **Workflow Rule Validation**: Security validation for dynamic rules

### **Error Handling**

- **Structured Error Responses**: Consistent error format across all tools
- **Logging**: Comprehensive logging with performance monitoring
- **Graceful Degradation**: Fallback behavior for optional features
- **Recovery Mechanisms**: Automatic retry and recovery patterns

## **🚀 Deployment Architecture**

### **NPX Package (Recommended)**

The system is distributed as a self-contained NPX package with automatic dependency management:

```json
{
  "mcpServers": {
    "workflow-manager": {
      "command": "npx",
      "args": ["-y", "@hive-academy/mcp-workflow-manager"]
    }
  }
}
```

**Automatic Dependency Management:**

- **Prisma Client Generation**: Generates database client on first run
- **Database Migrations**: Runs migrations automatically when needed
- **Environment Detection**: Adapts behavior for NPX vs local vs global installations
- **Project Isolation**: Each project gets its own database automatically

### **Docker Deployment**

For production environments, Docker containers are available:

```json
{
  "mcpServers": {
    "workflow-manager": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "-v",
        "project-workflow:/app/data",
        "--rm",
        "hiveacademy/mcp-workflow-manager"
      ]
    }
  }
}
```

**Container Features:**

- **Consistent Environment**: Same runtime across all deployments
- **Volume Management**: Persistent data storage with project isolation
- **Scalability**: Support for horizontal scaling and load balancing
- **Version Control**: Specific image tags for deployment management

### **Environment Configuration**

```typescript
// Core environment variables
DATABASE_URL=file:./workflow.db              // Database connection
NODE_ENV=production                          // Environment mode
LOG_LEVEL=info                              // Logging level
CACHE_TTL=300                               // Cache time-to-live
PERFORMANCE_MONITORING=true                  // Performance tracking
WORKFLOW_RULES_VERSION=1.0.0                // Rules version tracking
```

## **🔧 Development Architecture**

### **Development Setup**

```bash
# Local development
npm install
npm run dev

# Database setup
npx prisma generate
npx prisma migrate dev

# Testing
npm run test
npm run test:e2e
```

### **Code Quality Standards**

- **TypeScript Strict Mode**: Comprehensive type checking
- **ESLint + Prettier**: Code formatting and linting
- **Jest Testing**: Unit and integration testing with 75% coverage
- **Prisma Migrations**: Version-controlled database schema changes
- **Git Hooks**: Pre-commit validation and testing

### **Architecture Validation**

The system includes comprehensive architectural validation:

- **Module Structure Verification**: Ensures proper dependency injection
- **Service Boundary Validation**: Confirms clean separation of concerns
- **MCP Compliance Checking**: Validates protocol adherence
- **Performance Monitoring**: Tracks response times and resource usage
- **Quality Gate Enforcement**: Automated quality validation

---

**The MCP Workflow Manager represents a sophisticated, enterprise-grade architecture that combines the power of NestJS v11.0.1, Prisma v6.9.0, and MCP protocol compliance to deliver intelligent workflow guidance for AI-assisted development.**
