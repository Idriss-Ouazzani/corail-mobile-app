-- ============================================================================
-- Migration 016: Add quote fields to personal_rides
-- ============================================================================

-- Add quote_token and quote_status to personal_rides table
ALTER TABLE public.personal_rides
  ADD COLUMN IF NOT EXISTS quote_id TEXT,
  ADD COLUMN IF NOT EXISTS quote_token TEXT,
  ADD COLUMN IF NOT EXISTS quote_status TEXT CHECK (quote_status IN ('SENT', 'VIEWED', 'ACCEPTED', 'REFUSED'));

-- Add index for quote lookups
CREATE INDEX IF NOT EXISTS idx_personal_rides_quote_id ON public.personal_rides(quote_id);

-- Add comment for documentation
COMMENT ON COLUMN public.personal_rides.quote_id IS 'Reference to the quote ID if a quote was generated for this ride';
COMMENT ON COLUMN public.personal_rides.quote_token IS 'Public token for accessing the quote via web link (e.g., https://corail.app/devis/{token})';
COMMENT ON COLUMN public.personal_rides.quote_status IS 'Status of the quote: SENT (envoyé), VIEWED (vu), ACCEPTED (validé), or REFUSED (refusé)';

