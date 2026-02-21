-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🚨 FIX RAPIDE: Remettre mydrissouazzani@gmail.com en VERIFIED + ADMIN
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 1️⃣ Vérifier l'état actuel
SELECT 
  email,
  verification_status AS "Statut actuel",
  is_admin AS "Admin?",
  updated_at AS "Dernière mise à jour"
FROM public.users
WHERE email = 'mydrissouazzani@gmail.com';

-- 2️⃣ Remettre à VERIFIED + ADMIN
UPDATE public.users
SET 
  verification_status = 'VERIFIED',
  is_admin = TRUE,
  siren = COALESCE(siren, '123456789'), -- Ajouter un SIREN si manquant
  professional_card_number = COALESCE(professional_card_number, 'VTC000001'), -- Ajouter carte VTC si manquant
  verification_submitted_at = COALESCE(verification_submitted_at, NOW()),
  updated_at = NOW()
WHERE email = 'mydrissouazzani@gmail.com';

-- 3️⃣ Vérifier que c'est bon maintenant
SELECT 
  email,
  verification_status AS "✅ Nouveau statut",
  is_admin AS "✅ Admin?",
  siren,
  professional_card_number,
  updated_at AS "✅ Mis à jour"
FROM public.users
WHERE email = 'mydrissouazzani@gmail.com';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 📱 APRÈS AVOIR EXÉCUTÉ CE SCRIPT
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 1. DÉCONNECTE-TOI de l'app
-- 2. RECONNECTE-TOI avec mydrissouazzani@gmail.com
-- 3. Ton statut devrait être VERIFIED

-- Si ça ne fonctionne pas :
-- → Ferme l'app complètement (force quit Expo Go)
-- → Redémarre Metro : npx expo start --clear
-- → Reconnecte-toi

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

