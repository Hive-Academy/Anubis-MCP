# 🎯 MCP Workflow-Manager: AI-Guided Development Intelligence

**Transform chaotic development into organized, quality-driven workflows with MCP-compliant AI guidance.**

A revolutionary **Model Context Protocol (MCP) server** that provides intelligent workflow guidance for AI agents in software development. Built with NestJS + Prisma, this system follows MCP protocol standards correctly by providing guidance instead of plain text documents.

## 🏆 **MAJOR ACHIEVEMENT: MCP PROTOCOL COMPLIANCE**

**✅ BREAKTHROUGH**: We've achieved full MCP protocol compliance by eliminating all execution violations and establishing a true guidance-only architecture.

### **🎯 What Makes This Special**

- **✅ MCP Compliant**: Server provides guidance, AI agents execute locally
- **✅ Zero Execution Violations**: No server-side command execution
- **✅ Intelligent Guidance**: Context-aware recommendations for AI agents
- **✅ Clean Architecture**: Proper separation between guidance and execution

## 🚀 **BUSINESS VALUE**

### **For Development Teams**

- **🎯 Structured Workflows**: Transform chaotic development into organized processes
- **📈 Quality Assurance**: Built-in quality gates and validation criteria
- **⚡ Faster Delivery**: AI-guided development with intelligent recommendations
- **📊 Analytics**: Comprehensive tracking and performance insights

### **For AI Agents**

- **🧠 Intelligent Guidance**: Context-aware step-by-step instructions
- **🔧 Tool Recommendations**: Suggested tools for each development task
- **✅ Success Criteria**: Clear validation requirements for each step
- **📋 Progress Tracking**: Comprehensive workflow state management

### **For Organizations**

- **🏗️ Scalable Architecture**: MCP-compliant design for enterprise use
- **🔒 Security**: No server-side execution reduces security risks
- **📈 ROI**: Faster development cycles with higher quality output
- **🎯 Standardization**: Consistent development practices across teams

## 🎯 **HOW IT WORKS: MCP GUIDANCE ARCHITECTURE**

### **1. AI Agent Requests Guidance**

```javascript
// AI agent calls MCP server for guidance
get_step_guidance({
  taskId: 123,
  roleId: 'senior-developer',
  stepId: 'implementation-setup',
});
```

### **2. MCP Server Provides Intelligent Guidance**

```json
{
  "success": true,
  "guidance": {
    "description": "Set up implementation environment with proper structure",
    "expectedOutput": "Clean project structure with all dependencies configured",
    "suggestedTools": ["codebase_search", "read_file", "edit_file"],
    "localExecution": {
      "commands": [
        "Analyze existing project structure",
        "Install required dependencies",
        "Configure development environment"
      ],
      "aiIntelligence": "Apply senior developer expertise to create optimal setup"
    },
    "successCriteria": [
      "All dependencies installed and configured",
      "Project structure follows best practices",
      "Development environment ready for implementation"
    ]
  }
}
```

### **3. AI Agent Executes Locally**

- AI agent receives structured guidance
- Uses its own tools (codebase_search, read_file, edit_file, etc.)
- Executes commands locally in the development environment
- Reports results back to MCP server

### **4. Progress Tracking & Analytics**

```javascript
// AI agent reports completion
report_step_completion({
  taskId: 123,
  stepId: 'implementation-setup',
  result: 'success',
  executionData: {
    /* results */
  },
  executionTime: 1500,
});
```

## 🚀 **QUICK START**

### NPX Setup (Recommended)

