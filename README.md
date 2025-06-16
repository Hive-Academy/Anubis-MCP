# 🏺 Anubis - Divine Guidance for AI Workflows

**Anubis is the divine guide for AI workflows - the first MCP-compliant system that embeds intelligent guidance directly into each step, ensuring your AI agents follow complex development processes consistently and reliably.**

_Transform chaotic development into organized, quality-driven workflows with MCP-compliant AI guidance._

![Docker Pulls](https://img.shields.io/docker/pulls/hiveacademy/anubis)
![Docker Image Size](https://img.shields.io/docker/image-size/hiveacademy/anubis)
![Docker Image Version](https://img.shields.io/docker/v/hiveacademy/anubis)
[![MCP Server](https://img.shields.io/badge/MCP-Server-blue?style=for-the-badge&logo=docker)](https://hub.docker.com/r/hiveacademy/anubis)

- **NPM Package**: [@hive-academy/anubis](https://www.npmjs.com/package/@hive-academy/anubis)

A sophisticated **Model Context Protocol (MCP) server** that embeds intelligent guidance directly into each workflow step, ensuring AI agents follow complex development processes consistently and reliably. Built with NestJS v11.0.1 + Prisma v6.9.0 + @rekog/mcp-nest v1.5.2, this system follows MCP protocol standards by providing divine guidance instead of execution.

## 🏆 **ENTERPRISE-GRADE MCP WORKFLOW SYSTEM**

**✅ PRODUCTION READY**: Version 1.0.15 with full MCP protocol compliance and enterprise-grade architecture.

## 🚀 **QUICK START**

### **Prerequisites**

```bash
# Required versions
Node.js >= 18.0.0
npm >= 8.0.0
```

### **NPX Setup (Recommended)**

```json
// Add to your MCP client config (Cursor, Claude Desktop, etc.)
{
  "mcpServers": {
    "anubis": {
      "command": "npx",
      "args": ["-y", "@hive-academy/anubis"]
    }
  }
}
```

**Benefits:**

- ✅ Zero installation required
- ✅ Automatic dependency management (Prisma client generation)
- ✅ Always latest version (v1.0.15)
- ✅ Project isolation (each project gets its own database)

### **Docker Setup**

```json
{
  "mcpServers": {
    "anubis": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "-v",
        "project-anubis:/app/data",
        "--rm",
        "hiveacademy/anubis"
      ]
    }
  }
}
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

## 🎭 **AI ROLE SPECIALIZATIONS**

Our system provides specialized guidance for different development roles:

| Role                    | Purpose                      | Guidance Focus                                   | Key Capabilities                                    |
| ----------------------- | ---------------------------- | ------------------------------------------------ | --------------------------------------------------- |
| **🎯 Boomerang**        | Strategic orchestration      | Project analysis, coordination, delivery         | Git setup, codebase analysis, task creation         |
| **🔍 Researcher**       | Evidence-based investigation | Technology research, feasibility analysis        | Research operations, evidence tracking              |
| **🏗️ Architect**        | Technical design & planning  | System architecture, design patterns             | Implementation planning, batch subtask creation     |
| **👨‍💻 Senior Developer** | Implementation excellence    | Code development, SOLID, KISS and DRY principles | Iterative implementation, testing, quality gates    |
| **✅ Code Review**      | Quality assurance            | Testing, validation, acceptance criteria         | Manual testing, security validation, final approval |

### **🎯 What Makes This Special**

- **✅ MCP Compliant**: Server provides guidance, AI agents execute locally
- **✅ Zero Execution Violations**: No server-side command execution
- **✅ Database-Driven Intelligence**: Dynamic workflow rules with embedded guidance
- **✅ Domain-Driven Design**: Clean architecture with clear boundaries
- **✅ Feature-Based Organization**: Embedded workflow intelligence
- **✅ 12 Specialized MCP Tools**: Comprehensive workflow management

## 🚀 **BUSINESS VALUE**

### **For Development Teams**

- **🎯 Structured Workflows**: Transform chaotic development into organized processes
- **📈 Quality Assurance**: Built-in quality gates and validation criteria
- **⚡ Faster Delivery**: AI-guided development with intelligent recommendations
- **📊 Analytics**: Interactive dashboards with Chart.js visualizations

### **For AI Agents**

- **🧠 Intelligent Guidance**: Context-aware step-by-step instructions
- **🔧 Tool Recommendations**: Suggested tools for each development task
- **✅ Success Criteria**: Clear validation requirements for each step
- **📋 Progress Tracking**: Comprehensive workflow state management

### **For Organizations**

- **🏗️ Scalable Architecture**: Enterprise-grade NestJS + Prisma stack
- **🔒 Security**: No server-side execution reduces security risks
- **📈 ROI**: Faster development cycles with higher quality output
- **🎯 Standardization**: Consistent development practices across teams

## 🎯 **HOW IT WORKS: MCP GUIDANCE ARCHITECTURE**

### **1. AI Agent Requests Guidance**

```javascript
// AI agent calls MCP server for guidance
get_step_guidance({
  executionId: 'cmbx4tkoo0001mtuogbz69myc',
  roleId: 'cmbx4owap0003mtxkfbov68jb',
  stepId: 'iterative_subtask_implementation_cycle',
});
```

### **2. MCP Server Provides Intelligent Guidance**

```json
{
  "stepInfo": {
    "stepId": "iterative_subtask_implementation_cycle",
    "name": "iterative_subtask_implementation_cycle",
    "description": "Execute implementation in iterative cycles: get next subtask → implement → test → commit → update status → repeat"
  },
  "behavioralContext": {
    "approach": "Iterative subtask completion with individual commits and validation after each subtask",
    "principles": [
      "MANDATORY: Get next subtask using SubtaskOperations.get_next_subtask",
      "MANDATORY: Update subtask to 'in-progress' before starting implementation",
      "MANDATORY: Implement following architect's code examples exactly",
      "MANDATORY: Test each subtask implementation thoroughly",
      "MANDATORY: Commit changes after each subtask completion",
      "MANDATORY: Update subtask to 'completed' with evidence after commit"
    ]
  },
  "approachGuidance": {
    "stepByStep": [
      "Execute SubtaskOperations.get_next_subtask with taskId to get next available subtask",
      "If subtask available: Update status to 'in-progress' using SubtaskOperations.update_subtask",
      "Implement the subtask following architect's strategic guidance and code examples exactly",
      "Test the subtask implementation (unit tests, integration tests, manual validation)",
      "Commit changes with descriptive message referencing the completed subtask",
      "Update subtask status to 'completed' with completion evidence using SubtaskOperations.update_subtask"
    ]
  },
  "qualityChecklist": [
    "SubtaskOperations.get_next_subtask used to systematically get each subtask",
    "Each subtask updated to 'in-progress' before implementation starts",
    "Implementation follows architect's strategic guidance and code examples exactly",
    "SOLID, KISS and DRY principles compliance maintained for each subtask implementation",
    "Testing completed for each subtask (unit, integration, manual validation)",
    "Individual commit made after each subtask completion with descriptive message",
    "Each subtask updated to 'completed' status with proper completion evidence"
  ]
}
```

### **3. AI Agent Executes Locally**

- AI agent receives structured guidance with behavioral context
- Uses its own tools (codebase_search, read_file, edit_file, run_terminal_cmd, etc.)
- Executes commands locally in the development environment
- Reports results back to MCP server with completion evidence

### **4. Progress Tracking & Analytics**

```javascript
// AI agent reports completion
report_step_completion({
  executionId: 'cmbx4tkoo0001mtuogbz69myc',
  stepId: 'iterative_subtask_implementation_cycle',
  result: 'success',
  executionData: {
    subtasksCompleted: 4,
    filesModified: [
      'memory-bank/TechnicalArchitecture.md',
      'memory-bank/DeveloperGuide.md',
    ],
    implementationEvidence:
      'All documentation files updated with current implementation details',
  },
});
```

## 🔧 **MCP TOOL ARCHITECTURE**

### **Workflow Management Tools (8 tools)**

- `get_workflow_guidance` - Context-aware role behavior with embedded intelligence
- `get_step_guidance` - Step-by-step execution guidance with validation
- `report_step_completion` - Step completion reporting and progress tracking
- `get_step_progress` - Step execution history and analytics
- `get_next_available_step` - AI-powered next step recommendations
- `get_role_transitions` - Intelligent transition recommendations
- `validate_transition` - Comprehensive transition requirement checking
- `execute_transition` - Intelligent role transition execution

### **Execution Management Tools (2 tools)**

- `workflow_execution_operations` - Query/update execution state
- `bootstrap_workflow` - Workflow initialization and setup

### **Service Operations Tool (1 tool)**

- `execute_mcp_operation` - Execute core service operations (TaskOperations, PlanningOperations, SubtaskOperations, WorkflowOperations, ReviewOperations, ResearchOperations)

### **Reporting Tools (4 tools)**

- `generate_workflow_report` - Interactive dashboards with Chart.js visualizations
- `get_report_status` - Report generation status and progress
- `cleanup_report` - Report file management and cleanup

## 💡 **BEST PRACTICES FOR AI AGENTS**

### **MCP-Compliant Development**

- ✅ **DO**: Request guidance from MCP server using workflow tools
- ✅ **DO**: Execute commands locally using your own tools (run_terminal_cmd, edit_file, etc.)
- ✅ **DO**: Report results back to MCP server with completion evidence
- ✅ **DO**: Follow structured guidance recommendations and quality checklists
- ✅ **DO**: Use execute_mcp_operation for core service operations
- ❌ **DON'T**: Expect MCP server to execute commands
- ❌ **DON'T**: Skip guidance requests for complex tasks

### **Quality Standards**

- **Evidence-Based Development**: Validate all changes with testing and completion evidence
- **SOLID Principles**: Follow clean code practices (Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion)
- **Documentation**: Maintain comprehensive project documentation
- **Progress Tracking**: Report completion status with detailed execution data

### **Workflow Execution Pattern**

```javascript
// 1. Bootstrap workflow
const bootstrap = await bootstrap_workflow({
  initialRole: 'boomerang',
  executionMode: 'GUIDED',
  projectPath: '/full/project/path',
});

// 2. Get step guidance
const guidance = await get_step_guidance({
  executionId: bootstrap.executionId,
  roleId: bootstrap.currentRoleId,
});

// 3. Execute locally using your tools
// ... execute guidance using run_terminal_cmd, edit_file, etc.

// 4. Report completion
await report_step_completion({
  executionId: bootstrap.executionId,
  stepId: guidance.stepInfo.stepId,
  result: 'success',
  executionData: {
    /* your execution results */
  },
});
```

## 📊 **INTERACTIVE ANALYTICS**

Generate beautiful HTML dashboards with:

- **📈 Real-time Progress Tracking**: Visual workflow progress indicators
- **🎯 Role Performance Metrics**: Efficiency and quality analytics
- **✅ Quality Gate Monitoring**: Compliance and validation tracking
- **📊 Interactive Charts**: Chart.js visualizations with filtering
- **📱 Mobile Responsive**: Modern Tailwind CSS design
- **🔧 Vanilla JavaScript**: No framework dependencies, pure DOM manipulation

## 🏗️ **TECHNICAL ARCHITECTURE**

### **Technology Stack**

- **Backend**: NestJS v11.0.1 with TypeScript for enterprise-grade scalability
- **Database**: Prisma ORM v6.9.0 with SQLite (default) and PostgreSQL support
- **MCP Integration**: @rekog/mcp-nest v1.5.2 for seamless protocol compliance
- **Validation**: Zod v3.24.4 for comprehensive parameter validation
- **Runtime**: Node.js >=18.0.0 with npm >=8.0.0
- **Package**: @hive-academy/anubis v1.0.15

### **Domain-Driven Design**

```
src/task-workflow/
├── domains/
│   ├── workflow-rules/              # PRIMARY MCP INTERFACE
│   │   ├── services/                # Core workflow services
│   │   ├── mcp-operations/          # MCP tool implementations
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

### **MCP-Compliant Design**

```
AI Agent ←→ MCP Protocol ←→ Guidance Server
    ↓                           ↓
Local Execution            Database-Driven Intelligence
    ↓                           ↓
Own Tools                  Workflow Rules & Steps
```

### **Key Architectural Principles**

- **Guidance-Only**: No server-side execution, pure MCP compliance
- **Database-Driven Intelligence**: Dynamic workflow rules with embedded guidance
- **Feature-Based Organization**: Embedded workflow intelligence
- **Clean Architecture**: Proper dependency injection and separation of concerns
- **Performance Optimization**: Two-layer caching system with 25-75% token savings

## 🎯 **PROJECT ISOLATION**

### **NPX (Automatic)**

Each project gets its own database automatically:

```
/project-a/workflow.db
/project-b/workflow.db
/project-c/workflow.db
```

### **Docker (Manual)**

Configure volume names for project isolation:

```json
// Project A
"args": ["run", "-i", "-v", "project-a-anubis:/app/data", "--rm", "..."]

// Project B
"args": ["run", "-i", "-v", "project-b-anubis:/app/data", "--rm", "..."]
```

## 🚀 **DEVELOPMENT STATUS**

**✅ PRODUCTION READY - MCP COMPLIANT v1.0.15**

- **✅ Architecture**: MCP-compliant guidance-only design
- **✅ Performance**: Optimized with intelligent caching (25-75% token savings)
- **✅ Quality**: Comprehensive testing and validation
- **✅ Compliance**: Zero execution violations
- **✅ Documentation**: Complete system instructions
- **✅ Enterprise-Grade**: NestJS + Prisma + TypeScript stack

## 📚 **DOCUMENTATION**

- **Technical Architecture**: `memory-bank/TechnicalArchitecture.md` - Comprehensive technical documentation
- **Developer Guide**: `memory-bank/DeveloperGuide.md` - Development patterns and setup procedures
- **Project Overview**: `memory-bank/ProjectOverview.md` - Business context and strategic overview

## 🤝 **CONTRIBUTING**

This project follows MCP protocol standards and clean architecture principles:

- **MCP Compliance**: Guidance-only, no execution
- **SOLID Principles**: Clean, maintainable code
- **Domain-Driven Design**: Clear domain boundaries
- **Evidence-Based Development**: Comprehensive testing
- **TypeScript Strict Mode**: Comprehensive type checking
- **ESLint + Prettier**: Code formatting and linting
- **Jest Testing**: Unit and integration testing with 75% coverage

### **Development Setup**

```bash
# Install dependencies
npm install

# Setup database
npm run db:init

# Start development server
npm run start:dev

# Run tests
npm run test

# Run linting
npm run lint
```

## 📄 **LICENSE**

MIT License - see LICENSE file for details.

---

## 🎯 **THE BOTTOM LINE**

**This MCP server transforms AI development by providing intelligent, database-driven guidance instead of trying to execute commands itself. It's the difference between a GPS that gives you directions (correct) vs. a GPS that tries to drive your car (wrong).**

**Built with enterprise-grade technology stack (NestJS v11.0.1 + Prisma v6.9.0 + @rekog/mcp-nest v1.5.2), this system delivers sophisticated workflow intelligence while maintaining perfect MCP protocol compliance.**

**Result**: Faster, higher-quality development with proper MCP protocol compliance, clean separation of concerns, and enterprise-grade architecture.
