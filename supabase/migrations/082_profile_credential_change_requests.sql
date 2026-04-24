-- Demandes de changement tél. / n° VTC / SIRET (profil certifié) — validation admin (portail getcorail.com).

-- users.id est TEXT (legacy Firebase / Supabase) — aligné sur vtc_profiles, group_invitations, etc.
CREATE TABLE IF NOT EXISTS public.profile_credential_change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  request_type text NOT NULL CHECK (request_type IN ('phone', 'vtc_number', 'siret')),
  current_value text,
  requested_value text NOT NULL,
  document_path text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Une demande en attente par (utilisateur, type) à la fois
CREATE UNIQUE INDEX IF NOT EXISTS profile_credential_change_one_pending_per_type
  ON public.profile_credential_change_requests (user_id, request_type)
  WHERE (status = 'pending');

CREATE INDEX IF NOT EXISTS idx_profile_credential_change_list
  ON public.profile_credential_change_requests (status, created_at DESC);

COMMENT ON TABLE public.profile_credential_change_requests IS
  'Changement Tél. / n° VTC / SIRET : soumission chauffeur + pièce, approbation admin.';

-- updated_at
CREATE OR REPLACE FUNCTION public.set_profile_credential_request_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_profile_credential_change_updated ON public.profile_credential_change_requests;
CREATE TRIGGER tr_profile_credential_change_updated
  BEFORE UPDATE ON public.profile_credential_change_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.set_profile_credential_request_updated_at();

ALTER TABLE public.profile_credential_change_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own credential requests" ON public.profile_credential_change_requests;
CREATE POLICY "Users read own credential requests"
  ON public.profile_credential_change_requests
  FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM public.users
      WHERE supabase_auth_id = auth.uid() OR id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Users insert own credential requests" ON public.profile_credential_change_requests;
CREATE POLICY "Users insert own credential requests"
  ON public.profile_credential_change_requests
  FOR INSERT
  WITH CHECK (
    user_id IN (
      SELECT id FROM public.users
      WHERE supabase_auth_id = auth.uid() OR id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Users update own pending credential requests" ON public.profile_credential_change_requests;
CREATE POLICY "Users update own pending credential requests"
  ON public.profile_credential_change_requests
  FOR UPDATE
  USING (
    user_id IN (
      SELECT id FROM public.users
      WHERE supabase_auth_id = auth.uid() OR id = auth.uid()::text
    )
    AND status = 'pending'
  )
  WITH CHECK (
    user_id IN (
      SELECT id FROM public.users
      WHERE supabase_auth_id = auth.uid() OR id = auth.uid()::text
    )
    AND status = 'pending'
  );

DROP POLICY IF EXISTS "Users delete own pending credential request" ON public.profile_credential_change_requests;
CREATE POLICY "Users delete own pending credential request"
  ON public.profile_credential_change_requests
  FOR DELETE
  USING (
    user_id IN (
      SELECT id FROM public.users
      WHERE supabase_auth_id = auth.uid() OR id = auth.uid()::text
    )
    AND status = 'pending'
  );
