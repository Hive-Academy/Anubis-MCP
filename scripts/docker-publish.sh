#!/bin/bash

# Docker Hub Publication Script for Anubis
# This script builds and publishes multi-platform Docker images

set -e # Exit on any error

# Configuration
DOCKER_HUB_USERNAME="${DOCKER_HUB_USERNAME:-hiveacademy}"
IMAGE_NAME="anubis"
FULL_IMAGE_NAME="${DOCKER_HUB_USERNAME}/${IMAGE_NAME}"

# Version management
VERSION="${1:-latest}"
if [ "$VERSION" = "latest" ]; then
    # Generate version from package.json
    VERSION=$(node -p "require('./package.json').version")
fi

echo "🚀 Building and publishing Anubis"
echo "📦 Image: ${FULL_IMAGE_NAME}"
echo "🏷️  Version: ${VERSION}"
echo ""

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if logged in to Docker Hub
if ! docker info | grep -q "Username:"; then
    echo "🔐 Please log in to Docker Hub first:"
    echo "   docker login"
    exit 1
fi

# Create builder for multi-platform builds
echo "🔧 Setting up multi-platform builder..."
docker buildx create --name mcp-builder --use --bootstrap 2>/dev/null || true
docker buildx use mcp-builder

echo "📋 Building multi-platform image..."
docker buildx build \
    --platform linux/amd64,linux/arm64 \
    --tag "${FULL_IMAGE_NAME}:${VERSION}" \
    --tag "${FULL_IMAGE_NAME}:latest" \
    --push \
    .

echo ""
echo "✅ Successfully published to Docker Hub!"
echo ""
echo "📄 Update your MCP client configuration:"
echo ""
echo "Claude Desktop:"
echo '{'
echo '  "mcpServers": {'
echo '    "anubis": {'
echo '      "command": "docker",'
echo '      "args": ["run", "--rm", "-i", "-v", "mcp-workflow-data:/app/data", "'${FULL_IMAGE_NAME}'"]'
echo '    }'
echo '  }'
echo '}'
echo ""
echo "Docker Run:"
echo "docker run -p 3000:3000 -v mcp-workflow-data:/app/data ${FULL_IMAGE_NAME}"
echo ""
echo "🌐 View on Docker Hub: https://hub.docker.com/r/${DOCKER_HUB_USERNAME}/${IMAGE_NAME}"

# Optional: Run image scan if available
if command -v docker scout >/dev/null 2>&1; then
    echo ""
    echo "🔍 Running security scan..."
    docker scout cves "${FULL_IMAGE_NAME}:${VERSION}" || echo "⚠️  Scout scan failed or not available"
fi

echo ""
echo "🎉 Publication complete!"
