-- ============================================================================
-- VTC Profiles - Supabase Storage Configuration
-- ============================================================================
-- Description: Bucket pour stocker les photos de profil des VTC
-- ============================================================================

-- Créer le bucket pour les photos de profil VTC
INSERT INTO storage.buckets (id, name, public)
VALUES ('vtc-profiles', 'vtc-profiles', true)
ON CONFLICT (id) DO NOTHING;

-- Politique RLS pour l'upload
-- Seul le propriétaire du profil peut uploader sa photo
CREATE POLICY "Users can upload their own profile photo"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vtc-profiles' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Politique RLS pour la suppression
-- Seul le propriétaire peut supprimer sa photo
CREATE POLICY "Users can delete their own profile photo"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'vtc-profiles' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Politique RLS pour la lecture
-- Tout le monde peut voir les photos publiques
CREATE POLICY "Public profile photos are viewable by everyone"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'vtc-profiles');

-- ============================================================================
-- Structure des fichiers dans le bucket
-- ============================================================================
-- vtc-profiles/
--   {user_id}/
--     profile.jpg  (ou profile.png, profile.webp)
--
-- Exemple:
--   vtc-profiles/550e8400-e29b-41d4-a716-446655440000/profile.jpg
--
-- URL publique:
--   https://qeheawdjlwlkhnwbhqcg.supabase.co/storage/v1/object/public/vtc-profiles/{user_id}/profile.jpg
-- ============================================================================

-- Fonction helper pour générer l'URL de la photo
CREATE OR REPLACE FUNCTION get_vtc_profile_photo_url(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  storage_url TEXT;
  project_url TEXT := 'https://qeheawdjlwlkhnwbhqcg.supabase.co'; -- Remplacer par ta vraie URL
BEGIN
  -- Chercher si un fichier existe pour cet user
  SELECT name INTO storage_url
  FROM storage.objects
  WHERE bucket_id = 'vtc-profiles'
    AND (storage.foldername(name))[1] = user_uuid::text
  LIMIT 1;
  
  IF storage_url IS NOT NULL THEN
    RETURN project_url || '/storage/v1/object/public/vtc-profiles/' || storage_url;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTAIRES
-- ============================================================================
COMMENT ON POLICY "Users can upload their own profile photo" ON storage.objects 
IS 'Permet aux VTC d''uploader leur photo de profil dans leur dossier user_id';

COMMENT ON POLICY "Public profile photos are viewable by everyone" ON storage.objects 
IS 'Les photos de profil sont publiques pour être affichées sur la page VTC';

COMMENT ON FUNCTION get_vtc_profile_photo_url(UUID) 
IS 'Retourne l''URL publique de la photo de profil d''un VTC (ou NULL si pas de photo)';

