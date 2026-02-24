-- ============================================================================
-- Migration 064: Admins reconnus par email (JWT) pour le bucket driver-verification
-- ============================================================================
-- Permet aux admins identifiés par email (JWT) de lire les documents et donc
-- d'obtenir des URLs signées pour la prévisualisation dans le panel admin.
-- ============================================================================

DROP POLICY IF EXISTS "Admins can read all verification docs" ON storage.objects;
CREATE POLICY "Admins can read all verification docs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'driver-verification'
  AND EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.is_admin = true
    AND (
      u.supabase_auth_id = auth.uid()
      OR u.id = auth.uid()::text
      OR (auth.jwt() ->> 'email' IS NOT NULL AND u.email = (auth.jwt() ->> 'email'))
    )
  )
);
