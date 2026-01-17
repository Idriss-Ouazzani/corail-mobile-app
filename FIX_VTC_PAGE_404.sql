-- ============================================================================
-- FIX : Résoudre le 404 sur la page VTC
-- ============================================================================

-- 1. Vérifier que le profil existe et est public
SELECT 
    slug,
    display_name,
    is_public,
    created_at
FROM vtc_profiles
WHERE slug = 'poochi';
-- RÉSULTAT ATTENDU : is_public = true

-- 2. Si is_public = false, le mettre à true
UPDATE vtc_profiles
SET is_public = true
WHERE slug = 'poochi';

-- 3. Créer la fonction increment_profile_view si elle n'existe pas
DROP FUNCTION IF EXISTS increment_profile_view(TEXT);

CREATE OR REPLACE FUNCTION increment_profile_view(profile_slug TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE vtc_profiles
  SET 
    view_count = COALESCE(view_count, 0) + 1,
    last_viewed_at = NOW()
  WHERE slug = profile_slug 
  AND is_public = true;
END;
$$;

-- 4. Vérifier que tout fonctionne
SELECT 
    slug,
    display_name,
    is_public,
    view_count,
    photo_url
FROM vtc_profiles
WHERE slug = 'poochi';

-- ✅ Si is_public = true, la page devrait fonctionner !



