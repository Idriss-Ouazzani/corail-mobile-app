-- ============================================================================
-- ACTIVATION DES TRIGGERS POUR NOTIFICATIONS PUSH AUTOMATIQUES
-- ============================================================================
-- Ce fichier active les triggers qui appellent l'Edge Function send-push
-- pour envoyer des notifications automatiquement depuis la base de données.
--
-- PRÉREQUIS :
-- 1. Edge Function "send-push" déployée sur Supabase
-- 2. Extension pg_net activée (pour faire des requêtes HTTP)
-- 3. Variables d'environnement configurées dans Supabase
-- ============================================================================

-- ============================================================================
-- 1. ACTIVER L'EXTENSION PG_NET
-- ============================================================================
-- pg_net permet de faire des requêtes HTTP depuis PostgreSQL

CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================================================
-- 2. FONCTION POUR APPELER L'EDGE FUNCTION send-push
-- ============================================================================

CREATE OR REPLACE FUNCTION call_send_push_function(
  p_user_id TEXT,
  p_title TEXT,
  p_body TEXT,
  p_data JSONB DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tokens TEXT[];
  v_supabase_url TEXT;
  v_supabase_anon_key TEXT;
  v_request_id BIGINT;
BEGIN
  -- Récupérer tous les tokens actifs de l'utilisateur
  SELECT ARRAY_AGG(push_token)
  INTO v_tokens
  FROM public.push_tokens
  WHERE user_id = p_user_id
    AND is_active = true;

  -- Si pas de tokens, ne rien faire
  IF v_tokens IS NULL OR array_length(v_tokens, 1) = 0 THEN
    RAISE NOTICE 'Aucun token push actif pour user: %', p_user_id;
    RETURN;
  END IF;

  -- Récupérer l'URL Supabase (à remplacer par votre URL)
  -- TODO: Remplacer par votre Project ID
  v_supabase_url := 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/send-push';
  
  -- Récupérer l'Anon Key (à stocker en tant que secret dans Supabase)
  -- Alternative : utiliser SELECT vault.decrypt_secret('supabase_anon_key')
  v_supabase_anon_key := current_setting('app.settings.supabase_anon_key', true);

  -- Appeler l'Edge Function via pg_net
  SELECT net.http_post(
    url := v_supabase_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_supabase_anon_key
    ),
    body := jsonb_build_object(
      'tokens', to_jsonb(v_tokens),
      'title', p_title,
      'body', p_body,
      'data', p_data
    )
  ) INTO v_request_id;

  RAISE NOTICE 'Push notification envoyée via Edge Function (request_id: %)', v_request_id;
END;
$$;

-- ============================================================================
-- 3. TRIGGER: NOTIFICATION QUAND UNE COURSE EST PRISE
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_notify_ride_claimed ON public.rides;

CREATE TRIGGER trigger_notify_ride_claimed
AFTER UPDATE ON public.rides
FOR EACH ROW
WHEN (NEW.status = 'CLAIMED' AND OLD.status = 'PUBLISHED')
EXECUTE FUNCTION notify_ride_claimed();

-- Note : La fonction notify_ride_claimed existe déjà dans CREATE_NOTIFICATION_TRIGGERS.sql
-- mais elle doit être mise à jour pour appeler call_send_push_function au lieu de send_push_notification

CREATE OR REPLACE FUNCTION notify_ride_claimed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_creator_id TEXT;
  v_picker_name TEXT;
  v_pickup_address TEXT;
BEGIN
  -- Récupérer les infos nécessaires
  v_creator_id := OLD.creator_id;
  v_pickup_address := NEW.pickup_address;

  -- Récupérer le nom du picker
  SELECT full_name INTO v_picker_name
  FROM public.users
  WHERE id = NEW.picker_id;

  -- Ne pas notifier si le créateur a pris sa propre course
  IF v_creator_id IS NOT NULL AND v_creator_id != NEW.picker_id THEN
    PERFORM call_send_push_function(
      v_creator_id,
      '🎉 Course prise !',
      v_picker_name || ' a pris votre course (' || v_pickup_address || ')',
      jsonb_build_object('type', 'ride_claimed', 'ride_id', NEW.id)
    );
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================================
-- 4. TRIGGER: NOTIFICATION QUAND UNE COURSE EST TERMINÉE
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_notify_ride_completed ON public.rides;

CREATE TRIGGER trigger_notify_ride_completed
AFTER UPDATE ON public.rides
FOR EACH ROW
WHEN (NEW.status = 'COMPLETED' AND OLD.status = 'CLAIMED')
EXECUTE FUNCTION notify_ride_completed();

CREATE OR REPLACE FUNCTION notify_ride_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_creator_id TEXT;
  v_driver_name TEXT;
  v_pickup_address TEXT;
  v_dropoff_address TEXT;
