-- ============================================================================
-- Migration 017: Group Invitations System
-- ============================================================================

-- Table pour les invitations de groupe
CREATE TABLE IF NOT EXISTS public.group_invitations (
  id TEXT PRIMARY KEY DEFAULT ('invitation-' || substr(md5(random()::text), 1, 8)),
  group_id TEXT NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  inviter_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  invitee_email TEXT,
  invitee_phone TEXT,
  invitee_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REFUSED')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  CONSTRAINT check_invitee_info CHECK (invitee_email IS NOT NULL OR invitee_phone IS NOT NULL)
);

-- Index pour rechercher les invitations
CREATE INDEX IF NOT EXISTS idx_group_invitations_group_id ON public.group_invitations(group_id);
CREATE INDEX IF NOT EXISTS idx_group_invitations_invitee_id ON public.group_invitations(invitee_id);
CREATE INDEX IF NOT EXISTS idx_group_invitations_invitee_email ON public.group_invitations(invitee_email);
CREATE INDEX IF NOT EXISTS idx_group_invitations_status ON public.group_invitations(status);

-- Ajouter colonnes manquantes à groups si besoin
ALTER TABLE public.groups
  ADD COLUMN IF NOT EXISTS color TEXT,
  ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'people';

-- Trigger pour updated_at
CREATE TRIGGER update_group_invitations_updated_at 
  BEFORE UPDATE ON public.group_invitations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS pour group_invitations
ALTER TABLE public.group_invitations ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir les invitations qui leur sont destinées
CREATE POLICY "Users can see their invitations" 
  ON public.group_invitations FOR SELECT 
  USING (invitee_id = auth.uid()::text OR invitee_email = (SELECT email FROM public.users WHERE id = auth.uid()::text));

-- Les admins de groupe peuvent créer des invitations
CREATE POLICY "Group admins can create invitations" 
  ON public.group_invitations FOR INSERT 
  WITH CHECK (
    inviter_id = auth.uid()::text AND
    EXISTS (
      SELECT 1 FROM public.group_members 
      WHERE group_id = group_invitations.group_id 
        AND user_id = auth.uid()::text 
        AND role = 'ADMIN'
    )
  );

-- Les invités peuvent mettre à jour leurs invitations
CREATE POLICY "Invitees can update their invitations" 
  ON public.group_invitations FOR UPDATE 
  USING (invitee_id = auth.uid()::text OR invitee_email = (SELECT email FROM public.users WHERE id = auth.uid()::text));

-- Commentaires
COMMENT ON TABLE public.group_invitations IS 'Invitations pour rejoindre un groupe';
COMMENT ON COLUMN public.group_invitations.invitee_email IS 'Email de la personne invitée (si pas encore inscrite)';
COMMENT ON COLUMN public.group_invitations.invitee_phone IS 'Téléphone de la personne invitée (si pas encore inscrite)';
COMMENT ON COLUMN public.group_invitations.invitee_id IS 'ID utilisateur si la personne est déjà inscrite';

