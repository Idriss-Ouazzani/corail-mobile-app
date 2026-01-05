-- ============================================================================
-- Add push_token to users table for Expo push notifications
-- ============================================================================

-- Ajouter le champ push_token
ALTER TABLE users
ADD COLUMN IF NOT EXISTS push_token TEXT;

-- Créer un index pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_users_push_token ON users(push_token) WHERE push_token IS NOT NULL;

-- Vérifier la structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name = 'push_token';

