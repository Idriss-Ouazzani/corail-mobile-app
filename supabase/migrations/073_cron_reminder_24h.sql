-- Migration 073: Planifier l'envoi des rappels 24h (pg_cron + pg_net)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Prérequis : secrets créés dans le Vault (voir docs/RAPPEL_24H_ETAPES.md).
-- Si la migration échoue (permission denied sur CREATE EXTENSION), active
-- pg_cron et pg_net depuis Database → Extensions, puis exécute uniquement
-- le SELECT cron.schedule(...) ci-dessous dans le SQL Editor.
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Créer les extensions (elles créent le schéma cron et la fonction net.http_post)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Planifier l'appel quotidien à 8h00 UTC (9h Paris en hiver)
SELECT cron.schedule(
  'send-booking-reminder-24h-daily',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'reminder_cron_project_url' LIMIT 1) || '/functions/v1/send-booking-reminder-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE((SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'reminder_cron_secret' LIMIT 1), '')
    ),
    body := '{"cron": true}'::jsonb,
    timeout_milliseconds := 60000
  ) AS request_id;
  $$
);
