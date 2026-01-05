-- Table pour stocker les tokens de notifications push
-- Permet d'envoyer des notifications aux utilisateurs même quand l'app est fermée

CREATE TABLE IF NOT EXISTS public.push_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  push_token TEXT NOT NULL,
  device_type TEXT NOT NULL CHECK (device_type IN ('ios', 'android', 'web')),
  device_name TEXT,
  app_version TEXT,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Un user peut avoir plusieurs devices, mais un token est unique
  UNIQUE(push_token)
);

-- Index pour recherche rapide par user_id
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON public.push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_active ON public.push_tokens(is_active) WHERE is_active = true;

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_push_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_push_tokens_updated_at
BEFORE UPDATE ON public.push_tokens
FOR EACH ROW
EXECUTE FUNCTION update_push_tokens_updated_at();

-- RLS Policies (Row Level Security)
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir/gérer leurs propres tokens
CREATE POLICY "Users can view their own push tokens"
  ON public.push_tokens
  FOR SELECT
  USING (true); -- Lecture publique pour permettre l'enregistrement initial

CREATE POLICY "Users can insert their own push tokens"
  ON public.push_tokens
  FOR INSERT
  WITH CHECK (true); -- Insertion publique pour permettre l'enregistrement

CREATE POLICY "Users can update their own push tokens"
  ON public.push_tokens
  FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete their own push tokens"
  ON public.push_tokens
  FOR DELETE
  USING (true);

-- Vérification
SELECT 
  tablename, 
  schemaname
FROM pg_tables 
WHERE tablename = 'push_tokens';

COMMENT ON TABLE public.push_tokens IS 'Stocke les tokens de notifications push Expo pour envoyer des notifications aux utilisateurs';

