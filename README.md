# 𓂀𓁢𓋹𝔸ℕ𝕌𝔹𝕀𝕊𓋹𓁢𓂀 - Divine Guidance for AI Workflows

**The first MCP-compliant system that embeds intelligent guidance directly into AI workflows, transforming chaotic development into organized, quality-driven processes.**

![Docker Pulls](https://img.shields.io/docker/pulls/hiveacademy/anubis)
![Docker Image Size](https://img.shields.io/docker/image-size/hiveacademy/anubis)
![Docker Image Version](https://img.shields.io/docker/v/hiveacademy/anubis)
[![MCP Server](https://img.shields.io/badge/MCP-Server-blue?style=for-the-badge&logo=docker)](https://hub.docker.com/r/hiveacademy/anubis)

**🚀 [NPM Package](https://www.npmjs.com/package/@hive-academy/anubis)** • **🐳 [Docker Hub](https://hub.docker.com/r/hiveacademy/anubis)** • **📚 [Website](https://hive-academy.github.io/Anubis-MCP/)**

## 🚀 **QUICK START**

### **Option 1: NPX (Recommended)**

```json
// Add to your MCP client config
{
  "mcpServers": {
    "anubis": {
      "command": "npx",
      "args": ["-y", "@hive-academy/anubis"]
    }
  }
}
```

### **Option 2: Docker**

```json
{
  "mcpServers": {
    "anubis": {
      "command": "docker", 
      "args": ["run", "-i", "-v", "anubis-data:/app/data", "--rm", "hiveacademy/anubis"]
    }
  }
}
```

**✅ Benefits**: Zero installation • Always latest version • Project isolation • Auto-dependency management

## 🤖 **SUPERCHARGE YOUR AI AGENT**

### **Initialize Workflow Rules**

Transform any AI agent into a workflow expert by asking it to run:

```
Please initialize Anubis workflow rules for [your-agent-name] by calling the init_rules MCP tool
```

**Supported Agents**: `cursor` • `copilot` • `roocode` • `kilocode`

### **What Your Agent Gets**

🎯 **Structured Workflows** - Step-by-step guidance for complex development tasks  
🔒 **Role Boundaries** - Clear separation between planning, development, and review  
⚡ **Quality Gates** - Built-in validation and testing requirements  
📊 **Progress Tracking** - Real-time analytics and completion reports  
🧠 **Embedded Intelligence** - Context-aware recommendations for each step  

### **Example: Agent Transformation**

```
Before: "Create a user authentication system"
↓ Chaotic implementation, missing tests, no documentation

After: "Create a user authentication system" 
↓ Guided workflow with:
   1. Requirements analysis (Researcher role)
   2. System design (Architect role) 
   3. Implementation (Senior Developer role)
   4. Testing & validation (Code Review role)
   5. Quality assurance & deployment
```

## 🎭 **ROLE-BASED WORKFLOW SYSTEM**

| Role | Purpose | Key Capabilities |
|------|---------|------------------|
| **🎯 Boomerang** | Strategic orchestration | Project analysis, git setup, task creation |
| **🔍 Researcher** | Evidence-based investigation | Technology research, feasibility analysis |
| **🏗️ Architect** | Technical design | System architecture, implementation planning |
| **👨‍💻 Senior Developer** | Implementation excellence | Code development, testing, quality assurance |
| **✅ Code Review** | Quality validation | Manual testing, security validation, approval |

## 🔧 **MCP TOOLS OVERVIEW**

**12 Specialized Tools** for complete workflow management:

- **Workflow Management** (8 tools): Step guidance, progress tracking, role transitions
- **Execution Management** (2 tools): Bootstrap workflows, manage execution state  
- **Service Operations** (1 tool): Core business logic operations
- **Analytics** (3 tools): Interactive dashboards, reports, cleanup

## 🎯 **HOW IT WORKS**

### **Simple 3-Step Process**

1. **🤖 AI Agent Requests Guidance** → Calls MCP server for step-by-step instructions
2. **🧠 Server Provides Intelligence** → Returns structured guidance with quality checklist  
3. **⚡ Agent Executes Locally** → Uses own tools to implement, reports results back

### **Example Workflow**

```javascript
// 1. Agent asks for guidance
const guidance = await get_step_guidance({
  executionId: 'workflow-123',
  roleId: 'senior-developer'
});

// 2. Server responds with structured guidance
{
  "stepInfo": { "name": "Implement authentication system" },
  "qualityChecklist": ["SOLID principles", "Unit tests", "Security validation"],
  "approachGuidance": ["Create models", "Add controllers", "Write tests"]
}

// 3. Agent executes using own tools and reports completion
await report_step_completion({
  result: 'success',
  executionData: { filesModified: ['auth.ts'], testsRun: 15 }
});
```

## � **ANALYTICS & REPORTING**

Generate beautiful interactive dashboards with real-time metrics:

- **📈 Progress Tracking** - Visual workflow indicators
- **🎯 Role Performance** - Efficiency analytics  
- **✅ Quality Gates** - Compliance monitoring
- **📊 Interactive Charts** - Chart.js visualizations
- **📱 Mobile Responsive** - Modern Tailwind CSS

## 🏗️ **TECHNICAL STACK**

**Enterprise-Grade Architecture:**
- **Backend**: NestJS v11 + TypeScript
- **Database**: Prisma ORM + SQLite/PostgreSQL  
- **MCP**: @rekog/mcp-nest v1.5.2
- **Runtime**: Node.js ≥18.0.0

**✅ Production Ready**: MCP-compliant • Zero execution violations • 75% test coverage

## 📚 **DOCUMENTATION**

- **[📖 Technical Architecture](memory-bank/TechnicalArchitecture.md)** - System design & patterns
- **[🚀 Developer Guide](memory-bank/DeveloperGuide.md)** - Setup & development workflows  
- **[🎯 Project Overview](memory-bank/ProjectOverview.md)** - Business context & strategy

## 🤝 **CONTRIBUTING**

```bash
# Development setup
npm install && npm run db:init && npm run start:dev

# Quality checks  
npm run test && npm run lint
```

**Standards**: MCP compliance • SOLID principles • Domain-driven design • Evidence-based development

## 📄 **LICENSE**

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🎯 **THE BOTTOM LINE**

**Transform your AI agent from chaotic task executor to intelligent workflow orchestrator. Get structured guidance, quality assurance, and analytics - all while maintaining perfect MCP protocol compliance.**

**🚀 Ready to upgrade your AI workflows? Add Anubis to your MCP config and ask your agent to initialize the rules!**
