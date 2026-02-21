-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🚀 FIX: Ajouter la colonne client_email à la table rides
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Cette colonne est nécessaire pour que les drivers qui prennent une course
-- puissent contacter le client par email (en plus du téléphone)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Ajouter la colonne client_email
ALTER TABLE public.rides
ADD COLUMN IF NOT EXISTS client_email TEXT;

-- Créer un index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_rides_client_email 
ON public.rides(client_email);

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

-- Vérifier les colonnes client de la table rides
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'rides' 
  AND column_name LIKE 'client%'
ORDER BY column_name;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 📝 RÉSULTAT ATTENDU
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Colonnes client dans rides :
-- - client_name (text, nullable)
-- - client_phone (text, nullable)
-- - client_email (text, nullable) ← NOUVEAU
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

