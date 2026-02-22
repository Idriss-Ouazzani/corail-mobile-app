-- ============================================================================
-- Migration 037: S'assurer que quote_id et quote_status existent
-- ============================================================================
-- Certaines bases peuvent ne pas avoir ces colonnes (migrations 009/015/016
-- non appliquées ou ordre différent). On les ajoute si manquantes pour que
-- le trigger sync_quote_status_to_rides (036) ne plante pas.
-- ============================================================================

-- rides
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS quote_id TEXT;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS quote_token TEXT;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS quote_status TEXT;

-- personal_rides
ALTER TABLE public.personal_rides ADD COLUMN IF NOT EXISTS quote_id TEXT;
ALTER TABLE public.personal_rides ADD COLUMN IF NOT EXISTS quote_token TEXT;
ALTER TABLE public.personal_rides ADD COLUMN IF NOT EXISTS quote_status TEXT;
