-- ============================================================================
-- Migration 049: Correctif schema cache – vtc_profiles + quotes (043/044)
-- ============================================================================
-- Corrige l’erreur "could not find the 'vat_number' column of 'vtc_profiles'
-- in the schema cache" : assure que les colonnes existent (déjà dans 043/044).
-- Après exécution, si l’erreur persiste : Supabase Dashboard → Project Settings
-- → API → ou redémarre le projet pour forcer le rechargement du cache.
-- ============================================================================

ALTER TABLE public.vtc_profiles
  ADD COLUMN IF NOT EXISTS vat_option TEXT;

ALTER TABLE public.vtc_profiles
  ADD COLUMN IF NOT EXISTS vat_number TEXT;

COMMENT ON COLUMN public.vtc_profiles.vat_option IS 'VAT_10 = facture TVA 10% | NON_APPLICABLE = art. 293B CGI';
COMMENT ON COLUMN public.vtc_profiles.vat_number IS 'Numéro TVA intracommunautaire (si assujetti)';

-- quotes (devis)
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS valid_until DATE;
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS client_company_name TEXT;
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS client_address TEXT;
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS client_siret TEXT;
COMMENT ON COLUMN public.quotes.valid_until IS 'Date de validité du devis (ex. 30 jours après émission)';
COMMENT ON COLUMN public.quotes.client_company_name IS 'Raison sociale du client (B2B)';
COMMENT ON COLUMN public.quotes.client_address IS 'Adresse du client (B2B)';
COMMENT ON COLUMN public.quotes.client_siret IS 'SIRET du client (B2B)';

-- Forcer PostgREST à recharger le schéma (Supabase)
NOTIFY pgrst, 'reload schema';
