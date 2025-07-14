// Test setup file for Jest
import { config } from 'dotenv';
import path from 'path';
import { sequelize } from '../db';

// Load test environment variables
const testEnvPath = path.resolve(__dirname, '../../test.env');
config({ path: testEnvPath, quiet: true });

// Set test environment
process.env['NODE_ENV'] = 'test';

// Global test setup
beforeAll(async () => {
  // Connect to test database
  try {
    // First try to connect to the default postgres database to create our test database
    const tempSequelize = new (require('sequelize-typescript').Sequelize)({
      dialect: 'postgres',
      host: process.env['DB_HOST'] || 'localhost',
      port: parseInt(process.env['DB_PORT'] || '3002'),
      username: process.env['DB_USER'] || 'postgres',
      password: process.env['DB_PASSWORD'] || 'rachida',
      database: 'postgres', // Connect to default database first
      logging: false
    });

    try {
      // Try to create the test database if it doesn't exist
      await tempSequelize.query(`CREATE DATABASE reved_kids_test;`);
      console.log('✅ Test database created');
    } catch (createError: any) {
      if (createError.message.includes('already exists')) {
        console.log('✅ Test database already exists');
      } else {
        console.warn('⚠️ Could not create test database:', createError.message);
      }
    } finally {
      await tempSequelize.close();
    }

    // Now connect to our test database
    await sequelize.authenticate();
    console.log('✅ Test database connected');
    
    // Sync database for tests (this will create tables)
    await sequelize.sync({ force: true });
    console.log('✅ Test database synced');
  } catch (error) {
    console.error('❌ Test database connection failed:', error);
    throw error;
  }
});

// Global test teardown
afterAll(async () => {
  // Close database connection
  try {
    await sequelize.close();
    console.log('✅ Test database connection closed');
  } catch (error) {
    console.error('❌ Error closing test database connection:', error);
  }
});

// Clean up after each test
afterEach(async () => {
  // Clean up test data by truncating tables
  try {
    const models = sequelize.models;
    for (const modelName in models) {
      const model = models[modelName];
      if (model) {
        await model.destroy({ 
          where: {},
          force: true,
          truncate: true 
        });
      }
    }
  } catch (error) {
    console.warn('⚠️ Error cleaning up test data:', error);
  }
});

// Mock console methods to reduce noise in tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  // Suppress console output during tests unless explicitly needed
  if (process.env['NODE_ENV'] === 'test') {
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
  }
});

afterAll(() => {
  // Restore console methods
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Global test utilities
export const testUtils = {
  // Helper to create test data
  createTestStudent: (data = {}) => ({
    prenom: 'Test',
    nom: 'Student',
    dateNaissance: new Date('2015-01-01'),
    age: 8,
    niveauActuel: 'CE2',
    emailParent: 'test@example.com',
    totalPoints: 0,
    serieJours: 0,
    preferences: {},
    adaptations: {},
    ...data
  }),

  // Helper to create test exercise
  createTestExercise: (data = {}) => ({
    titre: 'Test Exercise',
    consigne: 'Test instruction',
    type: 'QCM',
    difficulte: 'decouverte',
    pointsReussite: 10,
    dureeEstimee: 5,
    ordre: 1,
    moduleId: 1,
    configuration: {
      question: 'Test question?',
      choix: ['A', 'B', 'C', 'D'],
      bonneReponse: 'A'
    },
    actif: true,
    metadata: {},
    ...data
  }),

  // Helper to create test module
  createTestModule: (data = {}) => ({
    titre: 'Test Module',
    description: 'Test module description',
    niveau: 'CE2',
    matiere: 'MATHEMATIQUES',
    periode: 'P1',
    ordre: 1,
    actif: true,
    metadata: {},
    ...data
  }),

  // Helper to wait for async operations
  wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  // Helper to generate random IDs
  generateId: () => Math.floor(Math.random() * 1000000),

  // Helper to create mock request
  createMockRequest: (data = {}) => ({
    params: {},
    query: {},
    body: {},
    headers: {},
    method: 'GET',
    url: '/test',
    originalUrl: '/test',
    ip: '127.0.0.1',
    get: jest.fn(),
    ...data
  }),

  // Helper to create mock response
  createMockResponse: () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.end = jest.fn().mockReturnValue(res);
    res.setHeader = jest.fn().mockReturnValue(res);
    res.getHeader = jest.fn().mockReturnValue(null);
    res.removeHeader = jest.fn().mockReturnValue(res);
    res.on = jest.fn().mockReturnValue(res);
    return res;
  }
};

// Export for use in tests
export default testUtils; 