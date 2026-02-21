-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🔍 DEBUG: Pourquoi les infos client ne s'affichent pas ?
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ÉTAPE 1 : Vérifier que la colonne client_email existe
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'rides' 
  AND column_name LIKE 'client%'
ORDER BY column_name;

-- ❓ Si tu ne vois PAS "client_email" ici, il faut exécuter ADD_CLIENT_EMAIL_TO_RIDES.sql

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ÉTAPE 2 : Vérifier les courses que TU as prises (picker)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Remplace par TON user ID (celui qui prend les courses)
-- Tu peux le trouver en regardant les logs Metro ou en exécutant CHECK_MY_CURRENT_USER.sql

SELECT 
  id,
  status,
  visibility,
  creator_id,
  picker_id,
  client_name,
  client_phone,
  -- client_email, -- Décommente si la colonne existe
  pickup_address,
  dropoff_address,
  created_at,
  CASE 
    WHEN client_name IS NULL AND client_phone IS NULL THEN '❌ AUCUNE INFO CLIENT'
    WHEN client_name IS NOT NULL AND client_phone IS NOT NULL THEN '✅ INFO CLIENT COMPLÈTE'
    WHEN client_name IS NOT NULL THEN '⚠️ NOM SEULEMENT'
    WHEN client_phone IS NOT NULL THEN '⚠️ TÉLÉPHONE SEULEMENT'
  END AS diagnostic
FROM rides
WHERE picker_id = 'db5f396a-4c75-4792-a6ab-7f071d394bfd' -- 👈 REMPLACE par ton user ID
ORDER BY created_at DESC
LIMIT 10;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ÉTAPE 3 : Vérifier les courses MARKETPLACE (PUBLISHED)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SELECT 
  id,
  status,
  visibility,
  creator_id,
  client_name,
  client_phone,
  -- client_email, -- Décommente si la colonne existe
  pickup_address,
  created_at,
  CASE 
    WHEN client_name IS NULL AND client_phone IS NULL THEN '❌ AUCUNE INFO CLIENT'
    WHEN client_name IS NOT NULL AND client_phone IS NOT NULL THEN '✅ INFO CLIENT COMPLÈTE'
    WHEN client_name IS NOT NULL THEN '⚠️ NOM SEULEMENT'
    WHEN client_phone IS NOT NULL THEN '⚠️ TÉLÉPHONE SEULEMENT'
  END AS diagnostic
FROM rides
WHERE status = 'PUBLISHED'
  AND visibility = 'PUBLIC'
ORDER BY created_at DESC
LIMIT 10;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ÉTAPE 4 : Vérifier les créateurs des courses marketplace
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SELECT 
  r.id AS ride_id,
  r.status,
  r.client_name,
  r.client_phone,
  u.email AS creator_email,
  u.full_name AS creator_name,
  u.phone AS creator_phone
FROM rides r
LEFT JOIN users u ON r.creator_id = u.id
WHERE r.status = 'PUBLISHED'
  AND r.visibility = 'PUBLIC'
ORDER BY r.created_at DESC
LIMIT 10;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 📊 DIAGNOSTIC ATTENDU
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Si tu vois "❌ AUCUNE INFO CLIENT" :
--   → Les courses ont été créées SANS infos client
--   → SOLUTION : Quand on publie une course perso -> marketplace,
--                il faut que PublishRideModal demande les infos client

-- Si tu vois "✅ INFO CLIENT COMPLÈTE" mais rien ne s'affiche dans l'app :
--   → Problème côté app (RideDetailScreen)
--   → Envoie-moi les logs Metro pour debug

-- Si la colonne client_email n'existe pas :
--   → Exécute ADD_CLIENT_EMAIL_TO_RIDES.sql d'abord

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🔧 FIX TEMPORAIRE : Ajouter manuellement des infos client
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Si tu as besoin d'ajouter des infos client manuellement pour tester :

-- UPDATE rides
-- SET 
--   client_name = 'Client Test',
--   client_phone = '0612345678'
--   -- client_email = 'client@example.com' -- Si la colonne existe
-- WHERE id = 'ride-XXX'; -- 👈 Remplace par l'ID de la course

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🎯 RÉSULTAT
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Après avoir exécuté ce script, tu sauras exactement pourquoi
-- les infos client ne s'affichent pas dans l'app.

-- Envoie-moi les résultats de chaque étape pour que je puisse t'aider ! 🔍

