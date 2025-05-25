# Multi-stage build for optimized Docker Hub deployment
FROM node:22-alpine AS builder

# Add metadata labels for Docker Hub
LABEL org.opencontainers.image.title="MCP Workflow Manager"
LABEL org.opencontainers.image.description="A comprehensive Model Context Protocol server for AI workflow automation and task management"
LABEL org.opencontainers.image.version="1.0.0"
LABEL org.opencontainers.image.authors="Hive Academy <abdallah@nghive.tech>"
LABEL org.opencontainers.image.source="https://github.com/Hive-Academy/Workflow_Manager_MCP"
LABEL org.opencontainers.image.documentation="https://github.com/Hive-Academy/Workflow_Manager_MCP/blob/main/README.md"
LABEL org.opencontainers.image.licenses="MIT"

# Install system dependencies for Playwright in builder stage
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    && rm -rf /var/cache/apk/*

# Tell Playwright to use installed Chromium
ENV PLAYWRIGHT_BROWSERS_PATH=0
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Set working directory
WORKDIR /app

# Copy package files and install all dependencies (including dev) for build
COPY package*.json ./
RUN npm ci --ignore-scripts && npm cache clean --force

# Install Playwright browsers (this will use the system chromium we installed)
RUN npx playwright install chromium --with-deps || true

# Copy source code and Prisma schema
COPY . .

# Generate Prisma client and build TypeScript
RUN npx prisma generate
RUN npm run build

# Create necessary directories for reports
RUN mkdir -p temp/reports temp/rendered-reports templates/reports

# Production stage
FROM node:22-alpine AS production

# Add same metadata to final image
LABEL org.opencontainers.image.title="MCP Workflow Manager"
LABEL org.opencontainers.image.description="A comprehensive Model Context Protocol server for AI workflow automation and task management"
LABEL org.opencontainers.image.version="1.0.0"
LABEL org.opencontainers.image.authors="Hive Academy <abdallah@nghive.tech>"
LABEL org.opencontainers.image.source="https://github.com/Hive-Academy/Workflow_Manager_MCP"
LABEL org.opencontainers.image.documentation="https://github.com/Hive-Academy/Workflow_Manager_MCP/blob/main/README.md"
LABEL org.opencontainers.image.licenses="MIT"

# Install system dependencies: dumb-init for proper signal handling, curl for health checks, bash for entrypoint script
# Also install Playwright dependencies for production
RUN apk add --no-cache \
    dumb-init \
    curl \
    bash \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    && rm -rf /var/cache/apk/*

# Set Playwright environment variables for production
ENV PLAYWRIGHT_BROWSERS_PATH=0
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

# Set working directory
WORKDIR /app

# Copy package files and install production dependencies only (without running postinstall)
COPY package*.json ./
RUN npm ci --only=production --ignore-scripts && npm cache clean --force

# Install Playwright for production runtime
RUN npx playwright install chromium --with-deps || true

# Fix ownership of node_modules for the nestjs user
RUN chown -R nestjs:nodejs /app/node_modules

# Copy built application and generated Prisma client from builder stage
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nestjs:nodejs /app/generated ./generated

# Copy report directories from builder stage
COPY --from=builder --chown=nestjs:nodejs /app/temp ./temp
COPY --from=builder --chown=nestjs:nodejs /app/templates ./templates

# Copy scripts and make them executable
COPY --chown=nestjs:nodejs scripts/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Copy documentation
COPY --chown=nestjs:nodejs README.md ./

# Create data directory for SQLite with proper permissions
RUN mkdir -p /app/data && chown -R nestjs:nodejs /app/data

# Ensure report directories exist with proper permissions
RUN mkdir -p /app/temp/reports /app/temp/rendered-reports /app/templates/reports \
    && chown -R nestjs:nodejs /app/temp /app/templates

# Set default environment variables
ENV DATABASE_URL="file:./data/workflow.db"
ENV MCP_SERVER_NAME="MCP-Workflow-Manager"
ENV MCP_SERVER_VERSION="1.0.0"
ENV MCP_TRANSPORT_TYPE="STDIO"
ENV NODE_ENV="production"
ENV PORT="3000"

# Switch to non-root user
USER nestjs

# Expose port for HTTP/SSE transport (only used when MCP_TRANSPORT_TYPE is not STDIO)
EXPOSE 3000

# Add health check for container monitoring
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD if [ "$MCP_TRANSPORT_TYPE" = "STDIO" ]; then exit 0; else curl -f http://localhost:$PORT/health || exit 1; fi

# Use entrypoint script for initialization
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

# Start the MCP server
CMD ["node", "dist/main.js"]