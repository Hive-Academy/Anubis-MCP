# Multi-stage build for optimized Docker Hub deployment
FROM node:22-alpine AS builder

# Add metadata labels for Docker Hub
LABEL org.opencontainers.image.title="Anubis"
LABEL org.opencontainers.image.description="🏺 𓂀𓁢𓋹𝔸ℕ𝕌𝔹𝕀𝕊𓋹𓁢𓂀 - Intelligent Guidance for AI Workflows | MCP-compliant workflow intelligence system with embedded, context-aware guidance for reliable AI-assisted development"
LABEL org.opencontainers.image.version="1.2.12"
LABEL org.opencontainers.image.authors="Hive Academy <abdallah@nghive.tech>"
LABEL org.opencontainers.image.source="https://github.com/Hive-Academy/Anubis-MCP"
LABEL org.opencontainers.image.documentation="https://github.com/Hive-Academy/Anubis-MCP/blob/main/README.md"
LABEL org.opencontainers.image.licenses="MIT"

# Set working directory
WORKDIR /app

# Copy package files and install all dependencies (including dev) for build
COPY package*.json ./
RUN npm ci --ignore-scripts && npm cache clean --force

# Copy source code and Prisma schema
COPY . .

# Generate Prisma client and build TypeScript
RUN npx prisma generate
RUN npm run build

# Compile seed script for production use (ts-node not available in production)
RUN echo "🔧 Creating Docker-compatible seed script..." && \
    sed 's|from '\''../generated/prisma'\''|from '\''/app/generated/prisma'\''|g' scripts/prisma-seed.ts > scripts/prisma-seed-docker.ts && \
    echo "🔧 Compiling seed script..." && \
    npx tsc scripts/prisma-seed-docker.ts --outDir dist/scripts --moduleResolution node --target es2020 --module commonjs --esModuleInterop true --allowSyntheticDefaultImports true --strict false --skipLibCheck && \
    mv dist/scripts/prisma-seed-docker.js dist/scripts/prisma-seed.js && \
    echo "✅ Docker seed script compiled successfully"

# Create necessary directories for reports
RUN mkdir -p temp/reports temp/rendered-reports templates/reports

# ================================================================================================
# Production stage - Runtime database initialization
# ================================================================================================
FROM node:22-alpine AS production

# Add same metadata to final image
LABEL org.opencontainers.image.title="Anubis"
LABEL org.opencontainers.image.description="🏺 Anubis - Intelligent Guidance for AI Workflows | MCP-compliant workflow intelligence system with embedded, context-aware guidance for reliable AI-assisted development"
LABEL org.opencontainers.image.version="1.2.12"
LABEL org.opencontainers.image.authors="Hive Academy <abdallah@nghive.tech>"
LABEL org.opencontainers.image.source="https://github.com/Hive-Academy/Anubis-MCP"
LABEL org.opencontainers.image.documentation="https://github.com/Hive-Academy/Anubis-MCP/blob/main/README.md"
LABEL org.opencontainers.image.licenses="MIT"

# Install system dependencies: dumb-init for proper signal handling, curl for health checks, bash for entrypoint script
RUN apk add --no-cache \
    dumb-init \
    curl \
    bash \
    && rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

# Set working directory
WORKDIR /app

# Copy package files and install production dependencies only (without running postinstall)
COPY package*.json ./
RUN npm ci --only=production --ignore-scripts && npm cache clean --force

# Fix ownership of node_modules for the nestjs user
RUN chown -R nestjs:nodejs /app/node_modules

# Copy built application and generated Prisma client from builder stage
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nestjs:nodejs /app/generated ./generated

# Copy essential workflow rules .anubis for seeding
COPY --from=builder --chown=nestjs:nodejs /app/enhanced-workflow-rules ./enhanced-workflow-rules

# Copy report directories from builder stage
COPY --from=builder --chown=nestjs:nodejs /app/temp ./temp
COPY --from=builder --chown=nestjs:nodejs /app/templates ./templates

# Copy documentation
COPY --chown=nestjs:nodejs README.md ./

# Create .anubis directory for SQLite with proper permissions
RUN mkdir -p /app/.anubis && chown -R nestjs:nodejs /app/.anubis

# Create the actual report directory structure where reports are generated
RUN mkdir -p /app/anubis-reports/temp \
    && chown -R nestjs:nodejs /app/anubis-reports

# Create the reports directory that ReportRenderingService expects
RUN mkdir -p /app/reports/rendered \
    && chown -R nestjs:nodejs /app/reports

# Create workspace directory for init rules output (mounted from host)
RUN mkdir -p /app/workspace \
    && chown -R nestjs:nodejs /app/workspace

# Ensure temp and templates directories exist with proper permissions
RUN chown -R nestjs:nodejs /app/temp /app/templates

# Create startup script for runtime database initialization
RUN echo '#!/bin/bash' > /app/init-db.sh && \
    echo 'set -e' >> /app/init-db.sh && \
    echo 'echo "🔍 Checking database initialization..."' >> /app/init-db.sh && \
    echo 'if [ ! -f "/app/.anubis/workflow.db" ] || [ ! -s "/app/.anubis/workflow.db" ]; then' >> /app/init-db.sh && \
    echo '  echo "📋 Database not found or empty, deploying migrations..."' >> /app/init-db.sh && \
    echo '  npx prisma migrate deploy --schema=./prisma/schema.prisma' >> /app/init-db.sh && \
    echo '  echo "✅ Migrations deployed successfully"' >> /app/init-db.sh && \
    echo '  echo "🌱 Running database seeding..."' >> /app/init-db.sh && \
    echo '  node dist/scripts/prisma-seed.js' >> /app/init-db.sh && \
    echo '  echo "✅ Database initialization completed"' >> /app/init-db.sh && \
    echo 'else' >> /app/init-db.sh && \
    echo '  echo "✅ Database already exists and populated"' >> /app/init-db.sh && \
    echo 'fi' >> /app/init-db.sh && \
    echo 'echo "🚀 Starting Anubis MCP Server..."' >> /app/init-db.sh && \
    echo 'exec "$@"' >> /app/init-db.sh && \
    chmod +x /app/init-db.sh && \
    chown nestjs:nodejs /app/init-db.sh

# Set default environment variables
ENV RUNNING_IN_DOCKER="true"
ENV MCP_SERVER_NAME="Anubis"
ENV MCP_SERVER_VERSION="1.2.12"
ENV MCP_TRANSPORT_TYPE="STDIO"
ENV NODE_ENV="production"
ENV PORT="3000"
ENV DATABASE_URL="file:/app/.anubis/workflow.db"

# Switch to non-root user
USER nestjs

# Expose port for HTTP/SSE transport (only used when MCP_TRANSPORT_TYPE is not STDIO)
EXPOSE 3000

# Add health check for container monitoring (simplified for MCP usage)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD if [ "$MCP_TRANSPORT_TYPE" = "STDIO" ]; then exit 0; else curl -f http://localhost:$PORT/health || exit 1; fi

# Use initialization script to ensure database is properly set up at runtime
ENTRYPOINT ["/app/init-db.sh"]
CMD ["node", "dist/main.js"]