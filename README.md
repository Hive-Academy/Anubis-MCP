# 🎯 MCP Workflow-Manager: Rule-Driven AI Development

**Transform chaotic development into organized, quality-driven workflows with embedded AI intelligence.**

A revolutionary **Rule-Driven Model Context Protocol (MCP) server** that provides intelligent workflow orchestration for AI agents in software development. Built with NestJS + Prisma, this system offers embedded behavioral guidance, role specialization, and comprehensive analytics.

## ✨ **KEY INNOVATIONS**

### 🧠 **Embedded Workflow Intelligence**

- **Context-Aware Guidance**: Every response includes role-specific behavioral context
- **AI-Powered Recommendations**: Smart next-step suggestions and workflow optimization
- **Quality Enforcement**: Built-in checklists and pattern validation
- **Project Adaptation**: System learns and adapts to your specific project patterns

### 🎯 **Clean Architecture (12 MCP Tools)**

- **8 Workflow-Rules Tools**: Primary interface for rule-driven development
- **4 Reporting Tools**: Interactive dashboards and analytics
- **Zero Task Complexity**: Tasks managed internally by workflow rules
- **Role Specialization**: Intelligent transitions between specialized AI roles

## 🚀 **QUICK START**

### NPX Setup (Recommended)

```json
// Add to your MCP client config
{
  "mcpServers": {
    "workflow-manager": {
      "command": "npx",
      "args": ["-y", "@hive-academy/mcp-workflow-manager"]
    }
  }
}
```

**Benefits:**

- ✅ Zero installation required
- ✅ Automatic dependency management
- ✅ Automatic project isolation
- ✅ Always latest version

### Docker Setup

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

## 🎯 **FOR AI AGENTS: HOW TO USE**

### **1. Start with Workflow Guidance**

```javascript
// Get role-specific behavioral context and next actions
get_workflow_guidance({
  roleName: 'boomerang|researcher|architect|senior-developer|code-review',
  taskId: 'current-task-id',
});
```

### **2. Execute Workflow Steps**

```javascript
// Execute steps with built-in validation and tracking
execute_workflow_step({
  id: taskId,
  roleId: 'your-current-role',
  stepId: 'recommended-step',
  executionData: {
    /* step-specific context */
  },
});
```

### **3. Generate Interactive Analytics**

```javascript
// Create beautiful dashboards with Chart.js visualizations
generate_workflow_report({
  reportType: 'interactive-dashboard',
  outputFormat: 'html',
  basePath: process.env.PROJECT_ROOT,
});
```

## 🎭 **AI ROLE SPECIALIZATIONS**

| Role                    | Purpose                      | When to Use                            |
| ----------------------- | ---------------------------- | -------------------------------------- |
| **🎯 Boomerang**        | Strategic orchestration      | Project start, final delivery          |
| **🔍 Researcher**       | Evidence-based investigation | Unknown tech, feasibility              |
| **🏗️ Architect**        | Technical design & planning  | System architecture, complex decisions |
| **👨‍💻 Senior Developer** | Implementation excellence    | Code development, features             |
| **✅ Code Review**      | Quality assurance            | Implementation validation              |

## 🔧 **MCP TOOL ARCHITECTURE**

### **Primary Interface: Workflow-Rules (8 Tools)**

- `get_workflow_guidance` - Role-specific behavioral context
- `execute_workflow_step` - Step execution with validation
- `get_step_progress` - Analytics and tracking
- `get_next_available_step` - AI-powered recommendations
- `get_role_transitions` - Intelligent role transitions
- `validate_transition` - Transition requirement checking
- `execute_transition` - Role transition execution
- `get_transition_history` - Transition analytics
- `workflow_execution_operations` - Execution lifecycle

### **Analytics Interface: Reporting (4 Tools)**

- `generate_workflow_report` - Interactive dashboards
- `get_report_status` - Report generation monitoring
- `cleanup_report` - File management
- `report_system_health` - System diagnostics

## 💡 **BEST PRACTICES**

### **Rule-Driven Development**

- ✅ **DO**: Use workflow guidance for behavioral context
- ✅ **DO**: Execute steps through the workflow system
- ✅ **DO**: Follow role transitions with validation
- ❌ **DON'T**: Try to manage tasks manually
- ❌ **DON'T**: Skip workflow validation steps

### **Quality Standards**

- **Memory Bank Analysis**: Verify project documentation
- **Current State Verification**: Test functionality before decisions
- **Evidence-Based Completion**: Document acceptance criteria satisfaction
- **Technical Excellence**: SOLID principles, design patterns, testing

## 📊 **INTERACTIVE ANALYTICS**

Generate beautiful HTML dashboards with:

- **Real-time Progress Tracking**: Visual workflow progress
- **Role Performance Metrics**: Efficiency analytics
- **Quality Gate Monitoring**: Compliance tracking
- **Interactive Charts**: Chart.js visualizations
- **Mobile Responsive**: Modern Tailwind CSS design

