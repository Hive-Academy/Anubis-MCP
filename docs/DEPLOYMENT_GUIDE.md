# 🚀 MCP Workflow Manager - Simple Setup Guide

This guide shows how to add the MCP Workflow Manager to your MCP client. **No manual installation required** - just add the configuration and the MCP client handles everything automatically.

## 🚀 **Quick Setup Guide**

### **Zero Configuration Database Management** ✨

**NEW**: Unified database configuration provides automatic project isolation across all deployment methods!

```
project-a/data/workflow.db  ← Project A's database
project-b/data/workflow.db  ← Project B's database
project-c/data/workflow.db  ← Project C's database
```

### **NPX Setup (Recommended)** ⭐

**Why NPX?**

- ✅ **Zero Configuration**: Automatic project detection and database creation
- ✅ **Project Isolation**: Each project gets its own database automatically
- ✅ **Always Latest**: Automatically uses the most recent version
- ✅ **No Installation**: No global packages, no manual setup

#### **Claude Desktop Configuration**

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

#### **Cursor IDE Configuration**

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

**✅ What Happens Automatically:**

- Database created at `{your-project}/data/workflow.db`
- Migrations applied safely
- Project isolation maintained
- Zero setup required

### **Docker Setup**

**Project isolation via volume mounts:**

#### **Simple Volume Setup (Recommended)**

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
        "my-project-name-data:/app/data",
        "hiveacademy/mcp-workflow-manager"
      ]
    }
  }
}
```

**Use different volume names for each project:**

- `project-a-data:/app/data` → Project A's database
- `project-b-data:/app/data` → Project B's database

#### **Host Directory Setup (For Local File Access)**

**Windows:**

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
        "D:/projects/my-project/data:/app/data",
        "-v",
        "D:/projects/my-project/workflow-reports:/app/reports",
        "hiveacademy/mcp-workflow-manager"
      ]
    }
  }
}
```

**macOS/Linux:**

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
        "/Users/username/projects/my-project/data:/app/data",
        "-v",
        "/Users/username/projects/my-project/workflow-reports:/app/reports",
        "hiveacademy/mcp-workflow-manager"
      ]
    }
  }
}
```

**✅ What You Get:**

- **Database**: `my-project/data/workflow.db` (created automatically)
- **Reports**: `my-project/workflow-reports/` (when reports are generated)
- **Project Isolation**: Each project has separate data

## 🎯 **Which Method Should I Use?**

### **Choose NPX if:**

- ✅ You want the **simplest possible setup**
- ✅ You're developing **multiple projects**
- ✅ You want **automatic project isolation**
- ✅ You prefer **zero configuration**

### **Choose Docker if:**

- ✅ You're working in a **team environment**
- ✅ You need **consistent environments**
- ✅ You want **version control**
- ✅ You need **local file access** to reports

## 🔒 **Project Isolation - How It Works**

### **NPX Automatic Isolation**

NPX detects your current directory and creates project-specific databases:

```bash
cd /path/to/project-a
# Database: /path/to/project-a/data/workflow.db

cd /path/to/project-b
# Database: /path/to/project-b/data/workflow.db
```

**No configuration needed** - it just works!

### **Docker Volume Isolation**

Use different volume names for complete isolation:

```json
// Project A
"args": ["-v", "project-a-data:/app/data", ...]

// Project B
"args": ["-v", "project-b-data:/app/data", ...]
```

## 🚨 **Troubleshooting**

### **NPX Issues**

**Problem**: Package installation fails  
**Solution**: Clear NPX cache: `npx clear-npx-cache`

**Problem**: Database permission errors  
**Solution**: Check directory permissions: `ls -la data/`

### **Docker Issues**

**Problem**: Volume mount errors  
**Solution**: Ensure paths use absolute paths and proper syntax

**Problem**: Database conflicts between projects  
**Solution**: Use different volume names for each project

## ✅ **Verification**

After adding the configuration:

1. **Restart your MCP client** (Claude Desktop, Cursor, VS Code)
2. **Check for workflow tools** in your MCP client
3. **Create a test task** to verify everything works

**You should see 10+ workflow management tools available:**

- `task_operations`
- `planning_operations`
- `workflow_operations`
- `review_operations`
- And more!

## 📚 **Additional Resources**

- **[Complete Database Setup Guide](STREAMLINED_DATABASE_SETUP.md)** - Detailed technical documentation
- **NPM Package**: [@hive-academy/mcp-workflow-manager](https://www.npmjs.com/package/@hive-academy/mcp-workflow-manager)
- **Docker Hub**: [hiveacademy/mcp-workflow-manager](https://hub.docker.com/r/hiveacademy/mcp-workflow-manager)
- **GitHub**: [Hive-Academy/Workflow_Manager_MCP](https://github.com/Hive-Academy/Workflow_Manager_MCP)

---

**🎉 That's it!** No manual installation, no complex setup - just add the config and start using your workflow manager with automatic project isolation.

**Built with ❤️ for the AI development community by Hive Academy**
