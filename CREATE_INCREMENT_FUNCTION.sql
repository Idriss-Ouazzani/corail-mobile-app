-- ============================================================================
-- Créer la fonction increment_profile_view
-- ============================================================================
-- Cette fonction incrémente le compteur de vues du profil VTC
-- ============================================================================

-- Supprimer l'ancienne si elle existe
DROP FUNCTION IF EXISTS increment_profile_view(TEXT);

-- Créer la nouvelle fonction
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

-- Tester la fonction
SELECT increment_profile_view('poochi');

-- Vérifier que ça a fonctionné
SELECT slug, view_count, last_viewed_at 
FROM vtc_profiles 
WHERE slug = 'poochi';

