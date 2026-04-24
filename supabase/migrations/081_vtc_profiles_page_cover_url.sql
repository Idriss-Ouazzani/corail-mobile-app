-- Bannière / arrière-plan personnalisable pour la page publique VTC (getcorail.com + app).
-- NULL = utiliser l’image Unsplash par défaut côté clients.

ALTER TABLE public.vtc_profiles
  ADD COLUMN IF NOT EXISTS page_cover_url text;

COMMENT ON COLUMN public.vtc_profiles.page_cover_url IS
  'URL de l’image de couverture (bannière) de la page pro ; null = image par défaut.';
