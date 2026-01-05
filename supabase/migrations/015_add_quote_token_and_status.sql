-- ============================================================================
-- Migration 015: Add quote_token and quote_status to rides
-- ============================================================================

-- Add quote_token and quote_status to rides table
ALTER TABLE public.rides
  ADD COLUMN IF NOT EXISTS quote_token TEXT,
  ADD COLUMN IF NOT EXISTS quote_status TEXT CHECK (quote_status IN ('SENT', 'VIEWED', 'ACCEPTED', 'REFUSED'));

-- Add client information if not exists (might be added in another migration)
ALTER TABLE public.rides
  ADD COLUMN IF NOT EXISTS client_name TEXT,
  ADD COLUMN IF NOT EXISTS client_phone TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.rides.quote_token IS 'Public token for accessing the quote via web link (e.g., https://corail.app/devis/{token})';
COMMENT ON COLUMN public.rides.quote_status IS 'Status of the quote: SENT (envoyé), VIEWED (vu), ACCEPTED (validé), or REFUSED (refusé)';
COMMENT ON COLUMN public.rides.client_name IS 'Name of the client for this ride (optional)';
COMMENT ON COLUMN public.rides.client_phone IS 'Phone number of the client for this ride (optional)';

