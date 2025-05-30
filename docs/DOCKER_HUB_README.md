# MCP Workflow Manager

![Docker Pulls](https://img.shields.io/docker/pulls/hiveacademy/mcp-workflow-manager)
![Docker Image Size](https://img.shields.io/docker/image-size/hiveacademy/mcp-workflow-manager)
![Docker Image Version](https://img.shields.io/docker/v/hiveacademy/mcp-workflow-manager)

A comprehensive **Model Context Protocol (MCP) server** for AI workflow automation and task management in Cursor IDE and other MCP-compatible clients.

## 🚀 What is MCP Workflow Manager?

The MCP Workflow Manager provides a structured, role-based workflow system for AI development tasks. It enables seamless coordination between different AI modes (Boomerang, Researcher, Architect, Senior Developer, Code Review) with persistent task tracking, implementation planning, and progress monitoring.

### ⭐ Key Features

- **42+ MCP Tools** for comprehensive workflow management
- **Role-Based Workflow** with automatic task delegation
- **Persistent Task Tracking** with SQLite/PostgreSQL support
- **Implementation Planning** with batch-based subtask organization
- **Research & Code Review** integrated reporting
- **Real-time Status Updates** and progress monitoring
- **Multi-Transport Support** (STDIO, SSE, Streamable HTTP)
- **Production Ready** with NestJS + Prisma architecture
- **Automatic Database Setup** with migrations on container start

## 🚀 Quick Setup

**No manual installation required** - just add the configuration to your MCP client and everything works automatically!

### NPX Setup (Recommended - Automatic Project Isolation)

#### Claude Desktop

Add to your `claude_desktop_config.json`:

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

#### Cursor IDE

Add to your `.cursor/mcp.json`:

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

### Docker Setup (Production/Teams)

#### Claude Desktop

```json
{
  "mcpServers": {
    "workflow-manager": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "-v",
        "workflow-manager-data:/app/data",
        "--rm",
        "hiveacademy/mcp-workflow-manager"
      ]
    }
  }
}
```

#### Cursor IDE

```json
{
  "mcpServers": {
    "workflow-manager": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--network=host",
        "-v",
        "workflow-manager-data:/app/data",
        "--rm",
        "hiveacademy/mcp-workflow-manager"
      ]
    }
  }
}
```

## 🔒 Project Isolation & Multi-Project Setup

### **IMPORTANT**: Avoiding Database Conflicts Between Projects

When using Docker across multiple projects, ensure each project has its own isolated database to prevent data conflicts:

#### ✅ **Recommended: Project-Specific Volume Names**

```json
// For project "my-auth-app"
{
  "mcpServers": {
    "workflow-manager": {
      "command": "docker",
      "args": ["run", "-i", "-v", "my-auth-app-mcp-data:/app/data", "--rm", "hiveacademy/mcp-workflow-manager"]
    }
  }
}

// For project "my-ecommerce-app"
{
  "mcpServers": {
    "workflow-manager": {
      "command": "docker",
      "args": ["run", "-i", "-v", "my-ecommerce-app-mcp-data:/app/data", "--rm", "hiveacademy/mcp-workflow-manager"]
    }
  }
}
```

#### ❌ **Avoid: Shared Volume Names**

```json
// DON'T DO THIS - All projects will share the same database!
{
  "mcpServers": {
    "workflow-manager": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "-v",
        "mcp-workflow-data:/app/data",
        "--rm",
        "hiveacademy/mcp-workflow-manager"
      ]
    }
  }
}
```

### **NPX vs Docker: When to Use Which**

| Use Case                                | Recommended Approach                 | Reason                             |
| --------------------------------------- | ------------------------------------ | ---------------------------------- |
| **Single Developer, Multiple Projects** | NPX with automatic isolation         | Simpler setup, automatic isolation |
| **Team Development**                    | Docker with project-specific volumes | Consistent environment across team |
| **Production Deployment**               | Docker with external database        | Scalability and reliability        |
| **Quick Testing/Prototyping**           | NPX                                  | Fastest setup                      |
| **CI/CD Pipelines**                     | Docker                               | Reproducible builds                |

## 🛠️ Available MCP Tools

### Core Task Management

- `task_operations` - Task lifecycle management
- `planning_operations` - Implementation planning and batch management
- `workflow_operations` - Role-based delegation and transitions
- `review_operations` - Code review and completion reports
- `research_operations` - Research reports and communication

### Query & Analytics

- `query_task_context` - Comprehensive task context retrieval
- `query_workflow_status` - Delegation and workflow status
- `query_reports` - Report queries with evidence
- `batch_subtask_operations` - Bulk subtask management
- `batch_status_updates` - Cross-entity synchronization

### Reporting & Analytics

- `generate_workflow_report` - Comprehensive analytics and reports
- `get_report_status` - Report generation status
- `cleanup_report` - Report file management

## 🔄 Workflow Roles

The system implements a structured workflow with specialized AI roles:

1. **🪃 Boomerang** - Task intake, analysis, and final delivery
2. **🔬 Researcher** - Information gathering and research
3. **🏛️ Architect** - Technical planning and design
4. **👨‍💻 Senior Developer** - Code implementation
5. **🔍 Code Review** - Quality assurance and testing

## 📊 Environment Variables

| Variable             | Default                   | Description                                    |
| -------------------- | ------------------------- | ---------------------------------------------- |
| `DATABASE_URL`       | `file:./data/workflow.db` | Database connection string                     |
| `MCP_SERVER_NAME`    | `MCP-Workflow-Manager`    | Server name for MCP protocol                   |
| `MCP_SERVER_VERSION` | `1.0.0`                   | Server version                                 |
| `MCP_TRANSPORT_TYPE` | `STDIO`                   | Transport type: STDIO, SSE, or STREAMABLE_HTTP |
| `PORT`               | `3000`                    | HTTP server port (SSE/HTTP only)               |

## ✅ Verification

After adding the configuration:

1. **Restart your MCP client** (Claude Desktop, Cursor, VS Code)
2. **Check for workflow tools** in your MCP client
3. **Create a test task** to verify everything works

You should see 10+ workflow management tools available!

## 📚 Additional Resources

- **NPM Package**: [@hive-academy/mcp-workflow-manager](https://www.npmjs.com/package/@hive-academy/mcp-workflow-manager)
- **GitHub Repository**: [Hive-Academy/Workflow_Manager_MCP](https://github.com/Hive-Academy/Workflow_Manager_MCP)
- **Complete Setup Guide**: [Deployment Guide](https://github.com/Hive-Academy/Workflow_Manager_MCP/blob/main/docs/DEPLOYMENT_GUIDE.md)
- **MCP Protocol**: [Model Context Protocol](https://modelcontextprotocol.io/)

---

**🎉 That's it!** No manual installation, no complex setup - just add the config and start using your workflow manager.
