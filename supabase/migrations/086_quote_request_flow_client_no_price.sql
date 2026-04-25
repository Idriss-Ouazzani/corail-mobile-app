-- Devis sans prix client : annonces (rides) + demandes ciblées (driver_ride_requests) + lien quotes
-- - rides.price_cents nullable pour « demande de devis » (indicatif seulement)
-- - last_refused_quote_cents : rappel après refus de devis
-- - quote_lock_* : verrou optionnel (prochaine étape : Prendre + prix sur Annonces)

ALTER TABLE public.rides
  ALTER COLUMN price_cents DROP NOT NULL;

ALTER TABLE public.rides
  ADD COLUMN IF NOT EXISTS last_refused_quote_cents INTEGER,
  ADD COLUMN IF NOT EXISTS quote_lock_driver_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS quote_lock_expires_at TIMESTAMPTZ;

COMMENT ON COLUMN public.rides.last_refused_quote_cents IS 'Dernier montant de devis refusé (centimes), affiché sur l’annonce';
COMMENT ON COLUMN public.rides.quote_lock_driver_id IS 'Chauffeur ayant verrouillé l’annonce le temps d’émettre un devis (optionnel)';
COMMENT ON COLUMN public.rides.quote_lock_expires_at IS 'Expiration du verrou (évite les blocages fantômes)';

ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS source_driver_request_id TEXT REFERENCES public.driver_ride_requests(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source_ride_id TEXT REFERENCES public.rides(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_quotes_source_driver_request_id ON public.quotes(source_driver_request_id);
CREATE INDEX IF NOT EXISTS idx_quotes_source_ride_id ON public.quotes(source_ride_id);

ALTER TABLE public.driver_ride_requests
  ADD COLUMN IF NOT EXISTS indicative_low_cents INTEGER,
  ADD COLUMN IF NOT EXISTS indicative_high_cents INTEGER,
  ADD COLUMN IF NOT EXISTS active_quote_id TEXT REFERENCES public.quotes(id) ON DELETE SET NULL;

-- Étendre les statuts : CLOSED = reprise en annonces après refus de devis par le client
ALTER TABLE public.driver_ride_requests DROP CONSTRAINT IF EXISTS driver_ride_requests_status_check;
ALTER TABLE public.driver_ride_requests
  ADD CONSTRAINT driver_ride_requests_status_check
  CHECK (status IN ('PENDING', 'ACCEPTED', 'REFUSED', 'CLOSED'));

COMMENT ON COLUMN public.driver_ride_requests.active_quote_id IS 'Dernier devis envoyé au client (en attente de réponse)';
