-- ============================================================================
-- Migration 066: Lecture publique des objets du bucket driver-verification
-- ============================================================================
-- Avec bucket public (065), les GET vers l'URL publique sont sans JWT.
-- Sans cette policy, RLS bloque car auth.uid() est null.
-- Les chemins sont non devinables (user_id + timestamp) ; l'app ne montre les
-- liens qu'aux admins et propriétaires.
-- ============================================================================

CREATE POLICY "Public read driver-verification bucket"
ON storage.objects FOR SELECT
USING ( bucket_id = 'driver-verification' );
