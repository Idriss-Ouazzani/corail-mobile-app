-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🚀 FIX: Confirmer le user ademola@corail.com et créer son profil
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Ce script corrige le user ademola@corail.com qui est bloqué à cause de
-- "Email not confirmed"
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 1️⃣ Confirmer l'email dans auth.users
UPDATE auth.users
SET 
  email_confirmed_at = NOW()
WHERE email = 'ademola@corail.com';

-- 2️⃣ Créer le profil dans public.users si il n'existe pas
INSERT INTO public.users (
  id,
  supabase_auth_id,
  email,
  full_name,
  verification_status,
  has_accepted_terms,
  credits,
  created_at,
  updated_at
)
SELECT 
  id::text,
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', 'Ademola'),
  'UNVERIFIED',
  FALSE,
  2, -- Crédits de bienvenue
  created_at,
  NOW()
FROM auth.users
WHERE email = 'ademola@corail.com'
ON CONFLICT (id) DO UPDATE
SET
  verification_status = 'UNVERIFIED',
  has_accepted_terms = FALSE,
  updated_at = NOW();

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ✅ VÉRIFICATION
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Vérifier dans auth.users
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  raw_user_meta_data->>'full_name' as full_name
FROM auth.users
WHERE email = 'ademola@corail.com';

-- Vérifier dans public.users
SELECT 
  id,
  email,
  full_name,
  verification_status,
  has_accepted_terms,
  credits,
  created_at
FROM public.users
WHERE email = 'ademola@corail.com';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 📝 RÉSULTAT ATTENDU
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- auth.users:
--   - email_confirmed_at: 2026-01-XX XX:XX:XX (pas NULL)
--
-- public.users:
--   - verification_status: 'UNVERIFIED'
--   - has_accepted_terms: FALSE
--   - credits: 2
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

