# 🚀 MCP Workflow Manager - Simple Setup Guide

This guide shows how to add the MCP Workflow Manager to your MCP client. **No manual installation required** - just add the configuration and the MCP client handles everything automatically.

## 📋 Quick Setup

| Method     | Best For                                 | Configuration             |
| ---------- | ---------------------------------------- | ------------------------- |
| **NPX**    | Development, Automatic Project Isolation | Add to MCP config → Done! |
| **Docker** | Production, Team Consistency             | Add to MCP config → Done! |

## 🎯 NPX Setup (Recommended - Automatic Project Isolation)

### ✅ **Why NPX?**

- **Zero Setup**: Just add config, everything works automatically
- **Automatic Project Isolation**: Each project gets its own database automatically
- **MCP Standard**: Follows the same pattern as other MCP servers
- **Always Latest**: Automatically uses the latest version

### 🔧 **Claude Desktop Configuration**

Add this to your `claude_desktop_config.json`:

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

### 🔧 **Cursor IDE Configuration**

Add this to your `.cursor/mcp.json`:

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

### 🔧 **VS Code Configuration**

Add this to your VS Code settings or `.vscode/mcp.json`:

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

### 🔒 **Automatic Project Isolation**

NPX automatically creates separate databases for each project:

```
/project-a/workflow.db  ← Project A's data
/project-b/workflow.db  ← Project B's data
/project-c/workflow.db  ← Project C's data
```

**No configuration needed** - it just works!

## 🎯 **Project Isolation - How It Works**

### **The Problem (Now Fixed)**

Previously, all Docker containers shared the same development database because the Docker image included development database files. This has been **completely resolved**.

### **The Solution**

Each project now gets its own isolated database through:

1. **Project-specific volume names**: `project-name-mcp-data`
2. **Project-specific database files**: `project-name-workflow.db`
3. **Clean Docker image**: No development database files included

### **Docker Project Isolation (Recommended)**

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
        "my-project-name-mcp-data:/app/data",
        "-e",
        "DATABASE_URL=file:./data/my-project-name-workflow.db",
        "-e",
        "MCP_PROJECT_NAME=my-project-name",
        "hiveacademy/mcp-workflow-manager"
      ]
    }
  }
}
```

**How it works:**

- **Volume**: `my-project-name-mcp-data` → Isolated storage per project
- **Database**: `my-project-name-workflow.db` → Unique database file per project
- **Environment**: `MCP_PROJECT_NAME` → Project identification

### **Example Configurations**

**Project A** (`/path/to/project-a/.cursor/mcp.json`):

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
        "project-a-mcp-data:/app/data",
        "-e",
        "DATABASE_URL=file:./data/project-a-workflow.db",
        "hiveacademy/mcp-workflow-manager"
      ]
    }
  }
}
```

**Project B** (`/path/to/project-b/.cursor/mcp.json`):

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
        "project-b-mcp-data:/app/data",
        "-e",
        "DATABASE_URL=file:./data/project-b-workflow.db",
        "hiveacademy/mcp-workflow-manager"
      ]
    }
  }
}
```

**Result**: ✅ Complete isolation - each project has its own database and data.

## 📊 **Accessing Reports Locally (Docker Only)**

When using Docker, you can access generated reports directly in your local project directory by mounting a local folder to the report directory.

### **Setup with Local Report Access**

**Step 1**: Create a local reports directory in your project:

```bash
mkdir workflow-reports
```

**Step 2**: Update your Docker configuration to include the report volume mount:

#### **Windows Example**

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
        "my-project-mcp-data:/app/data",
        "-v",
        "D:/projects/my-project/workflow-reports:/app/data/workflow-manager-mcp-reports",
        "-e",
        "DATABASE_URL=file:./data/my-project-workflow.db",
        "-e",
        "MCP_PROJECT_NAME=my-project",
        "hiveacademy/mcp-workflow-manager"
      ]
    }
  }
}
```

