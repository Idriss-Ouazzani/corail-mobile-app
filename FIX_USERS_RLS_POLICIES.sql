-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🚀 FIX: Politiques RLS pour la table users
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Ce script s'assure que les utilisateurs peuvent mettre à jour leur propre profil
-- (nécessaire pour submitVerification)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 1️⃣ S'assurer que RLS est activé sur users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2️⃣ Supprimer les anciennes policies pour repartir propre
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can read basic profiles" ON public.users;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.users;

-- 3️⃣ Créer les policies nécessaires

-- Policy 1: Les utilisateurs peuvent lire leur propre profil
CREATE POLICY "Users can read own profile"
ON public.users FOR SELECT
USING (auth.uid()::text = id OR auth.uid() = supabase_auth_id);

-- Policy 2: Les utilisateurs peuvent mettre à jour leur propre profil
-- ✅ CRITIQUE pour submitVerification
CREATE POLICY "Users can update own profile"
ON public.users FOR UPDATE
USING (auth.uid()::text = id OR auth.uid() = supabase_auth_id)
WITH CHECK (auth.uid()::text = id OR auth.uid() = supabase_auth_id);

-- Policy 3: Les utilisateurs authentifiés peuvent lire les profils basiques des autres
-- (pour afficher les noms dans l'app, les avatars, etc.)
CREATE POLICY "Authenticated users can read basic profiles"
ON public.users FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Policy 4: Les admins peuvent lire tous les profils
-- ⚠️ TEMPORAIREMENT DÉSACTIVÉE pour éviter la récursion infinie
-- Les admins utilisent le Dashboard Supabase pour voir tous les profils
-- Si vraiment nécessaire, stocker is_admin dans auth.users.raw_user_meta_data
-- et le vérifier sans sous-requête

-- CREATE POLICY "Admins can read all profiles"
-- ON public.users FOR SELECT
-- USING (
--   EXISTS (
--     SELECT 1 FROM public.users
--     WHERE id = auth.uid()::text
--     AND is_admin = true
--   )
-- );

-- Note: La policy "Authenticated users can read basic profiles" permet déjà
-- aux utilisateurs de lire les profils des autres (pour afficher les noms, etc.)

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ✅ VÉRIFICATION
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Vérifier que les policies sont bien créées
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- Vérifier que RLS est activé
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'users';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 📝 RÉSULTAT ATTENDU
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 3 policies doivent être présentes :
-- 1. "Users can read own profile" (SELECT)
-- 2. "Users can update own profile" (UPDATE) ✅ CRITIQUE pour submitVerification
-- 3. "Authenticated users can read basic profiles" (SELECT)
--
-- RLS doit être activé (rowsecurity = true)
--
-- Note: La policy "Admins can read all profiles" est désactivée pour éviter
-- la récursion infinie. Les admins utilisent le Dashboard Supabase.
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

