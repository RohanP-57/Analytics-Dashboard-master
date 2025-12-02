# Multi-stage build for Railway deployment
FROM node:18-alpine AS frontend-build

WORKDIR /app

# Copy frontend package files
COPY src/frontend/package.json ./

# Install frontend dependencies (use npm install to handle version conflicts)
RUN npm install --omit=dev

# Copy frontend source
COPY src/frontend/ .

# Build the React app for production
RUN npm run build

# Backend stage
FROM node:18-alpine AS backend

# Install build dependencies for native modules like sqlite3
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy backend package files
COPY src/backend/package*.json ./

# Install backend dependencies
RUN npm install --production

# Copy backend source files
COPY src/backend/ .

# Copy built frontend from previous stage
COPY --from=frontend-build /app/build ./public

# Create necessary directories with proper permissions
RUN mkdir -p uploads data && chmod 755 uploads data

# Set environment variables
ENV NODE_ENV=production

# Expose port (Railway will map this to PORT environment variable)
EXPOSE 5000

# Health check to ensure the app is running
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 5000) + '/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "server.js"]