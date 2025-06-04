# Streamlined Database Configuration

## Overview

This document describes the **Unified Database Configuration System** that provides consistent per-project database management across all deployment methods (Docker, NPX, Local Development).

## Key Benefits

✅ **Automatic Project Isolation**: Each project gets its own database automatically  
✅ **Consistent Path Management**: Same pattern works across Docker/NPX/Local  
✅ **Zero Configuration Required**: Works out-of-the-box with sensible defaults  
✅ **Deployment-Aware**: Automatically detects and configures for current environment  
✅ **Migration Safety**: Safe database schema updates across all deployment methods

## Database Path Pattern

**Unified Pattern**: `{projectRoot}/data/workflow.db`

```
project-a/
├── data/
│   └── workflow.db          ← Project A's database
├── your-code/
└── ...

project-b/
├── data/
│   └── workflow.db          ← Project B's database
├── your-code/
└── ...
```

## Deployment Methods

### 1. NPX Deployment (Recommended)

**Automatic Project Isolation**: NPX automatically creates separate databases per project.

#### Configuration

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

#### How It Works

- **Project Root**: Automatically detected from `process.cwd()`
- **Database Path**: `{projectRoot}/data/workflow.db`
- **Directory Creation**: Automatic with proper permissions
- **Migrations**: Applied safely on startup

#### Example Paths

```
/Users/dev/project-a/data/workflow.db
/Users/dev/project-b/data/workflow.db
C:\Users\Dev\project-c\data\workflow.db
```

### 2. Docker Deployment

**Volume-Based Project Isolation**: Each project uses a separate volume mount.

#### Configuration

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
        "/absolute/path/to/your-project/data:/app/data",
        "hiveacademy/mcp-workflow-manager"
      ]
    }
  }
}
```

#### How It Works

- **Container Path**: Always `/app/data/workflow.db`
- **Host Path**: `{your-project}/data/workflow.db` (via volume mount)
- **Project Isolation**: Achieved through different volume mounts
- **Migrations**: Pre-deployed in image for instant startup

#### Platform Examples

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
        "hiveacademy/mcp-workflow-manager"
      ]
    }
  }
}
```

### 3. Local Development

**Flexible Configuration**: Supports custom paths and environment-specific setup.

#### Default Configuration

```bash
# Uses current directory + /data/workflow.db
npm run start

# Database created at: ./data/workflow.db
```

#### Custom Database Path

```bash
# Set custom project root
export PROJECT_ROOT="/path/to/my-project"
npm run start

# Database created at: /path/to/my-project/data/workflow.db
```

#### Environment Variables

```bash
# Optional: Override project root
PROJECT_ROOT="/custom/path"

# Optional: Override entire database URL
DATABASE_URL="file:./custom-location/my-workflow.db"
```

## Configuration System Architecture

### Automatic Deployment Detection

The system automatically detects the deployment method:

```typescript
// Docker Detection
if (process.env.RUNNING_IN_DOCKER || fs.existsSync('/.dockerenv')) {
  return 'docker';
}

// NPX Detection
if (
  execPath.includes('.npm/_npx') ||
  process.env.npm_execpath?.includes('npx')
) {
  return 'npx';
}

// Local Development (default)
return 'local';
```

### Database Configuration Resolution

1. **Project Root Resolution**:

   - Custom root parameter (highest priority)
   - `PROJECT_ROOT` environment variable
   - Current working directory (default)

2. **Path Generation**:

   - Docker: `/app/data/workflow.db`
   - NPX/Local: `{projectRoot}/data/workflow.db`

3. **Directory Creation**: Automatic with proper permissions

4. **Validation**: Checks write permissions and path consistency

### Migration Management

#### NPX & Local Development

- **Runtime Migrations**: Applied on startup using `prisma migrate deploy`
- **Safe Updates**: Only applies pending migrations, preserves data
- **Error Handling**: Clear error messages with troubleshooting tips

#### Docker Deployment

- **Build-Time Migrations**: Pre-deployed during image build
- **Instant Startup**: No migration delay in container startup
- **Verification**: Runtime validation ensures schema consistency

## Environment Variables

### Automatically Set Variables

```bash
DATABASE_URL="file:{resolved-path}/workflow.db"
PROJECT_ROOT="{detected-project-root}"
MCP_DATA_DIRECTORY="{data-directory-path}"
MCP_DEPLOYMENT_METHOD="{docker|npx|local}"
```

