# Simplified Railway deployment - Frontend Build Stage
FROM node:18-alpine AS frontend-build

WORKDIR /app

# Copy frontend files
COPY src/frontend/package*.json ./
COPY src/frontend/ .

# Install and build with minimal complexity
RUN npm install --legacy-peer-deps --no-optional
RUN npm run build

# Verify build succeeded
RUN ls -la build/ && test -f build/index.html

# Backend Production Stage
FROM node:18-alpine AS production

# Install essential system dependencies
RUN apk add --no-cache sqlite curl

WORKDIR /app

# Copy backend files
COPY src/backend/package*.json ./
COPY src/backend/ .

# Install backend dependencies
RUN npm install --production

# Copy built frontend from previous stage
COPY --from=frontend-build /app/build ./public

# Copy video file from frontend public folder to backend public folder
COPY --from=frontend-build /app/public/login_video.mp4 ./public/login_video.mp4

# Verify video file was copied correctly
RUN ls -la ./public/login_video.mp4 && echo "Video file size:" && du -h ./public/login_video.mp4

# Create directories
RUN mkdir -p uploads data logs

# Set environment
ENV NODE_ENV=production
ENV PORT=8080

# Expose port
EXPOSE 8080

# Simple startup - no complex scripts
CMD ["node", "server.js"]