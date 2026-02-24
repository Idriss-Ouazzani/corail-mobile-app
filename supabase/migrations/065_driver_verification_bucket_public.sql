-- ============================================================================
-- Migration 065: Rendre le bucket driver-verification lisible en public
-- ============================================================================
-- Comme vtc-profiles pour les photos : les objets sont accessibles via l'URL
-- publique. Les chemins contiennent user_id + timestamp, donc non devinables.
-- L'accès aux données reste contrôlé par l'app (seuls admin/propriétaire voient les liens).
-- ============================================================================

UPDATE storage.buckets
SET public = true
WHERE id = 'driver-verification';
