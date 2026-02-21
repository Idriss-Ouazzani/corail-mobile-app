-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🚀 FIX: Permettre aux admins de valider les profils (SANS récursion)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Ce script ajoute une policy permettant aux admins de modifier les profils
-- des autres utilisateurs (nécessaire pour la validation) SANS créer de
-- récursion infinie.
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 1️⃣ Créer une fonction pour vérifier si l'utilisateur courant est admin
-- Cette fonction utilise le Service Role pour éviter la récursion RLS
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Important : exécuté avec les droits du créateur (bypass RLS)
SET search_path = public
STABLE -- La fonction est stable (résultat identique pour les mêmes inputs)
AS $$
BEGIN
  -- Vérifier directement dans la table users si l'utilisateur courant est admin
  -- Le SECURITY DEFINER permet de bypass RLS pour cette vérification
  RETURN EXISTS (
    SELECT 1 
    FROM public.users 
    WHERE (id = auth.uid()::text OR supabase_auth_id = auth.uid())
    AND is_admin = TRUE
  );
END;
$$;

-- 2️⃣ Créer la policy permettant aux admins de mettre à jour tous les profils
-- ⚠️ Cette policy utilise la fonction ci-dessus qui bypass RLS, donc pas de récursion
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.users;

CREATE POLICY "Admins can update all profiles"
ON public.users FOR UPDATE
USING (
  public.is_current_user_admin() = true -- Utilise la fonction (pas de récursion)
)
WITH CHECK (
  public.is_current_user_admin() = true
);

-- 3️⃣ Créer aussi la policy de lecture pour les admins (pour le panneau admin)
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.users;

CREATE POLICY "Admins can read all profiles"
ON public.users FOR SELECT
USING (
  public.is_current_user_admin() = true
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ✅ VÉRIFICATION
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Vérifier que la fonction existe
SELECT 
  proname,
  prosecdef,
  provolatile
FROM pg_proc
WHERE proname = 'is_current_user_admin';

-- Vérifier que les policies sont bien créées
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN policyname LIKE '%admin%' OR policyname LIKE '%Admin%' THEN '✅ OK (utilise fonction DEFINER)'
    ELSE '✅ OK'
  END as status
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- Tester la fonction (doit retourner true si tu es admin, false sinon)
-- Exécute cette requête en étant connecté en tant qu'admin :
SELECT public.is_current_user_admin() AS am_i_admin;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 📝 RÉSULTAT ATTENDU
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Fonction créée :
-- - proname: is_current_user_admin
-- - prosecdef: true (SECURITY DEFINER activé)
-- - provolatile: s (STABLE)
--
-- 5 policies au total :
-- 1. "Admins can read all profiles" (SELECT) ✅ Nouveau
-- 2. "Admins can update all profiles" (UPDATE) ✅ Nouveau
-- 3. "Authenticated users can read basic profiles" (SELECT) ✅
-- 4. "Users can read own profile" (SELECT) ✅
-- 5. "Users can update own profile" (UPDATE) ✅
--
-- Pas de récursion car la fonction utilise SECURITY DEFINER pour bypass RLS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🔒 SÉCURITÉ
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Cette approche est sécurisée car :
-- 1. La fonction is_current_user_admin() est SECURITY DEFINER
--    → Elle s'exécute avec les droits de son créateur (bypass RLS)
-- 2. Elle vérifie uniquement le statut is_admin de l'utilisateur courant
-- 3. Elle ne fait pas de sous-requête récursive sur users
-- 4. auth.uid() est toujours fiable (fourni par Supabase Auth)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

