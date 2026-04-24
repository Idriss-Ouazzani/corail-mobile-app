-- ============================================================================
-- Purge one-off : données de courses (tests) avant mise en production
-- ============================================================================
-- À exécuter une fois sur le projet Supabase (SQL Editor ou psql).
--
-- Supprime :
--   - rides (marketplace), personal_rides, driver_ride_requests
--   - planning_events liés à une course, lignes activity_log avec ride_id
--   - notifications in-app ciblant une course
--   - factures dont la source est une course (si table invoices présente)
--   - notification_logs liés à une course (si table présente)
--
-- Ne modifie PAS : public.users, groups, quotes, credits_ledger, badges, vtc_profiles
--
-- credits_ledger : conservé exprès (les soldes restent cohérents ; ride_id peut
--                  pointer vers une course supprimée — acceptable pour l’historique).
--
-- Optionnel : décommenter la fin pour supprimer aussi tous les devis (quotes).
-- ============================================================================

BEGIN;

-- Demandes directes site / app (référencent rides ou personal_rides)
DELETE FROM public.driver_ride_requests;

-- Événements d’agenda liés à une course (y compris orphelins si ride_id était renseigné)
DELETE FROM public.planning_events WHERE ride_id IS NOT NULL;

-- Journal d’activité : entrées attachées à une course
DELETE FROM public.activity_log
WHERE ride_id IS NOT NULL
  AND ride_id IN (
    SELECT id FROM public.rides
    UNION ALL
    SELECT id FROM public.personal_rides
  );

-- Notifications cloche liées à une course
DELETE FROM public.in_app_notifications
WHERE target_ride_id IS NOT NULL
   OR target_personal_ride_id IS NOT NULL;

-- Factures émises depuis une course (si la table existe sur ce projet)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'invoices'
  ) THEN
    DELETE FROM public.invoices
    WHERE source_type IN ('RIDE', 'PERSONAL')
      AND source_id IS NOT NULL;
  END IF;
END $$;

-- Logs push analytics (schéma historique possible : ride_id uuid — on purge si la colonne existe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'notification_logs'
  ) THEN
    DELETE FROM public.notification_logs WHERE ride_id IS NOT NULL;
  END IF;
END $$;

DELETE FROM public.rides;
DELETE FROM public.personal_rides;

-- Optionnel : tout l’historique de devis test (décommenter si tu veux repartir à zéro côté devis)
-- DELETE FROM public.quotes;

COMMIT;
