-- Migration des anciennes valeurs de transaction_type vers les nouvelles

-- 1. D'abord, voir les valeurs actuelles dans la table
SELECT transaction_type, COUNT(*) as count
FROM credits_ledger
GROUP BY transaction_type
ORDER BY count DESC;

-- 2. Mettre à jour les anciennes valeurs vers les nouvelles
UPDATE credits_ledger SET transaction_type = 'RIDE_PUBLISHED' WHERE transaction_type = 'PUBLISH_RIDE';
UPDATE credits_ledger SET transaction_type = 'RIDE_CLAIMED' WHERE transaction_type = 'CLAIM_RIDE';
UPDATE credits_ledger SET transaction_type = 'RIDE_COMPLETED' WHERE transaction_type = 'COMPLETE_RIDE_BONUS';
UPDATE credits_ledger SET transaction_type = 'OTHER' WHERE transaction_type = 'CONVERT_TO_PERSONAL';
UPDATE credits_ledger SET transaction_type = 'OTHER' WHERE transaction_type NOT IN (
    'RIDE_PUBLISHED',
    'RIDE_CLAIMED', 
    'RIDE_COMPLETED',
    'BONUS',
    'PENALTY',
    'REFUND',
    'OTHER'
);

-- 3. Vérifier que toutes les valeurs sont maintenant conformes
SELECT transaction_type, COUNT(*) as count
FROM credits_ledger
GROUP BY transaction_type
ORDER BY count DESC;

-- 4. Supprimer l'ancienne contrainte CHECK si elle existe
ALTER TABLE credits_ledger 
DROP CONSTRAINT IF EXISTS credits_ledger_transaction_type_check;

-- 5. Ajouter la nouvelle contrainte avec les bonnes valeurs
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

-- 6. Vérification finale
SELECT 
    constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'credits_ledger'::regclass
  AND contype = 'c';



