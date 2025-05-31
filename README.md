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

## 🚀 Quick Setup

**No installation needed** - just add the configuration to your MCP client and everything works automatically!

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

#### VS Code

Add to your settings or `.vscode/mcp.json`:

```json
{
  "mcp": {
    "servers": {
      "workflow-manager": {
        "command": "npx",
        "args": ["-y", "@hive-academy/mcp-workflow-manager"]
      }
    }
  }
}
```

**✅ Self-Contained Package Benefits:**

- **🔧 Automatic Dependency Management**: Prisma client generation and database migrations
- **🎭 Conditional Playwright Setup**: Browser installation only when report generation needed
- **🌍 Environment Detection**: Adapts for NPX vs global vs local installations
- **🛡️ Graceful Degradation**: Disables optional features if dependencies unavailable
- **🚀 Works on Clean Systems**: No local dependencies required beyond Node.js
- **📊 Automatic Project Isolation**: Each project gets its own database automatically

**What happens automatically on first run:**

1. **Environment Detection**: Identifies NPX vs global vs local installation
2. **Prisma Client Generation**: Generates database client automatically
3. **Database Setup**: Creates and migrates database schema
4. **Playwright Browsers**: Installs browsers conditionally for report generation
5. **Project Isolation**: Creates project-specific database based on directory

### NPX Environment Variables (Optional)

For enhanced control over NPX package behavior, you can set environment variables:

#### Cursor IDE with Environment Variables

```json
{
  "mcpServers": {
    "workflow-manager": {
      "command": "npx",
      "args": ["-y", "@hive-academy/mcp-workflow-manager"],
      "env": {
        "PROJECT_ROOT": "D:/projects/your-project",
        "DISABLE_REPORT_GENERATION": "false"
      }
    }
  }
}
```

#### Claude Desktop with Environment Variables

```json
{
  "mcpServers": {
    "workflow-manager": {
      "command": "npx",
      "args": ["-y", "@hive-academy/mcp-workflow-manager"],
      "env": {
        "PROJECT_ROOT": "/Users/username/projects/your-project",
        "DISABLE_REPORT_GENERATION": "false"
      }
    }
  }
}
```

**Available Environment Variables:**

- **`PROJECT_ROOT`**: Explicit project root directory (defaults to current working directory)

  - **Purpose**: Ensures reports and database are created in the correct project location
  - **When to use**: When the current working directory doesn't match your project root
  - **Example**: `"PROJECT_ROOT": "D:/projects/my-app"`

- **`DISABLE_REPORT_GENERATION`**: Disable Playwright browser installation and report generation
  - **Purpose**: Faster startup when reports aren't needed
  - **Values**: `"true"` or `"false"` (default: `"false"`)
  - **Example**: `"DISABLE_REPORT_GENERATION": "true"`

**✅ Benefits of Setting PROJECT_ROOT:**

- **📊 Correct Report Location**: Reports generated in your project directory
- **🗄️ Proper Database Location**: Database created in project-specific location
- **🔒 Project Isolation**: Prevents data mixing between different projects
- **🎯 Predictable Paths**: Always know where your workflow data is stored

### Docker Setup (Production/Teams)

**No manual setup required!** Docker automatically creates directories and initializes the database.

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
        "workflow-manager-data:/app/prisma/data",
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
        "workflow-manager-data:/app/prisma/data",
        "--rm",
        "hiveacademy/mcp-workflow-manager"
      ]
    }
  }
}
```

**✅ What happens automatically:**

- Database creation and initialization
- Directory structure setup
- Schema migrations
- Permissions configuration

## 🔒 Project Isolation

### NPX (Automatic)

Each project automatically gets its own database:

```
/project-a/workflow.db  ← Project A's data
/project-b/workflow.db  ← Project B's data
```

### Docker (Automatic Directory Creation)

**No manual directory creation needed!** Use project-specific volume names:

```json
// Project A
"args": ["run", "-i", "-v", "project-a-workflow:/app/prisma/data", "--rm", "hiveacademy/mcp-workflow-manager"]

