-- ============================================================================
-- 080 : Permettre à un utilisateur authentifié d’insérer sa propre ligne users
-- ============================================================================
-- Le trigger handle_new_user() crée normalement le profil. Si le client arrive
-- avant le trigger (ou en secours), getVerificationStatus() faisait un INSERT
-- bloqué par RLS (42501). Cette policy limite l’INSERT à sa propre clé auth.

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

CREATE POLICY "Users can insert own profile"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid()::text);

COMMENT ON POLICY "Users can insert own profile" ON public.users IS
  'Bootstrap : id doit être auth.uid() (aligné sur handle_new_user).';
