#!/bin/bash

# HRMS API Deployment Script
echo "🚀 HRMS API Deployment Setup"
echo "================================"

# Check if we're in the right directory
if [ ! -f "server/server.js" ]; then
    echo "❌ Error: server/server.js not found. Please run this from the HRMS root directory."
    exit 1
fi

echo "✅ Found server/server.js"

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found. Creating from template..."
    cp .env.example .env
    echo "📝 Please edit .env with your actual values before deploying!"
    echo "   Required: DATABASE_URL, JWT_SECRET, FRONTEND_URL"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Test the server locally
echo "🧪 Testing server locally..."
if node server/server.js &
then
    SERVER_PID=$!
    sleep 3
    
    # Test health endpoint
    if curl -s http://localhost:3000/test-db > /dev/null; then
        echo "✅ Server is running correctly!"
        kill $SERVER_PID
    else
        echo "❌ Server health check failed. Check your database connection."
        kill $SERVER_PID
        exit 1
    fi
else
    echo "❌ Failed to start server. Check your configuration."
    exit 1
fi

echo ""
echo "🎉 Setup complete! Ready for deployment."
echo ""
echo "Next steps:"
echo "1. Edit .env with your actual database and secrets"
echo "2. Choose a deployment platform:"
echo "   • Vercel: npm i -g vercel && vercel"
echo "   • Railway: Connect GitHub at railway.app"
echo "   • Render: Connect repository at render.com"
echo ""
echo "📖 See API_DEPLOYMENT_GUIDE.md for detailed instructions"
