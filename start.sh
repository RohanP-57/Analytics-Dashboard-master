#!/bin/sh

# Railway startup script for Analytics Dashboard

echo "🚀 Starting Analytics Dashboard on Railway..."
echo "📊 Environment: ${NODE_ENV:-development}"
echo "🔌 Port: ${PORT:-8080}"
echo "🌐 Railway URL: ${RAILWAY_STATIC_URL:-Not set}"

# Set default environment variables if not provided
export NODE_ENV=${NODE_ENV:-production}
export PORT=${PORT:-8080}

# Create necessary directories
mkdir -p uploads data logs

# Set proper permissions
chmod 755 uploads data logs

# Start the application
echo "🎯 Starting server..."
exec node server.js