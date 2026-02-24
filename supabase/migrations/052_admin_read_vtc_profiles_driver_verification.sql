-- ============================================================================
-- Migration 052: Admins peuvent lire tous les vtc_profiles (review vérification chauffeur)
-- ============================================================================

-- Policy: les admins peuvent SELECT sur tous les vtc_profiles
DROP POLICY IF EXISTS "Admins can read all vtc_profiles" ON public.vtc_profiles;
CREATE POLICY "Admins can read all vtc_profiles"
ON public.vtc_profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE (u.id = auth.uid()::text OR u.supabase_auth_id = auth.uid())
    AND u.is_admin = true
  )
);

-- Admins peuvent UPDATE vtc_profiles (pour review documents : statuts, notes)
DROP POLICY IF EXISTS "Admins can update vtc_profiles for verification" ON public.vtc_profiles;
CREATE POLICY "Admins can update vtc_profiles for verification"
ON public.vtc_profiles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE (u.id = auth.uid()::text OR u.supabase_auth_id = auth.uid())
    AND u.is_admin = true
  )
)
WITH CHECK (true);
