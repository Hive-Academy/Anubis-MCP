# 𓂀𓁢𓋹𝔸ℕ𝕌𝔹𝕀𝕊𓋹𓁢𓂀 - Intelligent Guidance for AI Workflows

**Transform your AI agent from chaotic coder to intelligent workflow orchestrator with three powerful capabilities:**

<div align="center">

## **Three Pillars of Intelligent Workflow Management**

### **Intelligent Guidance** | **Seamless Transitions** | **Beautiful Reporting**

![Docker Pulls](https://img.shields.io/docker/pulls/hiveacademy/anubis)
![Docker Image Size](https://img.shields.io/docker/image-size/hiveacademy/anubis)
![Docker Image Version](https://img.shields.io/docker/v/hiveacademy/anubis)
[![MCP Server](https://img.shields.io/badge/MCP-Server-blue?style=for-the-badge&logo=docker)](https://hub.docker.com/r/hiveacademy/anubis)

**[NPM Package](https://www.npmjs.com/package/@hive-academy/anubis)** • **[Docker Hub](https://hub.docker.com/r/hiveacademy/anubis)** • **[Website](https://hive-academy.github.io/Anubis-MCP/)**

<a href="https://glama.ai/mcp/servers/@Hive-Academy/Anubis-MCP">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@Hive-Academy/Anubis-MCP/badge" alt="𓂀𓁢𓋹𝔸ℕ𝕌𝔹𝕀𝕊𓋹𓁢𓂀 - Intelligent Guidance for MCP server" />
</a>

</div>

---

## **QUICK START**

### **Option 1: NPX (Recommended)**

> Add to your MCP client config

```json
{
  "mcpServers": {
    "anubis": {
      "command": "npx",
      "args": ["-y", "@hive-academy/anubis"],
      "env": {
        "PROJECT_ROOT": "C:\\path\\to\\projects"
      }
    }
  }
}
```

### **Option 2: Docker (MCP Configuration)**

**For Unix/Linux/macOS (mcp.json):**

```json
{
  "mcpServers": {
    "anubis": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "-v",
        "${PWD}:/app/workspace",
        "-v",
        "anubis-data:/app/data",
        "hiveacademy/anubis"
      ]
    }
  }
}
```

**For Windows (mcp.json):**

```json
{
  "mcpServers": {
    "anubis": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "-v",
        "C:\\path\\to\\your\\project:/app/workspace",
        "-v",
        "C:\\path\\to\\your\\project\\data:/app/data",
        "hiveacademy/anubis"
      ]
    }
  }
}
```

---

## **INITIALIZE CUSTOM-MODES ( AGENT RULES)**

> Once you get the mcp server running you need to initialize the rules (custom-modes) for the agent you are using

**Supported Agents**: `cursor` • `copilot` • `roocode` • `kilocode`

### **Step 1: Initialize Intelligent Guidance**

```
Please initialize Anubis workflow rules for [your-agent-name] by calling the init_rules MCP tool
```

### **Step 2: Start Your Workflow**

```
Begin a new workflow for [your-project] with Anubis guidance
```

## **ROOCODE Setup Example**

[![Anubis MCP server Demo](https://img.youtube.com/vi/NPWrGJ_lRqY/0.jpg)](https://www.youtube.com/embed/NPWrGJ_lRqY?si=dXFzTf-qJqNRzOu6&start=477)

1- install the MCP server:

```
{
  "mcpServers": {
    "anubis": {
      "command": "npx",
      "args": ["-y", "@hive-academy/anubis"],
      "env": {
        "PROJECT_ROOT": "C:\\path\\to\\projects"
      }
    }
  }
}
```

2- then make sure you are on Code mode and ask it to generate the custom Anubis mode for you

`Please initialize Anubis workflow rules for roocode by calling the init_rules MCP tool`

3- reload the window and you should see the custom mode in the modes dropdown list. activate it and ask it to create your first task

4- also if you don't have a memory bank files, ask it to generate them for you as the first task.

## **Cursor Setup Example**

**For Cursor users, here's a complete setup example:**

1. **Install MCP Server in Cursor:**
   - Open Cursor Settings (`Cmd/Ctrl + ,`)
   - Navigate to "Extensions" → "MCP Servers"
   - Add new server configuration:
   ```
   "anubis": {
     "command": "npx",
     "args": ["-y", "@hive-academy/anubis"],
      "env": {
        "PROJECT_ROOT": "C:\\path\\to\\projects"
      }
   }
   ```
2. **Initialize Cursor Rules**

- Make Sure the mcp server is working and active.
- ask the agent to `Please initialize Anubis workflow rules for cursor by calling the init_rules MCP tool`.
- you should see a file generated at .cursor/rules with the name `000-workflow-core.mdc`
- Head over to cursor rules and make sure the rules file are added and active.

### Now You are ready to start you first task 🚀.

> Hint: an important first step task is to generate memory-bank files
> Ask the agent to `Please create a task to analyze codebase and generate memory-bank files (ProjectOverview.md, TechnicalArchitecture.md, and DeveloperGuide.md)`

## **Claude Code Setup Example**

- To install the mcp server use this command `claude mcp add anubis npx -y @hive-academy/anubis`

  > make sure you are on the poject root you want to install this into.

- To make sure it's installed correctly run `claude mcp list` you should see a server with name `anubis`.

- now you will need to do a very important step:
  - Download this rules markdown file [Anubis Rules](https://github.com/Hive-Academy/Anubis-MCP/blob/main/.roo/rules-anubis/rules.md)
  - Save it inside your project for example inside a folder names `rules` and file name `anubis-rules.md`.
  - Then open your CLAUDE.md file and add the following:
    `Anubis Workflow @rules/anubis-rules.md`

---

## **CORE VALUE #1: INTELLIGENT GUIDANCE FOR AI AGENTS**

**Your AI agent receives step-by-step intelligent rules for every development task:**

```javascript
// Before Anubis: Chaotic, directionless coding
"Create a user authentication system" →  Where do I start?

// With Anubis: Intelligent guidance at every step
"Create a user authentication system" →
   Requirements Analysis (Researcher Role)
   System Architecture (Architect Role)
   Enhanced Implementation with Subtasks (Senior Dev Role)
   Quality Validation (Code Review Role)
   Progress Report (Auto-generated)
```

**Benefits:**

- **30-50% faster development** with structured workflows
- **40-60% fewer defects** through quality gates
- **100% MCP-compliant** guidance without execution

---

## **CORE VALUE #2: SEAMLESS TASK & ROLE TRANSITIONS**

**Never lose context when switching between roles or continuing tasks:**

```javascript
// Seamless context preservation across transitions
{
  "currentRole": "architect",
  "completedSteps": ["requirements", "design"],
  "context": {
    "decisions": ["JWT for auth", "PostgreSQL for storage"],
    "rationale": "Scalability and security requirements",
    "nextSteps": ["Enhanced Implementation with Subtasks by Senior Dev role"]
  }
}
// → Switch roles without losing any context!
```

**Features:**

- **Intelligent context preservation** between role switches
- **Automatic task handoffs** with full history
- **Role-based boundaries** for focused expertise
- **Pause and resume** workflows anytime

---

## **CORE VALUE #3: BEAUTIFUL HTML REPORTING**

**Transform your workflow data into stunning, interactive reports:**

<div align="center">
  <img src="https://github.com/Hive-Academy/Anubis-MCP/assets/placeholder/report-preview.png" alt="Anubis Report Preview" width="600">
</div>

**What you get:**

- **Interactive dashboards** with Chart.js visualizations
- **Mobile-responsive** Tailwind CSS design
- **Progress tracking** with visual indicators
- **Performance analytics** for each role
- **Detailed task breakdowns** with timelines
- **Export-ready reports** for stakeholders

---

## **INTELLIGENT ROLE SYSTEM**

| Role                 | Intelligent Purpose     | Key Powers                                        |
| -------------------- | ----------------------- | ------------------------------------------------- |
| **Boomerang**        | Strategic Orchestration | Project setup, task creation, workflow management |
| **Researcher**       | Knowledge Gathering     | Evidence-based research, feasibility analysis     |
| **Architect**        | System Design           | Technical architecture, implementation planning   |
| **Senior Developer** | Code Manifestation      | High-quality implementation, testing              |
| **Code Review**      | Quality Guardian        | Security validation, performance review, approval |

---

## **REAL-WORLD EXAMPLE**

```javascript
// 1. Agent receives intelligent guidance
const guidance = await get_step_guidance({
  executionId: 'auth-system-123',
  roleId: 'senior-developer'
});

// 2. Anubis provides structured rules
{
  "guidance": {
    "step": "Implement JWT authentication",
    "approach": [
      "1. Create User model with Prisma",
      "2. Implement password hashing with bcrypt",
      "3. Create JWT token generation service",
      "4. Add authentication middleware"
    ],
    "qualityChecklist": [
      "SOLID principles applied",
      "Unit tests coverage > 80%",
      "Security best practices",
      "Error handling implemented"
    ],
    "context": {
      "previousDecisions": ["PostgreSQL", "JWT strategy"],
      "nextRole": "code-review"
    }
  }
}

// 3. Agent executes with confidence and reports
await report_step_completion({
  result: 'success',
  metrics: {
    filesCreated: 8,
    testsWritten: 15,
    coverage: 85
  }
});

// 4. Beautiful report auto-generated! 📊
```

---

## **TECHNICAL EXCELLENCE**

**Enterprise-Grade Architecture:**

- **Backend**: NestJS v11 + TypeScript
- **Database**: Prisma ORM + SQLite/PostgreSQL
- **MCP**: @rekog/mcp-nest v1.5.2
- **Analytics**: Chart.js + Tailwind CSS
- **Runtime**: Node.js ≥18.0.0

**Production Ready**:

- MCP-compliant architecture
- Zero execution violations
- 75% test coverage
- Sub-50ms cached responses

---

## 📚 **DOCUMENTATION**

- **[📖 Technical Architecture](memory-bank/TechnicalArchitecture.md)** - System design & patterns
- **[🚀 Developer Guide](memory-bank/DeveloperGuide.md)** - Setup & development workflows
- **[🎯 Project Overview](memory-bank/ProjectOverview.md)** - Business context & strategy
- **[📊 Report Examples](docs/showcase/)** - Sample workflow reports

---

## 🤝 **CONTRIBUTING**

```bash
# Development setup
npm install && npm run db:init && npm run start:dev

# Quality checks
npm run test && npm run lint
```

**Standards**: MCP compliance • SOLID principles • Domain-driven design • Evidence-based development

---

## **LICENSE**

MIT License - see [LICENSE](LICENSE) file for details.

---

## **THE ANUBIS PROMISE**

<div align="center">

### **Intelligent Guidance** ✨ **Seamless Transitions** ✨ **Beautiful Reports**

**Transform your AI workflows from chaotic to intelligent. Give your agents the rules of the ancients with modern MCP-compliant architecture.**

**Ready to ascend? Add Anubis to your MCP config now!**

</div>
