# Multi-stage build for optimized Docker Hub deployment with BUILD-TIME MIGRATION DEPLOYMENT
FROM node:22-alpine AS builder

# Add metadata labels for Docker Hub
LABEL org.opencontainers.image.title="Anubis"
LABEL org.opencontainers.image.description="🏺 𓂀𓁢𓋹𝔸ℕ𝕌𝔹𝕀𝕊𓋹𓁢𓂀 - Intelligent Guidance for AI Workflows | MCP-compliant workflow intelligence system with embedded, context-aware guidance for reliable AI-assisted development"
LABEL org.opencontainers.image.version="1.2.1"
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

# STRATEGIC: Compile seed script for production use (ts-node not available in production)
# Create a Docker-specific version of the seed script with correct import paths
RUN sed 's|from '\''../generated/prisma'\''|from '\''/app/generated/prisma'\''|g' scripts/prisma-seed.ts > scripts/prisma-seed-docker.ts && \
    npx tsc scripts/prisma-seed-docker.ts --outDir dist/scripts --moduleResolution node --target es2020 --module commonjs --esModuleInterop true --allowSyntheticDefaultImports true --strict false && \
    mv dist/scripts/prisma-seed-docker.js dist/scripts/prisma-seed.js

# Create necessary directories for reports
RUN mkdir -p temp/reports temp/rendered-reports templates/reports

# ================================================================================================
# BUILD-TIME MIGRATION AND SEEDING DEPLOYMENT STAGE - Strategic UX Enhancement
# Deploy migrations and seed data during image build for instant container startup
# ================================================================================================
FROM builder AS migration-deployer

# Create build-time database directory
RUN mkdir -p ./build-time-db

# Set build-time database configuration for migration deployment
ENV DATABASE_URL="file:./build-time-db/workflow.db"

# STRATEGIC BUILD-TIME MIGRATION AND SEEDING DEPLOYMENT
# Deploy all migrations and seed essential workflow data during build
RUN echo "🔧 DEPLOYING MIGRATIONS AND SEEDING DATA AT BUILD-TIME for instant startup UX..." && \
    npx prisma migrate deploy --schema=./prisma/schema.prisma && \
    echo "✅ BUILD-TIME MIGRATION DEPLOYMENT SUCCESSFUL" && \
    echo "🌱 BUILD-TIME DATABASE SEEDING..." && \
    node dist/scripts/prisma-seed.js && \
    echo "✅ BUILD-TIME DATABASE SEEDING SUCCESSFUL" && \
    ls -la ./build-time-db/ && \
    npx prisma db pull --schema=./prisma/schema.prisma --print && \
    echo "📊 Migration deployment and seeding verification complete"

# ================================================================================================
# Production stage with PRE-DEPLOYED migrations for INSTANT STARTUP
# ================================================================================================
FROM node:22-alpine AS production

# Add same metadata to final image
LABEL org.opencontainers.image.title="Anubis"
LABEL org.opencontainers.image.description="🏺 Anubis - Intelligent Guidance for AI Workflows | MCP-compliant workflow intelligence system with embedded, context-aware guidance for reliable AI-assisted development"
LABEL org.opencontainers.image.version="1.2.1"
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
# NOTE: Unlike npm package, Docker includes full generated client for immediate runtime availability
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/prisma/schema.prisma ./prisma/schema.prisma
COPY --from=builder --chown=nestjs:nodejs /app/prisma/onboarding-models.prisma ./prisma/onboarding-models.prisma
COPY --from=builder --chown=nestjs:nodejs /app/prisma/rule-models.prisma ./prisma/rule-models.prisma
COPY --from=builder --chown=nestjs:nodejs /app/prisma/task-models.prisma ./prisma/task-models.prisma
COPY --from=builder --chown=nestjs:nodejs /app/prisma/workflow-enums.prisma ./prisma/workflow-enums.prisma
# STRATEGIC: Migrations folder REQUIRED for verification commands (migrate status, etc.)
# Even with build-time deployment, runtime verification compares deployed vs migration files
COPY --from=builder --chown=nestjs:nodejs /app/prisma/migrations ./prisma/migrations
COPY --from=builder --chown=nestjs:nodejs /app/generated ./generated

# Copy essential workflow rules data for seeding
COPY --from=builder --chown=nestjs:nodejs /app/enhanced-workflow-rules ./enhanced-workflow-rules

