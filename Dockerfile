# Multi-stage build for Railway deployment
FROM node:18-alpine AS frontend-build

WORKDIR /app

# Copy frontend package files and package-lock.json if it exists
COPY src/frontend/package*.json ./

# Clear npm cache and use a more stable approach
RUN npm cache clean --force

# Use npm ci if package-lock exists, otherwise install with specific fixes
RUN if [ -f package-lock.json ]; then \
      npm ci --legacy-peer-deps; \
    else \
      npm install --legacy-peer-deps; \
    fi

# Fix the ajv/ajv-keywords compatibility issue specifically
RUN npm install ajv@^8.12.0 ajv-keywords@^5.1.0 --legacy-peer-deps --save-dev

# Copy frontend source
COPY src/frontend/ .

# Set environment variables to reduce build issues
ENV GENERATE_SOURCEMAP=false
ENV CI=false
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Build the React app for production
RUN npm run build

# List build output for debugging
RUN ls -la build/

# Backend stage  
FROM node:18-alpine AS production

# Install system dependencies for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    sqlite \
    curl

WORKDIR /app

# Copy backend package files
COPY src/backend/package*.json ./

# Install backend dependencies with verbose logging
RUN npm install --production --verbose

# Copy backend source files
COPY src/backend/ .

# Copy built frontend from previous stage
COPY --from=frontend-build /app/build ./public

# Verify frontend files were copied
RUN ls -la public/

# Create necessary directories with proper permissions
RUN mkdir -p uploads data logs
RUN chmod 755 uploads data logs

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Expose port (Railway uses 8080)
EXPOSE 8080

# Add a simple health check script
RUN echo '#!/bin/sh\ncurl -f http://localhost:$PORT/api/health || exit 1' > /app/healthcheck.sh
RUN chmod +x /app/healthcheck.sh

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD /app/healthcheck.sh

# Copy and set up startup script
COPY start.sh ./
RUN chmod +x start.sh

# Start the application with Railway-optimized startup
CMD ["./start.sh"]