FROM node:18-alpine

WORKDIR /app

# Copy backend package files first for better caching
COPY src/backend/package*.json ./

# Install dependencies
RUN npm install --production

# Copy backend source files
COPY src/backend/ .

# Create necessary directories
RUN mkdir -p uploads data

# Expose port (Railway will map this to PORT environment variable)
EXPOSE 5000

# Start the application
CMD ["node", "server.js"]