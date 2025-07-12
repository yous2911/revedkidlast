import { Sequelize } from 'sequelize-typescript';
import { Eleve } from './models/eleve.model';
import { ProgressionEleve } from './models/progression-eleve.model';
import { SessionEleve } from './models/session-eleve.model';
import { ExercicePedagogique } from './models/exercice-pedagogique.model';
import { ModulePedagogique } from './models/module-pedagogique.model';
import { RevisionProgrammee } from './models/revision-programmee.model';

// Configuration de la base de données
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env['DB_HOST'] || 'localhost',
  port: parseInt(process.env['DB_PORT'] || '5432'),
  username: process.env['DB_USER'] || 'postgres',
  password: process.env['DB_PASSWORD'] || 'password',
  database: process.env['DB_NAME'] || 'reved_kids',
  logging: process.env['NODE_ENV'] === 'development' ? console.log : false,
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
    acquire: 30000,
    idle: 10000
  },
  dialectOptions: {
    ssl: process.env['NODE_ENV'] === 'production' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  }
});

// Test de connexion
export const testConnection = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données établie avec succès.');
  } catch (error) {
    console.error('❌ Impossible de se connecter à la base de données:', error);
    throw error;
  }
};

// Synchronisation des modèles
export const syncDatabase = async (): Promise<void> => {
  try {
    await sequelize.sync({ alter: true });
    console.log('✅ Modèles synchronisés avec la base de données.');
  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation:', error);
    throw error;
  }
};

export { sequelize }; 