```json
// Add to your MCP client config (Cursor, Claude Desktop, etc.)
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
- ✅ Always latest version
- ✅ Project isolation

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

## 🎭 **AI ROLE SPECIALIZATIONS**

Our system provides specialized guidance for different development roles:

| Role                    | Purpose                      | Guidance Focus                            |
| ----------------------- | ---------------------------- | ----------------------------------------- |
| **🎯 Boomerang**        | Strategic orchestration      | Project analysis, coordination, delivery  |
| **🔍 Researcher**       | Evidence-based investigation | Technology research, feasibility analysis |
| **🏗️ Architect**        | Technical design & planning  | System architecture, design patterns      |
| **👨‍💻 Senior Developer** | Implementation excellence    | Code development, SOLID principles        |
| **✅ Code Review**      | Quality assurance            | Testing, validation, acceptance criteria  |

## 🔧 **MCP TOOL ARCHITECTURE**

### **Core Workflow Tools (8 Tools)**

- `bootstrap_workflow` - Initialize new workflows with task creation
- `get_workflow_guidance` - Get role-specific behavioral context
- `get_step_guidance` - Get specific guidance for step execution
- `report_step_completion` - Report AI execution results back to server
- `get_next_available_step` - Get AI-powered next step recommendations
- `get_step_progress` - Get step execution history and analytics
- `workflow_execution_operations` - Complete execution lifecycle management

### **Analytics & Reporting Tools (3 Tools)**

- `generate_workflow_report` - Interactive HTML dashboards with Chart.js
- `get_report_status` - Monitor report generation progress
- `cleanup_report` - Clean up report files

## 💡 **BEST PRACTICES FOR AI AGENTS**

### **MCP-Compliant Development**

- ✅ **DO**: Request guidance from MCP server
- ✅ **DO**: Execute commands locally using your own tools
- ✅ **DO**: Report results back to MCP server
- ✅ **DO**: Follow structured guidance recommendations
- ❌ **DON'T**: Expect MCP server to execute commands
- ❌ **DON'T**: Skip guidance requests for complex tasks

### **Quality Standards**

- **Evidence-Based Development**: Validate all changes with testing
- **SOLID Principles**: Follow clean code practices
- **Documentation**: Maintain comprehensive project documentation
- **Progress Tracking**: Report completion status for analytics

## 📊 **INTERACTIVE ANALYTICS**

Generate beautiful HTML dashboards with:

- **📈 Real-time Progress Tracking**: Visual workflow progress indicators
- **🎯 Role Performance Metrics**: Efficiency and quality analytics
- **✅ Quality Gate Monitoring**: Compliance and validation tracking
- **📊 Interactive Charts**: Chart.js visualizations with filtering
- **📱 Mobile Responsive**: Modern Tailwind CSS design

## 🏗️ **TECHNICAL ARCHITECTURE**

### **MCP-Compliant Design**

```
AI Agent ←→ MCP Protocol ←→ Guidance Server
    ↓                           ↓
Local Execution            Intelligent Guidance
    ↓                           ↓
Own Tools                  Database-Driven Rules
```

### **Technology Stack**

- **Backend**: NestJS with TypeScript
- **Database**: Prisma ORM (SQLite/PostgreSQL)
- **MCP Integration**: @rekog/mcp-nest
- **Validation**: Zod schemas
- **Reports**: Direct HTML generation with Chart.js
- **Transport**: STDIO, SSE, HTTP support

### **Key Architectural Principles**

- **Guidance-Only**: No server-side execution
- **Intelligence**: Context-aware recommendations
- **Scalability**: Database-driven workflow rules
- **Quality**: Built-in validation and tracking

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
```

## 🚀 **DEVELOPMENT STATUS**

**✅ PRODUCTION READY - MCP COMPLIANT**

- **✅ Architecture**: MCP-compliant guidance-only design
- **✅ Performance**: Optimized with intelligent caching
- **✅ Quality**: Comprehensive testing and validation
- **✅ Compliance**: Zero execution violations
- **✅ Documentation**: Complete system instructions

## 📚 **DOCUMENTATION**

- **MCP Architecture Fix**: `docs/MCP_ARCHITECTURE_FIX.md`
- **Technical Architecture**: `memory-bank/TechnicalArchitecture.md`
- **Developer Guide**: `memory-bank/DeveloperGuide.md`
- **Project Overview**: `memory-bank/ProjectOverview.md`

## 🤝 **CONTRIBUTING**

This project follows MCP protocol standards and clean architecture principles:

- **MCP Compliance**: Guidance-only, no execution
- **SOLID Principles**: Clean, maintainable code
- **Domain-Driven Design**: Clear domain boundaries
- **Evidence-Based Development**: Comprehensive testing

## 📄 **LICENSE**

MIT License - see LICENSE file for details.

---

## 🎯 **THE BOTTOM LINE**

**This MCP server transforms AI development by providing intelligent guidance instead of trying to execute commands itself. It's the difference between a GPS that gives you directions (correct) vs. a GPS that tries to drive your car (wrong).**

**Result**: Faster, higher-quality development with proper MCP protocol compliance and clean separation of concerns.
