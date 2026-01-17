-- Ajouter la colonne credits à la table users

-- 1. Ajouter la colonne avec une valeur par défaut
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 0;

-- 2. Créer un index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_users_credits ON users(credits);

-- 3. Calculer le solde actuel de chaque utilisateur depuis credits_ledger
UPDATE users 
SET credits = (
    SELECT COALESCE(SUM(amount), 0)
    FROM credits_ledger
    WHERE credits_ledger.user_id = users.id
)
WHERE id IN (SELECT DISTINCT user_id FROM credits_ledger);

-- 4. Vérifier les soldes mis à jour
SELECT 
    u.id,
    u.email,
    u.credits as credits_column,
    (SELECT COALESCE(SUM(amount), 0) FROM credits_ledger WHERE user_id = u.id) as credits_calculated
FROM users u
WHERE u.id IN (SELECT DISTINCT user_id FROM credits_ledger)
ORDER BY u.email;

-- 5. OPTIONNEL : Créer une fonction trigger pour maintenir users.credits à jour automatiquement
CREATE OR REPLACE FUNCTION update_user_credits()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalculer le total des crédits pour l'utilisateur
    UPDATE users
    SET credits = (
        SELECT COALESCE(SUM(amount), 0)
        FROM credits_ledger
        WHERE user_id = NEW.user_id
    )
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Créer le trigger sur INSERT/UPDATE/DELETE dans credits_ledger
DROP TRIGGER IF EXISTS trigger_update_user_credits ON credits_ledger;
CREATE TRIGGER trigger_update_user_credits
    AFTER INSERT OR UPDATE OR DELETE ON credits_ledger
    FOR EACH ROW
    EXECUTE FUNCTION update_user_credits();



