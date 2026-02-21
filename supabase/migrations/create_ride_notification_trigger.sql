/**
 * Migration: Trigger automatique pour notifications de nouvelles courses
 * 
 * Déclenche l'envoi de push notifications quand une course est créée
 * avec status = 'AVAILABLE'
 */

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 1) Table de logs des notifications (pour analytics)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS public.notification_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  ride_id uuid REFERENCES public.rides(id) ON DELETE CASCADE,
  notification_type text NOT NULL, -- 'new_ride', 'ride_claimed', etc.
  sent_at timestamptz NOT NULL,
  delivered boolean DEFAULT false,
  opened boolean DEFAULT false
);

CREATE INDEX idx_notification_logs_user_id ON public.notification_logs(user_id);
CREATE INDEX idx_notification_logs_ride_id ON public.notification_logs(ride_id);
CREATE INDEX idx_notification_logs_sent_at ON public.notification_logs(sent_at DESC);

COMMENT ON TABLE public.notification_logs IS 'Logs des notifications push envoyées (analytics)';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 2) Fonction pour appeler l'Edge Function via HTTP
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE OR REPLACE FUNCTION public.notify_new_ride()
RETURNS TRIGGER AS $$
DECLARE
  edge_function_url text;
  payload json;
BEGIN
  -- Construire l'URL de l'Edge Function
  -- Remplacer par votre projet Supabase
  edge_function_url := current_setting('app.settings.supabase_functions_url', true) 
    || '/send-ride-notification';
  
  -- Si pas de config, utiliser l'URL par défaut (à adapter)
  IF edge_function_url IS NULL OR edge_function_url = '' THEN
    edge_function_url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-ride-notification';
  END IF;

  -- Construire le payload
  payload := json_build_object(
    'rideId', NEW.id,
    'visibility', NEW.visibility,
    'groupId', NEW.group_id
  );

  -- Appel HTTP asynchrone (via pg_net ou http extension)
  -- Note: Nécessite l'extension pg_net (déjà installée sur Supabase)
  PERFORM
    net.http_post(
      url := edge_function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := payload::jsonb
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 3) Trigger sur INSERT de rides
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DROP TRIGGER IF EXISTS on_ride_created ON public.rides;

CREATE TRIGGER on_ride_created
  AFTER INSERT ON public.rides
  FOR EACH ROW
  WHEN (NEW.status = 'AVAILABLE')
  EXECUTE FUNCTION public.notify_new_ride();

COMMENT ON TRIGGER on_ride_created ON public.rides IS 
  'Déclenche l\'envoi de notifications push quand une nouvelle course est disponible';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 4) Configuration (à adapter selon votre projet)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Pour configurer l'URL de l'Edge Function :
-- ALTER DATABASE postgres SET app.settings.supabase_functions_url TO 'https://YOUR_PROJECT_REF.supabase.co/functions/v1';

-- Pour configurer la service role key (ATTENTION: sécurité sensible)
-- ALTER DATABASE postgres SET app.settings.service_role_key TO 'your-service-role-key';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 5) Alternative : Utiliser pg_notify (plus simple mais nécessite un listener)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Si vous préférez utiliser pg_notify et écouter depuis l'app :
/*
CREATE OR REPLACE FUNCTION public.notify_new_ride_simple()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify(
    'new_ride',
    json_build_object(
      'ride_id', NEW.id,
      'visibility', NEW.visibility,
      'group_id', NEW.group_id
    )::text
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_ride_created_simple
  AFTER INSERT ON public.rides
  FOR EACH ROW
  WHEN (NEW.status = 'AVAILABLE')
  EXECUTE FUNCTION public.notify_new_ride_simple();
*/

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Notes d'implémentation :
-- 
-- Option A (Recommandée) : Trigger → Edge Function → Expo Push API
-- + Automatique, pas de code client
-- + Fonctionne app fermée
-- - Nécessite pg_net ou appel manuel depuis client
-- 
-- Option B : Trigger → pg_notify → Client listener → Notification locale
-- + Simple, natif PostgreSQL
-- - Nécessite client connecté (Supabase Realtime)
-- - Ne fonctionne que si app ouverte
-- 
-- Option C : Appel direct depuis client après création de course
-- + Contrôle total côté client
-- + Simple à débugger
-- - Dépend du client
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

