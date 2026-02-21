-- Migration: Add client_email column to quotes table
-- Description: Allow storing client email for better communication options

-- Add client_email column (optional)
ALTER TABLE public.quotes
ADD COLUMN IF NOT EXISTS client_email TEXT;

-- Make client_phone optional (was NOT NULL before)
ALTER TABLE public.quotes
ALTER COLUMN client_phone DROP NOT NULL;

-- Add check constraint: at least one contact method required
ALTER TABLE public.quotes
ADD CONSTRAINT check_contact_method CHECK (
  client_phone IS NOT NULL OR client_email IS NOT NULL
);

-- Add comment
COMMENT ON COLUMN public.quotes.client_email IS 'Client email address for sending quotes';
COMMENT ON CONSTRAINT check_contact_method ON public.quotes IS 'Ensures at least one contact method (phone or email) is provided';

