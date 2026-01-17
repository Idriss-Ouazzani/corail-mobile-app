-- Mettre à jour les contraintes CHECK sur transaction_type pour accepter les nouvelles valeurs

-- 1. Supprimer l'ancienne contrainte CHECK si elle existe
ALTER TABLE credits_ledger 
DROP CONSTRAINT IF EXISTS credits_ledger_transaction_type_check;

-- 2. Ajouter la nouvelle contrainte avec toutes les valeurs possibles
ALTER TABLE credits_ledger 
ADD CONSTRAINT credits_ledger_transaction_type_check 
CHECK (transaction_type IN (
    'RIDE_PUBLISHED',    -- Course publiée (+1 crédit)
    'RIDE_CLAIMED',      -- Course prise (-1 crédit)
    'RIDE_COMPLETED',    -- Course terminée (+1 crédit bonus)
    'BONUS',             -- Bonus admin
    'PENALTY',           -- Pénalité
    'REFUND',            -- Remboursement
    'OTHER'              -- Autre (conversions, ajustements)
));

-- 3. Vérifier les transactions existantes qui pourraient avoir d'anciennes valeurs
SELECT transaction_type, COUNT(*) as count
FROM credits_ledger
GROUP BY transaction_type
ORDER BY count DESC;



