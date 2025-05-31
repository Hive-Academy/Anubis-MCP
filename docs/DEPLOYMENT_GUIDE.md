# 🚀 MCP Workflow Manager - Simple Setup Guide

This guide shows how to add the MCP Workflow Manager to your MCP client. **No manual installation required** - just add the configuration and the MCP client handles everything automatically.

## 🚀 **Quick Setup Guide**

### **Step 1: Choose Your Setup Method**

**No manual directory creation required!** Docker automatically creates all directories and initializes the database.

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
        "my-project-name-mcp-data:/app/prisma/data",
        "hiveacademy/mcp-workflow-manager"
      ]
    }
  }
}
```

**How it works:**

- **Volume**: `my-project-name-mcp-data` → Isolated storage per project (automatically created)
- **Database**: `workflow.db` → Unique database file per project (automatically initialized)
- **Prisma Path Resolution**: Database stored in `/app/prisma/data/workflow.db` inside container
- **No Setup Required**: Docker creates directories, initializes database, applies migrations

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
        "my-project-name-mcp-data:/app/prisma/data",
        "hiveacademy/mcp-workflow-manager"
      ]
    }
  }
}
```

**How it works:**

- **Volume**: `my-project-name-mcp-data` → Isolated storage per project
- **Database**: `workflow.db` → Unique database file per project (created automatically)
- **Prisma Path Resolution**: Database stored in `/app/prisma/data/workflow.db` inside container

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
        "project-a-mcp-data:/app/prisma/data",
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
        "project-b-mcp-data:/app/prisma/data",
        "hiveacademy/mcp-workflow-manager"
      ]
    }
  }
}
```

**Result**: ✅ Complete isolation - each project has its own database and data.

## 📊 **Local Report Access**

**Want to access generated reports directly on your file system?** Use host directory mounting.

**No manual directory creation needed!** Docker automatically creates all required directories.

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
        "D:/projects/my-project/prisma/data:/app/prisma/data",
        "-v",
        "D:/projects/my-project/workflow-reports:/app/data/workflow-manager-mcp-reports",
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
        "/Users/username/projects/my-project/prisma/data:/app/prisma/data",
        "-v",
        "/Users/username/projects/my-project/workflow-reports:/app/data/workflow-manager-mcp-reports",
        "hiveacademy/mcp-workflow-manager"
      ]
    }
  }
}
```

**✅ What you get automatically:**

- **Database**: `my-project/prisma/data/workflow.db` (created on first run)
- **Reports**: `my-project/workflow-reports/` (created when reports are generated)
- **Project Isolation**: Each project gets its own database and reports

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
