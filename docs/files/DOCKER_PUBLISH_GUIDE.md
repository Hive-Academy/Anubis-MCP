# 🚀 Docker Hub Publication Guide

This guide will help you publish your Anubis to Docker Hub immediately, following the established patterns in the MCP ecosystem.

## 📋 Prerequisites

1. **Docker Hub Account**: Create account at [hub.docker.com](https://hub.docker.com) with username `hiveacademy`
2. **Docker Desktop**: Installed and running locally
3. **Git Repository**: Code is at https://github.com/Hive-Academy/Workflow_Manager_MCP

## ✅ Issues Fixed

### 1. Repository Information ✅

- ✅ Updated package.json with correct repository URL
- ✅ Updated Docker labels with Hive Academy information
- ✅ Corrected GitHub Actions workflow
- ✅ Fixed Docker Hub README references

### 2. MCP Transport Configuration ✅

- ✅ Multi-transport support (STDIO, SSE, STREAMABLE_HTTP)
- ✅ Environment-based transport selection
- ✅ Proper @rekog/mcp-nest v1.5.2 configuration

### 3. Database Initialization ✅

- ✅ Automatic migration on container startup
- ✅ Docker entrypoint script handles database setup
- ✅ SQLite/PostgreSQL/MySQL support
- ✅ Proper data persistence with volumes

### 4. Production Configuration ✅

- ✅ Multi-platform builds (linux/amd64, linux/arm64)
- ✅ Security scanning with Docker Scout
- ✅ Health checks for different transport types
- ✅ Non-root user execution

## 🎯 Quick Publication (5 minutes)

### Step 1: Docker Hub Setup

```bash
# Login to Docker Hub as hiveacademy
docker login
# Enter username: hiveacademy
# Enter password: [your-password]

# Verify login
docker info | grep Username
```

### Step 2: Build and Publish

```bash
# Run the publication script
./scripts/docker-publish.sh

# Or with specific version
./scripts/docker-publish.sh 1.0.0
```

### Step 3: Test Your Published Image

```bash
# Pull your image
docker pull hiveacademy/anubis

# Test with STDIO transport (default)
docker run -i --rm -v mcp-workflow-data:/app/data hiveacademy/anubis

# Test with SSE transport
docker run -p 3000:3000 -e MCP_TRANSPORT_TYPE=SSE -v mcp-workflow-data:/app/data hiveacademy/anubis

# Check health
curl http://localhost:3000/health
```

## 🔧 Manual Publication Steps

If you prefer manual control:

### 1. Build Multi-Platform Image

```bash
# Create builder
docker buildx create --name mcp-builder --use --bootstrap

# Build for multiple platforms
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --tag hiveacademy/anubis:latest \
  --tag hiveacademy/anubis:1.0.0 \
  --push \
  .
```

### 2. Update Docker Hub Description

- Go to [hub.docker.com/r/hiveacademy/anubis](https://hub.docker.com/r/hiveacademy/anubis)
- Navigate to repository settings
- Copy content from `DOCKER_HUB_README.md` into the repository description

## 🚀 Automated GitHub Actions Setup

### 1. Set Up Repository Secrets

In your GitHub repository settings → Secrets and variables → Actions:

```
DOCKER_HUB_ACCESS_TOKEN=your-access-token
```

Note: Username is hardcoded as `hiveacademy` in the workflow.

### 2. Create Access Token

1. Go to Docker Hub → Account Settings → Security
2. Create New Access Token with name "GitHub Actions"
3. Copy the token to GitHub secrets

### 3. Push to GitHub

```bash
git add .
git commit -m "feat: add Docker Hub publication setup with database auto-migration"
git push origin main
```

The GitHub Action will automatically build and publish on every push!

## 📊 Verification & Testing

### Test Different Transport Types

```bash
# STDIO (default) - for CLI integration
docker run -i --rm -v mcp-workflow-data:/app/data hiveacademy/anubis

# SSE - for HTTP clients
docker run -p 3000:3000 -e MCP_TRANSPORT_TYPE=SSE -v mcp-workflow-data:/app/data hiveacademy/anubis

# Streamable HTTP - for web applications
docker run -p 3000:3000 -e MCP_TRANSPORT_TYPE=STREAMABLE_HTTP -v mcp-workflow-data:/app/data hiveacademy/anubis
```

### Test Database Types

```bash
# SQLite (default)
docker run -v mcp-workflow-data:/app/data hiveacademy/anubis

# PostgreSQL
docker run \
  -e DATABASE_URL="postgresql://user:pass@host:5432/db" \
  hiveacademy/anubis

# MySQL
docker run \
  -e DATABASE_URL="mysql://user:pass@host:3306/db" \
  hiveacademy/anubis
```

### MCP Client Configuration

#### Claude Desktop

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

#### For HTTP/SSE Transport

```json
{
  "mcpServers": {
    "anubis": {
      "transport": {
        "type": "sse",
        "url": "http://localhost:3000/sse"
      }
    }
  }
}
```

First start the container:

```bash
docker run -p 3000:3000 -e MCP_TRANSPORT_TYPE=SSE -v mcp-workflow-data:/app/data hiveacademy/anubis
```

## 📋 Production Deployment

### Docker Compose for Production

```yaml
version: '3.8'
services:
  mcp-workflow:
    image: hiveacademy/anubis:latest
    ports:
      - '3000:3000'
    environment:
      - DATABASE_URL=postgresql://workflow:secure_password@postgres:5432/workflow_db
      - MCP_SERVER_NAME=Production-anubis
      - MCP_TRANSPORT_TYPE=SSE
      - NODE_ENV=production
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped
    volumes:
      - mcp-logs:/app/logs

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=workflow_db
      - POSTGRES_USER=workflow
      - POSTGRES_PASSWORD=secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U workflow -d workflow_db']
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  mcp-logs:
```

### Environment Configuration

Create a `.env` file:

```bash
# Copy the example
cp docker.env.example .env

# Edit for your environment
# Set your database URL, transport type, etc.
```

## 🌟 Marketing Your MCP Server

### 1. Submit to MCP Community Lists

- **[Awesome MCP Servers](https://github.com/punkpeye/awesome-mcp-servers)** - Submit a PR
- **[MCP Servers Hub](https://mcpservers.com)** - Add your server
- **[r/mcp](https://reddit.com/r/mcp)** - Announce your server

### 2. Add MCP Badge to README

```markdown
[![MCP Server](https://img.shields.io/badge/MCP-Server-blue?style=for-the-badge&logo=docker)](https://hub.docker.com/r/hiveacademy/anubis)
[![Docker Pulls](https://img.shields.io/docker/pulls/hiveacademy/anubis)](https://hub.docker.com/r/hiveacademy/anubis)
```

## 📈 Success Metrics

After publication, monitor:

- **Docker pulls**: Track adoption at [hub.docker.com/r/hiveacademy/anubis](https://hub.docker.com/r/hiveacademy/anubis)
- **GitHub stars**: Community validation
- **Issue reports**: User engagement
- **MCP community mentions**: Ecosystem adoption

## 🚨 Troubleshooting

### Build Issues

```bash
# Clear Docker cache
docker buildx prune -f

# Reset builder
docker buildx rm mcp-builder
docker buildx create --name mcp-builder --use --bootstrap
```

### Database Issues

```bash
# Check database initialization logs
docker logs <container-id>

# Manual migration (if needed)
docker exec -it <container-id> npx prisma migrate deploy
```

### Transport Issues

```bash
# Test STDIO transport
echo '{"jsonrpc": "2.0", "method": "ping", "id": 1}' | docker run -i --rm hiveacademy/anubis

# Test HTTP transport
curl -X POST http://localhost:3000/messages \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "method": "ping", "id": 1}'
```

## ✅ Ready to Publish!

Your Anubis is now properly configured for Docker Hub publication with:

✅ **Correct Repository Information**: All references point to Hive-Academy/Workflow_Manager_MCP  
✅ **Multi-Transport Support**: STDIO, SSE, and Streamable HTTP  
✅ **Automatic Database Setup**: Migrations run on container startup  
✅ **Production Ready**: Multi-platform, security scanned, health monitored

**Next Steps:**

1. Run `./scripts/docker-publish.sh`
2. Test with your preferred MCP client
3. Submit to awesome lists
4. Share in communities

The MCP ecosystem awaits your contribution! 🎉
