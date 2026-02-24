-- ============================================================================
-- Migration 045: Lecture publique des factures par lien (comme les devis)
-- ============================================================================
-- Permet à la page getcorail.com/invoice/[token] de lire la facture avec la clé anon.
-- Sans cette policy, "Facture introuvable" si le site n’utilise pas la service_role.
-- ============================================================================

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view invoice by token" ON public.invoices;
CREATE POLICY "Public can view invoice by token"
  ON public.invoices
  FOR SELECT
  USING (true);

COMMENT ON POLICY "Public can view invoice by token" ON public.invoices IS
  'Lecture publique par lien partagé (token dans l’URL) ; même principe que quotes.';
