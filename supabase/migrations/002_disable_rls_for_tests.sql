-- ============================================================================
-- Désactiver temporairement RLS pour les tests
-- Les policies seront réactivées plus tard quand on migrera vers Supabase Auth
-- ============================================================================

-- Désactiver RLS sur toutes les tables
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE rides DISABLE ROW LEVEL SECURITY;
ALTER TABLE personal_rides DISABLE ROW LEVEL SECURITY;
ALTER TABLE credits_ledger DISABLE ROW LEVEL SECURITY;
ALTER TABLE badges DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges DISABLE ROW LEVEL SECURITY;
ALTER TABLE groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE planning_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log DISABLE ROW LEVEL SECURITY;

-- ✅ Toutes les opérations sont maintenant autorisées pour les tests

