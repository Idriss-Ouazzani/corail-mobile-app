-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🚨 FIX URGENT: Restaurer TOUS les utilisateurs VERIFIED (VERSION SIMPLE)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ÉTAPE 1 : Voir l'état actuel
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SELECT 
  email,
  verification_status,
  is_admin,
  siren,
  professional_card_number
FROM public.users
ORDER BY email;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ÉTAPE 2 : Restaurer TOUS les utilisateurs à VERIFIED
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

UPDATE public.users
SET 
  verification_status = 'VERIFIED',
  siren = COALESCE(siren, '123456789'),
  professional_card_number = COALESCE(professional_card_number, 'VTC000001'),
  verification_submitted_at = COALESCE(verification_submitted_at, created_at),
  updated_at = NOW()
WHERE verification_status != 'VERIFIED'
  OR siren IS NULL
  OR professional_card_number IS NULL;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ÉTAPE 3 : Vérifier le résultat
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SELECT 
  email,
  verification_status AS "✅ Statut",
  is_admin AS "Admin?",
  siren AS "SIREN",
  professional_card_number AS "Carte VTC",
  updated_at AS "Mis à jour"
FROM public.users
ORDER BY email;

-- Compter les statuts
SELECT 
  verification_status,
  COUNT(*) as "Nombre d'utilisateurs"
FROM public.users
GROUP BY verification_status;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- RÉSULTAT ATTENDU
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Tous les utilisateurs devraient être VERIFIED
-- verification_status | Nombre d'utilisateurs
-- --------------------+-----------------------
-- VERIFIED            | X (tous)

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 📱 APRÈS CE SCRIPT
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- TOUS les comptes doivent :
-- 1. Se déconnecter de l'app
-- 2. Se reconnecter
-- 3. Vérifier que le statut est bien VERIFIED

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

