-- ============================================================================
-- Migration 043: Option TVA sur vtc_profiles
-- ============================================================================
-- VAT_10 = Je facture la TVA (10%)
-- NON_APPLICABLE = TVA non applicable (micro-entreprise – art. 293B CGI)
-- ============================================================================

ALTER TABLE public.vtc_profiles
  ADD COLUMN IF NOT EXISTS vat_option TEXT;

COMMENT ON COLUMN public.vtc_profiles.vat_option IS 'VAT_10 = facture TVA 10% | NON_APPLICABLE = art. 293B CGI';
