-- ============================================
-- 🔍 VÉRIFIER le statut Realtime sur la table rides
-- ============================================

-- Vérifier si la réplication est activée
SELECT 
  schemaname,
  tablename,
  -- Vérifier si la table publie des changements
  (SELECT COUNT(*) 
   FROM pg_publication_tables 
   WHERE schemaname = 'public' 
   AND tablename = 'rides') as is_published
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename = 'rides';

-- Vérifier les publications Realtime existantes
SELECT 
  pubname,
  puballtables,
  pubinsert,
  pubupdate,
  pubdelete
FROM pg_publication
WHERE pubname = 'supabase_realtime';

-- Vérifier quelles tables sont dans la publication supabase_realtime
SELECT 
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND schemaname = 'public'
ORDER BY tablename;

