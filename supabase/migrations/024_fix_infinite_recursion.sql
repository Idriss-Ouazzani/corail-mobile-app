-- ============================================
-- 🔧 FIX: Infinite Recursion in RLS Policies
-- ============================================
-- Problème : La policy "Admins can read all profiles" crée une récursion infinie
-- Solution : Supprimer cette policy et simplifier l'accès

-- ============================================
-- ÉTAPE 1 : Supprimer la policy récursive
-- ============================================

DROP POLICY IF EXISTS "Admins can read all profiles" ON public.users;


-- ============================================
-- ÉTAPE 2 : Créer des policies non-récursives
-- ============================================

-- Policy 1 : Les utilisateurs peuvent lire leur propre profil
-- (celle-ci existe déjà et est OK)
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
CREATE POLICY "Users can read own profile"
ON public.users FOR SELECT
USING (id = auth.uid()::text);

-- Policy 2 : Les utilisateurs peuvent mettre à jour leur propre profil
-- (celle-ci existe déjà et est OK)
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
ON public.users FOR UPDATE
USING (id = auth.uid()::text);

-- Policy 3 : Les utilisateurs authentifiés peuvent lire les profils basiques des autres
-- (pour afficher les noms dans l'app, les avatars, etc.)
CREATE POLICY "Authenticated users can read basic profiles"
ON public.users FOR SELECT
USING (
  auth.uid() IS NOT NULL -- User doit être authentifié
);

-- Note : Pour les admins, on gérera les permissions côté code avec une fonction RPC
-- ou on utilisera le Service Role Key pour contourner RLS


-- ============================================
-- ÉTAPE 3 : Vérifier les policies actuelles
-- ============================================

SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  CASE 
    WHEN policyname LIKE '%admin%' OR policyname LIKE '%Admin%' THEN '⚠️ Potentiellement récursive'
    ELSE '✅ OK'
  END as status
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;


-- ============================================
-- ÉTAPE 4 : Fonction RPC pour vérifier si admin (optionnel)
-- ============================================
-- Si tu as besoin de vérifier si un user est admin depuis l'app :

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.users 
    WHERE id = auth.uid()::text 
    AND is_admin = TRUE
  );
END;
$$;

-- Utilisation dans l'app :
-- const { data, error } = await supabase.rpc('is_admin');


-- ============================================
-- RÉSULTAT FINAL
-- ============================================
-- Les policies sur public.users sont maintenant :
-- 1. Users can read own profile (lecture de son propre profil)
-- 2. Users can update own profile (modification de son propre profil)
-- 3. Authenticated users can read basic profiles (lecture des profils des autres)
-- 
-- Plus de récursion infinie ! ✅

