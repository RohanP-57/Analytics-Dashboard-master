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

# Create necessary directories
RUN mkdir -p uploads data

# Remove build dependencies to reduce image size
RUN apk del python3 make g++

# Set proper permissions
RUN chown -R node:node /app
USER node

EXPOSE 5000

CMD ["node", "server.js"]