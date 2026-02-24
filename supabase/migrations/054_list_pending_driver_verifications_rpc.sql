-- ============================================================================
-- Migration 054: RPC list_pending_driver_verifications (admin) – contourne RLS
-- ============================================================================
-- Permet à un admin de récupérer la liste des profils en attente de vérification
-- même si les policies RLS ne s'appliquent pas correctement (ex: id vs supabase_auth_id).
-- ============================================================================

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
  -- Vérifier que l'appelant est admin
  IF NOT EXISTS (
    SELECT 1 FROM public.users u
    WHERE (u.id = auth.uid()::text OR u.supabase_auth_id = auth.uid())
    AND u.is_admin = true
  ) THEN
    RETURN; -- retourne 0 lignes si pas admin
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

COMMENT ON FUNCTION public.list_pending_driver_verifications() IS 'Liste des profils VTC en attente de vérification (réservé aux admins). Contourne RLS pour éviter les soucis id / supabase_auth_id.';
