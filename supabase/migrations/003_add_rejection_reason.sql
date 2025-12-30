-- ============================================================================
-- Ajout du champ rejection_reason pour les rejets de vérification
-- ============================================================================

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Index pour les recherches
CREATE INDEX IF NOT EXISTS idx_users_rejection_reason ON public.users(rejection_reason);

COMMENT ON COLUMN public.users.rejection_reason IS 'Raison du rejet de la vérification (si REJECTED)';