# STRATEGIC ENHANCEMENT: Copy pre-deployed migration validation data from migration-deployer stage
# This enables instant startup verification without migration deployment delay
COPY --from=migration-deployer --chown=nestjs:nodejs /app/build-time-db ./build-time-db

# Copy report directories from builder stage
COPY --from=builder --chown=nestjs:nodejs /app/temp ./temp
COPY --from=builder --chown=nestjs:nodejs /app/templates ./templates

# Copy documentation
COPY --chown=nestjs:nodejs README.md ./

# Create data directory for SQLite with proper permissions
RUN mkdir -p /app/data && chown -R nestjs:nodejs /app/data

# Create the actual report directory structure where reports are generated
RUN mkdir -p /app/data/anubis-reports/temp \
    && chown -R nestjs:nodejs /app/data/anubis-reports

# Create the reports directory that ReportRenderingService expects
RUN mkdir -p /app/reports/rendered \
    && chown -R nestjs:nodejs /app/reports

# Ensure temp and templates directories exist with proper permissions (for other functionality)
RUN chown -R nestjs:nodejs /app/temp /app/templates

# Create startup script to initialize database if needed
RUN echo '#!/bin/bash' > /app/init-db.sh && \
    echo 'set -e' >> /app/init-db.sh && \
    echo 'echo "🔍 Checking database initialization..."' >> /app/init-db.sh && \
    echo 'if [ ! -f "/app/data/workflow.db" ] || [ ! -s "/app/data/workflow.db" ]; then' >> /app/init-db.sh && \
    echo '  echo "📋 Database not found or empty, initializing from build-time template..."' >> /app/init-db.sh && \
    echo '  if [ -f "/app/build-time-db/workflow.db" ]; then' >> /app/init-db.sh && \
    echo '    cp /app/build-time-db/workflow.db /app/data/workflow.db' >> /app/init-db.sh && \
    echo '    echo "✅ Database initialized from build-time template"' >> /app/init-db.sh && \
    echo '  else' >> /app/init-db.sh && \
    echo '    echo "⚠️  Build-time database not found, running migrations..."' >> /app/init-db.sh && \
    echo '    npx prisma migrate deploy' >> /app/init-db.sh && \
    echo '    echo "🌱 Running database seeding..."' >> /app/init-db.sh && \
    echo '    node dist/scripts/prisma-seed.js' >> /app/init-db.sh && \
    echo '    echo "✅ Database migrations and seeding completed"' >> /app/init-db.sh && \
    echo '  fi' >> /app/init-db.sh && \
    echo 'else' >> /app/init-db.sh && \
    echo '  echo "✅ Database already exists and populated"' >> /app/init-db.sh && \
    echo 'fi' >> /app/init-db.sh && \
    echo 'echo "🚀 Starting Anubis MCP Server..."' >> /app/init-db.sh && \
    echo 'exec "$@"' >> /app/init-db.sh && \
    chmod +x /app/init-db.sh && \
    chown nestjs:nodejs /app/init-db.sh

# Set default environment variables with unified database configuration
ENV RUNNING_IN_DOCKER="true"
ENV MCP_SERVER_NAME="Anubis"
ENV MCP_SERVER_VERSION="1.2.1"
ENV MCP_TRANSPORT_TYPE="STDIO"
ENV NODE_ENV="production"
ENV PORT="3000"
ENV DATABASE_URL="file:/app/data/workflow.db"

# STRATEGIC UX ENHANCEMENT: Mark image as having pre-deployed migrations
ENV MIGRATIONS_PRE_DEPLOYED="true"
ENV BUILD_TIME_MIGRATION_DEPLOYED="true"
ENV BUILD_TIME_SEEDING_DEPLOYED="true"

# Switch to non-root user
USER nestjs

# Expose port for HTTP/SSE transport (only used when MCP_TRANSPORT_TYPE is not STDIO)
EXPOSE 3000

# Add health check for container monitoring (simplified for MCP usage)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD if [ "$MCP_TRANSPORT_TYPE" = "STDIO" ]; then exit 0; else curl -f http://localhost:$PORT/health || exit 1; fi

# STRATEGIC ENHANCEMENT: Use initialization script to ensure database is properly set up
ENTRYPOINT ["/app/init-db.sh"]
CMD ["node", "dist/main.js"]