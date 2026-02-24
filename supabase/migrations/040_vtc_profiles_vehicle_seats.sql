-- ============================================================================
-- Migration 040: Nombre de places véhicule (compatibilité demande client)
-- ============================================================================
-- Champ structurant pour filtrer/compatibilité : 2 à 7 places.
-- À exécuter dans le SQL Editor Supabase si la colonne n'existe pas encore.
-- ============================================================================

ALTER TABLE public.vtc_profiles
  ADD COLUMN IF NOT EXISTS vehicle_seats INTEGER;

ALTER TABLE public.vtc_profiles
  DROP CONSTRAINT IF EXISTS vtc_profiles_vehicle_seats_check;

ALTER TABLE public.vtc_profiles
  ADD CONSTRAINT vtc_profiles_vehicle_seats_check
  CHECK (vehicle_seats IS NULL OR (vehicle_seats >= 2 AND vehicle_seats <= 7));

COMMENT ON COLUMN public.vtc_profiles.vehicle_seats IS 'Nombre de places du véhicule (2 à 7), pour compatibilité avec les demandes clients';
