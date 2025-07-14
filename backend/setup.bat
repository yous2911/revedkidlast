@echo off
REM RevEd Kids Backend Setup Script for Windows
REM This script helps you quickly set up the backend environment

echo 🚀 RevEd Kids Backend Setup
echo ==========================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

REM Check Node.js version
for /f "tokens=1,2,3 delims=." %%a in ('node --version') do set NODE_VERSION=%%a
set NODE_VERSION=%NODE_VERSION:~1%
if %NODE_VERSION% LSS 18 (
    echo ❌ Node.js version 18+ is required. Current version: 
    node --version
    pause
    exit /b 1
)

echo ✅ Node.js version: 
node --version

REM Check if PostgreSQL is installed
psql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  PostgreSQL is not installed. Please install PostgreSQL 12+ first.
    echo    You can continue with the setup, but you'll need to install PostgreSQL later.
)

REM Install dependencies
echo 📦 Installing dependencies...
call npm install

REM Create .env file if it doesn't exist
if not exist .env (
    echo ⚙️  Creating .env file from template...
    copy env.example .env
    echo ✅ .env file created. Please edit it with your actual values.
) else (
    echo ✅ .env file already exists.
)

REM Check if database exists
psql --version >nul 2>&1
if %errorlevel% equ 0 (
    echo 🗄️  Checking database connection...
    psql -h localhost -U postgres -lqt | findstr "reved_kids" >nul
    if %errorlevel% equ 0 (
        echo ✅ Database 'reved_kids' already exists.
    ) else (
        echo 📊 Creating database 'reved_kids'...
        createdb -U postgres reved_kids
        if %errorlevel% equ 0 (
            echo ✅ Database created successfully.
        ) else (
            echo ⚠️  Failed to create database. Please create it manually:
            echo    createdb -U postgres reved_kids
        )
    )
) else (
    echo ⚠️  Please create the database manually:
    echo    createdb -U postgres reved_kids
)

REM Check if Redis is running (optional)
redis-cli ping >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Redis is running.
) else (
    echo ℹ️  Redis is not running or not installed. Caching will use fallback memory cache.
)

echo.
echo 🎉 Setup completed!
echo.
echo Next steps:
echo 1. Edit .env file with your actual values
echo 2. Start the development server: npm run dev
echo 3. Check the API: http://localhost:3000
echo 4. View monitoring: http://localhost:3000/api/monitoring/health
echo.
echo 📚 For more information, see README.md
pause 