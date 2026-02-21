-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🔍 Vérifier le statut de vérification d'un utilisateur
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 1️⃣ Vérifier le statut dans public.users
SELECT 
  id,
  email,
  full_name,
  verification_status,
  is_admin,
  has_accepted_terms,
  created_at,
  verification_submitted_at
FROM public.users
WHERE email = 'mydrissouazzani@gmail.com';

-- 2️⃣ Vérifier dans auth.users aussi
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  raw_user_meta_data->>'full_name' as full_name
FROM auth.users
WHERE email = 'mydrissouazzani@gmail.com';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 📝 RÉSULTAT ATTENDU
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Dans public.users :
-- - verification_status: 'VERIFIED' ✅
-- - is_admin: true ✅
-- - has_accepted_terms: true ✅
-- - email_confirmed_at: pas NULL ✅
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🔧 SI NÉCESSAIRE : Forcer le statut à VERIFIED
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Si verification_status n'est pas 'VERIFIED', corrige-le :
-- UPDATE public.users
-- SET 
--   verification_status = 'VERIFIED',
--   is_admin = true,
--   has_accepted_terms = true
-- WHERE email = 'mydrissouazzani@gmail.com';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

