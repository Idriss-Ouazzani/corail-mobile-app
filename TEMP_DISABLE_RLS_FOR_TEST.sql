-- ============================================
-- ⚠️ DÉSACTIVER RLS TEMPORAIREMENT (TEST ONLY)
-- ============================================
-- Ceci est juste pour TESTER si RLS est le problème
-- NE PAS LAISSER EN PRODUCTION !

-- Désactiver RLS
ALTER TABLE public.rides DISABLE ROW LEVEL SECURITY;

-- Vérifier
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'rides';

-- ⚠️ APRÈS LE TEST, RÉACTIVE RLS avec:
-- ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;

