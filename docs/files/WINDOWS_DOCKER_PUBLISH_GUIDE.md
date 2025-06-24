# 🪟 Windows Docker Publication Guide

## 🎯 Complete Guide for Publishing Anubis to Docker Hub on Windows

### 🆕 What's New in This Version

- **🌱 Integrated Database Seeding**: Workflow rules are automatically seeded during Docker build
- **⚡ Instant Startup**: No manual `npm run rules:gen` required - everything is pre-configured
- **🔧 Enhanced Build Process**: Improved multi-stage build with validation and testing
- **📦 Production Ready**: Optimized for both development and production deployments

### 📋 Prerequisites

1. **Docker Desktop for Windows** - Installed and running
2. **Docker Hub Account** - Create at [hub.docker.com](https://hub.docker.com)
3. **PowerShell 5.1+** - Built into Windows 10/11
4. **Git for Windows** - For version control
5. **Node.js 22+** - For testing before publication

### 🔧 Pre-Publication Setup

#### Step 1: Verify Docker Installation

```powershell
# Check Docker is running
docker --version
docker info

# Login to Docker Hub
docker login
# Enter your Docker Hub username and password
```

#### Step 3: Test Your Application

```powershell
# Install dependencies
npm install

# Build the application
npm run build

# Run tests (if available)
npm test

# Test Docker build locally
docker build -t test-mcp-workflow .
docker run --rm test-mcp-workflow --help
```

### 🚀 Publication Process

#### Option A: Manual Step-by-Step

1. **Build Multi-Platform Image**:

   ```powershell
   # Create and use buildx builder
   docker buildx create --name mcp-builder --use --bootstrap

   # Build and push for multiple platforms
   docker buildx build `
     --platform linux/amd64,linux/arm64 `
     --tag hiveacademy/anubis:latest `
   --tag hiveacademy/anubis:1.0.0 `
     --push .
   ```

2. **Verify Publication**:

   ```powershell
   # Check the image was published
   docker pull hiveacademy/anubis:latest

   # Test the published image
   docker run --rm hiveacademy/anubis:latest --help
   ```

### 🔧 Configuration Options

#### Environment Variables for Different Use Cases

**1. Basic STDIO Usage (Default)**:

```powershell
# For Claude Desktop integration
docker run --rm -i `
  -v mcp-workflow-data:/app/data `
  hiveacademy/anubis:latest
```

**2. HTTP Server Mode**:

```powershell
# For web-based clients
docker run --rm `
  -p 3000:3000 `
  -e MCP_TRANSPORT_TYPE=SSE `
  -e NODE_ENV=production `
  -v mcp-workflow-data:/app/data `
  hiveacademy/anubis:latest
```

**3. Production with PostgreSQL**:

```powershell
# With external database
docker run --rm `
  -p 3000:3000 `
  -e DATABASE_URL="postgresql://user:pass@postgres:5432/workflow_db" `
  -e MCP_TRANSPORT_TYPE=SSE `
  -e NODE_ENV=production `
  hiveacademy/anubis:latest
```

### 📝 Docker Hub Configuration

#### Repository Settings on Docker Hub

1. **Repository Name**: `anubis`
2. **Description**: "A comprehensive Model Context Protocol server for AI workflow automation and task management"
3. **README**: Copy content from `DOCKER_HUB_README.md`
4. **Tags**:
   - `latest` (always points to newest stable)
   - `1.0.0`, `1.1.0`, etc. (specific versions)
   - `develop` (development builds)

#### Automated Builds (Optional)

Link your GitHub repository for automatic builds:

1. Go to Docker Hub → Account Settings → Linked Accounts
2. Link your GitHub account
3. Create automated build from `Hive-Academy/Workflow_Manager_MCP`

### 🔍 Testing Publication

#### Local Testing

```powershell
# Test different configurations
# 1. Basic functionality
docker run --rm -v mcp-test-data:/app/data hiveacademy/anubis:latest --help

# 2. HTTP mode
docker run --rm -p 3000:3000 -e MCP_TRANSPORT_TYPE=SSE hiveacademy/anubis:latest &
Start-Sleep 5
Invoke-WebRequest http://localhost:3000/health -UseBasicParsing
Stop-Process -Name node
```

#### Integration Testing

```powershell
# Test with Claude Desktop configuration
$claudeConfig = @{
    mcpServers = @{
        "anubis" = @{
            command = "docker"
            args = @("run", "--rm", "-i", "-v", "mcp-workflow-data:/app/data", "hiveacademy/anubis:latest")
        }
    }
} | ConvertTo-Json -Depth 3

Write-Host "Add this to your Claude Desktop config:"
Write-Host $claudeConfig
```

### 📊 Monitoring and Maintenance

#### Health Checks

```powershell
# Check container health
docker run --rm --health-cmd "npm run health-check" hiveacademy/anubis:latest

# Monitor running containers
docker stats
```

#### Updates and Versioning

```powershell
# When releasing new versions
# 1. Update package.json version
npm version patch  # or minor/major

# 2. Build and publish new version
.\scripts\docker-publish.ps1 -Version $(node -p "require('./package.json').version")

# 3. Test the new version
docker pull hiveacademy/anubis:latest
```

### 🛡️ Security Considerations

#### Container Security

- ✅ Image runs as non-root user
- ✅ Minimal attack surface (Alpine Linux base)
- ✅ No sensitive data in image layers
- ✅ Environment variables for configuration
- ✅ Health checks enabled

#### Network Security

```powershell
# For production deployment
docker run --rm `
  --network mcp-network `
  --restart unless-stopped `
  -v mcp-workflow-data:/app/data `
  hiveacademy/anubis:latest
```

### 🌟 Best Practices

#### Version Management

- Use semantic versioning (1.0.0, 1.1.0, etc.)
- Tag releases in Git
- Maintain changelog
- Test before publishing

#### Performance Optimization

```powershell
# Optimize image size
docker images hiveacademy/anubis

# Check layer sizes
docker history hiveacademy/anubis:latest
```

### 🎉 Success Verification

After successful publication, verify:

1. **Docker Hub Page**: https://hub.docker.com/r/hiveacademy/anubis
2. **Image Pull**: `docker pull hiveacademy/anubis`
3. **Multi-Platform**: Check AMD64 and ARM64 support
4. **Documentation**: Verify README displays correctly
5. **Tags**: Confirm version tags are available

### 🔗 Integration Examples

#### Claude Desktop Configuration

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
        "mcp-workflow-data:/app/data",
        "hiveacademy/anubis"
      ]
    }
  }
}
```

#### Docker Compose

```yaml
version: '3.8'
services:
  anubis:
    image: hiveacademy/anubis:latest
    container_name: mcp-workflow
    environment:
      - MCP_TRANSPORT_TYPE=SSE
      - NODE_ENV=production
    ports:
      - '3000:3000'
    volumes:
      - mcp-workflow-data:/app/data
    restart: unless-stopped

