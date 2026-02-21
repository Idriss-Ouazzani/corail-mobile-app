-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Migration 032: Champs pour demandes client (site web)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Fourchette indicative et utilisateur système pour creator_id
-- des annonces créées depuis le site (source = 'client').
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Colonnes fourchette indicative (pour source = 'client')
ALTER TABLE public.rides
ADD COLUMN IF NOT EXISTS indicative_low_cents INTEGER;

ALTER TABLE public.rides
ADD COLUMN IF NOT EXISTS indicative_high_cents INTEGER;

COMMENT ON COLUMN public.rides.indicative_low_cents IS 'Fourchette indicative bas (cents) pour demandes client site web';
COMMENT ON COLUMN public.rides.indicative_high_cents IS 'Fourchette indicative haut (cents) pour demandes client site web';

-- Utilisateur système pour les annonces créées depuis le site (creator_id)
INSERT INTO public.users (id, email, full_name, verification_status, is_admin)
VALUES (
  'corail-landing',
  'noreply@corail.vtc',
  'Demandes site web',
  'VERIFIED',
  false
)
ON CONFLICT (id) DO NOTHING;
