-- ============================================================================
-- SCRIPT 1 : VOIR TOUTES TES TABLES
-- ============================================================================
-- Exécute ce script pour voir quelles tables tu as dans ta base
-- ============================================================================

-- Afficher toutes les tables publiques avec leur état RLS
SELECT 
  tablename as "Nom de la table",
  CASE 
    WHEN rowsecurity THEN '🔒 RLS Activé'
    ELSE '🔓 RLS Désactivé'
  END as "État RLS"
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================================
-- Copie le résultat et dis-moi quelles tables tu as !
-- ============================================================================

