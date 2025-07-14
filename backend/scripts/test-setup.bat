@echo off
REM Test Setup Script for RevEd Kids Backend (Windows)
REM This script helps set up the test environment

echo 🔧 Setting up test environment for RevEd Kids Backend...

REM Check if PostgreSQL is running (basic check)
netstat -an | findstr ":5432" >nul
if errorlevel 1 (
    echo ❌ PostgreSQL might not be running. Please start PostgreSQL first.
    pause
    exit /b 1
)

REM Create test database if it doesn't exist
echo 📦 Creating test database...
psql -h localhost -U postgres -c "CREATE DATABASE reved_kids_test;" 2>nul
if errorlevel 1 (
    echo Database already exists or error occurred
)

echo ✅ Test environment setup complete!
echo.
echo 📋 Next steps:
echo 1. Run: npm test
echo 2. Or run specific tests: npm test -- --testNamePattern="memory game"
echo.
echo 🔍 Troubleshooting:
echo - Make sure PostgreSQL is running on localhost:5432
echo - Ensure postgres user has password 'password' or update test.env
echo - Check that all required packages are installed: npm install
pause 