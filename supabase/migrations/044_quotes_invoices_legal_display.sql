-- ============================================================================
-- Migration 044: Devis et factures – champs pour affichage légal complet
-- ============================================================================
-- Devis: date validité, client B2B (raison sociale, adresse, SIRET).
-- Factures: date prestation, paiement, TVA (HT/TVA), client B2B.
-- vtc_profiles: numéro TVA intracommunautaire (si assujetti).
-- ============================================================================

-- vtc_profiles: numéro TVA intracommunautaire (pour factures)
ALTER TABLE public.vtc_profiles
  ADD COLUMN IF NOT EXISTS vat_number TEXT;
COMMENT ON COLUMN public.vtc_profiles.vat_number IS 'Numéro TVA intracommunautaire (si assujetti)';

-- quotes: date de validité du devis, client B2B
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

-- invoices: date prestation, paiement, détail TVA, client B2B
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS service_date DATE;
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS total_ht_cents INTEGER;
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS vat_amount_cents INTEGER;
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS client_company_name TEXT;
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS client_address TEXT;
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS client_siret TEXT;
COMMENT ON COLUMN public.invoices.service_date IS 'Date de la prestation';
COMMENT ON COLUMN public.invoices.payment_method IS 'Mode de paiement (CB, virement, espèces…)';
COMMENT ON COLUMN public.invoices.paid_at IS 'Date de paiement';
COMMENT ON COLUMN public.invoices.total_ht_cents IS 'Total HT en centimes (si TVA)';
COMMENT ON COLUMN public.invoices.vat_amount_cents IS 'Montant TVA en centimes (si TVA 10%)';
COMMENT ON COLUMN public.invoices.client_company_name IS 'Raison sociale du client (B2B)';
COMMENT ON COLUMN public.invoices.client_address IS 'Adresse du client (B2B)';
COMMENT ON COLUMN public.invoices.client_siret IS 'SIRET du client (B2B)';
