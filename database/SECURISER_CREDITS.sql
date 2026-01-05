-- ============================================================================
-- SÉCURISER LA TABLE CREDITS_LEDGER
-- ============================================================================
-- Contexte : Activer RLS sur credits_ledger maintenant que l'Edge Function
--            gère les insertions de manière sécurisée avec SERVICE_ROLE.
--
-- Objectif :
--  1. Activer RLS sur credits_ledger
--  2. Permettre la lecture par tous (pour afficher l'historique)
--  3. Bloquer toutes les écritures (INSERT/UPDATE/DELETE) depuis l'app
--  4. Les écritures se feront uniquement via l'Edge Function add-credits
--     qui utilise la clé SERVICE_ROLE pour bypass RLS
-- ============================================================================

-- 1. Activer RLS
ALTER TABLE public.credits_ledger ENABLE ROW LEVEL SECURITY;

-- 2. Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Allow read access for all users" ON public.credits_ledger;
DROP POLICY IF EXISTS "Service role can insert credits" ON public.credits_ledger;
DROP POLICY IF EXISTS "Users can read their own credits" ON public.credits_ledger;

-- 3. Policy pour la lecture : tout le monde peut lire (pour afficher l'historique)
--    Note : Si vous utilisez Firebase Auth et pas Supabase Auth, auth.uid() sera NULL
--    Pour Firebase Auth, la sécurité de lecture est gérée côté application
CREATE POLICY "Anyone can read credits_ledger"
  ON public.credits_ledger
  FOR SELECT
  USING (true);

-- 4. Aucune policy pour INSERT/UPDATE/DELETE
--    = Bloqué par défaut pour les utilisateurs normaux (anon key)
--    = Autorisé uniquement pour SERVICE_ROLE key (utilisée par l'Edge Function)

-- ============================================================================
-- VÉRIFICATION
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '           🔒 SÉCURITÉ CREDITS_LEDGER ACTIVÉE';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '✅ RLS activé sur credits_ledger';
  RAISE NOTICE '✅ Lecture : Autorisée pour tous';
  RAISE NOTICE '✅ Écriture : Bloquée (sauf via Edge Function)';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
END $$;

-- Afficher l'état final
SELECT
  tablename as "Table",
  CASE
    WHEN rowsecurity THEN '🔒 RLS Activé'
    ELSE '🔓 RLS Désactivé'
  END as "État"
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'credits_ledger';

