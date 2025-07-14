import { Sequelize } from 'sequelize-typescript';
import { Eleve } from './models/eleve.model';
import { ProgressionEleve } from './models/progression-eleve.model';
import { SessionEleve } from './models/session-eleve.model';
import { ExercicePedagogique } from './models/exercice-pedagogique.model';
import { ModulePedagogique } from './models/module-pedagogique.model';
import { RevisionProgrammee } from './models/revision-programmee.model';
import { monitoringService } from './services/monitoring.service';

// Validate required environment variables
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});

// Configuration de la base de données
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env['DB_HOST'] || 'localhost',
  port: parseInt(process.env['DB_PORT'] || '5432'),
  username: process.env['DB_USER'] || 'postgres',
  password: process.env['DB_PASSWORD'] || 'password',
  database: process.env['DB_NAME'] || 'reved_kids',
  logging: process.env['NODE_ENV'] === 'development' ? (sql: string, timing?: number) => {
    // Track database queries for monitoring
    monitoringService.recordDbQuery();
    
    // Track slow queries (> 1 second)
    if (timing && timing > 1000) {
      monitoringService.recordSlowQuery();
      console.warn(`🐌 Slow database query (${timing.toFixed(2)}ms):`, sql.substring(0, 200) + '...');
    }
    
    console.log(sql);
  } : false,
  models: [
    Eleve,
    ProgressionEleve,
    SessionEleve,
    ExercicePedagogique,
    ModulePedagogique,
    RevisionProgrammee
  ],
  pool: {
    max: 20,
    min: 5,
    acquire: 10000, // Fixed: reduced from 30000 to 10000ms (10 seconds)
    idle: 10000,
    evict: 30000 // Add eviction timeout for better connection management
  },
  dialectOptions: {
    ssl: process.env['NODE_ENV'] === 'production' ? {
      require: true,
      rejectUnauthorized: false
    } : false,
    // Add statement timeout for better error handling
    statement_timeout: 30000, // 30 seconds
    idle_in_transaction_session_timeout: 30000 // 30 seconds
  },
  // Add retry configuration
  retry: {
    max: 3,
    timeout: 5000,
    match: [
      /ConnectionError/,
      /ConnectionRefusedError/,
      /ConnectionTimedOutError/,
      /TimeoutError/,
    ]
  }
});

// Test de connexion avec retry logic
export const testConnection = async (): Promise<void> => {
  let retries = 3;
  let lastError: Error | null = null;

  while (retries > 0) {
    try {
      await sequelize.authenticate();
      console.log('✅ Connexion à la base de données établie avec succès.');
      return;
    } catch (error) {
      lastError = error as Error;
      retries--;
      
      if (retries > 0) {
        console.warn(`⚠️ Tentative de connexion échouée, ${retries} essai(s) restant(s)...`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
      }
    }
  }
  
  console.error('❌ Impossible de se connecter à la base de données:', lastError);
  throw lastError || new Error('Database connection failed after all retries');
};

// Synchronisation des modèles avec better error handling
export const syncDatabase = async (): Promise<void> => {
  try {
    await sequelize.sync({ alter: true });
    console.log('✅ Modèles synchronisés avec la base de données.');
    
    // Create indexes for better performance
    await createIndexes();
  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation:', error);
    throw error;
  }
};

// Create database indexes for better performance
const createIndexes = async (): Promise<void> => {
  try {
    const queryInterface = sequelize.getQueryInterface();
    
    // Add indexes for frequently queried fields
    await queryInterface.addIndex('eleves', ['emailParent'], {
      name: 'idx_eleves_email_parent',
      unique: false
    }).catch(() => {}); // Ignore if index already exists

    await queryInterface.addIndex('progressions_eleves', ['eleveId'], {
      name: 'idx_progressions_eleve_id',
      unique: false
    }).catch(() => {});

    await queryInterface.addIndex('progressions_eleves', ['exerciceId'], {
      name: 'idx_progressions_exercice_id',
      unique: false
    }).catch(() => {});

    await queryInterface.addIndex('sessions_eleves', ['eleveId'], {
      name: 'idx_sessions_eleve_id',
      unique: false
    }).catch(() => {});

    await queryInterface.addIndex('exercices_pedagogiques', ['moduleId'], {
      name: 'idx_exercices_module_id',
      unique: false
    }).catch(() => {});

    await queryInterface.addIndex('exercices_pedagogiques', ['type', 'difficulte'], {
      name: 'idx_exercices_type_difficulte',
      unique: false
    }).catch(() => {});

    console.log('✅ Index de base de données créés ou vérifiés.');
  } catch (error) {
    console.warn('⚠️ Erreur lors de la création des index:', error);
    // Don't throw - indexes are optimization, not critical
  }
};

// Graceful shutdown function
export const closeDatabase = async (): Promise<void> => {
  try {
    await sequelize.close();
    console.log('✅ Connexions base de données fermées proprement.');
  } catch (error) {
    console.error('❌ Erreur lors de la fermeture de la base de données:', error);
    throw error;
  }
};

export { sequelize }; 