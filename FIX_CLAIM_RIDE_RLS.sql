-- ============================================
-- 🔧 FIX: Permettre de "claim" une course PUBLISHED
-- ============================================
-- Problème : La policy "Pickers can update claimed rides" vérifie picker_id = auth.uid()
-- mais quand on claim une ride, picker_id est encore NULL !

-- Solution : Ajouter une policy pour permettre de claim une ride PUBLISHED

-- Policy : Permettre de mettre à jour une ride PUBLISHED pour la claim
DROP POLICY IF EXISTS "Users can claim published rides" ON public.rides;
CREATE POLICY "Users can claim published rides"
ON public.rides FOR UPDATE
USING (
  status = 'PUBLISHED' 
  AND picker_id IS NULL -- Pas encore réclamée
  AND auth.uid() IS NOT NULL
  AND creator_id != auth.uid()::text -- Ne peut pas claim sa propre course
)
WITH CHECK (
  status = 'CLAIMED' -- Doit passer à CLAIMED
  AND picker_id = auth.uid()::text -- Le picker doit être celui qui fait l'update
);

-- Vérifier les policies
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'rides'
AND cmd = 'UPDATE'
ORDER BY policyname;

-- ✅ Tu devrais voir 3 policies UPDATE :
-- 1. "Creators can update own rides"
-- 2. "Pickers can update claimed rides" 
-- 3. "Users can claim published rides" ← NOUVELLE

