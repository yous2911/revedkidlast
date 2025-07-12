-- Script d'initialisation de la base de données RevEd Kids
-- Ce script est exécuté automatiquement lors du premier démarrage du conteneur PostgreSQL

-- Créer la base de données si elle n'existe pas
SELECT 'CREATE DATABASE reved_kids'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'reved_kids')\gexec

-- Se connecter à la base de données
\c reved_kids;

-- Créer les extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Créer les types ENUM personnalisés
DO $$ BEGIN
    CREATE TYPE niveau_scolaire AS ENUM ('CP', 'CE1', 'CE2', 'CM1', 'CM2');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE matiere_type AS ENUM ('MATHEMATIQUES', 'FRANCAIS', 'SCIENCES', 'HISTOIRE_GEOGRAPHIE', 'ANGLAIS');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE periode_type AS ENUM ('P1', 'P2', 'P3', 'P4', 'P5');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE type_exercice AS ENUM ('QCM', 'CALCUL', 'TEXTE_LIBRE', 'DRAG_DROP', 'CONJUGAISON', 'LECTURE', 'GEOMETRIE', 'PROBLEME');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE difficulte_type AS ENUM ('decouverte', 'consolidation', 'maitrise');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE statut_progression AS ENUM ('NON_COMMENCE', 'EN_COURS', 'TERMINE', 'MAITRISE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Créer les tables (si elles n'existent pas déjà)
-- Les tables seront créées automatiquement par Sequelize lors de la synchronisation

-- Insérer des données de test (optionnel)
-- Ces données peuvent être utilisées pour les tests ou le développement

-- Créer un utilisateur de test pour le développement
INSERT INTO eleves (prenom, nom, dateNaissance, age, niveauActuel, emailParent, totalPoints, serieJours, preferences, adaptations, "createdAt", "updatedAt")
VALUES (
    'Test',
    'Student',
    '2015-01-01',
    8,
    'CE2',
    'test@example.com',
    0,
    0,
    '{}',
    '{}',
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING;

-- Créer un module de test
INSERT INTO modules_pedagogiques (titre, description, niveau, matiere, periode, ordre, actif, metadata, "createdAt", "updatedAt")
VALUES (
    'Module Test Mathématiques',
    'Module de test pour les mathématiques',
    'CE2',
    'MATHEMATIQUES',
    'P1',
    1,
    true,
    '{}',
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING;

-- Créer un exercice de test
INSERT INTO exercices_pedagogiques (titre, consigne, type, difficulte, "pointsReussite", "dureeEstimee", ordre, "moduleId", configuration, actif, metadata, "createdAt", "updatedAt")
VALUES (
    'Addition simple',
    'Calculez la somme de 5 + 3',
    'CALCUL',
    'decouverte',
    10,
    5,
    1,
    1,
    '{"question": "5 + 3 = ?", "resultat": 8}',
    true,
    '{}',
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING;

-- Afficher un message de confirmation
SELECT 'Base de données RevEd Kids initialisée avec succès!' as message; 