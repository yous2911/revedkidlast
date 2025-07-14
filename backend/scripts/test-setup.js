#!/usr/bin/env node

/**
 * Test Setup Script for RevEd Kids Backend
 * This script helps set up the test environment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up test environment for RevEd Kids Backend...');

// Check if test.env exists
const testEnvPath = path.join(__dirname, '..', 'test.env');
if (!fs.existsSync(testEnvPath)) {
  console.log('📝 Creating test.env file...');
  const testEnvContent = `# Test Environment Configuration for RevEd Kids Backend
# This file contains test-specific environment variables

# Application
NODE_ENV=test
PORT=3001

# Test Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=reved_kids_test

# JWT Configuration for Tests
JWT_SECRET=test_jwt_secret_key_for_testing_only_32_chars_min

# Redis Configuration for Tests (Optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_URL=redis://localhost:6379

# Test Settings
LOG_LEVEL=error
ENABLE_REQUEST_LOGGING=false
DB_SYNC=true
DB_FORCE_SYNC=true
ENABLE_CORS=true

# Security Settings for Tests
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
RATE_LIMIT_AUTH_MAX=100

# Performance Settings for Tests
CACHE_TTL_SECONDS=60
MAX_REQUEST_SIZE=10mb
`;
  fs.writeFileSync(testEnvPath, testEnvContent);
  console.log('✅ test.env file created');
}

// Check if PostgreSQL is running (basic check)
try {
  execSync('pg_isready -h localhost -p 5432', { stdio: 'ignore' });
  console.log('✅ PostgreSQL is running');
} catch (error) {
  console.log('⚠️  PostgreSQL might not be running. Please start PostgreSQL first.');
  console.log('   You can still run tests, but they might fail if the database is not accessible.');
}

// Try to create test database
try {
  execSync('psql -h localhost -U postgres -c "CREATE DATABASE reved_kids_test;"', { 
    stdio: 'ignore',
    env: { ...process.env, PGPASSWORD: 'password' }
  });
  console.log('✅ Test database created or already exists');
} catch (error) {
  console.log('⚠️  Could not create test database. This might be normal if it already exists.');
  console.log('   Make sure PostgreSQL is running and accessible.');
}

console.log('');
console.log('✅ Test environment setup complete!');
console.log('');
console.log('📋 Next steps:');
console.log('1. Run: npm test');
console.log('2. Or run specific tests: npm run test:memory');
console.log('3. Or run unit tests: npm run test:unit');
console.log('4. Or run integration tests: npm run test:integration');
console.log('');
console.log('🔍 Troubleshooting:');
console.log('- Make sure PostgreSQL is running on localhost:5432');
console.log('- Ensure postgres user has password "password" or update test.env');
console.log('- Check that all required packages are installed: npm install');
console.log('- If tests fail, try: npm run test:setup'); 