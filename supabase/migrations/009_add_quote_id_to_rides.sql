-- ============================================================================
-- Migration 009: Ajouter quote_id aux rides
-- ============================================================================

-- Ajouter la colonne quote_id à la table rides
ALTER TABLE rides 
ADD COLUMN IF NOT EXISTS quote_id TEXT;

-- Ajouter une contrainte de clé étrangère
ALTER TABLE rides 
ADD CONSTRAINT fk_rides_quote 
FOREIGN KEY (quote_id) 
REFERENCES quotes(id) 
ON DELETE SET NULL;

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_rides_quote_id ON rides(quote_id);

-- Commentaire sur la colonne
COMMENT ON COLUMN rides.quote_id IS 'ID du devis associé à cette course (optionnel)';

