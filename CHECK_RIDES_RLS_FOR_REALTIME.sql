-- ============================================
-- 🔍 VÉRIFIER les politiques RLS sur rides
-- ============================================
-- Realtime a besoin de politiques SELECT pour fonctionner

-- Voir toutes les policies sur la table rides
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'rides'
ORDER BY policyname;

-- Vérifier si RLS est activé
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'rides';

