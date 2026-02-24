-- ============================================================================
-- Migration 039: Autoriser QUOTE_ACCEPTED et QUOTE_REFUSED dans activity_log
-- ============================================================================
-- accept_quote() et refuse_quote() (004) insèrent ces action_type mais la
-- contrainte activity_log_action_type_check ne les autorisait pas.
-- ============================================================================

ALTER TABLE public.activity_log
  DROP CONSTRAINT IF EXISTS activity_log_action_type_check;

ALTER TABLE public.activity_log
  ADD CONSTRAINT activity_log_action_type_check
  CHECK (action_type IN (
    'RIDE_PUBLISHED', 'RIDE_CLAIMED', 'RIDE_COMPLETED', 'RIDE_CANCELLED', 'RIDE_DELETED',
    'PERSONAL_RIDE_ADDED', 'CREDIT_EARNED', 'CREDIT_SPENT',
    'BADGE_EARNED', 'GROUP_JOINED', 'GROUP_CREATED',
    'QUOTE_ACCEPTED', 'QUOTE_REFUSED'
  ));

COMMENT ON CONSTRAINT activity_log_action_type_check ON public.activity_log IS
  'Types d’action pour le journal d’activité (devis + courses + crédits + badges + groupes)';
