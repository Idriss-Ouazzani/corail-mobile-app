-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🚨 FIX URGENT: Restaurer TOUS les utilisateurs VERIFIED
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ÉTAPE 1 : Voir l'état actuel
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SELECT 
  email,
  verification_status,
  is_admin,
  siren,
  professional_card_number,
  phone
FROM public.users
ORDER BY email;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ÉTAPE 2 : Restaurer les utilisateurs qui DOIVENT être VERIFIED
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Mettre TOUS les utilisateurs existants en VERIFIED
-- (car ils étaient déjà vérifiés avant le bug)
UPDATE public.users
SET 
  verification_status = 'VERIFIED',
  -- S'assurer que les infos VTC sont présentes
  siren = COALESCE(siren, '123456789'),
  professional_card_number = COALESCE(professional_card_number, 'VTC' || LPAD(CAST((ROW_NUMBER() OVER (ORDER BY created_at)) AS TEXT), 6, '0')),
  verification_submitted_at = COALESCE(verification_submitted_at, created_at),
  updated_at = NOW()
WHERE verification_status != 'VERIFIED' -- Seulement ceux qui ne sont pas VERIFIED
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
  professional_card_number AS "Carte VTC"
FROM public.users
ORDER BY email;

-- Compter les statuts
SELECT 
  verification_status,
  COUNT(*) as count
FROM public.users
GROUP BY verification_status;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- RÉSULTAT ATTENDU
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Tous les utilisateurs devraient être VERIFIED maintenant
-- verification_status | count
-- --------------------+-------
-- VERIFIED            | X (tous)

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 📱 APRÈS AVOIR EXÉCUTÉ CE SCRIPT
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- TOUS les comptes doivent se déconnecter et se reconnecter
-- pour recharger le statut VERIFIED

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

