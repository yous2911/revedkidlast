#!/bin/bash

# RevEd Kids Backend Setup Script
# This script helps you quickly set up the backend environment

set -e

echo "🚀 RevEd Kids Backend Setup"
echo "=========================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL is not installed. Please install PostgreSQL 12+ first."
    echo "   You can continue with the setup, but you'll need to install PostgreSQL later."
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "⚙️  Creating .env file from template..."
    cp env.example .env
    echo "✅ .env file created. Please edit it with your actual values."
else
    echo "✅ .env file already exists."
fi

# Check if database exists
if command -v psql &> /dev/null; then
    echo "🗄️  Checking database connection..."
    if psql -h localhost -U postgres -lqt | cut -d \| -f 1 | grep -qw reved_kids; then
        echo "✅ Database 'reved_kids' already exists."
    else
        echo "📊 Creating database 'reved_kids'..."
        createdb -U postgres reved_kids
        echo "✅ Database created successfully."
    fi
else
    echo "⚠️  Please create the database manually:"
    echo "   createdb -U postgres reved_kids"
fi

# Check if Redis is running (optional)
if command -v redis-cli &> /dev/null; then
    if redis-cli ping &> /dev/null; then
        echo "✅ Redis is running."
    else
        echo "⚠️  Redis is not running. You can start it with: redis-server"
    fi
else
    echo "ℹ️  Redis is not installed. Caching will use fallback memory cache."
fi

echo ""
echo "🎉 Setup completed!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your actual values"
echo "2. Start the development server: npm run dev"
echo "3. Check the API: http://localhost:3000"
echo "4. View monitoring: http://localhost:3000/api/monitoring/health"
echo ""
echo "📚 For more information, see README.md" 