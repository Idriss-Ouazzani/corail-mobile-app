-- Script pour corriger définitivement la contrainte transaction_type

-- ÉTAPE 1 : Voir toutes les contraintes CHECK actuelles
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'credits_ledger'::regclass
  AND contype = 'c';

-- ÉTAPE 2 : Supprimer TOUTES les contraintes CHECK sur transaction_type
-- (parfois il y en a plusieurs avec des noms différents)
DO $$ 
DECLARE 
    constraint_record RECORD;
BEGIN
    FOR constraint_record IN 
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'credits_ledger'::regclass
          AND contype = 'c'
          AND pg_get_constraintdef(oid) LIKE '%transaction_type%'
    LOOP
        EXECUTE format('ALTER TABLE credits_ledger DROP CONSTRAINT IF EXISTS %I', constraint_record.conname);
        RAISE NOTICE 'Dropped constraint: %', constraint_record.conname;
    END LOOP;
END $$;

-- ÉTAPE 3 : Vérifier qu'il n'y a plus de contraintes sur transaction_type
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'credits_ledger'::regclass
  AND contype = 'c'
  AND pg_get_constraintdef(oid) LIKE '%transaction_type%';

-- ÉTAPE 4 : Mettre à jour les anciennes valeurs dans les données existantes
UPDATE credits_ledger SET transaction_type = 'RIDE_PUBLISHED' WHERE transaction_type = 'PUBLISH_RIDE';
UPDATE credits_ledger SET transaction_type = 'RIDE_CLAIMED' WHERE transaction_type = 'CLAIM_RIDE';
UPDATE credits_ledger SET transaction_type = 'RIDE_COMPLETED' WHERE transaction_type = 'COMPLETE_RIDE_BONUS';
UPDATE credits_ledger SET transaction_type = 'OTHER' WHERE transaction_type = 'CONVERT_TO_PERSONAL';

-- ÉTAPE 5 : Voir les valeurs actuelles
SELECT DISTINCT transaction_type 
FROM credits_ledger 
ORDER BY transaction_type;

-- ÉTAPE 6 : Créer la nouvelle contrainte
ALTER TABLE credits_ledger 
ADD CONSTRAINT credits_ledger_transaction_type_check 
CHECK (transaction_type IN (
    'RIDE_PUBLISHED',
    'RIDE_CLAIMED',
    'RIDE_COMPLETED',
    'BONUS',
    'PENALTY',
    'REFUND',
    'OTHER'
));

-- ÉTAPE 7 : Vérification finale
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'credits_ledger'::regclass
  AND contype = 'c';

