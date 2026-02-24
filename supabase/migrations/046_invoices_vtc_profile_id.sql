-- ============================================================================
-- Migration 046: Lier la facture au chauffeur (vtc_profile_id)
-- ============================================================================
-- La RPC create_invoice reçoit p_vtc_profile_id ; la table doit avoir la colonne
-- pour que les factures affichent les infos du chauffeur sur getcorail.com.
-- ============================================================================

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS vtc_profile_id TEXT;

COMMENT ON COLUMN public.invoices.vtc_profile_id IS 'Profil VTC du chauffeur qui a émis la facture (pour afficher nom, adresse, SIRET, etc.)';

-- Index pour les requêtes par profil
CREATE INDEX IF NOT EXISTS idx_invoices_vtc_profile_id ON public.invoices(vtc_profile_id);