## 🏗️ **TECHNICAL STACK**

- **Backend**: NestJS with TypeScript
- **Database**: Prisma ORM (SQLite/PostgreSQL)
- **MCP Integration**: @rekog/mcp-nest
- **Validation**: Zod schemas
- **Reports**: Direct HTML generation with Chart.js
- **Transport**: STDIO, SSE, HTTP support

## 🎯 **PROJECT ISOLATION**

### NPX (Automatic)

Each project gets its own database automatically:

```
/project-a/workflow.db
/project-b/workflow.db
/project-c/workflow.db
```

### Docker (Manual)

Configure volume names for project isolation:

```json
// Project A
"args": ["run", "-i", "-v", "project-a-workflow:/app/data", "--rm", "..."]

// Project B
"args": ["run", "-i", "-v", "project-b-workflow:/app/data", "--rm", "..."]
```

## 🚀 **DEVELOPMENT STATUS**

**✅ PRODUCTION READY**

- **Architecture**: Clean rule-based workflow (100% complete)
- **Performance**: Optimized with intelligent caching
- **Quality**: Comprehensive testing and validation
- **Documentation**: Complete system instructions
- **Deployment**: NPX package ready for distribution

## 📚 **DOCUMENTATION**

- **System Instructions**: `enhanced-workflow-rules/000-workflow-core.md`
- **Technical Architecture**: `memory-bank/TechnicalArchitecture.md`
- **Developer Guide**: `memory-bank/DeveloperGuide.md`
- **Project Overview**: `memory-bank/ProjectOverview.md`

## 🤝 **CONTRIBUTING**

This project follows clean architecture principles:

- **SOLID Principles**: Single responsibility, dependency inversion
- **Domain-Driven Design**: Clear domain boundaries
- **Rule-Based Architecture**: Workflow rules drive execution
- **Evidence-Based Development**: Comprehensive testing and validation

## 📄 **LICENSE**

MIT License - see LICENSE file for details.

## 🏗️ **VERIFIED CLEAN ARCHITECTURE**

Our MCP Workflow-Manager has undergone comprehensive architectural verification to ensure optimal design and implementation:

### **✅ ARCHITECTURAL VALIDATION RESULTS**

**🎯 CORRECT MODULE STRUCTURE**

- `WorkflowRulesModule` properly imports `CoreWorkflowModule`
- `CoreWorkflowModule` is independent with no circular dependencies
- Services are correctly exported for dependency injection

**🔧 PROPER SERVICE ORCHESTRATION**

```typescript
// Clean orchestration flow
StepActionExecutor → CoreServiceOrchestrator → Core-Workflow Services
```

**🎭 CLEAN MCP INTERFACE LAYER**

- **MCP Services** (workflow-rules) provide user interface with embedded intelligence
- **Business Logic Services** (core-workflow) handle operations internally
- **CoreServiceOrchestrator** coordinates between layers

**⚡ VERIFIED ACTION EXECUTION FLOW**

```
User calls MCP tool (WorkflowGuidanceMcpService)
    ↓
MCP service calls WorkflowGuidanceService
    ↓
WorkflowGuidanceService orchestrates step execution
    ↓
StepActionExecutor uses CoreServiceOrchestrator
    ↓
CoreServiceOrchestrator calls appropriate core-workflow service
    ↓
Core-workflow service performs actual business logic
```

### **🏗️ ARCHITECTURE LAYERS**

```
┌─────────────────────────────────────────┐
│           MCP CLIENT INTERFACE          │
├─────────────────────────────────────────┤
│  WorkflowRulesModule (8 MCP Tools)      │
│  ├─ WorkflowGuidanceMcpService          │
│  ├─ StepExecutionMcpService             │
│  ├─ RoleTransitionMcpService            │
│  └─ WorkflowExecutionMcpService         │
├─────────────────────────────────────────┤
│       ORCHESTRATION LAYER               │
│  ├─ CoreServiceOrchestrator             │
│  ├─ StepActionExecutor                  │
│  └─ Rule-based workflow services        │
├─────────────────────────────────────────┤
│       BUSINESS LOGIC LAYER              │
│  CoreWorkflowModule (Internal Services) │
│  ├─ TaskOperationsService               │
│  ├─ PlanningOperationsService           │
│  ├─ WorkflowOperationsService           │
│  ├─ ReviewOperationsService             │
│  ├─ ResearchOperationsService           │
│  └─ IndividualSubtaskOperationsService  │
├─────────────────────────────────────────┤
│            DATA LAYER                   │
│  PrismaService + Database               │
└─────────────────────────────────────────┘
```

**🚀 VERIFICATION COMPLETE**: The system achieves perfect architectural alignment with rule-driven workflow execution and proper service orchestration.

## 🎯 **Rule-Driven Workflow Intelligence**
