-- ============================================================================
-- VTC Profiles - Supabase Storage Configuration (VERSION CORRIGÉE)
-- ============================================================================
-- ⚠️  IMPORTANT : Ce script NE PEUT PAS créer le bucket ni les policies
--     car tu n'as pas les permissions nécessaires sur storage.objects
-- 
-- À FAIRE MANUELLEMENT :
-- 1. Dashboard → Storage → New bucket → Name: vtc-profiles, Public: OUI
-- 2. Policies → Voir les instructions dans VTC_PHOTO_UPLOAD_GUIDE.md
-- ============================================================================

-- ============================================================================
-- Fonction helper pour générer l'URL de la photo
-- ============================================================================
-- Cette fonction PEUT être créée (elle ne touche pas à storage.objects)

CREATE OR REPLACE FUNCTION get_vtc_profile_photo_url(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  storage_url TEXT;
  -- Remplacer par ton URL de projet Supabase
  project_url TEXT := current_setting('app.settings.supabase_url', true);
BEGIN
  -- Si la variable n'est pas définie, utiliser une valeur par défaut
  IF project_url IS NULL OR project_url = '' THEN
    project_url := 'https://qeheawdjlwlkhnwbhqcg.supabase.co';
  END IF;

  -- Chercher si un fichier existe pour cet user
  -- (lecture seule, donc OK)
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
-- Test de la fonction
-- ============================================================================
-- Tu peux tester avec ton user_id :
-- SELECT get_vtc_profile_photo_url('ton-user-id-uuid-ici');

-- ============================================================================
-- COMMENTAIRES
-- ============================================================================
COMMENT ON FUNCTION get_vtc_profile_photo_url(UUID) 
IS 'Retourne l''URL publique de la photo de profil d''un VTC (ou NULL si pas de photo). USAGE: SELECT get_vtc_profile_photo_url(''uuid'')';

-- ============================================================================
-- INSTRUCTIONS POUR LE BUCKET (à faire via UI)
-- ============================================================================
-- 
-- 1. Créer le bucket :
--    Dashboard → Storage → New bucket
--    - Name: vtc-profiles
--    - Public: ✅ OUI
--    - Create
--
-- 2. Policies (optionnel, pour sécuriser) :
--    
--    A. Lecture publique :
--       Policy name: Public Access
--       Definition: SELECT
--       Target: public
--       Expression: true
--
--    B. Upload (propriétaire) :
--       Policy name: Users can upload to own folder
--       Definition: INSERT
--       Target: authenticated
--       WITH CHECK: (bucket_id = 'vtc-profiles'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)
--
--    C. Suppression (propriétaire) :
--       Policy name: Users can delete own files
--       Definition: DELETE
--       Target: authenticated
--       USING: (bucket_id = 'vtc-profiles'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)
--
-- ============================================================================
-- Structure recommandée :
-- ============================================================================
-- vtc-profiles/
--   {user_id}/
--     profile.jpg
--
-- URL publique :
-- https://qeheawdjlwlkhnwbhqcg.supabase.co/storage/v1/object/public/vtc-profiles/{user_id}/profile.jpg
-- ============================================================================

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================
-- ✅ Ce script peut être exécuté sans erreur (crée juste la fonction helper)
-- ⚠️  Le bucket et les policies doivent être créés via l'UI Supabase
-- ============================================================================



