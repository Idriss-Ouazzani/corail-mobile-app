-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🚀 FIX COMPLET: Ajouter client_email aux tables rides ET personal_rides
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Ce script ajoute la colonne client_email aux deux tables pour permettre
-- le contact des clients par email en plus du téléphone
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ÉTAPE 1 : Ajouter client_email à la table rides
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALTER TABLE public.rides
ADD COLUMN IF NOT EXISTS client_email TEXT;

CREATE INDEX IF NOT EXISTS idx_rides_client_email 
ON public.rides(client_email);

COMMENT ON COLUMN public.rides.client_email IS 
  'Email address of the client (optional, but at least one contact method - phone or email - is recommended for marketplace rides)';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ÉTAPE 2 : Ajouter client_email à la table personal_rides
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALTER TABLE public.personal_rides
ADD COLUMN IF NOT EXISTS client_email TEXT;

CREATE INDEX IF NOT EXISTS idx_personal_rides_client_email 
ON public.personal_rides(client_email);

COMMENT ON COLUMN public.personal_rides.client_email IS 
  'Email address of the client (optional, alternative contact method)';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ✅ VÉRIFICATION
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Vérifier les colonnes client dans rides
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'rides' 
  AND column_name LIKE 'client%'
ORDER BY column_name;

-- Vérifier les colonnes client dans personal_rides
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'personal_rides' 
  AND column_name LIKE 'client%'
ORDER BY column_name;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 📊 RÉSULTAT ATTENDU
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Pour rides :
-- table_name | column_name  | data_type | is_nullable
-- -----------+--------------+-----------+-------------
-- rides      | client_email | text      | YES
-- rides      | client_name  | text      | YES
-- rides      | client_phone | text      | YES

-- Pour personal_rides :
-- table_name      | column_name  | data_type | is_nullable
-- ----------------+--------------+-----------+-------------
-- personal_rides  | client_email | text      | YES
-- personal_rides  | client_name  | text      | YES
-- personal_rides  | client_phone | text      | YES

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 📝 NOTES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Après ce script :
-- ✅ Les courses marketplace ont client_email disponible
-- ✅ Les courses personnelles ont client_email disponible
-- ✅ Les drivers qui prennent une course peuvent voir l'email du client
-- ✅ Bouton "Email" cliquable dans RideDetailScreen
-- ✅ Cohérence avec la table quotes qui a déjà client_email

-- Les anciennes courses ont client_email = NULL (normal)
-- Les nouvelles courses créées via l'app auront client_email renseigné

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

