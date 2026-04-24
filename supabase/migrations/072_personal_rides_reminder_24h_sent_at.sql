-- Migration 072: Rappel email client 24h avant la course
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Ajoute une colonne pour ne pas renvoyer le rappel 24h si déjà envoyé.
-- L'Edge Function send-booking-reminder-email envoie l'email puis met à jour cette colonne.
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALTER TABLE public.personal_rides
  ADD COLUMN IF NOT EXISTS reminder_24h_sent_at TIMESTAMPTZ;

COMMENT ON COLUMN public.personal_rides.reminder_24h_sent_at IS
  'Date d''envoi du mail de rappel 24h avant la course (client). NULL = pas encore envoyé.';

CREATE INDEX IF NOT EXISTS idx_personal_rides_reminder_24h
  ON public.personal_rides(scheduled_at)
  WHERE reminder_24h_sent_at IS NULL AND client_email IS NOT NULL AND source = 'DIRECT_CLIENT' AND status = 'SCHEDULED';
