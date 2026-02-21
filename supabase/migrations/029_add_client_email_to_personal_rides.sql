-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Migration 029: Ajouter client_email à la table personal_rides
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Cette migration ajoute la colonne client_email à la table personal_rides
-- pour permettre le contact du client par email (en plus du téléphone)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Ajouter la colonne client_email
ALTER TABLE public.personal_rides
ADD COLUMN IF NOT EXISTS client_email TEXT;

-- Créer un index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_personal_rides_client_email 
ON public.personal_rides(client_email);

COMMENT ON COLUMN public.personal_rides.client_email IS 
  'Email address of the client (optional, alternative contact method)';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ✅ VÉRIFICATION
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Vérifier que la colonne est bien créée
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'personal_rides' 
  AND column_name = 'client_email';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 📝 NOTES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Après cette migration :
-- - Les courses personnelles peuvent avoir client_phone OU client_email (ou les deux)
-- - Les anciennes courses ont client_email = NULL (normal)
-- - Les nouvelles courses créées via l'app auront client_email renseigné
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

