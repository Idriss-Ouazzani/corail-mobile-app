-- ============================================================================
-- Migration 041: credits_onboarding_seen (onboarding crédits - ne plus afficher)
-- ============================================================================

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS credits_onboarding_seen BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.users.credits_onboarding_seen IS
  'User has seen the credits onboarding (marketplace); do not show again.';
