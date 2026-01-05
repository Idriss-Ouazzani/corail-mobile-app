-- ============================================================================
-- Migration 008: Ajouter le numéro de carte VTC aux users
-- ============================================================================

-- Ajouter la colonne vtc_card_number à la table users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS vtc_card_number TEXT;

-- Commentaire sur la colonne
COMMENT ON COLUMN users.vtc_card_number IS 'Numéro de carte professionnelle VTC du chauffeur';

