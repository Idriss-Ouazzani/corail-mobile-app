-- ============================================================================
-- Migration 020: Setup Supabase Auth Policies
-- Configure l'authentification et les RLS policies pour la migration depuis Firebase
-- ============================================================================

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 1️⃣ ACTIVER ROW LEVEL SECURITY SUR USERS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 2️⃣ POLICIES POUR LA TABLE USERS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Users peuvent lire leur propre profil
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
CREATE POLICY "Users can read own profile"
ON public.users
FOR SELECT
USING (auth.uid()::text = id);

-- Users peuvent mettre à jour leur propre profil
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
USING (auth.uid()::text = id);

-- Admins peuvent lire tous les profils
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.users;
CREATE POLICY "Admins can read all profiles"
ON public.users
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()::text
    AND is_admin = true
  )
);

-- Service role peut tout faire (pour les insertions lors du signup)
DROP POLICY IF EXISTS "Service role can insert users" ON public.users;
CREATE POLICY "Service role can insert users"
ON public.users
FOR INSERT
WITH CHECK (true);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 3️⃣ POLICY POUR LES RIDES (mise à jour RLS)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Supprimer l'ancienne policy qui ne marchait pas avec Firebase
DROP POLICY IF EXISTS "Verified users can read public rides" ON public.rides;

-- Nouvelle policy compatible Supabase Auth
CREATE POLICY "Authenticated users can read public rides"
ON public.rides
FOR SELECT
USING (
  visibility = 'PUBLIC' 
  AND status IN ('PUBLISHED', 'CLAIMED', 'IN_PROGRESS')
);

-- Policy pour les courses de groupe (avec auth Supabase)
DROP POLICY IF EXISTS "Users can read group rides" ON public.rides;
CREATE POLICY "Users can read group rides"
ON public.rides
FOR SELECT
USING (
  visibility = 'GROUP' 
  AND group_id IN (
    SELECT group_id FROM public.group_members
    WHERE user_id = auth.uid()::text
  )
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 4️⃣ FONCTION POUR CRÉER UN USER LORS DU SIGNUP
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Fonction trigger pour créer automatiquement un user dans public.users
-- quand un nouveau user s'inscrit via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, verification_status, created_at, updated_at)
  VALUES (
    NEW.id::text,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'UNVERIFIED',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour appeler la fonction ci-dessus
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ✅ MIGRATION TERMINÉE
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Vérification : Afficher les policies actives
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('users', 'rides')
ORDER BY tablename, policyname;