BEGIN
  -- Récupérer les infos
  v_creator_id := OLD.creator_id;
  v_pickup_address := NEW.pickup_address;
  v_dropoff_address := NEW.dropoff_address;

  -- Récupérer le nom du chauffeur
  SELECT full_name INTO v_driver_name
  FROM public.users
  WHERE id = NEW.picker_id;

  -- Notifier le créateur (si différent du chauffeur)
  IF v_creator_id IS NOT NULL AND v_creator_id != NEW.picker_id THEN
    PERFORM call_send_push_function(
      v_creator_id,
      '✅ Course terminée',
      v_driver_name || ' a terminé la course: ' || v_pickup_address || ' → ' || v_dropoff_address,
      jsonb_build_object('type', 'ride_completed', 'ride_id', NEW.id)
    );
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================================
-- 5. TRIGGER: NOTIFICATION D'INVITATION À UN GROUPE
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_notify_group_invitation ON public.group_invitations;

CREATE TRIGGER trigger_notify_group_invitation
AFTER INSERT ON public.group_invitations
FOR EACH ROW
WHEN (NEW.invitee_id IS NOT NULL)
EXECUTE FUNCTION notify_group_invitation();

CREATE OR REPLACE FUNCTION notify_group_invitation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_group_name TEXT;
  v_inviter_name TEXT;
BEGIN
  -- Récupérer le nom du groupe
  SELECT name INTO v_group_name
  FROM public.groups
  WHERE id = NEW.group_id;

  -- Récupérer le nom de l'inviteur
  SELECT full_name INTO v_inviter_name
  FROM public.users
  WHERE id = NEW.inviter_id;

  -- Envoyer la notification
  PERFORM call_send_push_function(
    NEW.invitee_id,
    '👥 Invitation groupe',
    v_inviter_name || ' vous a invité à rejoindre "' || v_group_name || '"',
    jsonb_build_object('type', 'group_invitation', 'invitation_id', NEW.id, 'group_id', NEW.group_id)
  );

  RETURN NEW;
END;
$$;

-- ============================================================================
-- 6. CONFIGURATION DES SECRETS (À FAIRE DANS LE DASHBOARD SUPABASE)
-- ============================================================================

-- Pour stocker l'Anon Key de manière sécurisée :
-- 1. Allez dans Supabase Dashboard > Project Settings > API
-- 2. Copiez votre "anon" key
-- 3. Allez dans SQL Editor et exécutez :

-- ALTER DATABASE postgres SET app.settings.supabase_anon_key = 'your-anon-key-here';

-- Alternative avec Vault (recommandé pour la production) :
-- INSERT INTO vault.secrets (name, secret)
-- VALUES ('supabase_anon_key', 'your-anon-key-here');

-- Puis dans la fonction, utilisez :
-- v_supabase_anon_key := vault.decrypt_secret('supabase_anon_key');

-- ============================================================================
-- 7. MISE À JOUR DE L'URL SUPABASE
-- ============================================================================

-- IMPORTANT : Remplacez YOUR_PROJECT_ID par votre vrai Project ID
-- Pour trouver votre Project ID : Supabase Dashboard > Project Settings > General
-- L'URL sera : https://YOUR_PROJECT_ID.supabase.co

-- Exemple :
-- v_supabase_url := 'https://abcdefghijklmnop.supabase.co/functions/v1/send-push';

-- ============================================================================
-- VÉRIFICATION
-- ============================================================================

-- Vérifier que les triggers sont actifs
SELECT 
  tgname AS trigger_name,
  tgrelid::regclass AS table_name,
  tgenabled AS enabled
FROM pg_trigger
WHERE tgname IN (
  'trigger_notify_ride_claimed',
  'trigger_notify_ride_completed',
  'trigger_notify_group_invitation'
);

-- Vérifier que l'extension pg_net est active
SELECT * FROM pg_extension WHERE extname = 'pg_net';

-- ============================================================================
-- TEST MANUEL
-- ============================================================================

-- Pour tester manuellement une notification :
-- SELECT call_send_push_function(
--   'USER_ID_HERE',
--   'Test',
--   'Ceci est un test de notification push',
--   '{"type": "test"}'::jsonb
-- );

COMMENT ON FUNCTION call_send_push_function IS 'Appelle l''Edge Function send-push pour envoyer des notifications push';
COMMENT ON FUNCTION notify_ride_claimed IS 'Trigger : Notifie le créateur quand sa course est prise';
COMMENT ON FUNCTION notify_ride_completed IS 'Trigger : Notifie le créateur quand une course est terminée';
COMMENT ON FUNCTION notify_group_invitation IS 'Trigger : Notifie un utilisateur invité à un groupe';

