-- ============================================
-- 🔍 DEBUG: Pourquoi Realtime fonctionne dans un sens seulement ?
-- ============================================

-- 1. Vérifier les 2 utilisateurs
SELECT 
  id,
  email,
  verification_status,
  is_admin,
  expo_push_token
FROM public.users
WHERE email IN ('mydrissouazzani@gmail.com', 'ademola@corail.com');

-- 2. Vérifier les policies SELECT sur rides
SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  qual AS using_expression
FROM pg_policies
WHERE tablename = 'rides'
AND cmd = 'SELECT'
ORDER BY policyname;

-- 3. Vérifier les dernières courses créées
SELECT 
  id,
  creator_id,
  status,
  visibility,
  created_at,
  pickup_address,
  dropoff_address
FROM public.rides
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 10;

-- 4. Vérifier qui peut voir quoi avec les policies actuelles
-- (Simule la vue pour chaque utilisateur)

