-- ============================================================================
-- Migration 083: VTC + pièce d'identité verso, type CNI / passeport
-- ============================================================================
-- Carte VTC : recto + verso (2 statuts / URLs).
-- Identité : type cni (recto+verso) ou passport (recto seul ; verso ignoré côté app).
-- Rétrocompat : dossiers sans URL verso restent validables si recto approuvé (logique app / admin).
-- ============================================================================

ALTER TABLE public.vtc_profiles
  ADD COLUMN IF NOT EXISTS verification_id_document_type TEXT NOT NULL DEFAULT 'cni'
    CHECK (verification_id_document_type IN ('cni', 'passport'));

COMMENT ON COLUMN public.vtc_profiles.verification_id_document_type IS 'cni = recto+verso obligatoires ; passport = une seule photo (page identité).';

ALTER TABLE public.vtc_profiles
  ADD COLUMN IF NOT EXISTS verification_vtc_card_url_verso TEXT,
  ADD COLUMN IF NOT EXISTS verification_vtc_card_status_verso TEXT NOT NULL DEFAULT 'missing'
    CHECK (verification_vtc_card_status_verso IN ('missing', 'uploaded', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS verification_vtc_card_admin_notes_verso TEXT;

ALTER TABLE public.vtc_profiles
  ADD COLUMN IF NOT EXISTS verification_id_card_url_verso TEXT,
  ADD COLUMN IF NOT EXISTS verification_id_card_status_verso TEXT NOT NULL DEFAULT 'missing'
    CHECK (verification_id_card_status_verso IN ('missing', 'uploaded', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS verification_id_card_admin_notes_verso TEXT;

-- RPC admin : inclure les nouvelles colonnes
-- CREATE OR REPLACE ne peut pas changer le type de retour (RETURNS TABLE) : 42P13 → DROP puis CREATE.
DROP FUNCTION IF EXISTS public.list_pending_driver_verifications();

CREATE FUNCTION public.list_pending_driver_verifications()
RETURNS TABLE (
  id text,
  user_id text,
  driver_verification_submitted_at timestamptz,
  verification_vtc_card_status text,
  verification_vtc_card_status_verso text,
  verification_id_card_status text,
  verification_id_card_status_verso text,
  verification_insurance_status text,
  verification_id_document_type text,
  verification_vtc_card_url text,
  verification_vtc_card_url_verso text,
  verification_id_card_url text,
  verification_id_card_url_verso text,
  verification_insurance_url text,
  driver_full_name text,
  driver_email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
    v.verification_vtc_card_status_verso,
    v.verification_id_card_status,
    v.verification_id_card_status_verso,
    v.verification_insurance_status,
    v.verification_id_document_type,
    v.verification_vtc_card_url,
    v.verification_vtc_card_url_verso,
    v.verification_id_card_url,
    v.verification_id_card_url_verso,
    v.verification_insurance_url,
    u.full_name AS driver_full_name,
    u.email AS driver_email
  FROM public.vtc_profiles v
  LEFT JOIN public.users u ON u.id = v.user_id
  WHERE v.driver_verification_status = 'pending'
  ORDER BY v.driver_verification_submitted_at ASC NULLS LAST;
END;
$$;

COMMENT ON FUNCTION public.list_pending_driver_verifications() IS 'Liste des profils VTC en attente (admins). Inclut recto/verso VTC et identité + type CNI/passeport.';
