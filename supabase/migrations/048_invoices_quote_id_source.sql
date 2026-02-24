'-- ============================================================================
-- Migration 048: Factures – quote_id, source_type, source_id
-- ============================================================================
-- Pour que get_invoice_public_by_token puisse retrouver le chauffeur comme le devis :
-- - quote_id : lien direct vers le devis (quotes.driver_id = chauffeur)
-- - source_type / source_id : déjà envoyés par l’app à create_invoice, à persister.
-- ============================================================================

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS quote_id TEXT;

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS source_type TEXT;

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS source_id TEXT;

COMMENT ON COLUMN public.invoices.quote_id IS 'Devis associé (pour afficher le chauffeur comme sur la page devis)';
COMMENT ON COLUMN public.invoices.source_type IS 'RIDE ou PERSONAL – source de la facture';
COMMENT ON COLUMN public.invoices.source_id IS 'ID de la course (rides ou personal_rides)';

CREATE INDEX IF NOT EXISTS idx_invoices_quote_id ON public.invoices(quote_id);

-- Trigger : à l'insertion, remplir quote_id depuis la course si source_type/source_id sont renseignés
CREATE OR REPLACE FUNCTION public.invoices_fill_quote_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.quote_id IS NOT NULL THEN
    RETURN NEW;
  END IF;
  IF NEW.source_type = 'RIDE' AND NEW.source_id IS NOT NULL THEN
    SELECT quote_id INTO NEW.quote_id FROM public.rides WHERE id = NEW.source_id LIMIT 1;
  ELSIF NEW.source_type = 'PERSONAL' AND NEW.source_id IS NOT NULL THEN
    SELECT quote_id INTO NEW.quote_id FROM public.personal_rides WHERE id = NEW.source_id LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS invoices_fill_quote_id_trigger ON public.invoices;
CREATE TRIGGER invoices_fill_quote_id_trigger
  BEFORE INSERT ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.invoices_fill_quote_id();

-- Backfill quote_id pour les factures existantes (source_type/source_id déjà renseignés)
UPDATE public.invoices i
SET quote_id = r.quote_id
FROM public.rides r
WHERE i.source_type = 'RIDE' AND i.source_id = r.id AND i.quote_id IS NULL AND r.quote_id IS NOT NULL;

UPDATE public.invoices i
SET quote_id = pr.quote_id
FROM public.personal_rides pr
WHERE i.source_type = 'PERSONAL' AND i.source_id = pr.id AND i.quote_id IS NULL AND pr.quote_id IS NOT NULL;
'