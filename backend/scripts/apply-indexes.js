#!/usr/bin/env node

/**
 * Script pour appliquer les index de base de données
 * Usage: npm run apply-indexes
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuration de la base de données
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'reved_kids',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

async function applyIndexes() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Application des index de base de données...');
    
    // Lire le fichier SQL des index
    const indexesPath = path.join(__dirname, '../src/database/indexes.sql');
    const indexesSQL = fs.readFileSync(indexesPath, 'utf8');
    
    // Diviser le SQL en commandes individuelles
    const commands = indexesSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.startsWith('/*'));
    
    console.log(`📋 ${commands.length} commandes à exécuter...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      
      try {
        if (command.trim()) {
          await client.query(command);
          successCount++;
          
          if (i % 10 === 0) {
            console.log(`✅ Progression: ${i + 1}/${commands.length}`);
          }
        }
      } catch (error) {
        errorCount++;
        console.error(`❌ Erreur sur la commande ${i + 1}:`, error.message);
        
        // Continuer malgré les erreurs (certains index peuvent déjà exister)
        if (!error.message.includes('already exists')) {
          console.error('Commande:', command.substring(0, 100) + '...');
        }
      }
    }
    
    console.log('\n📊 Résumé:');
    console.log(`✅ Commandes réussies: ${successCount}`);
    console.log(`❌ Erreurs: ${errorCount}`);
    
    if (errorCount === 0) {
      console.log('🎉 Tous les index ont été appliqués avec succès!');
    } else {
      console.log('⚠️  Certains index n\'ont pas pu être créés (peut-être déjà existants)');
    }
    
    // Vérifier les index existants
    console.log('\n🔍 Vérification des index existants...');
    const result = await client.query(`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND indexname LIKE 'idx_%'
      ORDER BY tablename, indexname;
    `);
    
    console.log(`📋 ${result.rows.length} index trouvés:`);
    result.rows.forEach(row => {
      console.log(`  - ${row.indexname} sur ${row.tablename}`);
    });
    
  } catch (error) {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Fonction pour vérifier la connectivité
async function checkConnection() {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Connexion à la base de données réussie');
    return true;
  } catch (error) {
    console.error('❌ Impossible de se connecter à la base de données:', error.message);
    return false;
  }
}

// Fonction principale
async function main() {
  console.log('🔧 Script d\'application des index RevEd Kids');
  console.log('==============================================\n');
  
  // Vérifier la connexion
  const connected = await checkConnection();
  if (!connected) {
    process.exit(1);
  }
  
  // Appliquer les index
  await applyIndexes();
  
  console.log('\n✨ Script terminé avec succès!');
}

// Exécuter le script
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Erreur inattendue:', error);
    process.exit(1);
  });
}

module.exports = { applyIndexes, checkConnection }; 