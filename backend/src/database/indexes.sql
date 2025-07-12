-- =====================================================
-- INDEXES POUR OPTIMISER LES PERFORMANCES
-- =====================================================

-- Index pour la table Eleve
CREATE INDEX IF NOT EXISTS idx_eleve_niveau_actuel ON eleve(niveau_actuel);
CREATE INDEX IF NOT EXISTS idx_eleve_dernier_acces ON eleve(dernier_acces);
CREATE INDEX IF NOT EXISTS idx_eleve_est_connecte ON eleve(est_connecte);
CREATE INDEX IF NOT EXISTS idx_eleve_total_points ON eleve(total_points DESC);

-- Index pour la table ProgressionEleve
CREATE INDEX IF NOT EXISTS idx_progression_eleve_id ON progression_eleve(eleve_id);
CREATE INDEX IF NOT EXISTS idx_progression_exercice_id ON progression_eleve(exercice_id);
CREATE INDEX IF NOT EXISTS idx_progression_eleve_exercice ON progression_eleve(eleve_id, exercice_id);
CREATE INDEX IF NOT EXISTS idx_progression_statut ON progression_eleve(statut);
CREATE INDEX IF NOT EXISTS idx_progression_derniere_tentative ON progression_eleve(derniere_tentative);
CREATE INDEX IF NOT EXISTS idx_progression_premiere_reussite ON progression_eleve(premiere_reussite);

-- Index pour la table SessionEleve
CREATE INDEX IF NOT EXISTS idx_session_eleve_id ON session_eleve(eleve_id);
CREATE INDEX IF NOT EXISTS idx_session_date_debut ON session_eleve(date_debut);
CREATE INDEX IF NOT EXISTS idx_session_eleve_date ON session_eleve(eleve_id, date_debut);
CREATE INDEX IF NOT EXISTS idx_session_terminee ON session_eleve(session_terminee);

-- Index pour la table ExercicePedagogique
CREATE INDEX IF NOT EXISTS idx_exercice_module_id ON exercice_pedagogique(module_id);
CREATE INDEX IF NOT EXISTS idx_exercice_actif ON exercice_pedagogique(actif);
CREATE INDEX IF NOT EXISTS idx_exercice_ordre ON exercice_pedagogique(ordre);
CREATE INDEX IF NOT EXISTS idx_exercice_difficulte ON exercice_pedagogique(difficulte);
CREATE INDEX IF NOT EXISTS idx_exercice_type ON exercice_pedagogique(type);

-- Index pour la table ModulePedagogique
CREATE INDEX IF NOT EXISTS idx_module_niveau ON module_pedagogique(niveau);
CREATE INDEX IF NOT EXISTS idx_module_matiere ON module_pedagogique(matiere);
CREATE INDEX IF NOT EXISTS idx_module_actif ON module_pedagogique(actif);
CREATE INDEX IF NOT EXISTS idx_module_niveau_matiere ON module_pedagogique(niveau, matiere);

-- Index pour la table RevisionProgrammee
CREATE INDEX IF NOT EXISTS idx_revision_eleve_id ON revision_programmee(eleve_id);
CREATE INDEX IF NOT EXISTS idx_revision_date_programmee ON revision_programmee(date_programmee);
CREATE INDEX IF NOT EXISTS idx_revision_statut ON revision_programmee(statut);
CREATE INDEX IF NOT EXISTS idx_revision_eleve_date ON revision_programmee(eleve_id, date_programmee);

-- Index composites pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_progression_eleve_reussi ON progression_eleve(eleve_id, reussi);
CREATE INDEX IF NOT EXISTS idx_exercice_module_actif ON exercice_pedagogique(module_id, actif);
CREATE INDEX IF NOT EXISTS idx_session_eleve_periode ON session_eleve(eleve_id, date_debut, date_fin);

-- Index pour les requêtes de recommandations
CREATE INDEX IF NOT EXISTS idx_progression_eleve_exercice_reussi ON progression_eleve(eleve_id, exercice_id, reussi);

-- Index pour les statistiques
CREATE INDEX IF NOT EXISTS idx_session_points_gagnes ON session_eleve(points_gagnes DESC);
CREATE INDEX IF NOT EXISTS idx_progression_points_gagnes ON progression_eleve(points_gagnes DESC);

-- Index pour les recherches textuelles (si PostgreSQL avec pg_trgm)
-- CREATE INDEX IF NOT EXISTS idx_exercice_titre_trgm ON exercice_pedagogique USING gin(titre gin_trgm_ops);
-- CREATE INDEX IF NOT EXISTS idx_module_titre_trgm ON module_pedagogique USING gin(titre gin_trgm_ops);

