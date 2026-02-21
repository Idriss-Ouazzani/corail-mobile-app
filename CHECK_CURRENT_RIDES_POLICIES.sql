-- ============================================
-- 🔍 VÉRIFIER toutes les politiques actuelles sur rides
-- ============================================

-- 1. Vérifier que RLS est activé
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'rides';

-- 2. Lister TOUTES les politiques
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies
WHERE tablename = 'rides'
ORDER BY cmd, policyname;

-- 3. Compter les politiques par type
SELECT 
  cmd,
  COUNT(*) as policy_count
FROM pg_policies
WHERE tablename = 'rides'
GROUP BY cmd
ORDER BY cmd;

