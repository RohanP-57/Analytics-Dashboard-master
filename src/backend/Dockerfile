# Multi-stage build: First build the React frontend
FROM node:18-alpine as frontend-build

WORKDIR /app/frontend

# Copy frontend package files
COPY ../frontend/package*.json ./

# Install frontend dependencies
RUN npm ci --only=production

# Copy frontend source
COPY ../frontend/ ./

# Build React app
RUN npm run build

# Backend stage
FROM node:18-alpine

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies and rebuild native modules
RUN npm ci --only=production && npm rebuild && npm cache clean --force

# Copy only necessary source files
COPY server.js ./
COPY routes/ ./routes/
COPY utils/ ./utils/
COPY models/ ./models/
COPY middleware/ ./middleware/
COPY validations/ ./validations/

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