-- ============================================================================
-- Migration 050: Vérification "Profil vérifié" pour les chauffeurs (vtc_profiles)
-- ============================================================================
-- Gating: marketplace, publication réseau, réservations getcorail.com réservés aux profils approved.
-- Documents: carte pro, pièce d'identité, attestation assurance RC Pro.
-- ============================================================================

-- Statut global vérification chauffeur
ALTER TABLE public.vtc_profiles
  ADD COLUMN IF NOT EXISTS driver_verification_status TEXT DEFAULT 'not_started'
  CHECK (driver_verification_status IN ('not_started', 'pending', 'approved', 'rejected'));

ALTER TABLE public.vtc_profiles
  ADD COLUMN IF NOT EXISTS driver_verification_submitted_at TIMESTAMPTZ;

ALTER TABLE public.vtc_profiles
  ADD COLUMN IF NOT EXISTS driver_verification_reviewed_at TIMESTAMPTZ;

ALTER TABLE public.vtc_profiles
  ADD COLUMN IF NOT EXISTS driver_verification_rejection_reason TEXT;

-- Documents (URLs Storage)
ALTER TABLE public.vtc_profiles
  ADD COLUMN IF NOT EXISTS verification_vtc_card_url TEXT;

ALTER TABLE public.vtc_profiles
  ADD COLUMN IF NOT EXISTS verification_id_card_url TEXT;

ALTER TABLE public.vtc_profiles
  ADD COLUMN IF NOT EXISTS verification_insurance_url TEXT;

-- Statut par document
ALTER TABLE public.vtc_profiles
  ADD COLUMN IF NOT EXISTS verification_vtc_card_status TEXT DEFAULT 'missing'
  CHECK (verification_vtc_card_status IN ('missing', 'uploaded', 'approved', 'rejected'));

ALTER TABLE public.vtc_profiles
  ADD COLUMN IF NOT EXISTS verification_id_card_status TEXT DEFAULT 'missing'
  CHECK (verification_id_card_status IN ('missing', 'uploaded', 'approved', 'rejected'));

ALTER TABLE public.vtc_profiles
  ADD COLUMN IF NOT EXISTS verification_insurance_status TEXT DEFAULT 'missing'
  CHECK (verification_insurance_status IN ('missing', 'uploaded', 'approved', 'rejected'));

-- Commentaires admin par document (ex: "photo illisible")
ALTER TABLE public.vtc_profiles
  ADD COLUMN IF NOT EXISTS verification_vtc_card_admin_notes TEXT;

ALTER TABLE public.vtc_profiles
  ADD COLUMN IF NOT EXISTS verification_id_card_admin_notes TEXT;

ALTER TABLE public.vtc_profiles
  ADD COLUMN IF NOT EXISTS verification_insurance_admin_notes TEXT;

COMMENT ON COLUMN public.vtc_profiles.driver_verification_status IS 'Statut global: not_started | pending | approved | rejected. approved = profil vérifié (accès réseau/page pro)';
COMMENT ON COLUMN public.vtc_profiles.driver_verification_submitted_at IS 'Date de soumission des documents pour vérification';
COMMENT ON COLUMN public.vtc_profiles.driver_verification_reviewed_at IS 'Date de revue admin (approbation ou rejet)';
COMMENT ON COLUMN public.vtc_profiles.driver_verification_rejection_reason IS 'Raison globale en cas de rejet';
COMMENT ON COLUMN public.vtc_profiles.verification_vtc_card_url IS 'Storage URL: carte professionnelle chauffeur (recto)';
COMMENT ON COLUMN public.vtc_profiles.verification_id_card_url IS 'Storage URL: pièce d''identité (CNI/passeport)';
COMMENT ON COLUMN public.vtc_profiles.verification_insurance_url IS 'Storage URL: attestation assurance RC Pro transport';

CREATE INDEX IF NOT EXISTS idx_vtc_profiles_driver_verification_status
  ON public.vtc_profiles(driver_verification_status);
