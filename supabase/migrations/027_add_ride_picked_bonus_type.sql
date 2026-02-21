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

