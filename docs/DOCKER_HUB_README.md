# MCP Workflow Manager

![Docker Pulls](https://img.shields.io/docker/pulls/hiveacademy/mcp-workflow-manager)
![Docker Image Size](https://img.shields.io/docker/image-size/hiveacademy/mcp-workflow-manager)
![Docker Image Version](https://img.shields.io/docker/v/hiveacademy/mcp-workflow-manager)

A comprehensive **Model Context Protocol (MCP) server** for AI workflow automation and task management in Cursor IDE and other MCP-compatible clients.

## 🚀 What is MCP Workflow Manager?

The MCP Workflow Manager provides a structured, role-based workflow system for AI development tasks. It enables seamless coordination between different AI modes (Boomerang, Researcher, Architect, Senior Developer, Code Review) with persistent task tracking, implementation planning, and progress monitoring.

### ⭐ Key Features

- **10+ Domain-Based MCP Tools** for comprehensive workflow management
- **Role-Based Workflow** with automatic task delegation and strategic redelegation
- **Persistent Task Tracking** with SQLite database and automatic project isolation
- **Implementation Planning** with batch-based subtask organization
- **Advanced Reporting** with PDF, PNG, HTML, and JPEG report generation
- **Real-time Analytics** with delegation patterns and performance monitoring
- **Multi-Platform Support** (linux/amd64, linux/arm64) for Intel and Apple Silicon
- **Production Ready** with NestJS + Prisma architecture and Alpine Linux security
- **Zero Setup Required** - Docker handles all initialization automatically
- **Browser Integration** with Playwright and system Chromium for report generation

## 🚀 Quick Start

**No manual setup required!** Docker automatically creates directories, initializes the database, and handles all configuration.

### 🌟 **NEW: Streamlined Database Configuration**

**Unified Path Pattern**: Each project gets automatic database isolation with consistent paths:

```
project-a/data/workflow.db  ← Project A's database
project-b/data/workflow.db  ← Project B's database
project-c/data/workflow.db  ← Project C's database
```

### Simple Setup (Recommended)

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

**✅ What happens automatically:**

- Database creation and initialization with schema migrations
- Directory structure setup with proper permissions
- Project isolation with unique databases per project
- Report generation capabilities with browser support

## 📦 Alternative: NPX Package

**Prefer NPX over Docker?** The MCP Workflow Manager is also available as a self-contained NPX package with automatic dependency management.

### NPX Setup

#### Claude Desktop

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

### NPX with Environment Variables

For enhanced control over project paths and report generation:

```json
{
  "mcpServers": {
    "workflow-manager": {
      "command": "npx",
      "args": ["-y", "@hive-academy/mcp-workflow-manager"],
      "env": {
        "PROJECT_ROOT": "/path/to/your/project",
        "DISABLE_REPORT_GENERATION": "false"
      }
    }
  }
}
```

**✅ NPX Benefits:**

- **🔧 Automatic Dependency Management**: Prisma client generation and database migrations
- **🎭 Conditional Playwright Setup**: Browser installation only when needed
- **🌍 Environment Detection**: Adapts for different installation types
- **🛡️ Graceful Degradation**: Disables optional features if dependencies unavailable
- **🚀 Works on Clean Systems**: No local dependencies required beyond Node.js
- **📊 Automatic Project Isolation**: Each project gets its own database automatically

**Docker vs NPX:**

- **Docker**: Better for production, teams, and consistent environments
- **NPX**: Better for development, quick setup, and local workflows

## 🔒 Project Isolation & Multi-Project Setup

**Each project gets its own isolated database automatically!** No manual setup required.

### ✅ **Recommended: Project-Specific Volume Names**

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

**✅ Result**: Each project gets its own database automatically created and isolated.

### ❌ **Avoid: Shared Volume Names**

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
        "shared-mcp-data:/app/data",
        "--rm",
        "hiveacademy/mcp-workflow-manager"
      ]
    }
  }
}
```

## 📊 Local Report Access

**Want to access generated reports directly on your file system?** Use host directory mounting for local file access.

### Windows Example

```json
{
  "mcpServers": {
    "workflow-manager": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "--network=host",
        "-v",
        "D:/projects/my-project/data:/app/data",
        "-v",
        "D:/projects/my-project/workflow-reports:/app/reports",
        "hiveacademy/mcp-workflow-manager"
      ]
    }
  }
}
```

### macOS/Linux Example

```json
{
  "mcpServers": {
    "workflow-manager": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "--network=host",
        "-v",
        "/Users/username/projects/my-project/data:/app/data",
        "-v",
        "/Users/username/projects/my-project/workflow-reports:/app/reports",
        "hiveacademy/mcp-workflow-manager"
      ]
    }
  }
}
```

**✅ What you get automatically:**

- **Database**: `my-project/data/workflow.db` (created on first run)
- **Reports**: `my-project/workflow-reports/` (created when reports are generated)
- **Project Isolation**: Each project gets its own database and reports
- **Multiple Formats**: PDF, PNG, HTML, and JPEG reports available

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

**Built with ❤️ for the AI development community by Hive Academy**
