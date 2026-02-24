-- ============================================================================
-- Migration 063: Reconnaître l'admin aussi par email (JWT) pour vtc_profiles
-- ============================================================================
-- Si auth.uid() ne matche pas users.id ni users.supabase_auth_id (ex: compte
-- créé autrement), on accepte quand même l'admin si users.email = email du JWT
-- et is_admin = true. Corrige le cas où le panel admin ne voit pas les pending.
-- ============================================================================

-- RPC: liste des profils en attente (admin reconnu par id, supabase_auth_id OU email JWT)
CREATE OR REPLACE FUNCTION public.list_pending_driver_verifications()
RETURNS TABLE (
  id text,
  user_id text,
  driver_verification_submitted_at timestamptz,
  verification_vtc_card_status text,
  verification_id_card_status text,
  verification_insurance_status text,
  verification_vtc_card_url text,
  verification_id_card_url text,
  verification_insurance_url text,
  driver_full_name text,
  driver_email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admin : id ou supabase_auth_id = auth.uid() OU email du JWT = users.email
  IF NOT EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.is_admin = true
    AND (
      u.id = auth.uid()::text
      OR u.supabase_auth_id = auth.uid()
      OR (auth.jwt() ->> 'email' IS NOT NULL AND u.email = (auth.jwt() ->> 'email'))
    )
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    v.id::text,
    v.user_id,
    v.driver_verification_submitted_at,
    v.verification_vtc_card_status,
    v.verification_id_card_status,
    v.verification_insurance_status,
    v.verification_vtc_card_url,
    v.verification_id_card_url,
    v.verification_insurance_url,
    u.full_name AS driver_full_name,
    u.email AS driver_email
  FROM public.vtc_profiles v
  LEFT JOIN public.users u ON u.id = v.user_id
  WHERE v.driver_verification_status = 'pending'
  ORDER BY v.driver_verification_submitted_at ASC NULLS LAST;
END;
$$;

COMMENT ON FUNCTION public.list_pending_driver_verifications() IS 'Liste des profils VTC en attente (admins). Reconnaît admin par id, supabase_auth_id ou email JWT.';

-- RLS vtc_profiles : admins reconnus aussi par email JWT
DROP POLICY IF EXISTS "Admins can read all vtc_profiles" ON public.vtc_profiles;
CREATE POLICY "Admins can read all vtc_profiles"
ON public.vtc_profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.is_admin = true
    AND (
      u.id = auth.uid()::text
      OR u.supabase_auth_id = auth.uid()
      OR (auth.jwt() ->> 'email' IS NOT NULL AND u.email = (auth.jwt() ->> 'email'))
    )
  )
);

DROP POLICY IF EXISTS "Admins can update vtc_profiles for verification" ON public.vtc_profiles;
CREATE POLICY "Admins can update vtc_profiles for verification"
ON public.vtc_profiles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.is_admin = true
    AND (
      u.id = auth.uid()::text
      OR u.supabase_auth_id = auth.uid()
      OR (auth.jwt() ->> 'email' IS NOT NULL AND u.email = (auth.jwt() ->> 'email'))
    )
  )
)
WITH CHECK (true);
