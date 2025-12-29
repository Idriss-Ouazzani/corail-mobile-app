-- ============================================
-- CORAIL - SYSTÈME DE VÉRIFICATION PROFESSIONNELLE VTC
-- ============================================

-- 1️⃣ Ajouter les colonnes de vérification à la table users
ALTER TABLE io_catalog.corail.users ADD COLUMNS (
  verification_status STRING,
  professional_card_number STRING,
  siren STRING,
  verification_documents STRING,
  verification_submitted_at TIMESTAMP,
  verification_reviewed_at TIMESTAMP,
  verification_reviewed_by STRING,
  verification_rejection_reason STRING
);

-- 2️⃣ Mettre à jour les utilisateurs existants avec statut UNVERIFIED par défaut
UPDATE io_catalog.corail.users
SET verification_status = 'UNVERIFIED'
WHERE verification_status IS NULL;

-- 3️⃣ Table pour l'historique de vérification
CREATE TABLE IF NOT EXISTS io_catalog.corail.verification_history (
  id STRING NOT NULL,
  user_id STRING NOT NULL,
  status STRING NOT NULL,
  professional_card_number STRING,
  siren STRING,
  documents STRING,
  submitted_at TIMESTAMP,
  reviewed_at TIMESTAMP,
  reviewed_by STRING,
  rejection_reason STRING,
  created_at TIMESTAMP
) USING DELTA;

-- 4️⃣ Vue pour les admins - Vérifications en attente
CREATE OR REPLACE VIEW io_catalog.corail.v_pending_verifications AS
SELECT 
  u.id,
  u.email,
  u.full_name,
  u.phone,
  u.professional_card_number,
  u.siren,
  u.verification_status,
  u.verification_submitted_at,
  u.verification_documents,
  u.created_at as user_created_at
FROM io_catalog.corail.users u
WHERE u.verification_status = 'PENDING'
ORDER BY u.verification_submitted_at ASC;

-- ✅ TERMINÉ !
-- Vérifier les colonnes ajoutées :
DESCRIBE io_catalog.corail.users;

-- Voir les vérifications en attente :
SELECT * FROM io_catalog.corail.v_pending_verifications;


