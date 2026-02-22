-- À exécuter dans Supabase : SQL Editor → New query → coller puis Run
-- Ajoute les colonnes indicative_low_cents / indicative_high_cents et l'utilisateur corail-landing

ALTER TABLE public.rides
ADD COLUMN IF NOT EXISTS indicative_low_cents INTEGER;

ALTER TABLE public.rides
ADD COLUMN IF NOT EXISTS indicative_high_cents INTEGER;

COMMENT ON COLUMN public.rides.indicative_low_cents IS 'Fourchette indicative bas (cents) pour demandes client site web';
COMMENT ON COLUMN public.rides.indicative_high_cents IS 'Fourchette indicative haut (cents) pour demandes client site web';

INSERT INTO public.users (id, email, full_name, verification_status, is_admin)
VALUES (
  'corail-landing',
  'noreply@corail.vtc',
  'Demandes site web',
  'VERIFIED',
  false
)
ON CONFLICT (id) DO NOTHING;