// Project B
"args": ["run", "-i", "-v", "project-b-workflow:/app/prisma/data", "--rm", "hiveacademy/mcp-workflow-manager"]
```

**Why `/app/prisma/data`?** Prisma resolves the `DATABASE_URL="file:./data/workflow.db"` relative to the schema location (`/app/prisma/schema.prisma`), resulting in `/app/prisma/data/workflow.db`. Docker automatically creates this path and ensures proper database persistence.

## 📊 Local Report Access

**Want to access generated reports directly on your file system?** Use host directory mounting:

### Setup (Automatic Directory Creation)

**No manual directory creation needed!** Docker creates all directories automatically.

#### Cursor IDE (Recommended)

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
        "D:/projects/your-project/prisma/data:/app/prisma/data",
        "-v",
        "D:/projects/your-project/workflow-reports:/app/data/workflow-manager-mcp-reports",
        "hiveacademy/mcp-workflow-manager"
      ]
    }
  }
}
```

#### Windows Example

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
        "D:/projects/my-project/prisma/data:/app/prisma/data",
        "-v",
        "D:/projects/my-project/workflow-reports:/app/data/workflow-manager-mcp-reports",
        "hiveacademy/mcp-workflow-manager"
      ]
    }
  }
}
```

#### macOS/Linux Example

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
        "/Users/username/projects/my-project/prisma/data:/app/prisma/data",
        "-v",
        "/Users/username/projects/my-project/workflow-reports:/app/data/workflow-manager-mcp-reports",
        "hiveacademy/mcp-workflow-manager"
      ]
    }
  }
}
```

### What You Get

- **Database**: `your-project/prisma/data/workflow.db` (automatically created)
- **Reports**: `your-project/workflow-reports/` (automatically created)
- **Project Isolation**: Each project gets its own database and reports

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

## 📊 Accessing Reports Locally

### Docker Setup with Local Report Access

To access generated reports directly in your local project directory, mount a local folder to the report directory:

#### Cursor IDE (Recommended)

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
        "D:/projects/your-project/prisma/data:/app/prisma/data",
        "-v",
        "D:/projects/your-project/workflow-reports:/app/data/workflow-manager-mcp-reports",
        "hiveacademy/mcp-workflow-manager"
      ]
    }
  }
}
```

#### Windows Example

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
        "D:/projects/my-project/prisma/data:/app/prisma/data",
        "-v",
        "D:/projects/my-project/workflow-reports:/app/data/workflow-manager-mcp-reports",
        "hiveacademy/mcp-workflow-manager"
      ]
    }
  }
}
```

#### macOS/Linux Example

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
        "/Users/username/projects/my-project/prisma/data:/app/prisma/data",
        "-v",
        "/Users/username/projects/my-project/workflow-reports:/app/data/workflow-manager-mcp-reports",
        "hiveacademy/mcp-workflow-manager"
      ]
    }
  }
}
```

### Setup Steps

1. **Create local reports directory**:

   ```bash
   mkdir workflow-reports
   ```

2. **Update your MCP configuration** with the absolute path to your project

3. **Restart your MCP client** (Cursor, Claude Desktop, etc.)

4. **Generate a report** using `generate_workflow_report`

5. **Access reports locally** in your `workflow-reports/` directory:
   ```
   workflow-reports/
   ├── task_summary/
   │   └── task_summary_2025-05-30T20-56-12.html
   ├── delegation_analytics/
   │   └── delegation_analytics_2025-05-30T21-15-30.pdf
   └── temp/
   ```

### Report Types Available

- **`task_summary`** - Task completion overview with status breakdown
- **`delegation_analytics`** - Delegation patterns and role efficiency analysis
- **`performance_dashboard`** - Real-time metrics with performance trending
- **`comprehensive`** - Complete analysis combining all metrics
- **Individual task reports** - Detailed analysis for specific tasks

### Output Formats

- **PDF** - Professional documents (recommended for reports)
- **HTML** - Interactive dashboards with live charts
- **PNG** - High-quality images for presentations
- **JPEG** - Compressed images for quick sharing

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
