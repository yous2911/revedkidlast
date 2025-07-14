import app from './app';
import { testConnection, syncDatabase, closeDatabase } from './db';

const PORT = process.env['PORT'] || 3000;
const NODE_ENV = process.env['NODE_ENV'] || 'development';

async function startServer() {
  try {
    console.log('🚀 Démarrage du serveur RevEd Kids...');
    
    // Test database connection (includes environment validation)
    console.log('📊 Vérification de la base de données...');
    await testConnection();

    // Sync database (only in development)
    if (NODE_ENV === 'development') {
      console.log('🔄 Synchronisation des modèles de développement...');
      await syncDatabase();
    }

    // Start HTTP server
    const server = app.listen(PORT, () => {
      console.log(`
🎯 RevEd Kids Backend démarré avec succès !
📍 Port: ${PORT}
🌍 Environnement: ${NODE_ENV}
🔗 URL: http://localhost:${PORT}
📊 Health Check: http://localhost:${PORT}/api/health
      `);
    });

    // Graceful shutdown handling
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n⚠️ Signal ${signal} reçu, arrêt gracieux en cours...`);
      
      // Force shutdown after 10 seconds
      const shutdownTimeout = setTimeout(() => {
        console.error('❌ Arrêt forcé après timeout');
        process.exit(1);
      }, 10000);
      
      // Stop accepting new requests
      server.close(async () => {
        // Clear the force shutdown timeout since we're shutting down gracefully
        clearTimeout(shutdownTimeout);
        console.log('🔌 Serveur HTTP fermé');
        
        try {
          // Close database connections using the new function
          await closeDatabase();
          
          console.log('✅ Arrêt gracieux terminé');
          process.exit(0);
        } catch (error) {
          console.error('❌ Erreur lors de l\'arrêt gracieux:', error);
          process.exit(1);
        }
      });
    };

    // Listen for shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle server errors
    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} déjà utilisé`);
      } else {
        console.error('❌ Erreur serveur:', error);
      }
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ Erreur de démarrage:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Exception non capturée:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (_reason, _promise) => {
  console.error('❌ Promesse rejetée non gérée');
  process.exit(1);
});

// Start the server
startServer(); 