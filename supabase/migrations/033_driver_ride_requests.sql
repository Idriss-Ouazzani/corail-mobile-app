-- ============================================================================
-- Driver ride requests: demandes de course adressées à un chauffeur depuis sa page publique
-- ============================================================================
-- Si le client accepte "proposer un autre" et le chauffeur refuse → course publiée en Annonces
-- Si le chauffeur accepte → course personnelle planifiée pour ce chauffeur
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.driver_ride_requests (
  id TEXT PRIMARY KEY DEFAULT ('req-' || substr(md5(random()::text), 1, 10)),
  driver_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  -- Trajet
  pickup_address TEXT NOT NULL,
  dropoff_address TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  price_cents INTEGER,
  distance_km DECIMAL(10,2),
  notes TEXT,
  -- Client
  client_name TEXT,
  client_email TEXT,
  client_phone TEXT,
  -- Option: si chauffeur refuse, publier en annonces
  fallback_to_marketplace BOOLEAN DEFAULT false,
  -- Statut
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REFUSED')),
  -- Réponse chauffeur
  responded_at TIMESTAMPTZ,
  -- Si ACCEPTED → id de la personal_ride créée
  personal_ride_id TEXT REFERENCES public.personal_rides(id) ON DELETE SET NULL,
  -- Si REFUSED + fallback → id de la ride publiée en annonces
  published_ride_id TEXT REFERENCES public.rides(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_driver_ride_requests_driver_id ON public.driver_ride_requests(driver_id);
CREATE INDEX idx_driver_ride_requests_status ON public.driver_ride_requests(status);
CREATE INDEX idx_driver_ride_requests_created_at ON public.driver_ride_requests(created_at DESC);

ALTER TABLE public.driver_ride_requests ENABLE ROW LEVEL SECURITY;

-- Le chauffeur peut voir et mettre à jour ses propres demandes
CREATE POLICY "Drivers can view own requests"
  ON public.driver_ride_requests FOR SELECT
  USING (driver_id = auth.uid()::text);

CREATE POLICY "Drivers can update own requests (accept/refuse)"
  ON public.driver_ride_requests FOR UPDATE
  USING (driver_id = auth.uid()::text)
  WITH CHECK (driver_id = auth.uid()::text);

-- L'API (service_role) peut insérer pour créer une demande
-- Pas de policy INSERT pour anon; on passe par l'API avec service_role

COMMENT ON TABLE public.driver_ride_requests IS 'Demandes de course adressées à un chauffeur depuis sa page publique getcorail.com/vtc/[slug]';
