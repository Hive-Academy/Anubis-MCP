# MCP Workflow Manager

A comprehensive **Model Context Protocol (MCP) server** for AI workflow automation and task management. Built with [NestJS](https://nestjs.com/), [Prisma](https://www.prisma.io/), and [`@rekog/mcp-nest`](https://www.npmjs.com/package/@rekog/mcp-nest) for production-ready reliability.

## ✨ Key Features

- **🔄 Role-Based Workflow**: Structured AI coordination (Boomerang, Researcher, Architect, Developer, Code Review)
- **📊 Task Management**: Complete task lifecycle with status tracking and delegation
- **🎯 Implementation Planning**: Batch-based subtask organization and execution
- **📈 Analytics & Reporting**: Comprehensive workflow analytics and progress monitoring
- **🔒 Project Isolation**: Automatic database separation for multi-project workflows
- **🚀 Zero Setup**: Just add to MCP config - no manual installation required
- **📦 Self-Contained NPX Package**: Automatic dependency management with no external requirements
- **🔧 Environment-Aware**: Adapts behavior for NPX, global, and local installations

## 🚀 Quick Setup Guide

### **Streamlined Database Configuration** ✨

**Zero Configuration Required!** Each project automatically gets its own isolated database:

```
project-a/data/workflow.db  ← Project A's data
project-b/data/workflow.db  ← Project B's data
project-c/data/workflow.db  ← Project C's data
```

### **NPX Setup (Recommended)**

**One command, automatic project isolation:**

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

✅ **Automatic project detection**  
✅ **Database created in `./data/workflow.db`**  
✅ **Migrations applied safely**  
✅ **Zero setup required**

### **Docker Setup**

**Project isolation via volume mounts:**

```json
{
  "mcpServers": {
    "workflow-manager": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "-v",
        "D:/projects/your-project/data:/app/data",
        "hiveacademy/mcp-workflow-manager"
      ]
    }
  }
}
```

**Replace `D:/projects/your-project/` with your actual project path**

✅ **Instant startup** (pre-deployed migrations)  
✅ **Project isolation** via different volume mounts  
✅ **Consistent across platforms**

### **How Project Isolation Works**

**NPX:** Automatic detection

```bash
cd /path/to/project-a && npx @hive-academy/mcp-workflow-manager
# Database: /path/to/project-a/data/workflow.db

cd /path/to/project-b && npx @hive-academy/mcp-workflow-manager
# Database: /path/to/project-b/data/workflow.db
```

**Docker:** Volume mount isolation

```bash
# Project A
docker run -v "/path/to/project-a/data:/app/data" hiveacademy/mcp-workflow-manager

# Project B
docker run -v "/path/to/project-b/data:/app/data" hiveacademy/mcp-workflow-manager
```

## 🛠️ Available MCP Tools

### Core Workflow Management

- **`task_operations`** - Task lifecycle management (create, update, get, list)
- **`planning_operations`** - Implementation planning and batch subtask management
- **`workflow_operations`** - Role-based delegation and workflow transitions
- **`review_operations`** - Code review and completion report management
- **`research_operations`** - Research reports and communication management

### Query & Analytics

- **`query_task_context`** - Comprehensive task context retrieval
- **`query_workflow_status`** - Delegation and workflow status queries
- **`query_reports`** - Report queries with evidence relationships
- **`batch_subtask_operations`** - Bulk subtask management by batch
- **`batch_status_updates`** - Cross-entity status synchronization

### Reporting & Analytics

- **`generate_workflow_report`** - Comprehensive workflow analytics and reports
- **`get_report_status`** - Report generation status tracking
- **`cleanup_report`** - Report file management

## 🔄 Workflow Roles

The system implements a structured workflow with specialized AI roles:

1. **🪃 Boomerang** - Task intake, analysis, and final delivery
2. **🔬 Researcher** - Information gathering and research
3. **🏛️ Architect** - Technical planning and design
4. **👨‍💻 Senior Developer** - Code implementation
5. **🔍 Code Review** - Quality assurance and testing

## ✅ Verification

After adding the configuration:

1. **Restart your MCP client**
2. **Check for workflow tools** in your MCP client
3. **Create a test task** to verify everything works

You should see 10+ workflow management tools available!

## 📚 Documentation

- **[Complete Setup Guide](docs/DEPLOYMENT_GUIDE.md)** - Detailed setup instructions
- **[Docker Hub](https://hub.docker.com/r/hiveacademy/mcp-workflow-manager)** - Production Docker images
- **[Technical Architecture](memory-bank/TechnicalArchitecture.md)** - System design details
- **[Developer Guide](memory-bank/DeveloperGuide.md)** - Development best practices

## 🤝 Contributing

We welcome contributions! See our [GitHub repository](https://github.com/Hive-Academy/Workflow_Manager_MCP) for details.

## 📄 License

MIT License - see [LICENSE](https://github.com/Hive-Academy/Workflow_Manager_MCP/blob/main/LICENSE) file.

---

**Built with ❤️ for the AI development community by Hive Academy**
