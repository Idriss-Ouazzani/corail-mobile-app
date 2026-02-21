/**
 * Migration: Activer Supabase Realtime sur la table rides
 * 
 * Permet de recevoir des notifications en temps réel (WebSockets)
 * quand une nouvelle course est créée
 */

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 1) Activer Realtime pour la table rides
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALTER PUBLICATION supabase_realtime ADD TABLE rides;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 2) Vérification (optionnel)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Pour vérifier que Realtime est bien activé :
-- SELECT schemaname, tablename 
-- FROM pg_publication_tables 
-- WHERE pubname = 'supabase_realtime';

COMMENT ON TABLE public.rides IS 
  'Table des courses marketplace - Realtime activé pour notifications instantanées';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- NOTES :
-- 
-- Realtime permet de recevoir des événements INSERT/UPDATE/DELETE en temps réel
-- Les clients (apps mobiles) s'abonnent via WebSockets
-- Latence typique : ~50-100ms (vs polling : 5-10 secondes)
-- 
-- Configuration côté client (déjà implémenté dans incomingRidesHybridService.ts) :
-- const channel = supabase
--   .channel('marketplace-rides')
--   .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'rides' }, handler)
--   .subscribe()
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

