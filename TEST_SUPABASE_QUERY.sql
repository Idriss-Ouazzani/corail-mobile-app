-- ============================================================================
-- TESTER LA REQUÊTE EXACTE QUE L'APP UTILISE
-- ============================================================================
-- Exécutez dans Supabase SQL Editor
-- ============================================================================

-- 1. La requête EXACTE que getVerificationStatus() utilise
SELECT *
FROM users
WHERE id = 'H2nyal2rHvYJMKVQKne016kVB3';

-- 2. Vérifier que la colonne verification_status existe et a la bonne valeur
SELECT 
  id,
  email,
  full_name,
  verification_status,
  phone,
  siren,
  professional_card_number,
  has_accepted_terms,
  is_admin,
  created_at
FROM users
WHERE id = 'H2nyal2rHvYJMKVQKne016kVB3';

-- 3. Vérifier le type de données de verification_status
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'users' 
  AND column_name = 'verification_status';

