-- ============================================================================
-- DEBUG : Pourquoi le 404 persiste ?
-- ============================================================================

-- 1. Vérifier EXACTEMENT ce qu'il y a dans la table
SELECT 
    id,
    user_id,
    slug,
    display_name,
    is_public,
    photo_url,
    created_at
FROM vtc_profiles
WHERE slug = 'poochi';

-- RÉSULTAT ATTENDU : 1 ligne avec is_public = true

-- 2. Si aucun résultat, chercher tous les profils
SELECT slug, display_name, is_public 
FROM vtc_profiles 
ORDER BY created_at DESC 
LIMIT 5;

-- 3. Tester la requête EXACTE que fait la page Next.js
SELECT * 
FROM vtc_profiles 
WHERE slug = 'poochi' 
AND is_public = true;

-- SI CETTE REQUÊTE RETOURNE 0 LIGNE → C'est le problème !
-- SI ELLE RETOURNE 1 LIGNE → Le problème est ailleurs (cache Vercel, etc.)



