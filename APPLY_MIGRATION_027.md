# 🔧 Appliquer la migration 027 - RIDE_PICKED_BONUS

## 📋 Instructions

Va dans le **SQL Editor** de Supabase et exécute ce SQL :

```sql
-- Migration: Add RIDE_PICKED_BONUS transaction type
-- Description: Add new credit transaction type for when someone picks your published ride

-- Drop the existing check constraint
ALTER TABLE public.credits_ledger
DROP CONSTRAINT IF EXISTS credits_ledger_transaction_type_check;

-- Add the new constraint with the additional type
ALTER TABLE public.credits_ledger
ADD CONSTRAINT credits_ledger_transaction_type_check
CHECK (transaction_type IN (
  'PUBLISH_RIDE',           -- Publier une course (+1 crédit)
  'CLAIM_RIDE',             -- Prendre une course (-1 crédit)
  'COMPLETE_RIDE_BONUS',    -- Bonus pour terminer une course (+1 crédit)
  'RIDE_PICKED_BONUS',      -- Bonus quand quelqu'un prend votre course (+1 crédit)
  'ADMIN_ADJUSTMENT',       -- Ajustement manuel (+ ou -)
  'WELCOME_BONUS'           -- Bonus de bienvenue (+1 crédit)
));

-- Add comment
COMMENT ON CONSTRAINT credits_ledger_transaction_type_check ON public.credits_ledger IS 
'Valid transaction types for credits ledger. RIDE_PICKED_BONUS is awarded to ride creator when someone claims their ride.';
```

## 🔗 Lien direct

https://supabase.com/dashboard/project/qeheawdjlwlkhnwbhqcg/sql/new

## ✅ Vérification

Après l'exécution, vérifie que ça a marché :

```sql
-- Tester l'insertion avec le nouveau type
INSERT INTO public.credits_ledger (user_id, amount, transaction_type, description)
VALUES ('test-user', 1, 'RIDE_PICKED_BONUS', 'Test migration')
RETURNING *;

-- Supprimer le test
DELETE FROM public.credits_ledger WHERE description = 'Test migration';
```

Si ça marche, tu peux continuer à tester l'app !

