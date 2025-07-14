// Environment setup for tests
import { config } from 'dotenv';
import path from 'path';

// Load test environment variables before any tests run
const testEnvPath = path.resolve(__dirname, '../../test.env');
config({ path: testEnvPath, quiet: true });

// Set test environment
process.env['NODE_ENV'] = 'test';

// Ensure all required environment variables are set for tests
const requiredEnvVars = [
  'DB_HOST',
  'DB_USER', 
  'DB_PASSWORD',
  'DB_NAME',
  'JWT_SECRET'
];

// Set default test values if not provided
const defaultTestValues = {
  DB_HOST: 'localhost',
  DB_PORT: '5432',
  DB_USER: 'postgres',
  DB_PASSWORD: 'password',
  DB_NAME: 'reved_kids_test',
  JWT_SECRET: 'test_jwt_secret_key_for_testing_only_32_chars_min',
  NODE_ENV: 'test',
  PORT: '3001',
  LOG_LEVEL: 'error',
  ENABLE_REQUEST_LOGGING: 'false',
  DB_SYNC: 'true',
  DB_FORCE_SYNC: 'true',
  ENABLE_CORS: 'true'
};

// Set default values for missing environment variables
Object.entries(defaultTestValues).forEach(([key, value]) => {
  if (!process.env[key]) {
    process.env[key] = value;
  }
});

// Validate that all required environment variables are present
requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable for tests: ${envVar}`);
  }
});

console.log('✅ Test environment variables loaded successfully'); 