#### **macOS Example**

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
        "my-project-mcp-data:/app/data",
        "-v",
        "/Users/username/projects/my-project/workflow-reports:/app/data/workflow-manager-mcp-reports",
        "-e",
        "DATABASE_URL=file:./data/my-project-workflow.db",
        "-e",
        "MCP_PROJECT_NAME=my-project",
        "hiveacademy/mcp-workflow-manager"
      ]
    }
  }
}
```

#### **Linux Example**

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
        "my-project-mcp-data:/app/data",
        "-v",
        "/home/username/projects/my-project/workflow-reports:/app/data/workflow-manager-mcp-reports",
        "-e",
        "DATABASE_URL=file:./data/my-project-workflow.db",
        "-e",
        "MCP_PROJECT_NAME=my-project",
        "hiveacademy/mcp-workflow-manager"
      ]
    }
  }
}
```

### **Key Configuration Points**

1. **Use absolute paths**: Always use the full path to your project directory
2. **Mount to correct location**: `/app/data/workflow-manager-mcp-reports` is where reports are generated
3. **Include network host**: `--network=host` for proper connectivity in Cursor
4. **Project isolation**: Keep using unique volume names and database files

### **After Setup**

**Step 3**: Restart your MCP client (Cursor, Claude Desktop, etc.)

**Step 4**: Generate a report using `generate_workflow_report`

**Step 5**: Access reports locally in your `workflow-reports/` directory:

```
workflow-reports/
├── task_summary/
│   └── task_summary_2025-05-30T20-56-12.html
├── delegation_analytics/
│   └── delegation_analytics_2025-05-30T21-15-30.pdf
├── performance_dashboard/
│   └── performance_dashboard_2025-05-30T22-00-45.png
└── temp/
```

### **Available Report Types**

- **`task_summary`** - Task completion overview with status breakdown
- **`delegation_analytics`** - Delegation patterns and role efficiency analysis
- **`performance_dashboard`** - Real-time metrics with performance trending
- **`comprehensive`** - Complete analysis combining all metrics
- **Individual task reports** - Detailed analysis for specific tasks

### **Output Formats**

- **PDF** - Professional documents (recommended for reports)
- **HTML** - Interactive dashboards with live charts
- **PNG** - High-quality images for presentations
- **JPEG** - Compressed images for quick sharing

### **Benefits of Local Access**

✅ **Direct Access**: Reports appear immediately in your project directory  
✅ **Version Control**: Include reports in your git repository if desired  
✅ **Easy Sharing**: Share reports directly from your local filesystem  
✅ **Integration**: Use reports in documentation, presentations, or CI/CD

### **NPX Note**

NPX users get automatic local report access since the server runs directly in the project directory. No additional configuration needed!

## 🎯 Which Method Should I Use?

### Choose NPX if:

- ✅ You're developing multiple projects
- ✅ You want automatic project isolation
- ✅ You want the simplest setup
- ✅ You want automatic updates

### Choose Docker if:

- ✅ You're working in a team
- ✅ You need consistent environments
- ✅ You're deploying to production
- ✅ You want version control

## 🚨 Troubleshooting

### NPX Issues

**Problem**: Command not found
**Solution**: The MCP client will automatically install the package on first use

**Problem**: Permission errors
**Solution**: The MCP client handles permissions automatically

### Docker Issues

**Problem**: Image not found
**Solution**: The MCP client will automatically pull the image on first use

**Problem**: Volume conflicts between projects
**Solution**: Use different volume names for each project (see examples above)

## ✅ Verification

After adding the configuration:

1. **Restart your MCP client** (Claude Desktop, Cursor, VS Code)
2. **Check for workflow tools** in your MCP client
3. **Create a test task** to verify everything works

You should see tools like:

- `task_operations`
- `planning_operations`
- `workflow_operations`
- `review_operations`
- And more!

## 📚 Additional Resources

- **NPM Package**: [@hive-academy/mcp-workflow-manager](https://www.npmjs.com/package/@hive-academy/mcp-workflow-manager)
- **Docker Hub**: [hiveacademy/mcp-workflow-manager](https://hub.docker.com/r/hiveacademy/mcp-workflow-manager)
- **GitHub**: [Hive-Academy/Workflow_Manager_MCP](https://github.com/Hive-Academy/Workflow_Manager_MCP)

---

**🎉 That's it!** No manual installation, no complex setup - just add the config and start using your workflow manager.
