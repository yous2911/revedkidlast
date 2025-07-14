#!/bin/bash

# Test Setup Script for RevEd Kids Backend
# This script helps set up the test environment

echo "🔧 Setting up test environment for RevEd Kids Backend..."

# Check if PostgreSQL is running
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "❌ PostgreSQL is not running. Please start PostgreSQL first."
    exit 1
fi

# Create test database if it doesn't exist
echo "📦 Creating test database..."
psql -h localhost -U postgres -c "CREATE DATABASE reved_kids_test;" 2>/dev/null || echo "Database already exists or error occurred"

echo "✅ Test environment setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Run: npm test"
echo "2. Or run specific tests: npm test -- --testNamePattern='memory game'"
echo ""
echo "🔍 Troubleshooting:"
echo "- Make sure PostgreSQL is running on localhost:5432"
echo "- Ensure postgres user has password 'password' or update test.env"
echo "- Check that all required packages are installed: npm install" 