volumes:
  mcp-workflow-data:
```

### 📞 Support and Troubleshooting

#### Common Issues

1. **Docker Build Fails**:

   ```powershell
   # Clear Docker cache
   docker system prune -a
   ```

2. **Multi-Platform Build Issues**:

   ```powershell
   # Reset buildx
   docker buildx rm mcp-builder
   docker buildx create --name mcp-builder --use --bootstrap
   ```

3. **Permission Issues**:
   ```powershell
   # Run PowerShell as Administrator
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

#### Getting Help

- 📖 Documentation: See README.md
- 🐛 Issues: GitHub Issues page
- 💬 Community: Docker Hub comments
- 📧 Support: Repository maintainers

---

**🎯 Quick Start Summary for Windows**:

1. `.\scripts\clean-for-publish.ps1` - Clean repository
2. `docker login` - Login to Docker Hub
3. `.\scripts\docker-publish.ps1` - Publish image
4. Verify at https://hub.docker.com/r/hiveacademy/anubis

**Total time**: ~10-15 minutes for first publication! 🚀

### 🌱 Database Seeding Integration

#### How It Works

The new Docker build process automatically handles database seeding:

1. **Build-Time Seeding**: During Docker image creation, the workflow rules are seeded into a build-time database
2. **Runtime Detection**: When the container starts, it detects if seeding is already complete
3. **Automatic Fallback**: If seeding is needed at runtime, it happens automatically using `npx prisma db seed`

#### Key Benefits

- **⚡ Instant Startup**: No waiting for database initialization
- **🔄 Consistent State**: Every container starts with the same workflow rules
- **🛡️ Error Resilient**: Automatic fallback if build-time seeding fails
- **📦 Self-Contained**: No external dependencies or manual setup required

#### Environment Variables

```powershell
# These are automatically set in the Docker image
BUILD_TIME_SEEDING_DEPLOYED=true    # Indicates seeding completed during build
MIGRATIONS_PRE_DEPLOYED=true        # Indicates migrations completed during build
```

#### Troubleshooting Seeding

If you encounter seeding issues:

```powershell
# Force re-seeding in development
docker run --rm -e FORCE_RESET=true -v mcp-data:/app/data hiveacademy/anubis

# Check seeding status
docker run --rm -v mcp-data:/app/data hiveacademy/anubis --verbose

# Manual seeding (if needed)
docker exec -it <container-id> npx prisma db seed
```
