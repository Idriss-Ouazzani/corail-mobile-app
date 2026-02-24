-- ============================================================================
-- Migration 053: Politiques RLS vtc_profiles pour les utilisateurs (lecture / création / mise à jour)
-- ============================================================================
-- Permet à un utilisateur de créer son propre profil VTC (ex. pour la vérification
-- sans avoir encore complété la Page Pro) et de le lire/modifier.
-- ============================================================================

-- S'assurer que RLS est activé
ALTER TABLE public.vtc_profiles ENABLE ROW LEVEL SECURITY;

-- Résolution "mon user_id" : id ou supabase_auth_id selon la config.
-- L'app envoie auth.uid() comme user_id ; en base user_id peut être users.id (auth UUID ou legacy).
CREATE OR REPLACE FUNCTION public.current_vtc_user_id()
RETURNS TEXT AS $$
  SELECT id FROM public.users
  WHERE id = auth.uid()::text OR supabase_auth_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Utilisateur peut lire son propre profil (user_id = lui-même, via users.id ou auth.uid())
DROP POLICY IF EXISTS "Users can read own vtc_profile" ON public.vtc_profiles;
CREATE POLICY "Users can read own vtc_profile"
ON public.vtc_profiles
FOR SELECT
USING (
  user_id = public.current_vtc_user_id()
  OR user_id = auth.uid()::text
);

-- Utilisateur peut créer son propre profil (user_id = lui-même)
DROP POLICY IF EXISTS "Users can insert own vtc_profile" ON public.vtc_profiles;
CREATE POLICY "Users can insert own vtc_profile"
ON public.vtc_profiles
FOR INSERT
WITH CHECK (
  user_id = public.current_vtc_user_id()
  OR user_id = auth.uid()::text
);

-- Utilisateur peut modifier son propre profil
DROP POLICY IF EXISTS "Users can update own vtc_profile" ON public.vtc_profiles;
CREATE POLICY "Users can update own vtc_profile"
ON public.vtc_profiles
FOR UPDATE
USING (
  user_id = public.current_vtc_user_id()
  OR user_id = auth.uid()::text
)
WITH CHECK (
  user_id = public.current_vtc_user_id()
  OR user_id = auth.uid()::text
);
