-- ============================================================================
-- QUOTES SYSTEM - Système de devis VTC
-- ============================================================================

-- 1. Ajouter company_name aux users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS company_name TEXT;

-- 2. Créer la table quotes
CREATE TABLE public.quotes (
  id TEXT PRIMARY KEY DEFAULT ('quote-' || substr(md5(random()::text), 1, 8)),
  driver_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Client info
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  
  -- Trip details
  pickup_address TEXT NOT NULL,
  dropoff_address TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  
  -- Pricing
  price_cents INTEGER NOT NULL,
  
  -- Notes
  notes TEXT,
  
  -- Token pour accès public
  token TEXT UNIQUE NOT NULL DEFAULT substr(md5(random()::text || clock_timestamp()::text), 1, 12),
  
  -- Status tracking
  status TEXT DEFAULT 'SENT' CHECK (status IN ('SENT', 'VIEWED', 'ACCEPTED', 'REFUSED', 'EXPIRED')),
  
  -- Acceptance tracking
  accepted_at TIMESTAMPTZ,
  acceptance_ip TEXT,
  acceptance_user_agent TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ
);

CREATE INDEX idx_quotes_driver_id ON public.quotes(driver_id);
CREATE INDEX idx_quotes_token ON public.quotes(token);
CREATE INDEX idx_quotes_status ON public.quotes(status);
CREATE INDEX idx_quotes_scheduled_date ON public.quotes(scheduled_date);

-- 3. Trigger pour updated_at
CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. Row Level Security
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- Les chauffeurs peuvent voir et gérer leurs devis
CREATE POLICY "Drivers can manage own quotes" 
  ON public.quotes 
  FOR ALL 
  USING (driver_id = auth.uid()::text) 
  WITH CHECK (driver_id = auth.uid()::text);

-- Accès public en lecture avec token (via service_role ou anon avec token)
-- Note: L'accès public sera géré par une Edge Function

-- 5. Function pour accepter un devis (accessible publiquement via Edge Function)
CREATE OR REPLACE FUNCTION accept_quote(
  p_token TEXT,
  p_ip TEXT,
  p_user_agent TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_quote RECORD;
BEGIN
  -- Trouver le devis par token
  SELECT * INTO v_quote FROM public.quotes WHERE token = p_token;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Quote not found'
    );
  END IF;
  
  -- Vérifier que le devis n'est pas déjà accepté/refusé
  IF v_quote.status IN ('ACCEPTED', 'REFUSED') THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Quote already processed'
    );
  END IF;
  
  -- Marquer comme accepté
  UPDATE public.quotes 
  SET 
    status = 'ACCEPTED',
    accepted_at = NOW(),
    acceptance_ip = p_ip,
    acceptance_user_agent = p_user_agent,
    updated_at = NOW()
  WHERE token = p_token;
  
  -- Log l'activité
  INSERT INTO public.activity_log (
    user_id, 
    action_type, 
    description,
    metadata
  )
  VALUES (
    v_quote.driver_id,
    'QUOTE_ACCEPTED',
    'Client has accepted quote for ' || v_quote.client_name,
    jsonb_build_object(
      'quote_id', v_quote.id,
      'client_name', v_quote.client_name,
      'price_cents', v_quote.price_cents
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'quote_id', v_quote.id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Function pour refuser un devis
CREATE OR REPLACE FUNCTION refuse_quote(p_token TEXT)
RETURNS JSONB AS $$
DECLARE
  v_quote RECORD;
BEGIN
  SELECT * INTO v_quote FROM public.quotes WHERE token = p_token;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Quote not found');
  END IF;
  
  IF v_quote.status IN ('ACCEPTED', 'REFUSED') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Quote already processed');
  END IF;
  
  UPDATE public.quotes 
  SET status = 'REFUSED', updated_at = NOW()
  WHERE token = p_token;
  
  INSERT INTO public.activity_log (
    user_id, 
    action_type, 
    description
  )
  VALUES (
    v_quote.driver_id,
    'QUOTE_REFUSED',
    'Client has refused quote for ' || v_quote.client_name
  );
  
  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Function pour marquer un devis comme vu
CREATE OR REPLACE FUNCTION mark_quote_viewed(p_token TEXT)
RETURNS JSONB AS $$
BEGIN
  UPDATE public.quotes 
  SET 
    status = CASE WHEN status = 'SENT' THEN 'VIEWED' ELSE status END,
    viewed_at = CASE WHEN viewed_at IS NULL THEN NOW() ELSE viewed_at END,
    updated_at = NOW()
  WHERE token = p_token AND status != 'ACCEPTED' AND status != 'REFUSED';
  
  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Ajouter les nouveaux types d'action au activity_log
-- (Pas besoin de migrer la constraint, on peut l'étendre progressivement)

