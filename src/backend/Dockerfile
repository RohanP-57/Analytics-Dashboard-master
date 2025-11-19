# Multi-stage build: First build the React frontend
FROM node:18-alpine as frontend-build

WORKDIR /app/frontend

# Copy frontend package files
COPY src/frontend/package*.json ./

# Install frontend dependencies (need dev dependencies for build)
RUN npm ci

# Copy frontend source
COPY src/frontend/ ./

# Build React app
RUN npm run build

# Backend stage
FROM node:18-alpine

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY src/backend/package*.json ./

# Install only production dependencies and rebuild native modules
RUN npm ci --only=production && npm rebuild && npm cache clean --force

# Copy only necessary source files
COPY src/backend/server.js ./
COPY src/backend/routes/ ./routes/
COPY src/backend/utils/ ./utils/
COPY src/backend/models/ ./models/
COPY src/backend/middleware/ ./middleware/
COPY src/backend/validations/ ./validations/

# Copy built frontend from previous stage
COPY --from=frontend-build /app/frontend/build ./public

# Create necessary directories
RUN mkdir -p uploads data

# Remove build dependencies to reduce image size
RUN apk del python3 make g++

# Set proper permissions
RUN chown -R node:node /app
USER node

EXPOSE 5000

CMD ["node", "server.js"]