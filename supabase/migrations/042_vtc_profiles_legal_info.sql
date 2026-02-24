-- ============================================================================
-- Migration 042: Infos légales / facturation sur vtc_profiles
-- ============================================================================
-- SIRET (14 chiffres) + adresse pour devis/factures conformes.
-- SIREN (users) conservé pour compatibilité, non affiché.
-- ============================================================================

ALTER TABLE public.vtc_profiles
  ADD COLUMN IF NOT EXISTS legal_business_name TEXT;

ALTER TABLE public.vtc_profiles
  ADD COLUMN IF NOT EXISTS legal_address_line1 TEXT;

ALTER TABLE public.vtc_profiles
  ADD COLUMN IF NOT EXISTS legal_postal_code TEXT;

ALTER TABLE public.vtc_profiles
  ADD COLUMN IF NOT EXISTS legal_city TEXT;

ALTER TABLE public.vtc_profiles
  ADD COLUMN IF NOT EXISTS siret TEXT;

ALTER TABLE public.vtc_profiles
  ADD COLUMN IF NOT EXISTS legal_info_configured BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.vtc_profiles.legal_business_name IS 'Raison sociale / nom commercial pour facturation';
COMMENT ON COLUMN public.vtc_profiles.legal_address_line1 IS 'Adresse ligne 1 (siège / activité)';
COMMENT ON COLUMN public.vtc_profiles.legal_postal_code IS 'Code postal';
COMMENT ON COLUMN public.vtc_profiles.legal_city IS 'Ville';
COMMENT ON COLUMN public.vtc_profiles.siret IS 'SIRET 14 chiffres pour facturation';
COMMENT ON COLUMN public.vtc_profiles.legal_info_configured IS 'True si le chauffeur a complété la config infos légales (devis/factures)';
