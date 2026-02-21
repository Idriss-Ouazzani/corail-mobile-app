-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🔍 Vérifier si la course a les infos client
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Remplace 'ride-XXX' par l'ID de la course que tu as prise
-- Note: Si client_email n'existe pas encore, il faut d'abord exécuter ADD_CLIENT_EMAIL_TO_RIDES.sql
SELECT 
  id,
  status,
  creator_id,
  picker_id,
  client_name,
  client_phone,
  pickup_address,
  dropoff_address,
  created_at
FROM rides
WHERE picker_id = 'db5f396a-4c75-4792-a6ab-7f071d394bfd'
ORDER BY created_at DESC
LIMIT 5;

-- Si la colonne client_email existe, utilise cette requête à la place :
-- SELECT 
--   id,
--   status,
--   creator_id,
--   picker_id,
--   client_name,
--   client_phone,
--   client_email,
--   pickup_address,
--   dropoff_address,
--   created_at
-- FROM rides
-- WHERE picker_id = 'db5f396a-4c75-4792-a6ab-7f071d394bfd'
-- ORDER BY created_at DESC
-- LIMIT 5;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 📝 DIAGNOSTIC
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Si client_name, client_phone, client_email sont tous NULL :
--   → La course a été créée AVANT qu'on rende les infos client obligatoires
--   → Tu ne verras jamais les infos client car elles n'existent pas
--   → Solution : Demander au créateur de te donner les infos manuellement
--
-- Si au moins UN des champs est renseigné :
--   → Les infos existent dans la DB
--   → Le problème vient de l'app qui ne les charge/affiche pas correctement
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🔧 SOLUTION : Ajouter les infos client manuellement
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Si les infos client sont NULL, tu peux les ajouter manuellement
-- (après avoir demandé au créateur de te les donner) :

-- UPDATE rides
-- SET 
--   client_name = 'Nom du client',
--   client_phone = '0612345678',
--   client_email = 'client@exemple.com'
-- WHERE id = 'ride-XXX-que-tu-as-prise';

-- Puis redémarre l'app pour voir les changements
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

