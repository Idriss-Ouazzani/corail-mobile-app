-- ============================================
-- 🔒 ACTIVER RLS sur la table rides
-- ============================================
-- Realtime nécessite que RLS soit activé pour fonctionner

-- Étape 1 : Activer RLS sur la table rides
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;

-- Étape 2 : Créer des politiques pour que tout le monde puisse lire les courses publiées
-- (sinon Realtime ne pourra pas broadcaster les changements)

-- Policy : Les utilisateurs authentifiés peuvent lire toutes les courses publiées
DROP POLICY IF EXISTS "Anyone can read published rides" ON public.rides;
CREATE POLICY "Anyone can read published rides"
ON public.rides FOR SELECT
USING (
  status = 'PUBLISHED' 
  AND auth.uid() IS NOT NULL -- Utilisateur authentifié
);

-- Policy : Les utilisateurs peuvent lire leurs propres courses (quel que soit le statut)
DROP POLICY IF EXISTS "Users can read own rides" ON public.rides;
CREATE POLICY "Users can read own rides"
ON public.rides FOR SELECT
USING (
  creator_id = auth.uid()::text 
  OR picker_id = auth.uid()::text
);

-- Policy : Les utilisateurs peuvent créer des courses
DROP POLICY IF EXISTS "Users can create rides" ON public.rides;
CREATE POLICY "Users can create rides"
ON public.rides FOR INSERT
WITH CHECK (
  creator_id = auth.uid()::text
);

-- Policy : Les créateurs peuvent mettre à jour leurs propres courses
DROP POLICY IF EXISTS "Creators can update own rides" ON public.rides;
CREATE POLICY "Creators can update own rides"
ON public.rides FOR UPDATE
USING (creator_id = auth.uid()::text);

-- Policy : Les pickers peuvent mettre à jour les courses qu'ils ont prises
DROP POLICY IF EXISTS "Pickers can update claimed rides" ON public.rides;
CREATE POLICY "Pickers can update claimed rides"
ON public.rides FOR UPDATE
USING (picker_id = auth.uid()::text);

-- Policy : Les créateurs peuvent supprimer leurs propres courses
DROP POLICY IF EXISTS "Creators can delete own rides" ON public.rides;
CREATE POLICY "Creators can delete own rides"
ON public.rides FOR DELETE
USING (creator_id = auth.uid()::text);

-- Vérifier que RLS est activé
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'rides';

-- Vérifier les policies créées
SELECT 
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'rides'
ORDER BY policyname;

-- ✅ Si rowsecurity = true et que tu vois toutes les policies, c'est bon !

