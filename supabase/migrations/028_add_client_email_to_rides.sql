-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Migration 028: Ajouter client_email à la table rides
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Cette migration ajoute la colonne client_email à la table rides
-- pour permettre le contact du client par email (en plus du téléphone)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Ajouter la colonne client_email
ALTER TABLE public.rides
ADD COLUMN IF NOT EXISTS client_email TEXT;

-- Créer un index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_rides_client_email 
ON public.rides(client_email);

COMMENT ON COLUMN public.rides.client_email IS 
  'Email address of the client (optional, but at least one contact method - phone or email - is recommended for marketplace rides)';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ✅ VÉRIFICATION
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Vérifier que la colonne est bien créée
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'rides' 
  AND column_name = 'client_email';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 📝 NOTES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Après cette migration :
-- - Les courses marketplace peuvent avoir client_phone OU client_email (ou les deux)
-- - Les anciennes courses ont client_email = NULL (normal)
-- - Les nouvelles courses créées via l'app auront client_email renseigné
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

