-- ============================================================================
-- Désactiver RLS sur vtc_profiles (pour Firebase Auth)
-- ============================================================================
-- Description: Les policies RLS utilisent auth.uid() qui ne fonctionne pas
--              avec Firebase Auth. On désactive RLS pour le MVP.
-- Note: La sécurité est assurée côté app (Firebase Auth + API checks)
-- ============================================================================

-- 1. Supprimer les policies existantes
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON vtc_profiles;
DROP POLICY IF EXISTS "Users can manage their own profile" ON vtc_profiles;

-- 2. Désactiver RLS sur la table
ALTER TABLE vtc_profiles DISABLE ROW LEVEL SECURITY;

-- 3. Ajouter la contrainte UNIQUE sur user_id (nécessaire pour l'upsert)
ALTER TABLE vtc_profiles 
DROP CONSTRAINT IF EXISTS vtc_profiles_user_id_unique;

ALTER TABLE vtc_profiles 
ADD CONSTRAINT vtc_profiles_user_id_unique UNIQUE (user_id);

-- 4. Vérification
SELECT 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE tablename = 'vtc_profiles';

-- Si rowsecurity = false, c'est bon ! ✅



