-- ============================================
-- 🚀 ACTIVER Realtime sur la table rides
-- ============================================
-- Ce script active la réplication Realtime pour détecter 
-- automatiquement les nouvelles courses publiées.

-- Étape 1 : Activer la réplication sur la table rides
ALTER PUBLICATION supabase_realtime ADD TABLE public.rides;

-- Vérifier que ça a marché
SELECT 
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename = 'rides';

-- ✅ Si tu vois "rides" dans les résultats, c'est bon !

