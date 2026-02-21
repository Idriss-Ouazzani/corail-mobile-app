-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🔍 Debug : Vérifier les infos de la course et du créateur
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 1️⃣ Vérifier les infos de la course (avec les infos client)
SELECT 
  r.id,
  r.status,
  r.creator_id,
  r.picker_id,
  r.client_name,
  r.client_phone,
  r.client_email,
  r.pickup_address,
  r.dropoff_address,
  r.scheduled_at
FROM rides r
WHERE r.id = 'ride-b91b2946';

-- 2️⃣ Vérifier les infos du créateur (apporteur d'affaires)
SELECT 
  u.id,
  u.email,
  u.full_name,
  u.phone
FROM users u
WHERE u.id = '22fb2856-2364-4932-9098-187d7d06f7bf';

-- 3️⃣ Vérifier si tu es le picker
SELECT 
  r.id,
  r.picker_id,
  CASE 
    WHEN r.picker_id = 'db5f396a-4c75-4792-a6ab-7f071d394bfd' THEN 'OUI - Tu es le picker ✅'
    WHEN r.picker_id IS NULL THEN 'NON - Personne n''a pris cette course'
    ELSE 'NON - Quelqu''un d''autre a pris cette course'
  END as statut_picker
FROM rides r
WHERE r.id = 'ride-b91b2946';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 📝 DIAGNOSTIC
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Si client_name, client_phone, client_email sont NULL :
--   → La course a été créée SANS infos client (ancien système)
--   → Solution : L'apporteur d'affaires doit republier avec les infos client
--
-- Si le créateur n'a pas de phone :
--   → Les boutons Appeler/WhatsApp ne s'affichent pas
--   → Solution : Le créateur doit renseigner son téléphone dans son profil
--
-- Si tu n'es PAS le picker :
--   → Tu ne verras jamais les infos client (normal, tu n'as pas pris la course)
--   → Solution : Prendre la course d'abord
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🔧 SI NÉCESSAIRE : Ajouter les infos client manuellement
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Si la course n'a pas d'infos client, tu peux les ajouter :
-- UPDATE rides
-- SET 
--   client_name = 'Nom du client',
--   client_phone = '0612345678',
--   client_email = 'client@exemple.com'
-- WHERE id = 'ride-b91b2946';
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

