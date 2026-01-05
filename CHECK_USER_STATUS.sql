-- ============================================================================
-- VÉRIFIER LE STATUT DE L'UTILISATEUR momo@corail.com
-- ============================================================================
-- Exécutez ce script dans Supabase SQL Editor
-- ============================================================================

-- 1. Chercher l'utilisateur par email
SELECT 
  id,
  email,
  full_name,
  verification_status,
  created_at,
  updated_at
FROM users
WHERE email = 'momo@corail.com';

-- 2. Chercher l'utilisateur par UID (celui de la bannière debug)
SELECT 
  id,
  email,
  full_name,
  verification_status,
  created_at,
  updated_at
FROM users
WHERE id = 'H2nyal2rHvYJMKVQKne016kVB3';

-- 3. Afficher TOUS les utilisateurs avec leur statut
SELECT 
  id,
  email,
  full_name,
  verification_status,
  COUNT(*) OVER() as total_users
FROM users
ORDER BY created_at DESC
LIMIT 10;

