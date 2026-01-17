-- ============================================================================
-- Vérifier que le profil VTC existe dans la base de données
-- ============================================================================

-- 1. Vérifier tous les profils VTC
SELECT 
    id,
    user_id,
    slug,
    display_name,
    is_public,
    photo_url,
    created_at
FROM vtc_profiles
ORDER BY created_at DESC;

-- 2. Si tu as un slug spécifique, cherche-le :
-- SELECT * FROM vtc_profiles WHERE slug = 'ton-slug';

-- 3. Vérifier si is_public est bien true
-- La page ne s'affiche que si is_public = true !



