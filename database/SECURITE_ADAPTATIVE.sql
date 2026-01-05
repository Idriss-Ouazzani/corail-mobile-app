-- ============================================================================
-- SÉCURITÉ ADAPTATIVE - S'adapte aux tables qui existent vraiment
-- ============================================================================
-- Ce script vérifie quelles tables existent et applique RLS seulement sur celles-ci
-- ============================================================================

-- ============================================================================
-- FONCTION : Activer RLS si la table existe
-- ============================================================================

DO $$
DECLARE
  table_rec RECORD;
BEGIN
  
  -- =========================================================================
  -- LISTE DES TABLES À PROTÉGER (avec RLS)
  -- =========================================================================
  
  -- Tables avec données sensibles (argent, crédits)
  FOR table_rec IN 
    SELECT unnest(ARRAY['credits', 'user_credits', 'credits_ledger']) AS tname
  LOOP
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = table_rec.tname AND schemaname = 'public') THEN
      RAISE NOTICE '🔒 Protection de la table : %', table_rec.tname;
      
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_rec.tname);
      
      -- Policy lecture seule
      EXECUTE format('DROP POLICY IF EXISTS "Read only policy" ON %I', table_rec.tname);
      EXECUTE format('CREATE POLICY "Read only policy" ON %I FOR SELECT USING (true)', table_rec.tname);
      
      RAISE NOTICE '✅ Table % protégée (lecture seule)', table_rec.tname;
    ELSE
      RAISE NOTICE '⏭️  Table % inexistante, on skip', table_rec.tname;
    END IF;
  END LOOP;
  
  -- =========================================================================
  -- TABLES SEMI-SENSIBLES (RLS mais permissif)
  -- =========================================================================
  
  FOR table_rec IN 
    SELECT unnest(ARRAY['users', 'personal_rides']) AS tname
  LOOP
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = table_rec.tname AND schemaname = 'public') THEN
      RAISE NOTICE '🔐 RLS permissif sur : %', table_rec.tname;
      
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_rec.tname);
      
      -- Policies permissives
      EXECUTE format('DROP POLICY IF EXISTS "Permissive select" ON %I', table_rec.tname);
      EXECUTE format('DROP POLICY IF EXISTS "Permissive insert" ON %I', table_rec.tname);
      EXECUTE format('DROP POLICY IF EXISTS "Permissive update" ON %I', table_rec.tname);
      EXECUTE format('DROP POLICY IF EXISTS "Permissive all" ON %I', table_rec.tname);
      
      EXECUTE format('CREATE POLICY "Permissive all" ON %I FOR ALL USING (true) WITH CHECK (true)', table_rec.tname);
      
      RAISE NOTICE '✅ Table % : RLS activé (permissif)', table_rec.tname;
    ELSE
      RAISE NOTICE '⏭️  Table % inexistante, on skip', table_rec.tname;
    END IF;
  END LOOP;
  
  -- =========================================================================
  -- TABLES PUBLIQUES (Désactiver RLS)
  -- =========================================================================
  
  FOR table_rec IN 
    SELECT unnest(ARRAY['vtc_profiles', 'quotes', 'rides', 'groups', 'group_members', 'group_invitations']) AS tname
  LOOP
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = table_rec.tname AND schemaname = 'public') THEN
      RAISE NOTICE '🔓 Désactivation RLS sur : %', table_rec.tname;
      
      EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', table_rec.tname);
      
      RAISE NOTICE '✅ Table % : RLS désactivé (public)', table_rec.tname;
    ELSE
      RAISE NOTICE '⏭️  Table % inexistante, on skip', table_rec.tname;
    END IF;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Configuration terminée !';
  
END $$;

-- ============================================================================
-- AFFICHER LE RÉSULTAT
-- ============================================================================

SELECT 
  tablename as "Table",
  CASE 
    WHEN rowsecurity THEN '🔒 RLS Activé'
    ELSE '🔓 RLS Désactivé'
  END as "État",
  CASE 
    WHEN tablename IN ('credits', 'user_credits', 'credits_ledger') THEN 'CRITIQUE - Lecture seule'
    WHEN tablename IN ('users', 'personal_rides') THEN 'Protégé mais permissif'
    WHEN tablename IN ('vtc_profiles', 'quotes', 'rides') THEN 'Public (marketplace)'
    WHEN tablename IN ('groups', 'group_members', 'group_invitations') THEN 'Public (groupes)'
    WHEN tablename = 'push_tokens' THEN 'Déjà configuré'
    ELSE 'Autre'
  END as "Niveau de sécurité"
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT LIKE 'pg_%'
ORDER BY 
  CASE WHEN rowsecurity THEN 0 ELSE 1 END,
  tablename;

-- ============================================================================
-- EXPLICATION
-- ============================================================================
--
-- Ce script :
-- 1. Vérifie quelles tables existent vraiment
-- 2. Applique RLS seulement sur les tables qui existent
-- 3. Saute les tables inexistantes sans erreur
--
-- Résultat :
-- - Tables critiques (crédits) : Lecture seule
-- - Tables semi-sensibles : RLS activé mais permissif
-- - Tables publiques : RLS désactivé
--
-- ============================================================================

