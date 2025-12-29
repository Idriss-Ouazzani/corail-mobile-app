-- ============================================
-- CORAIL - VALIDATION ADMIN DES VÉRIFICATIONS VTC
-- ============================================

-- 📋 1. VOIR TOUTES LES DEMANDES EN ATTENTE
-- ============================================
SELECT 
  id,
  email,
  full_name,
  phone,
  professional_card_number,
  siren,
  verification_submitted_at,
  DATEDIFF(CURRENT_TIMESTAMP(), verification_submitted_at) as jours_attente
FROM io_catalog.corail.v_pending_verifications
ORDER BY verification_submitted_at ASC;

-- Ou directement dans la table users :
SELECT 
  id,
  email,
  full_name,
  phone,
  professional_card_number,
  siren,
  verification_status,
  verification_submitted_at,
  created_at
FROM io_catalog.corail.users
WHERE verification_status = 'PENDING'
ORDER BY verification_submitted_at ASC;


-- ✅ 2. VALIDER UNE VÉRIFICATION
-- ============================================
-- Remplace 'USER_ID' par l'ID réel de l'utilisateur à valider

UPDATE io_catalog.corail.users
SET 
  verification_status = 'VERIFIED',
  verification_reviewed_at = CURRENT_TIMESTAMP(),
  verification_reviewed_by = 'admin-manual'  -- Ton nom ou ID admin
WHERE id = 'USER_ID';

-- Exemple concret :
-- UPDATE io_catalog.corail.users
-- SET 
--   verification_status = 'VERIFIED',
--   verification_reviewed_at = CURRENT_TIMESTAMP(),
--   verification_reviewed_by = 'idriss-admin'
-- WHERE email = 'jean.dupont@test.com';


-- ❌ 3. REJETER UNE VÉRIFICATION
-- ============================================
-- Remplace 'USER_ID' et le message de rejet

UPDATE io_catalog.corail.users
SET 
  verification_status = 'REJECTED',
  verification_reviewed_at = CURRENT_TIMESTAMP(),
  verification_reviewed_by = 'admin-manual',
  verification_rejection_reason = 'Carte VTC expirée - Veuillez renouveler votre carte'
WHERE id = 'USER_ID';

-- Exemple concret :
-- UPDATE io_catalog.corail.users
-- SET 
--   verification_status = 'REJECTED',
--   verification_reviewed_at = CURRENT_TIMESTAMP(),
--   verification_reviewed_by = 'idriss-admin',
--   verification_rejection_reason = 'Numéro SIREN invalide'
-- WHERE email = 'utilisateur@test.com';


-- 📊 4. STATISTIQUES DE VÉRIFICATION
-- ============================================
SELECT 
  verification_status,
  COUNT(*) as nombre
FROM io_catalog.corail.users
GROUP BY verification_status
ORDER BY nombre DESC;


-- 📜 5. HISTORIQUE DES VALIDATIONS
-- ============================================
SELECT 
  u.email,
  u.full_name,
  u.verification_status,
  u.verification_submitted_at,
  u.verification_reviewed_at,
  u.verification_reviewed_by,
  DATEDIFF(u.verification_reviewed_at, u.verification_submitted_at) as delai_traitement_jours
FROM io_catalog.corail.users u
WHERE u.verification_reviewed_at IS NOT NULL
ORDER BY u.verification_reviewed_at DESC
LIMIT 20;


-- 🔍 6. VÉRIFIER UN UTILISATEUR SPÉCIFIQUE
-- ============================================
SELECT 
  id,
  email,
  full_name,
  phone,
  professional_card_number,
  siren,
  verification_status,
  verification_submitted_at,
  verification_reviewed_at,
  verification_reviewed_by,
  verification_rejection_reason,
  created_at
FROM io_catalog.corail.users
WHERE email = 'REMPLACE_PAR_EMAIL';

-- Exemple :
-- WHERE email = 'jean.dupont@test.com';


-- 🚨 7. RÉACTIVER UN COMPTE REJETÉ
-- ============================================
-- Si l'utilisateur a corrigé ses informations

UPDATE io_catalog.corail.users
SET 
  verification_status = 'PENDING',
  verification_rejection_reason = NULL
WHERE id = 'USER_ID';


