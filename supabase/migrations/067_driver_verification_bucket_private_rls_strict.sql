-- ============================================================================
-- Migration 067: RLS strict pour driver-verification (documents sensibles)
-- ============================================================================
-- Remet le bucket en privé et supprime la lecture publique (065/066).
-- Seuls le propriétaire du fichier et les admins peuvent lire (policies 051 + 064).
-- L'accès admin se fait via URLs signées générées par l'Edge Function (service role).
-- ============================================================================

-- Remettre le bucket en privé
UPDATE storage.buckets
SET public = false
WHERE id = 'driver-verification';

-- Supprimer la policy de lecture publique (066)
DROP POLICY IF EXISTS "Public read driver-verification bucket" ON storage.objects;
