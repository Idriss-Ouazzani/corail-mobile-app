-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🚀 FIX: Récursion infinie dans les politiques RLS (version simplifiée)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Ce script supprime toutes les policies problématiques et recrée uniquement
-- les 3 policies essentielles SANS récursion.
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 1️⃣ S'assurer que RLS est activé
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2️⃣ Supprimer TOUTES les policies existantes pour repartir propre
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can read basic profiles" ON public.users;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.users;
DROP POLICY IF EXISTS "Users can update their own push token" ON public.users;
DROP POLICY IF EXISTS "Service role can insert users" ON public.users;

-- 3️⃣ Créer les 3 policies essentielles (SANS RÉCURSION)

-- Policy 1: Les utilisateurs peuvent lire leur propre profil
CREATE POLICY "Users can read own profile"
ON public.users FOR SELECT
USING (
  auth.uid()::text = id 
  OR 
  auth.uid() = supabase_auth_id
);

-- Policy 2: Les utilisateurs peuvent mettre à jour leur propre profil
-- ✅ CRITIQUE pour submitVerification
CREATE POLICY "Users can update own profile"
ON public.users FOR UPDATE
USING (
  auth.uid()::text = id 
  OR 
  auth.uid() = supabase_auth_id
)
WITH CHECK (
  auth.uid()::text = id 
  OR 
  auth.uid() = supabase_auth_id
);

-- Policy 3: Les utilisateurs authentifiés peuvent lire les profils basiques des autres
-- (pour afficher les noms dans l'app, les avatars, etc.)
CREATE POLICY "Authenticated users can read basic profiles"
ON public.users FOR SELECT
USING (
  auth.uid() IS NOT NULL
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ✅ VÉRIFICATION
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Vérifier que les policies sont bien créées
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN policyname LIKE '%admin%' OR policyname LIKE '%Admin%' THEN '⚠️ Attention récursion possible'
    ELSE '✅ OK'
  END as status
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
-- Exactement 3 policies :
-- 1. "Authenticated users can read basic profiles" (SELECT) ✅
-- 2. "Users can read own profile" (SELECT) ✅
-- 3. "Users can update own profile" (UPDATE) ✅ CRITIQUE
--
-- Toutes avec status "✅ OK" (pas de récursion)
-- RLS activé (rowsecurity = true)
--
-- ⚠️ Important : Pas de policy "Admins can read all profiles" car elle
-- cause une récursion infinie. Les admins utilisent le Dashboard Supabase.
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