-- Index pour les requêtes temporelles
CREATE INDEX IF NOT EXISTS idx_progression_date_progression ON progression_eleve(date_progression);
CREATE INDEX IF NOT EXISTS idx_session_date_fin ON session_eleve(date_fin);

-- Index pour les requêtes de performance
CREATE INDEX IF NOT EXISTS idx_eleve_serie_jours ON eleve(serie_jours DESC);
CREATE INDEX IF NOT EXISTS idx_session_duree_minutes ON session_eleve(duree_minutes);

-- Index pour les contraintes uniques (si pas déjà créés)
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_eleve_email_unique ON eleve(email);
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_progression_eleve_exercice_unique ON progression_eleve(eleve_id, exercice_id);

-- =====================================================
-- ANALYSE DES TABLES POUR OPTIMISER LES STATISTIQUES
-- =====================================================

-- Analyser les tables pour mettre à jour les statistiques
ANALYZE eleve;
ANALYZE progression_eleve;
ANALYZE session_eleve;
ANALYZE exercice_pedagogique;
ANALYZE module_pedagogique;
ANALYZE revision_programmee;

-- =====================================================
-- VUES MATÉRIALISÉES POUR LES RAPPORTS FRÉQUENTS
-- =====================================================

-- Vue matérialisée pour les statistiques d'élèves
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_stats_eleves AS
SELECT 
    e.id,
    e.prenom,
    e.nom,
    e.niveau_actuel,
    e.total_points,
    e.serie_jours,
    COUNT(p.id) as total_exercices_tentes,
    COUNT(CASE WHEN p.reussi = true THEN 1 END) as total_exercices_reussis,
    AVG(CASE WHEN p.reussi = true THEN p.temps_passe END) as temps_moyen_reussite,
    MAX(p.derniere_tentative) as derniere_activite
FROM eleve e
LEFT JOIN progression_eleve p ON e.id = p.eleve_id
GROUP BY e.id, e.prenom, e.nom, e.niveau_actuel, e.total_points, e.serie_jours;

-- Index sur la vue matérialisée
CREATE INDEX IF NOT EXISTS idx_mv_stats_eleves_niveau ON mv_stats_eleves(niveau_actuel);
CREATE INDEX IF NOT EXISTS idx_mv_stats_eleves_points ON mv_stats_eleves(total_points DESC);

-- Fonction pour rafraîchir la vue matérialisée
CREATE OR REPLACE FUNCTION refresh_stats_eleves()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW mv_stats_eleves;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS POUR MAINTENIR LES VUES MATÉRIALISÉES
-- =====================================================

-- Trigger pour rafraîchir les stats quand un élève progresse
CREATE OR REPLACE FUNCTION trigger_refresh_stats_eleves()
RETURNS TRIGGER AS $$
BEGIN
    -- Rafraîchir la vue matérialisée de manière asynchrone
    PERFORM pg_notify('refresh_stats_eleves', '');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_refresh_stats_eleves_progression
    AFTER INSERT OR UPDATE OR DELETE ON progression_eleve
    FOR EACH ROW
    EXECUTE FUNCTION trigger_refresh_stats_eleves();

-- =====================================================
-- CONFIGURATION POUR LES PERFORMANCES
-- =====================================================

-- Optimiser les paramètres de base de données (à ajuster selon les ressources)
-- ALTER SYSTEM SET shared_buffers = '256MB';
-- ALTER SYSTEM SET effective_cache_size = '1GB';
-- ALTER SYSTEM SET maintenance_work_mem = '64MB';
-- ALTER SYSTEM SET checkpoint_completion_target = 0.9;
-- ALTER SYSTEM SET wal_buffers = '16MB';
-- ALTER SYSTEM SET default_statistics_target = 100;

-- =====================================================
-- COMMENTAIRES POUR LA MAINTENANCE
-- =====================================================

/*
MAINTENANCE DES INDEXES :

1. Vérifier l'utilisation des index :
   SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
   FROM pg_stat_user_indexes
   ORDER BY idx_scan DESC;

2. Identifier les index inutilisés :
   SELECT schemaname, tablename, indexname
   FROM pg_stat_user_indexes
   WHERE idx_scan = 0;

3. Rafraîchir les vues matérialisées :
   SELECT refresh_stats_eleves();

4. Analyser les tables régulièrement :
   ANALYZE eleve;
   ANALYZE progression_eleve;
   ANALYZE session_eleve;

5. Surveiller les performances :
   SELECT query, calls, total_time, mean_time
   FROM pg_stat_statements
   ORDER BY total_time DESC
   LIMIT 10;
*/ 