-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🔍 CHECK & FIX: Statut de vérification de mydrissouazzani@gmail.com
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ÉTAPE 1 : Vérifier l'état actuel dans la DB
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SELECT 
  id,
  email,
  full_name,
  phone,
  verification_status,
  is_admin,
  verification_submitted_at,
  created_at,
  updated_at,
  CASE 
    WHEN verification_status = 'VERIFIED' THEN '✅ VERIFIED (tout va bien!)'
    WHEN verification_status = 'PENDING' THEN '⏳ EN ATTENTE (à valider)'
    WHEN verification_status = 'UNVERIFIED' THEN '❌ NON VÉRIFIÉ (à corriger)'
    WHEN verification_status = 'REJECTED' THEN '🚫 REJETÉ (à corriger)'
    ELSE '⚠️ STATUT INCONNU'
  END AS diagnostic
FROM public.users
WHERE email = 'mydrissouazzani@gmail.com';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ÉTAPE 2 : Vérifier l'auth Supabase
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SELECT 
  id AS supabase_auth_id,
  email,
  email_confirmed_at,
  created_at,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN '✅ Email confirmé'
    ELSE '❌ Email non confirmé'
  END AS email_status
FROM auth.users
WHERE email = 'mydrissouazzani@gmail.com';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 📊 DIAGNOSTIC
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Si verification_status = 'VERIFIED' dans la DB :
--   → Le problème est dans l'app (cache)
--   → Solution : Déconnexion + reconnexion

-- Si verification_status != 'VERIFIED' dans la DB :
--   → Le statut a été modifié par erreur
--   → Solution : Exécuter l'ÉTAPE 3 ci-dessous

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ÉTAPE 3 : FIX - Remettre le statut à VERIFIED
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 🔧 Décommente et exécute SEULEMENT si verification_status != 'VERIFIED'

-- UPDATE public.users
-- SET 
--   verification_status = 'VERIFIED',
--   is_admin = TRUE,  -- S'assurer qu'il est admin aussi
--   verification_submitted_at = NOW(),
--   updated_at = NOW()
-- WHERE email = 'mydrissouazzani@gmail.com';

-- -- Vérifier que ça a marché
-- SELECT 
--   email,
--   verification_status,
--   is_admin,
--   updated_at
-- FROM public.users
-- WHERE email = 'mydrissouazzani@gmail.com';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🔄 APRÈS LE FIX
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 1. DÉCONNECTE-TOI de l'app
-- 2. RECONNECTE-TOI avec mydrissouazzani@gmail.com
-- 3. Le statut VERIFIED devrait être chargé

-- Si ça ne fonctionne toujours pas après reconnexion :
-- → Ferme complètement l'app (force quit)
-- → Redémarre Expo : npx expo start --clear
-- → Reconnecte-toi

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

