-- ============================================
-- 🔧 VALIDATION MANUELLE D'UTILISATEUR + ADMIN
-- ============================================
-- Utilise ces requêtes dans Supabase SQL Editor

-- ============================================
-- ÉTAPE 1 : Trouver ton utilisateur
-- ============================================
-- Liste tous les utilisateurs récents
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  raw_user_meta_data->>'full_name' as full_name
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;


-- ============================================
-- ÉTAPE 2 : Valider l'email dans auth.users
-- ============================================
-- REMPLACE 'ton-email@example.com' par ton vrai email

UPDATE auth.users
SET 
  email_confirmed_at = NOW(),
  updated_at = NOW()
WHERE email = 'mydrissouazzani@gmail.com';  -- ⚠️ CHANGE L'EMAIL ICI


-- ============================================
-- ÉTAPE 3 : Mettre à jour public.users
-- ============================================
-- Valider le statut + rendre admin

UPDATE public.users
SET 
  verification_status = 'VERIFIED',
  is_admin = TRUE,
  updated_at = NOW()
WHERE email = 'mydrissouazzani@gmail.com';  -- ⚠️ CHANGE L'EMAIL ICI


-- ============================================
-- ÉTAPE 4 : Vérification
-- ============================================
-- Vérifie que tout est OK

SELECT 
  au.id as auth_id,
  au.email,
  au.email_confirmed_at,
  pu.id as public_user_id,
  pu.verification_status,
  pu.is_admin,
  pu.full_name
FROM auth.users au
LEFT JOIN public.users pu ON au.email = pu.email
WHERE au.email = 'mydrissouazzani@gmail.com'  -- ⚠️ CHANGE L'EMAIL ICI
ORDER BY au.created_at DESC;


-- ============================================
-- 🚨 ÉTAPE BONUS : Réactiver le trigger (IMPORTANT)
-- ============================================
-- Le trigger on_auth_user_created est désactivé, c'est pour ça que les emails ne marchent pas !
-- Une fois que tu as validé ton compte manuellement, réactive-le :

-- Vérifier l'état actuel du trigger
SELECT 
  tgname as trigger_name,
  tgenabled as enabled,
  CASE 
    WHEN tgenabled = 'O' THEN '✅ Enabled'
    WHEN tgenabled = 'D' THEN '❌ Disabled'
    ELSE 'Unknown'
  END as status
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';

-- Réactiver le trigger
ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;

-- Vérifier que c'est réactivé
SELECT 
  tgname as trigger_name,
  CASE 
    WHEN tgenabled = 'O' THEN '✅ Trigger activé !'
    WHEN tgenabled = 'D' THEN '❌ Trigger toujours désactivé'
    ELSE 'Unknown'
  END as status
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';


-- ============================================
-- 🛠️ ALTERNATIVE : Valider par ID (si l'email ne marche pas)
-- ============================================
-- Si tu connais l'ID Supabase Auth de l'utilisateur :

-- UPDATE auth.users
-- SET 
--   email_confirmed_at = NOW(),
--   updated_at = NOW()
-- WHERE id = 'UUID-DE-TON-UTILISATEUR';  -- Remplace par l'UUID

-- UPDATE public.users
-- SET 
--   verification_status = 'VERIFIED',
--   is_admin = TRUE,
--   updated_at = NOW()
-- WHERE supabase_auth_id = 'UUID-DE-TON-UTILISATEUR';  -- Remplace par l'UUID


-- ============================================
-- 📝 NOTES IMPORTANTES
-- ============================================
-- 1. Ces requêtes doivent être exécutées dans Supabase SQL Editor
-- 2. Remplace 'mydrissouazzani@gmail.com' par ton vrai email
-- 3. RÉACTIVE LE TRIGGER après validation manuelle sinon les prochains users auront le même problème !
-- 4. Si le trigger était désactivé, c'est pour ça que les emails de confirmation ne partaient plus