### Optional Override Variables

```bash
# Override project root detection
PROJECT_ROOT="/custom/project/path"

# Override entire database URL (advanced)
DATABASE_URL="file:./custom/path/database.db"

# Enable verbose logging
MCP_VERBOSE="true"
```

## Troubleshooting

### Common Issues

#### Database Permission Errors

```bash
# Check data directory permissions
ls -la ./data/

# Fix permissions (Unix/macOS)
chmod 755 ./data/
chmod 644 ./data/workflow.db

# Windows: Ensure user has write permissions to project directory
```

#### Project Root Detection Issues

```bash
# Verify current working directory
pwd

# Set explicit project root
export PROJECT_ROOT="$(pwd)"

# Verify detection
npx @hive-academy/mcp-workflow-manager --verbose
```

#### Docker Volume Mount Issues

```bash
# Verify host path exists
ls -la /path/to/your-project/data/

# Create directory if missing
mkdir -p /path/to/your-project/data

# Check Docker volume mount syntax
docker run -v "/absolute/host/path:/app/data" image-name
```

### Migration Issues

#### NPX/Local: Migration Failures

```bash
# Check Prisma schema
npx prisma validate

# Reset database (development only!)
rm ./data/workflow.db
npx @hive-academy/mcp-workflow-manager

# Manual migration (if needed)
npx prisma migrate deploy
```

#### Docker: Build-Time Migration Issues

```bash
# Check Docker build logs
docker build --no-cache .

# Look for migration deployment output:
# "🔧 DEPLOYING MIGRATIONS AT BUILD-TIME..."
# "✅ BUILD-TIME MIGRATION DEPLOYMENT SUCCESSFUL"
```

## Advanced Configuration

### Custom Database Paths

```typescript
// Local development with custom path
import { setupDatabaseEnvironment } from './utils/database-config';

const config = setupDatabaseEnvironment({
  projectRoot: '/custom/project/root',
  customDatabasePath: './custom/location/workflow.db',
  verbose: true,
});
```

### Docker Volume Configuration Generator

```typescript
import { getDatabaseConfig } from './utils/database-config';

const config = getDatabaseConfig({ projectRoot: '/host/project/path' });
const dockerConfig = config.getDockerVolumeConfig();

console.log(dockerConfig.volumeMount);
// Output: "/host/project/path/data:/app/data"
```

### Programmatic Configuration

```typescript
import { DatabaseConfigManager } from './utils/database-config';

const manager = new DatabaseConfigManager({ verbose: true });
const config = manager.getDatabaseConfig();

console.log(`Deployment: ${config.deploymentMethod}`);
console.log(`Database: ${config.databaseUrl}`);
console.log(`Project Root: ${config.projectRoot}`);
```

## Migration from Old System

### NPX Users

- **No changes required**: Existing databases are automatically detected
- **Path migration**: Old `prisma/data/workflow.db` → `data/workflow.db`
- **Automatic upgrade**: Database moved on first run

### Docker Users

- **Volume path update**: Update volume mounts to use `/app/data`
- **Old**: `-v host-path:/app/prisma/data`
- **New**: `-v host-path:/app/data`

### Local Development

- **Environment cleanup**: Remove manual `DATABASE_URL` settings
- **Let auto-detection work**: System handles path resolution automatically

## Best Practices

### Project Setup

1. **Use NPX for simplicity**: Zero configuration, automatic isolation
2. **Use Docker for consistency**: Identical environment across team
3. **Use absolute paths in Docker**: Avoid relative path issues

### Database Management

1. **Let system handle paths**: Don't override unless necessary
2. **Use project-specific folders**: Keep databases isolated per project
3. **Backup before major changes**: Database files are in predictable locations

### Environment Variables

1. **Minimal overrides**: Only set what you need to change
2. **Use PROJECT_ROOT**: For custom project structures
3. **Enable verbose logging**: For troubleshooting setup issues

## Summary

The unified database configuration system provides:

- **Automatic project isolation** across all deployment methods
- **Zero configuration** for standard use cases
- **Consistent behavior** whether using NPX, Docker, or local development
- **Safe migration handling** with data preservation
- **Clear troubleshooting** with detailed error messages

The system follows the principle of "convention over configuration" while providing flexibility for advanced use cases.
