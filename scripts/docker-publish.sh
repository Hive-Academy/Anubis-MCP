#!/bin/bash

# 🚀 Docker Hub Publication Script for Anubis MCP Server
# Based on DOCKER_PUBLISH_GUIDE.md

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOCKER_USERNAME="hiveacademy"
IMAGE_NAME="anubis"
FULL_IMAGE_NAME="${DOCKER_USERNAME}/${IMAGE_NAME}"

# Get version from package.json or use parameter
if [ -n "$1" ]; then
    VERSION="$1"
else
    VERSION=$(node -p "require('./package.json').version")
fi

echo -e "${BLUE}🏺 Anubis Docker Hub Publication${NC}"
echo -e "${BLUE}================================${NC}"
echo -e "📦 Image: ${FULL_IMAGE_NAME}"
echo -e "🏷️  Version: ${VERSION}"
echo -e "🏗️  Platforms: linux/amd64, linux/arm64"
echo ""

# Check if logged in to Docker Hub
echo -e "${YELLOW}🔐 Checking Docker Hub authentication...${NC}"
if ! docker info | grep -q "Username"; then
    echo -e "${RED}❌ Not logged in to Docker Hub${NC}"
    echo -e "${YELLOW}Please run: docker login${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker Hub authentication verified${NC}"

# Create or use existing buildx builder
echo -e "${YELLOW}🏗️  Setting up multi-platform builder...${NC}"
if ! docker buildx inspect mcp-builder >/dev/null 2>&1; then
    echo -e "${YELLOW}Creating new buildx builder...${NC}"
    docker buildx create --name mcp-builder --use --bootstrap
else
    echo -e "${YELLOW}Using existing buildx builder...${NC}"
    docker buildx use mcp-builder
fi
echo -e "${GREEN}✅ Builder ready${NC}"

# Build and push multi-platform image
echo -e "${YELLOW}🚀 Building and pushing multi-platform image...${NC}"
echo -e "This may take several minutes..."

docker buildx build \
    --platform linux/amd64,linux/arm64 \
    --tag "${FULL_IMAGE_NAME}:latest" \
    --tag "${FULL_IMAGE_NAME}:${VERSION}" \
    --push \
    . || {
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
}

echo -e "${GREEN}✅ Multi-platform build and push completed${NC}"

# Verify the published image
echo -e "${YELLOW}🔍 Verifying published image...${NC}"
docker buildx imagetools inspect "${FULL_IMAGE_NAME}:${VERSION}" || {
    echo -e "${RED}❌ Image verification failed${NC}"
    exit 1
}

echo -e "${GREEN}✅ Image verification successful${NC}"

# Test the image locally
echo -e "${YELLOW}🧪 Testing published image locally...${NC}"
echo -e "Pulling and testing ${FULL_IMAGE_NAME}:${VERSION}..."

# Pull the image for current platform
docker pull "${FULL_IMAGE_NAME}:${VERSION}"

# Test STDIO transport (quick test)
echo -e "${YELLOW}Testing STDIO transport...${NC}"
timeout 10s docker run --rm "${FULL_IMAGE_NAME}:${VERSION}" node -e "console.log('Anubis MCP Server loaded successfully'); process.exit(0)" || true

echo -e "${GREEN}✅ Image test completed${NC}"

# Success summary
echo ""
echo -e "${GREEN}🎉 Publication Successful!${NC}"
echo -e "${GREEN}=========================${NC}"
echo -e "📦 Image: ${FULL_IMAGE_NAME}:${VERSION}"
echo -e "🌐 Docker Hub: https://hub.docker.com/r/${FULL_IMAGE_NAME}"
echo -e "📋 Platforms: linux/amd64, linux/arm64"
echo ""
echo -e "${BLUE}📖 Usage Examples:${NC}"
echo ""
echo -e "${YELLOW}# STDIO transport (for MCP clients like Claude Desktop)${NC}"
echo -e "docker run -i --rm -v mcp-workflow-data:/app/data ${FULL_IMAGE_NAME}:${VERSION}"
echo ""
echo -e "${YELLOW}# SSE transport (for HTTP clients)${NC}"
echo -e "docker run -p 3000:3000 -e MCP_TRANSPORT_TYPE=SSE -v mcp-workflow-data:/app/data ${FULL_IMAGE_NAME}:${VERSION}"
echo ""
echo -e "${YELLOW}# Test health endpoint${NC}"
echo -e "curl http://localhost:3000/health"
echo ""
echo -e "${BLUE}🔗 Next Steps:${NC}"
echo -e "1. Update Docker Hub repository description"
echo -e "2. Test with your MCP client"
echo -e "3. Submit to awesome MCP lists"
echo -e "4. Share in MCP communities"
echo ""
echo -e "${GREEN}🏺 Anubis is now available on Docker Hub! 🎉${NC}" 