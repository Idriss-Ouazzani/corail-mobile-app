-- ============================================================================
-- Migration 021: Cleanup Policies (suppression doublons + sécurisation)
-- ============================================================================

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 1️⃣ NETTOYER LES POLICIES RIDES (supprimer doublons)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Supprimer TOUTES les policies rides pour repartir propre
DROP POLICY IF EXISTS "Anyone can read public rides" ON public.rides;
DROP POLICY IF EXISTS "Verified users can read public rides" ON public.rides;
DROP POLICY IF EXISTS "Authenticated users can read public rides" ON public.rides;
DROP POLICY IF EXISTS "Users can read group rides" ON public.rides;
DROP POLICY IF EXISTS "Users can read their own rides" ON public.rides;
DROP POLICY IF EXISTS "Users can create rides" ON public.rides;
DROP POLICY IF EXISTS "Creators can update their rides" ON public.rides;

-- Recréer les policies PROPRES
-- Policy 1: Authentifié peut lire courses PUBLIC
CREATE POLICY "Authenticated users can read public rides"
ON public.rides
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND visibility = 'PUBLIC' 
  AND status IN ('PUBLISHED', 'CLAIMED', 'IN_PROGRESS')
);

-- Policy 2: Users peuvent lire leurs propres courses
CREATE POLICY "Users can read their own rides"
ON public.rides
FOR SELECT
USING (
  auth.uid()::text = creator_id
  OR auth.uid()::text = picker_id
);

-- Policy 3: Users peuvent lire courses de leurs groupes
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

-- Policy 4: Users peuvent créer des courses
CREATE POLICY "Users can create rides"
ON public.rides
FOR INSERT
WITH CHECK (auth.uid()::text = creator_id);

-- Policy 5: Créateurs peuvent modifier leurs courses
CREATE POLICY "Creators can update their rides"
ON public.rides
FOR UPDATE
USING (auth.uid()::text = creator_id);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 2️⃣ NETTOYER LES POLICIES USERS (SÉCURISER !)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Supprimer les policies DANGEREUSES
DROP POLICY IF EXISTS "Anyone can insert users" ON public.users;
DROP POLICY IF EXISTS "Anyone can update users" ON public.users;
DROP POLICY IF EXISTS "Anyone can view users" ON public.users;

-- Supprimer aussi les anciennes pour repartir propre
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.users;
DROP POLICY IF EXISTS "Service role can insert users" ON public.users;

-- Recréer les policies SÉCURISÉES
-- Policy 1: Users peuvent lire leur propre profil
CREATE POLICY "Users can read own profile"
ON public.users
FOR SELECT
USING (auth.uid()::text = id);

-- Policy 2: Users peuvent mettre à jour leur propre profil
CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
USING (auth.uid()::text = id);

-- Policy 3: Admins peuvent lire tous les profils
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

-- Policy 4: Insertion UNIQUEMENT via trigger (pas de policy INSERT publique)
-- Le trigger handle_new_user() se charge de l'insertion automatique

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ✅ VÉRIFICATION FINALE
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd,
  CASE 
    WHEN policyname LIKE '%Anyone%' THEN '🚨 DANGEREUX'
    ELSE '✅ OK'
  END as security_check
FROM pg_policies
WHERE tablename IN ('users', 'rides')
ORDER BY tablename, policyname;

-- Résultat attendu :
-- ✅ Pas de policy "Anyone..."
-- ✅ Toutes les policies utilisent auth.uid()
-- ✅ Total: 8 policies (5 pour rides, 3 pour users)

